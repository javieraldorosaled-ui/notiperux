import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  setLogLevel,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  Timestamp,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Silenciar logs informativos de reconexión de Firestore para evitar ruido en consola
try {
  setLogLevel('silent');
} catch {
  // Ignorar si el logger ya fue configurado
}

// Inicializar Firebase client
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestoreDbId = (firebaseConfig as Record<string, unknown>)?.firestoreDatabaseId as string | undefined;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  }, firestoreDbId);
} catch {
  firestoreInstance = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);
}

export const db = firestoreInstance;
export const auth = getAuth(app);
auth.languageCode = 'es';

// Estado de conectividad directa del cliente con Firestore:
// Deshabilitado en el navegador para centralizar todas las lecturas/escrituras en los endpoints
// del servidor (/api/*) que cuentan con circuit-breaker de cuota y respaldo persistente local.
let _firestoreAvailable = false;

export function isFirestoreAvailable(): boolean {
  return _firestoreAvailable;
}

export function setFirestoreUnavailable() {
  _firestoreAvailable = false;
}

export function handleFirestoreError(err: unknown, context: string) {
  const anyErr = err as { code?: string; message?: string } | undefined;
  const errMsg = String(anyErr?.message || '');
  const errCode = String(anyErr?.code || '');
  if (
    errCode === 'permission-denied' ||
    errCode === 'unavailable' ||
    errCode === 'resource-exhausted' ||
    errMsg.includes('PERMISSION_DENIED') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('Quota exceeded') ||
    errMsg.includes('Cloud Firestore API has not been used') ||
    errMsg.includes('the client is offline')
  ) {
    setFirestoreUnavailable();
  }
}

export type DataStatus = 'VERIFICADO' | 'REPORTADO' | 'PENDIENTE' | 'REFERENCIAL' | 'NO_DISPONIBLE';

export interface FirestoreProductDoc {
  id: string;
  name: string;
  category: 'alimentos' | 'combustibles' | 'abarrotes' | 'hogar';
  unit: string;
  icon: string;
  currentPrice: number | null;
  previousPrice: number | null;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  storeOrMarket: string;
  district: string;
  address?: string;
  source: string;
  sourceUrl?: string;
  verificationStatus: DataStatus;
  updatedAt: string; // ISO string
  createdAt: string; // ISO string
  priceType: 'minorista' | 'mayorista' | 'referencial' | 'reportado';
}

export interface FirestoreFuelStationDoc {
  id: string;
  name: string;
  brand: 'Primax' | 'Repsol' | 'Petroperú' | 'Pecsa' | 'Independiente' | string;
  address: string;
  district: string;
  gas90: number | null;
  gas90Trend: 'up' | 'down' | 'stable';
  gas95: number | null;
  gas95Trend: 'up' | 'down' | 'stable';
  diesel: number | null;
  dieselTrend: 'up' | 'down' | 'stable';
  glp: number | null;
  glpTrend: 'up' | 'down' | 'stable';
  source: string;
  sourceUrl?: string;
  verificationStatus: DataStatus;
  updatedAt: string; // ISO string
  isAvailable: boolean;
}

export interface FirestoreOfferDoc {
  id: string;
  product: string;
  store: string;
  location: string;
  district: string;
  oldPrice: number;
  currentPrice: number;
  discountPercentage: number;
  validFrom: string;
  validUntil: string;
  source: string;
  sourceUrl?: string;
  image?: string;
  verificationStatus: DataStatus;
  verifiedAt?: string;
  updatedAt: string;
  createdAt: string;
}

export interface FirestoreReportDoc {
  id: string;
  type: 'price' | 'offer';
  product: string;
  price: number;
  previousPrice?: number;
  storeName: string;
  district: string;
  location: string;
  comment?: string;
  photoUrl?: string;
  status: 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO';
  createdAt: string;
}

/**
 * Convierte un timestamp o string ISO a formato relativo legible en español:
 * "Actualizado ahora", "Actualizado hace 5 min", "Actualizado hace 2 h", etc.
 */
