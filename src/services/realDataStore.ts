import {
  collection,
  onSnapshot,
} from 'firebase/firestore';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { db, auth, isFirestoreAvailable, setFirestoreUnavailable } from './firebase';
import { BASELINE_PRODUCTS, BASELINE_FUELS } from './baselineData';
import {
  PriceItem,
  FuelStation,
  OfferItem,
  CommunityReport,
  VerificationStatus,
  TrustLevel,
  PriceTrend,
  HuanucoNewsItem,
  NewsSourceStatus,
} from '../types';

// Colecciones en Firestore
const PRODUCTS_COL = 'products';
const OFFERS_COL = 'offers';
const REPORTS_COL = 'priceReports';

const LOCAL_REPORTS_KEY = 'huanuco_community_reports_cache';

const KNOWN_DEMO_PRODUCT_IDS = new Set(['p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6']);
const KNOWN_DEMO_STORE_PRICE_IDS = new Set([
  'sp-pollo-1',
  'sp-pollo-2',
  'sp-huevo-1',
  'sp-huevo-2',
  'sp-arroz-1',
  'sp-arroz-2',
  'sp-papa-1',
  'sp-papa-2',
  'sp-aceite-1',
  'sp-aceite-2',
  'sp-1',
  'sp-2',
  'sp-3',
]);

const KNOWN_DEMO_PRODUCT_SIGNATURES: Record<
  string,
  { prices: number[]; prevPrices: number[]; sources: string[] }
> = {
  'prod-pollo-entero': {
    prices: [10.2],
    prevPrices: [11.5],
    sources: ['Relevamiento matutino Mercado Modelo', 'Relevamiento directo en mercado'],
  },
  'prod-huevo-rosado': {
    prices: [17.0, 16.5],
    prevPrices: [15.5, 15.0],
    sources: ['Relevamiento matutino Mercado Modelo', 'Relevamiento directo en mercado'],
  },
  'prod-arroz-extra': {
    prices: [4.3, 4.2],
    prevPrices: [4.5],
    sources: ['Monitoreo mayorista Puelles', 'Relevamiento directo en mercado'],
  },
  'prod-papa-amarilla': {
    prices: [3.8],
    prevPrices: [4.2],
    sources: ['Relevamiento matutino Mercado Modelo', 'Relevamiento directo en mercado'],
  },
  'prod-aceite-vegetal': {
    prices: [7.9, 8.5],
    prevPrices: [8.5, 9.0],
    sources: ['Comercio local Amarilis', 'Relevamiento directo en mercado'],
  },
};

function isKnownDemoProductData(id: string, data: Record<string, any>): boolean {
  if (!data) return false;
  if (data.isDemoData === true) return true;
  if (KNOWN_DEMO_PRODUCT_IDS.has(id)) return true;
  if (data.lastReportId || data.verifiedReportId) return false;
  if (data.updatedAt === '2026-09-22T08:30:00.000Z') return true;

  if (Array.isArray(data.storePrices) && data.storePrices.length > 0) {
    if (
      data.storePrices.some(
        (sp: any) => sp && typeof sp.id === 'string' && KNOWN_DEMO_STORE_PRICE_IDS.has(sp.id)
      )
    ) {
      return true;
    }
  }

  const sig = KNOWN_DEMO_PRODUCT_SIGNATURES[id];
  if (sig && typeof data.currentPrice === 'number') {
    const priceMatch = sig.prices.some((p) => Math.abs(p - data.currentPrice) < 0.001);
    const prevMatch =
      typeof data.previousPrice === 'number' &&
      sig.prevPrices.some((p) => Math.abs(p - data.previousPrice) < 0.001);
    const sourceMatch =
      typeof data.source === 'string' && sig.sources.includes(data.source.trim());
    if (priceMatch && (prevMatch || sourceMatch)) {
      return true;
    }
  }

  return false;
}

function getLocalReports(): CommunityReport[] {
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(reports: CommunityReport[]) {
  try {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // Ignore quota issues
  }
}

function getOrCreateClientId(): string {
  try {
    let clientId = localStorage.getItem('huanuco_user_client_id');
    if (!clientId) {
      clientId = 'usr-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('huanuco_user_client_id', clientId);
    }
    return clientId;
  } catch {
    return 'usr-anon';
  }
}

function mapProductDocToPriceItem(id: string, data: Record<string, any>): PriceItem {
  const baseTemplate = BASELINE_PRODUCTS.find((p) => p.id === id);

  if (isKnownDemoProductData(id, data)) {
    if (baseTemplate) {
      return {
        ...baseTemplate,
        currentPrice: null,
        previousPrice: null,
        changePercentage: 0,
        trend: 'stable',
        verificationStatus: 'PENDIENTE',
        trustLevel: 'pending',
        isVerified: false,
        updatedAt: '',
        source: 'Pendiente de reporte ciudadano',
        storePrices: [],
      };
    }
  }

  const currentPrice =
    typeof data.currentPrice === 'number' && !isNaN(data.currentPrice) && data.currentPrice > 0
      ? data.currentPrice
      : null;

  const previousPrice =
    currentPrice !== null &&
    typeof data.previousPrice === 'number' &&
    !isNaN(data.previousPrice) &&
    data.previousPrice > 0
      ? data.previousPrice
      : null;

  const hasRealPrice = currentPrice !== null;

  let changePercentage = 0;
  let trend: PriceTrend = 'stable';
  if (hasRealPrice && previousPrice !== null && previousPrice > 0) {
    const diff = currentPrice - previousPrice;
    changePercentage = Number(((diff / previousPrice) * 100).toFixed(1));
    trend = diff > 0.005 ? 'up' : diff < -0.005 ? 'down' : 'stable';
  }

  // Si currentPrice === null, verificationStatus debe ser 'PENDIENTE', nunca 'VERIFICADO'
  const verificationStatus: VerificationStatus = hasRealPrice
    ? (data.verificationStatus as VerificationStatus) || 'REPORTADO'
    : 'PENDIENTE';

  const trustLevel: TrustLevel = hasRealPrice
    ? verificationStatus === 'VERIFICADO'
      ? 'verified'
      : verificationStatus === 'REPORTADO'
      ? 'reported'
      : (data.trustLevel as TrustLevel) || 'pending'
    : 'pending';

  const storePrices =
    hasRealPrice && Array.isArray(data.storePrices)
      ? data.storePrices.filter(
          (sp: any) =>
            sp &&
            typeof sp.storeName === 'string' &&
            !KNOWN_DEMO_STORE_PRICE_IDS.has(sp.id || '') &&
            typeof sp.price === 'number' &&
            sp.price > 0
        )
      : [];

  const resolvedName =
    id === 'prod-aceite-vegetal' && (!data.name || data.name === 'Aceite Vegetal 900ml')
      ? baseTemplate?.name || 'Aceite Vegetal Máxima 900ml'
      : id === 'prod-huevo-rosado' && (!data.name || data.name === 'Huevo Rosado de Gallina')
      ? baseTemplate?.name || 'Huevo Rosado de Gallina · Marca Metro'
      : data.name || baseTemplate?.name || 'Producto sin nombre';

  return {
    id,
    name: resolvedName,
    brand: data.brand || baseTemplate?.brand,
    verifiedPresentation: data.verifiedPresentation || baseTemplate?.verifiedPresentation,
    category: data.category || baseTemplate?.category || 'alimentos',
    unit: data.unit || baseTemplate?.unit || 'kg',
    icon: data.icon || baseTemplate?.icon || '📦',
    previousPrice,
    currentPrice,
    changePercentage,
    trend,
    storeOrMarket: data.storeOrMarket || baseTemplate?.storeOrMarket || 'Huánuco',
    district: data.district || baseTemplate?.district || 'Huánuco Cercado',
    address: data.address ?? baseTemplate?.address,
    location: data.location ?? baseTemplate?.location,
    googleMapsQuery: data.googleMapsQuery || baseTemplate?.googleMapsQuery,
    updatedAt: hasRealPrice ? data.updatedAt || '' : '',
    createdAt: data.createdAt,
    trustLevel,
    verificationStatus,
    isVerified: hasRealPrice && verificationStatus === 'VERIFICADO',
    source: hasRealPrice ? data.source || 'Reporte ciudadano' : 'Pendiente de reporte ciudadano',
    sourceUrl: data.sourceUrl,
    priceType: data.priceType || baseTemplate?.priceType || 'minorista',
    explanationId: data.explanationId || baseTemplate?.explanationId,
    storePrices,
  };
}

let bootstrapTriggeredOnce = false;
function triggerBackendBootstrapOnce() {
  if (bootstrapTriggeredOnce) return;
  bootstrapTriggeredOnce = true;
  fetch('/api/products/bootstrap', { method: 'POST' })
    .then(() => refreshProductsFromBackend())
    .catch(() => {});
}

const productSubscribers = new Set<(products: PriceItem[]) => void>();
const reportSubscribers = new Set<(reports: CommunityReport[]) => void>();
const offerSubscribers = new Set<(offers: OfferItem[]) => void>();

export function refreshProductsFromBackend() {
  fetch('/api/products')
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data?.products)) {
        productSubscribers.forEach((cb) => cb(data.products));
      }
    })
    .catch(() => {});
}

export function refreshOffersFromBackend() {
  fetch('/api/offers')
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data?.offers)) {
        offerSubscribers.forEach((cb) => cb(data.offers));
      }
    })
    .catch(() => {});
}

export function refreshReportsFromBackend() {
  fetch('/api/reports')
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data?.reports)) {
        saveLocalReports(data.reports);
        reportSubscribers.forEach((cb) => cb(data.reports));
      }
    })
    .catch(() => {});
}