export function formatRelativeTime(dateInput: string | number | Date | undefined | null): string {
  if (!dateInput) return 'Fecha no disponible';

  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;

  if (isNaN(date.getTime())) {
    // Si ya viene formateado como texto (ej. "Hoy · 09:40 a. m.")
    return String(dateInput);
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) {
    return 'Actualizado recién';
  }

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 2) {
    return 'Actualizado ahora';
  }
  if (diffMin < 60) {
    return `Actualizado hace ${diffMin} min`;
  }
  if (diffHours < 24) {
    return `Actualizado hace ${diffHours} h`;
  }
  if (diffDays === 1) {
    return 'Actualizado ayer';
  }
  if (diffDays < 7) {
    return `Actualizado hace ${diffDays} días`;
  }

  return `Actualizado el ${date.toLocaleDateString('es-PE')}`;
}

/**
 * Calcula el porcentaje de descuento automáticamente y sin redondeos manuales erróneos
 */
export function calculateRealDiscount(oldPrice: number, currentPrice: number): number {
  if (!oldPrice || oldPrice <= currentPrice) return 0;
  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
}

/**
 * Obtener productos desde Firestore
 */
export async function getLiveProducts(): Promise<FirestoreProductDoc[]> {
  if (!isFirestoreAvailable()) return [];
  try {
    const colRef = collection(db, 'products');
    const snap = await getDocs(colRef);
    const docs: FirestoreProductDoc[] = [];
    snap.forEach((d) => {
      docs.push({ id: d.id, ...d.data() } as FirestoreProductDoc);
    });
    return docs;
  } catch (err) {
    handleFirestoreError(err, 'getLiveProducts');
    return [];
  }
}

/**
 * Obtener combustibles desde Firestore
 */
export async function getLiveFuelStations(): Promise<FirestoreFuelStationDoc[]> {
  if (!isFirestoreAvailable()) return [];
  try {
    const colRef = collection(db, 'fuelStations');
    const snap = await getDocs(colRef);
    const docs: FirestoreFuelStationDoc[] = [];
    snap.forEach((d) => {
      docs.push({ id: d.id, ...d.data() } as FirestoreFuelStationDoc);
    });
    return docs;
  } catch (err) {
    handleFirestoreError(err, 'getLiveFuelStations');
    return [];
  }
}

/**
 * Obtener ofertas activas desde Firestore
 */
export async function getLiveOffers(): Promise<FirestoreOfferDoc[]> {
  if (!isFirestoreAvailable()) return [];
  try {
    const colRef = collection(db, 'offers');
    const snap = await getDocs(colRef);
    const docs: FirestoreOfferDoc[] = [];
    snap.forEach((d) => {
      docs.push({ id: d.id, ...d.data() } as FirestoreOfferDoc);
    });
    return docs;
  } catch (err) {
    handleFirestoreError(err, 'getLiveOffers');
    return [];
  }
}

/**
 * Obtener reportes ciudadanos desde Firestore
 */
export async function getLivePriceReports(): Promise<FirestoreReportDoc[]> {
  if (!isFirestoreAvailable()) return [];
  try {
    const colRef = collection(db, 'priceReports');
    const snap = await getDocs(colRef);
    const docs: FirestoreReportDoc[] = [];
    snap.forEach((d) => {
      docs.push({ id: d.id, ...d.data() } as FirestoreReportDoc);
    });
    return docs;
  } catch (err) {
    handleFirestoreError(err, 'getLivePriceReports');
    return [];
  }
}

/**
 * Enviar un reporte ciudadano directamente a Firestore
 * REGLA DE SEGURIDAD: Siempre entra como PENDIENTE.
 */
export async function submitPriceReportToFirestore(
  report: Omit<FirestoreReportDoc, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  if (!isFirestoreAvailable()) {
    return 'local-' + Date.now();
  }
  try {
    const colRef = collection(db, 'priceReports');
    const docData = {
      ...report,
      status: 'PENDIENTE',
      createdAt: new Date().toISOString()
    };
    const res = await addDoc(colRef, docData);
    return res.id;
  } catch (err) {
    handleFirestoreError(err, 'submitPriceReportToFirestore');
    return 'local-' + Date.now();
  }
}