/**
 * Escucha en tiempo real la colección de productos en Firestore.
 * Nunca utiliza precios DEMO ni asigna 'VERIFICADO' cuando currentPrice es null.
 */
export function subscribeToProducts(
  onData: (products: PriceItem[]) => void,
  onError?: (err: Error) => void
) {
  productSubscribers.add(onData);
  triggerBackendBootstrapOnce();

  // Consultar siempre el endpoint del servidor para obtener las variaciones enriquecidas
  fetch('/api/products')
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data?.products)) {
        onData(data.products);
      } else {
        onData(BASELINE_PRODUCTS);
      }
    })
    .catch(() => {
      onData(BASELINE_PRODUCTS);
    });

  if (!isFirestoreAvailable()) {
    return () => {
      productSubscribers.delete(onData);
    };
  }

  const colRef = collection(db, PRODUCTS_COL);
  const unsubSnapshot = onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        refreshProductsFromBackend();
        return;
      }
      const productMap = new Map<string, PriceItem>();
      let detectedDemoResidue = false;

      snapshot.forEach((docSnap) => {
        if (KNOWN_DEMO_PRODUCT_IDS.has(docSnap.id)) {
          detectedDemoResidue = true;
          return;
        }
        const raw = docSnap.data();
        if (isKnownDemoProductData(docSnap.id, raw)) {
          detectedDemoResidue = true;
        }
        productMap.set(docSnap.id, mapProductDocToPriceItem(docSnap.id, raw));
      });

      if (detectedDemoResidue) {
        fetch('/api/products/bootstrap', { method: 'POST' })
          .then(() => refreshProductsFromBackend())
          .catch(() => {});
      }

      // Asegurar que los 5 productos del catálogo base estén presentes (sin precios ficticios)
      for (const base of BASELINE_PRODUCTS) {
        if (!productMap.has(base.id)) {
          productMap.set(base.id, {
            ...base,
            currentPrice: null,
            previousPrice: null,
            changePercentage: 0,
            trend: 'stable',
            verificationStatus: 'PENDIENTE',
            trustLevel: 'pending',
            isVerified: false,
            updatedAt: '',
            source: 'Pendiente de reporte ciudadano',
            storePrices: [],
          });
        }
      }

      const items = Array.from(productMap.values());
      const hasAnyNullOrUncomputed =
        items.some((p) => p.currentPrice === null) ||
        snapshot.docs.some((d) => !d.data()?.brand || !d.data()?.verifiedPresentation);
      if (hasAnyNullOrUncomputed) {
        refreshProductsFromBackend();
      } else {
        onData(items);
      }
    },
    (err) => {
      const msg = String(err?.message || '');
      if (
        err.code === 'permission-denied' ||
        err.code === 'resource-exhausted' ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('Quota exceeded') ||
        msg.includes('Cloud Firestore API has not been used')
      ) {
        setFirestoreUnavailable();
        refreshProductsFromBackend();
      } else if (onError) {
        onError(err);
      }
    }
  );

  return () => {
    productSubscribers.delete(onData);
    unsubSnapshot();
  };
}

/**
 * Carga y sincronización de combustibles:
 * El frontend consume exclusivamente GET /api/fuels (donde el backend consulta
 * Firestore con credenciales de servidor y data/fuels-huanuco.json como respaldo).
 * BASELINE_FUELS se utiliza únicamente como último fallback de emergencia.
 */
export function subscribeToFuels(
  onData: (fuels: FuelStation[]) => void,
  onError?: (err: Error) => void
) {
  let cancelled = false;

  const loadFromBackend = () => {
    fetch('/api/fuels')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.stations) && data.stations.length > 0) {
          onData(data.stations);
        } else {
          onData(BASELINE_FUELS);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[FuelsStore] Aviso al obtener /api/fuels, aplicando fallback BASELINE_FUELS:', err);
        onData(BASELINE_FUELS);
        if (onError && err instanceof Error) onError(err);
      });
  };

  loadFromBackend();

  return () => {
    cancelled = true;
  };
}

const VENDOR_SESSION_TOKEN_KEY = 'huanuco_vendor_email_session_token_v2';
const LEGACY_EMAIL_SESSION_KEY = 'huanuco_vendor_email_session_token';
const LEGACY_PHONE_SESSION_KEY = 'huanuco_vendor_session_token';

export function getVendorSessionToken(): string | null {
  try {
    if (localStorage.getItem(LEGACY_PHONE_SESSION_KEY)) {
      localStorage.removeItem(LEGACY_PHONE_SESSION_KEY);
    }
    if (localStorage.getItem(LEGACY_EMAIL_SESSION_KEY)) {
      localStorage.removeItem(LEGACY_EMAIL_SESSION_KEY);
    }
    return localStorage.getItem(VENDOR_SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setVendorSessionToken(token: string) {
  try {
    localStorage.removeItem(LEGACY_PHONE_SESSION_KEY);
    localStorage.removeItem(LEGACY_EMAIL_SESSION_KEY);
    localStorage.setItem(VENDOR_SESSION_TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearVendorSessionToken() {
  try {
    localStorage.removeItem(LEGACY_PHONE_SESSION_KEY);
    localStorage.removeItem(LEGACY_EMAIL_SESSION_KEY);
    localStorage.removeItem(VENDOR_SESSION_TOKEN_KEY);
  } catch {
    // ignore
  }
}

function parseClientDateMs(dateStr: string | undefined | null, endOfDay: boolean): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const iso = endOfDay ? `${trimmed}T23:59:59.999-05:00` : `${trimmed}T00:00:00.000-05:00`;
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return d.getTime();
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return endOfDay ? parsed.getTime() + 86399000 : parsed.getTime();
  }
  return null;
}

export function computePromotionStatus(
  validFrom?: string,
  validUntil?: string
): {
  promotionStatus: 'PROXIMAMENTE' | 'OFERTA_ACTIVA' | 'PROMOCION_VENCIDA';
  isExpired: boolean;
} {
  const nowMs = Date.now();
  const startMs = parseClientDateMs(validFrom, false);
  const endMs = parseClientDateMs(validUntil, true);

  if (endMs !== null && nowMs > endMs) {
    return { promotionStatus: 'PROMOCION_VENCIDA', isExpired: true };
  }
  if (startMs !== null && nowMs < startMs) {
    return { promotionStatus: 'PROXIMAMENTE', isExpired: false };
  }
  return { promotionStatus: 'OFERTA_ACTIVA', isExpired: false };
}

export function cleanPeruvianWhatsAppNumber(rawPhone?: string | null): string | null {
  if (!rawPhone || typeof rawPhone !== 'string') return null;
  const digits = rawPhone.replace(/[^\d]/g, '');
  if (digits.length === 9 && /^\d{9}$/.test(digits)) {
    return `51${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('51')) {
    const nine = digits.slice(2);
    if (/^\d{9}$/.test(nine)) {
      return `51${nine}`;
    }
  }
  return null;
}

export function buildWhatsAppPromoUrl(
  rawPhone: string | undefined | null,
  productName: string
): string | null {
  const cleanNumber = cleanPeruvianWhatsAppNumber(rawPhone);
  if (!cleanNumber) return null;
  const cleanProduct = (productName || 'su producto').trim();
  const message = `Hola, vi su promoción de ${cleanProduct} en Huanurebajas. ¿Sigue disponible?`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

let offersBackfillTriggered = false;

/**
 * Escucha en tiempo real la colección de ofertas / tiendas con promoción en Firestore
 */
export function subscribeToOffers(
  onData: (offers: OfferItem[]) => void,
  onError?: (err: Error) => void
) {
  offerSubscribers.add(onData);

  const fetchFromBackend = () => {
    fetch('/api/offers')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.offers)) {
          onData(data.offers);
        } else {
          onData([]);
        }
      })
      .catch(() => {
        onData([]);
      });
  };

  if (!isFirestoreAvailable()) {
    fetchFromBackend();
    return () => {
      offerSubscribers.delete(onData);
    };
  }

  const colRef = collection(db, OFFERS_COL);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: OfferItem[] = [];
      let needsBackendSync = false;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isActive === false) return;

        const validFrom = data.validFrom || '';
        const validUntil = data.validUntil || '';
        const lifecycle = computePromotionStatus(validFrom, validUntil);

        const originalPrice = Number(data.originalPrice ?? data.oldPrice) || 0;
        const offerPrice = Number(data.offerPrice ?? data.currentPrice) || 0;
        if (offerPrice <= 0) return;

        const discountPercentage =
          typeof data.discountPercentage === 'number' && data.discountPercentage > 0
            ? data.discountPercentage
            : originalPrice > offerPrice && originalPrice > 0
            ? Number((((originalPrice - offerPrice) / originalPrice) * 100).toFixed(1))
            : 0;

        const photo = data.storePhotoUrl || data.imageUrl || data.image || undefined;
        const cleanWa = cleanPeruvianWhatsAppNumber(data.whatsapp) || undefined;
        const hasWa =
          Boolean(cleanWa) ||
          data.hasWhatsapp === true ||
          Boolean(data.ownerVendorId);

        if (hasWa && !cleanWa) {
          needsBackendSync = true;
        }

        items.push({
          id: docSnap.id,
          title: data.title || data.product || 'Producto en promoción',
          product: data.product || data.title || 'Producto en promoción',
          productPhotoUrl: data.productPhotoUrl || undefined,
          unit: data.unit || 'unidad',
          category: data.category || 'alimentos',
          originalPrice,
          offerPrice,
          discountPercentage,
          store: data.store || data.storeName || 'Comercio local',
          storePhotoUrl: photo,
          location: data.location || data.address || 'Huánuco',
          district: data.district || 'Huánuco Cercado',
          googleMapsQuery: data.googleMapsQuery || `${data.store || ''} ${data.location || ''} Huánuco`.trim(),
          googleMapsUrl: data.googleMapsUrl || undefined,
          whatsapp: cleanWa,
          hasWhatsapp: hasWa,
          description: typeof data.description === 'string' ? data.description.slice(0, 300) : undefined,
          conditions: data.conditions || undefined,
          schedule: data.schedule || undefined,
          validFrom,
          validUntil,
          promotionStatus: lifecycle.promotionStatus,
          ownerVendorId: data.ownerVendorId || undefined,
          isActive: data.isActive !== false,
          isVerified: data.verificationStatus === 'VERIFICADO' || data.isVerified === true,
          trustLevel: data.trustLevel || 'verified',
          verificationStatus: (data.verificationStatus as VerificationStatus) || 'VERIFICADO',
          isExpired: lifecycle.isExpired,
          source: data.source || 'Comercio local de Huánuco',
          sourceUrl: data.sourceUrl,
          imageUrl: photo,
          verifiedAt: data.verifiedAt,
          updatedAt: data.updatedAt || '',
          createdAt: data.createdAt,
        });
      });

      if (needsBackendSync && !offersBackfillTriggered) {
        offersBackfillTriggered = true;
        fetchFromBackend();
      }

      items.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
      onData(items);
    },
    (err) => {
      const msg = String(err?.message || '');
      if (
        err.code === 'permission-denied' ||
        err.code === 'resource-exhausted' ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('Quota exceeded') ||
        msg.includes('Cloud Firestore API has not been used')
      ) {
        setFirestoreUnavailable();
        fetchFromBackend();
      } else if (onError) {
        onError(err);
      }
    }
  );
}

function mapGoogleVendorAuthError(err: unknown): string {
  const anyErr = err as { code?: string; message?: string } | undefined;
  const code = String(anyErr?.code || '');
  const msg = String(anyErr?.message || '');

  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request'
  ) {
    return 'Se canceló la selección de cuenta de Google.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo nuevamente.';
  }
  if (
    code === 'auth/network-request-failed' ||
    msg.toLowerCase().includes('network') ||
    msg.toLowerCase().includes('failed to fetch')
  ) {
    return 'No pudimos conectar con Google. Revisa tu conexión e inténtalo nuevamente.';
  }
  if (code === 'auth/operation-not-allowed' || msg.includes('OPERATION_NOT_ALLOWED')) {
    return 'El proveedor de Google debe estar habilitado en Firebase Console (Authentication → Sign-in method).';
  }
  return 'No se pudo vincular la cuenta con Google. Inténtalo nuevamente.';
}

async function getValidVendorAuthToken(forceRefresh = false): Promise<string | null> {
  try {
    if (auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken(forceRefresh);
      if (idToken) {
        setVendorSessionToken(idToken);
        return idToken;
      }
    }
  } catch {
    // Fallback to stored token if refresh fails transiently
  }
  return getVendorSessionToken();
}

/**
 * Vinculación e inicio de sesión de vendedor mediante Google + Firebase Authentication
 */
export async function signInVendorWithGoogle(): Promise<{
  success: boolean;
  sessionToken?: string;
  vendorId?: string;
  email?: string;
  privateWhatsapp?: string;
  store?: OfferItem | null;
  message: string;
}> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const userCredential = await signInWithPopup(auth, provider);
    const currentUser = userCredential.user;
    const idToken = await currentUser.getIdToken(true);
    setVendorSessionToken(idToken);

    const response = await fetch('/api/vendor/my-store', {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const data = await response.json().catch(() => ({}));

    return {
      success: true,
      sessionToken: idToken,
      vendorId: data.vendorId,
      email: currentUser.email || data.email || '',
      privateWhatsapp: data.privateWhatsapp || '',
      store: data.store || null,
      message: 'Cuenta vinculada correctamente',
    };
  } catch (err) {
    return {
      success: false,
      message: mapGoogleVendorAuthError(err),
    };
  }
}

/**
 * Cierra la sesión activa del vendedor (sin eliminar su tienda ni su promoción)
 */
export async function logoutVendorAccount(): Promise<void> {
  const token = getVendorSessionToken();
  clearVendorSessionToken();
  await signOut(auth).catch(() => null);
  if (token) {
    await fetch('/api/vendor-auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
  }
}

/**
 * Obtiene la tienda perteneciente al vendedor autenticado con Google
 */
export async function fetchMyVendorStore(): Promise<{
  authenticated: boolean;
  vendorId?: string;
  email?: string;
  privateWhatsapp?: string;
  store?: OfferItem | null;
}> {
  const token = await getValidVendorAuthToken(Boolean(auth.currentUser));
  if (!token) return { authenticated: false };
  try {
    const response = await fetch('/api/vendor/my-store', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      if (!auth.currentUser) {
        clearVendorSessionToken();
        return { authenticated: false };
      }
      return {
        authenticated: true,
        email: auth.currentUser.email || '',
        store: null,
      };
    }
    const data = await response.json();
    if (!response.ok || data.status === 'ERROR') {
      return { authenticated: false };
    }
    return {
      authenticated: true,
      vendorId: data.vendorId,
      email: data.email || auth.currentUser?.email || '',
      privateWhatsapp: data.privateWhatsapp,
      store: data.store || null,
    };
  } catch {
    if (auth.currentUser) {
      return {
        authenticated: true,
        email: auth.currentUser.email || '',
        store: null,
      };
    }
    return { authenticated: false };
  }
}

/**
 * Guarda los datos de la propia tienda del vendedor (Editar tienda)
 */
export async function saveMyVendorStore(payload: {
  store: string;
  storePhotoUrl?: string | null;
  location: string;
  district: string;
  googleMapsUrl?: string;
  whatsapp?: string;
  description?: string;
  // Campos iniciales opcionales al crear tienda por primera vez
  title?: string;
  originalPrice?: number;
  offerPrice?: number;
  validFrom?: string;
  validUntil?: string;
  conditions?: string;
  productPhotoUrl?: string | null;
}): Promise<{
  success: boolean;
  store?: OfferItem;
  privateWhatsapp?: string;
  message: string;
}> {
  const token = await getValidVendorAuthToken(true);
  if (!token) {
    return { success: false, message: 'Vincula o inicia sesión con tu cuenta de Google primero.' };
  }
  try {
    const response = await fetch('/api/vendor/my-store', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || data.status === 'ERROR') {
      return {
        success: false,
        message: data?.message || 'No se pudieron guardar los datos de tu tienda.',
      };
    }
    refreshOffersFromBackend();
    return {
      success: true,
      store: data.store,
      privateWhatsapp: data.privateWhatsapp,
      message: data.message || 'Tienda guardada correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Error de red al guardar tienda.',
    };
  }
}

/**
 * Actualiza los datos de la promoción de la propia tienda (Editar promoción)
 */
export async function saveMyVendorPromotion(payload: {
  title: string;
  productPhotoUrl?: string | null;
  originalPrice: number;
  offerPrice: number;
  validFrom: string;
  validUntil: string;
  conditions?: string;
}): Promise<{
  success: boolean;
  store?: OfferItem;
  message: string;
}> {
  const token = await getValidVendorAuthToken(true);
  if (!token) {
    return { success: false, message: 'Vincula o inicia sesión con tu cuenta de Google primero.' };
  }
  try {
    const response = await fetch('/api/vendor/my-promotion', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || data.status === 'ERROR') {
      return {
        success: false,
        message: data?.message || 'No se pudo actualizar la promoción.',
      };
    }
    refreshOffersFromBackend();
    return {
      success: true,
      store: data.store,
      message: data.message || 'Promoción actualizada correctamente.',
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Error de red al actualizar promoción.',
    };
  }
}

/**
 * Escucha en tiempo real los reportes ciudadanos en Firestore
 */
export function subscribeToReports(
  onData: (reports: CommunityReport[]) => void,
  onError?: (err: Error) => void
) {
  reportSubscribers.add(onData);

  fetch('/api/reports')
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data?.reports)) {
        saveLocalReports(data.reports);
        onData(data.reports);
      } else {
        onData(getLocalReports());
      }
    })
    .catch(() => {
      onData(getLocalReports());
    });

  if (!isFirestoreAvailable()) {
    return () => {
      reportSubscribers.delete(onData);
    };
  }

  const colRef = collection(db, REPORTS_COL);
  const unsubSnapshot = onSnapshot(
    colRef,
    (snapshot) => {
      const items: CommunityReport[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          type: data.type === 'offer' ? 'offer' : 'price',
          product: data.product || 'Producto',
          price: Number(data.price) || 0,
          previousPrice: data.previousPrice ? Number(data.previousPrice) : undefined,
          storeName: data.storeName || 'Tienda',
          location: data.location || data.address || 'Huánuco',
          district: data.district || 'Huánuco Cercado',
          date: data.date || '',
          comment: data.comment,
          photoUrl: data.photoUrl || undefined,
          trustLevel: data.status === 'VERIFICADO' ? 'verified' : 'reported',
          status: (data.status as 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO') || 'PENDIENTE',
          isVerified: data.status === 'VERIFICADO',
          createdAt: data.createdAt || '',
          authorId: data.authorId || undefined,
          verifiedBy: data.verifiedBy || undefined,
          verifiedAt: data.verifiedAt || undefined,
          rejectedBy: data.rejectedBy || undefined,
          rejectedAt: data.rejectedAt || undefined,
          moderationNotes: data.moderationNotes || data.rejectionReason || undefined,
        });
      });
      items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      saveLocalReports(items);
      onData(items);
    },
    (err) => {
      const msg = String(err?.message || '');
      if (
        err.code === 'permission-denied' ||
        err.code === 'resource-exhausted' ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('Quota exceeded') ||
        msg.includes('Cloud Firestore API has not been used')
      ) {
        setFirestoreUnavailable();
        refreshReportsFromBackend();
      } else if (onError) {
        onError(err);
      }
    }
  );

  return () => {
    reportSubscribers.delete(onData);
    unsubSnapshot();
  };
}

/**
 * Enviar reporte ciudadano a través del backend POST /api/reports
 */
export async function createCommunityReportInFirestore(
  report: Omit<CommunityReport, 'id' | 'createdAt' | 'status' | 'isVerified'> & {
    productId?: string;
    address?: string;
    validUntil?: string;
  }
): Promise<string> {
  const authorId = report.authorId || getOrCreateClientId();
  const payload = {
    ...report,
    authorId,
  };

  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || data.status === 'ERROR') {
    throw new Error(data?.message || `Error HTTP ${response.status} al enviar reporte`);
  }

  const createdReport: CommunityReport = data.report || {
    ...report,
    id: data.reportId || `rep-${Date.now()}`,
    authorId,
    status: 'PENDIENTE',
    isVerified: false,
    createdAt: new Date().toISOString(),
  };

  const existing = getLocalReports().filter((r) => r.id !== createdReport.id);
  existing.unshift(createdReport);
  saveLocalReports(existing);
  reportSubscribers.forEach((cb) => cb(existing));
  refreshProductsFromBackend();
  refreshReportsFromBackend();

  return createdReport.id;
}

/**
 * Flujo administrativo: Verifica un reporte ciudadano mediante POST /api/reports/:id/verify.
 * El moderador NO puede ser el autor del reporte (prohibida la auto-verificación).
 */
export async function verifyCommunityReportInFirestore(
  reportId: string,
  reviewer: { id: string; name: string },
  notes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/reports/${encodeURIComponent(reportId)}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reviewer,
        notes: notes || 'Verificado mediante comprobación oficial / campo',
      }),
    });

    const data = await response.json();
    if (!response.ok || data.success === false || data.status === 'ERROR') {
      return {
        success: false,
        message: data?.message || 'No se pudo verificar el reporte.',
      };
    }

    const localList = getLocalReports();
    const localIdx = localList.findIndex((r) => r.id === reportId);
    if (localIdx >= 0) {
      localList[localIdx].status = 'VERIFICADO';
      localList[localIdx].isVerified = true;
      localList[localIdx].verifiedBy = reviewer.name;
      localList[localIdx].verifiedAt = data.verifiedAt || new Date().toISOString();
      saveLocalReports(localList);
    }
    refreshProductsFromBackend();
    refreshReportsFromBackend();
    refreshOffersFromBackend();

    return {
      success: true,
      message: data.message || 'Reporte verificado con éxito y registrado en auditoría.',
    };
  } catch (error) {
    console.error('Error al verificar reporte:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error de red al procesar la verificación.',
    };
  }
}

/**
 * Flujo administrativo: Rechaza un reporte ciudadano mediante POST /api/reports/:id/reject.
 */
export async function rejectCommunityReportInFirestore(
  reportId: string,
  reviewer: { id: string; name: string },
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/reports/${encodeURIComponent(reportId)}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reviewer,
        reason: reason || 'Rechazado por inconsistencia o falta de evidencia',
      }),
    });

    const data = await response.json();
    if (!response.ok || data.success === false || data.status === 'ERROR') {
      return {
        success: false,
        message: data?.message || 'No se pudo rechazar el reporte.',
      };
    }

    const localList = getLocalReports();
    const localIdx = localList.findIndex((r) => r.id === reportId);
    if (localIdx >= 0) {
      localList[localIdx].status = 'RECHAZADO';
      localList[localIdx].isVerified = false;
      localList[localIdx].rejectedBy = reviewer.name;
      localList[localIdx].rejectedAt = data.rejectedAt || new Date().toISOString();
      localList[localIdx].moderationNotes = reason;
      saveLocalReports(localList);
    }
    refreshProductsFromBackend();
    refreshReportsFromBackend();

    return {
      success: true,
      message: data.message || 'Reporte rechazado y marcado en el sistema.',
    };
  } catch (error) {
    console.error('Error al rechazar reporte:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error de red al procesar el rechazo.',
    };
  }
}

/**
 * Confirmación ciudadana de vigencia de precio ("Sí, estaba a este precio")
 * mediante POST /api/products/:id/confirm con control anti-duplicados por dispositivo.
 */
export async function confirmProductPriceInFirestore(
  productId: string,
  clientId?: string
): Promise<{
  success: boolean;
  alreadyConfirmed?: boolean;
  confirmationsCount?: number;
  lastConfirmedAt?: string;
  message: string;
}> {
  try {
    const resolvedClientId = clientId || getOrCreateClientId();
    const response = await fetch(`/api/products/${encodeURIComponent(productId)}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: resolvedClientId,
      }),
    });

    const data = await response.json();
    if (response.status === 409) {
      return {
        success: false,
        alreadyConfirmed: true,
        confirmationsCount: data.confirmationsCount,
        message: data.message || 'Este dispositivo ya confirmó este precio.',
      };
    }

    if (!response.ok || data.success === false || data.status === 'ERROR') {
      return {
        success: false,
        message: data?.message || 'No se pudo registrar la confirmación.',
      };
    }

    return {
      success: true,
      alreadyConfirmed: false,
      confirmationsCount: data.confirmationsCount,
      lastConfirmedAt: data.lastConfirmedAt,
      message: data.message || 'Confirmación registrada.',
    };
  } catch (error) {
    console.error('Error al confirmar precio de producto:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error de red al confirmar el precio.',
    };
  }
}

/**
 * Suscripción a las últimas noticias reales y verificadas de Huánuco
 * a través del backend (/api/news) y Firestore (`news`).
 */
export function subscribeToHuanucoNews(
  onData: (payload: {
    items: HuanucoNewsItem[];
    sources: NewsSourceStatus[];
    updatedAt: string | null;
  }) => void
) {
  let cancelled = false;

  const fetchFromBackend = async () => {
    const timestamp = Date.now();
    // 1. Intentar endpoint dinámico de API (/api/news-v2) con prevención de caché
    try {
      const res = await fetch(`/api/news-v2?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data?.items) && data.items.length > 0) {
            if (!cancelled) {
              onData({
                items: data.items,
                sources: Array.isArray(data?.sources) ? data.sources : [],
                updatedAt: data.updatedAt || null,
              });
              return;
            }
          }
        }
      }
    } catch {
      // Ignorar y recurrir al archivo estático
    }

    // 2. Fallback estático garantizado en producción y Vercel (/data/news-huanuco.json)
    try {
      const resStatic = await fetch(`/data/news-huanuco.json?_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (resStatic.ok) {
        const contentType = resStatic.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const staticData = await resStatic.json();
          if (Array.isArray(staticData?.items) && staticData.items.length > 0) {
            if (!cancelled) {
              onData({
                items: staticData.items,
                sources: Array.isArray(staticData?.sources) ? staticData.sources : [],
                updatedAt: staticData.updatedAt || null,
              });
              return;
            }
          }
        }
      }
    } catch {
      // Ignorar
    }

    // 3. Si ambos fallan, responder con lista vacía para no bloquear la interfaz
    if (!cancelled) {
      onData({ items: [], sources: [], updatedAt: null });
    }
  };

  fetchFromBackend();
  // Polling automático cada 5 minutos mientras la aplicación esté abierta
  const pollInterval = setInterval(fetchFromBackend, 5 * 60 * 1000);

  // Re-consultar inmediatamente si el dispositivo recupera la conexión o el usuario abre/vuelve a la app
  const handleOnline = () => {
    fetchFromBackend();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      fetchFromBackend();
      // Disparar sincronización fresca en segundo plano para asegurar noticias del día actual
      fetch(`/api/news-v2/sync?_t=${Date.now()}`, { method: 'POST', cache: 'no-store' }).catch(() => {});
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return () => {
    cancelled = true;
    clearInterval(pollInterval);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  };
}

export const subscribeToNews = subscribeToHuanucoNews;

export async function triggerManualNewsSync(): Promise<{
  items: HuanucoNewsItem[];
  sources: NewsSourceStatus[];
  updatedAt: string | null;
}> {
  const timestamp = Date.now();
  try {
    const res = await fetch(`/api/news-v2/sync?_t=${timestamp}`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      body: JSON.stringify({ force: true }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.items)) {
        return {
          items: data.items,
          sources: Array.isArray(data?.sources) ? data.sources : [],
          updatedAt: data?.updatedAt || null,
        };
      }
    }
  } catch {
    // Fallback a archivo estático
  }

  try {
    const resStatic = await fetch(`/data/news-huanuco.json?_t=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });
    if (resStatic.ok) {
      const staticData = await resStatic.json();
      return {
        items: Array.isArray(staticData?.items) ? staticData.items : [],
        sources: Array.isArray(staticData?.sources) ? staticData.sources : [],
        updatedAt: staticData?.updatedAt || null,
      };
    }
  } catch {
    // Ignorar
  }

  return {
    items: [],
    sources: [],
    updatedAt: null,
  };
}


