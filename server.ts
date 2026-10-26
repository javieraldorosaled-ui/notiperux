import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { Firestore } from '@google-cloud/firestore';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});
import { runFuelIngestionPipeline } from './src/services/fuelIngestionService';
import { persistFuelsToFirestore, getFuelsFromServer } from './src/services/fuelPersistServer';
import { BASELINE_FUELS, BASELINE_PRODUCTS } from './src/services/baselineData';
import { calculatePriceChange, calculateDiscount } from './src/data/mockData';
import {
  PriceItem,
  StorePrice,
  CommunityReport,
  OfferItem,
  PriceTrend,
  VerificationStatus,
  TrustLevel,
  InternetPriceGroup,
  InternetPriceSourceStatus,
  InternetPriceObservation,
} from './src/types';
import {
  executeInternetPriceSync,
  computeGroupStatistics,
  formatDataAge,
  computeNextScheduledFetchIso,
  hasIncompatibleLegacyUnitPrice,
  INTERNET_STORES,
  WHITELIST_PRODUCT_GROUPS,
  DiscardedProductLog,
} from './src/services/internetPriceService';
import {
  syncHuanucoNews,
  loadNewsFromFirestore,
  NEWS_SOURCES,
} from './src/services/newsService';
import {
  isQuotaExceededError,
  isServerFirestoreReady,
  markServerFirestoreQuotaExceeded,
  loadLocalBackupState,
  saveLocalBackupState,
} from './src/services/firestoreQuotaGuard';
import { ORIGINAL_REPORTS } from './src/data/originalArticles';
import firebaseConfig from './firebase-applet-config.json';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// Inicializar instancia de Firestore en el servidor con la misma configuración existente
let serverFirestore: Firestore | null = null;
try {
  serverFirestore = new Firestore({
    projectId: firebaseConfig.projectId,
    databaseId:
      ((firebaseConfig as Record<string, unknown>)?.firestoreDatabaseId as string) || '(default)',
  });
} catch (err) {
  console.warn('[Server Firestore] No se pudo inicializar cliente Firestore:', err);
}

// Identificadores y valores antiguos DEMO conocidos que deben limpiarse sin afectar datos reales
const KNOWN_DEMO_FUEL_IDS = new Set([
  'fuel-primax-puente-calicanto',
  'fuel-repsol-paucarbamba',
  'fuel-petroperu-cayhuayna',
  'f-1',
  'f-2',
  'f-3',
  'f-4',
]);

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

const KNOWN_DEMO_PRODUCT_IDS = new Set(['p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6']);

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

function normalizeText(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isKnownDemoProductRecord(id: string, data: Record<string, any>): boolean {
  if (!data) return false;
  if (data.isDemoData === true) return true;
  if (KNOWN_DEMO_PRODUCT_IDS.has(id)) return true;

  // Si ya proviene de un reporte ciudadano real o verificación real, NO es demo
  if (data.lastReportId || data.verifiedReportId) {
    return false;
  }

  if (data.updatedAt === '2026-09-22T08:30:00.000Z') {
    return true;
  }

  if (Array.isArray(data.storePrices) && data.storePrices.length > 0) {
    const hasDemoStoreId = data.storePrices.some(
      (sp: any) => sp && typeof sp.id === 'string' && KNOWN_DEMO_STORE_PRICE_IDS.has(sp.id)
    );
    if (hasDemoStoreId) return true;
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

function buildCleanCatalogProduct(base: PriceItem): PriceItem {
  return {
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
  };
}

function sanitizeProductFromFirestore(id: string, data: Record<string, any>): PriceItem {
  const baseCatalogMatch = BASELINE_PRODUCTS.find((p) => p.id === id);

  if (isKnownDemoProductRecord(id, data)) {
    if (baseCatalogMatch) {
      return buildCleanCatalogProduct(baseCatalogMatch);
    }
  }

  const rawCurrent =
    typeof data.currentPrice === 'number' && !isNaN(data.currentPrice) && data.currentPrice > 0
      ? data.currentPrice
      : null;

  const rawPrevious =
    rawCurrent !== null &&
    typeof data.previousPrice === 'number' &&
    !isNaN(data.previousPrice) &&
    data.previousPrice > 0
      ? data.previousPrice
      : null;

  let changePercentage = 0;
  let trend: PriceTrend = 'stable';
  if (rawCurrent !== null && rawPrevious !== null && rawPrevious > 0) {
    const calc = calculatePriceChange(rawPrevious, rawCurrent);
    changePercentage = calc.changePercentage;
    trend = calc.trend;
  }

  const hasPrice = rawCurrent !== null;
  const verificationStatus: VerificationStatus = hasPrice
    ? (data.verificationStatus as VerificationStatus) || 'REPORTADO'
    : 'PENDIENTE';

  const trustLevel: TrustLevel = hasPrice
    ? verificationStatus === 'VERIFICADO'
      ? 'verified'
      : verificationStatus === 'REPORTADO'
      ? 'reported'
      : verificationStatus === 'REFERENCIAL'
      ? 'referential'
      : (data.trustLevel as TrustLevel) || 'pending'
    : 'pending';

  const cleanStorePrices: StorePrice[] = Array.isArray(data.storePrices)
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
      ? baseCatalogMatch?.name || 'Aceite Vegetal Máxima 900ml'
      : id === 'prod-huevo-rosado' && (!data.name || data.name === 'Huevo Rosado de Gallina')
      ? baseCatalogMatch?.name || 'Huevo Rosado de Gallina · Marca Metro'
      : id === 'prod-arroz-extra' &&
        (!data.name || data.name === 'Arroz Extra Costeño / Faraón')
      ? baseCatalogMatch?.name || 'Arroz Extra Metro / Costeño'
      : data.name || baseCatalogMatch?.name || 'Producto';

  return {
    id,
    name: resolvedName,
    brand: data.brand || baseCatalogMatch?.brand,
    verifiedPresentation: data.verifiedPresentation || baseCatalogMatch?.verifiedPresentation,
    category: data.category || baseCatalogMatch?.category || 'alimentos',
    unit: data.unit || baseCatalogMatch?.unit || 'kg',
    icon: data.icon || baseCatalogMatch?.icon || '📦',
    currentPrice: rawCurrent,
    previousPrice: rawPrevious,
    changePercentage,
    trend,
    storeOrMarket: data.storeOrMarket || baseCatalogMatch?.storeOrMarket || 'Huánuco',
    district: data.district || baseCatalogMatch?.district || 'Huánuco Cercado',
    address: data.address ?? baseCatalogMatch?.address ?? '',
    location: data.location ?? baseCatalogMatch?.location ?? '',
    googleMapsQuery: data.googleMapsQuery || baseCatalogMatch?.googleMapsQuery || 'Huánuco',
    updatedAt: hasPrice ? data.updatedAt || '' : '',
    createdAt: data.createdAt || undefined,
    trustLevel,
    verificationStatus,
    isVerified: hasPrice && verificationStatus === 'VERIFICADO',
    source: hasPrice
      ? data.source || 'Reporte ciudadano'
      : 'Pendiente de reporte ciudadano',
    sourceUrl: data.sourceUrl,
    priceType: data.priceType || baseCatalogMatch?.priceType || 'minorista',
    explanationId: data.explanationId || baseCatalogMatch?.explanationId,
    storePrices: hasPrice ? cleanStorePrices : [],
  };
}

function findMatchingCatalogProduct(
  productIdInput: string | undefined,
  productNameInput: string,
  existingProducts: Map<string, Record<string, any>>
): { id: string; existingData: Record<string, any> | null; baseTemplate: PriceItem | null } | null {
  if (productIdInput && existingProducts.has(productIdInput)) {
    const base = BASELINE_PRODUCTS.find((p) => p.id === productIdInput) || null;
    return {
      id: productIdInput,
      existingData: existingProducts.get(productIdInput) || null,
      baseTemplate: base,
    };
  }
  if (productIdInput) {
    const base = BASELINE_PRODUCTS.find((p) => p.id === productIdInput);
    if (base) {
      return { id: base.id, existingData: null, baseTemplate: base };
    }
  }

  const normName = normalizeText(productNameInput);
  if (!normName) return null;

  // Buscar coincidencia exacta en productos existentes
  for (const [docId, docData] of existingProducts.entries()) {
    if (normalizeText(docData.name || '') === normName) {
      const base = BASELINE_PRODUCTS.find((p) => p.id === docId) || null;
      return { id: docId, existingData: docData, baseTemplate: base };
    }
  }

  // Buscar coincidencia en el catálogo base (5 productos principales)
  for (const base of BASELINE_PRODUCTS) {
    const baseNorm = normalizeText(base.name);
    if (baseNorm === normName) {
      return {
        id: base.id,
        existingData: existingProducts.get(base.id) || null,
        baseTemplate: base,
      };
    }
  }

  // Coincidencia por palabras clave inequívocas del catálogo base
  const keywordAliases: Array<{ id: string; aliases: string[] }> = [
    {
      id: 'prod-pollo-entero',
      aliases: ['pollo limpio entero', 'pollo entero', 'pollo limpio', 'pollo fresco', 'pollo'],
    },
    {
      id: 'prod-huevo-rosado',
      aliases: [
        'huevo rosado de gallina',
        'huevo rosado de gallina · marca metro',
        'huevo rosado',
        'huevos rosados',
        'jaba de huevos',
        'huevos',
        'huevo',
      ],
    },
    {
      id: 'prod-arroz-extra',
      aliases: [
        'arroz extra costeno / faraon',
        'arroz extra metro / costeno',
        'arroz extra',
        'arroz costeno',
        'arroz faraon',
        'arroz',
      ],
    },
    {
      id: 'prod-papa-amarilla',
      aliases: ['papa amarilla tumbay', 'papa amarilla', 'papa tumbay'],
    },
    {
      id: 'prod-aceite-vegetal',
      aliases: [
        'aceite vegetal 900ml',
        'aceite vegetal maxima 900ml',
        'aceite vegetal 900 ml',
        'aceite vegetal',
      ],
    },
    {
      id: 'prod-azucar-rubia',
      aliases: ['azucar rubia 1 kg', 'azucar rubia 1kg', 'azucar rubia', 'azucar'],
    },
    {
      id: 'prod-fideos-spaguetti',
      aliases: ['fideos spaguetti 950 g', 'fideos spaguetti', 'spaguetti', 'fideos'],
    },
    {
      id: 'prod-atun-filete',
      aliases: ['filete de atun en conserva 140 g', 'filete de atun', 'atun', 'conserva de atun'],
    },
    {
      id: 'prod-lenteja',
      aliases: ['lenteja (menestra) 400 g', 'lenteja', 'lentejas', 'menestra lenteja'],
    },
    {
      id: 'prod-cebolla-roja',
      aliases: ['cebolla roja', 'cebolla'],
    },
    {
      id: 'prod-tomate',
      aliases: ['tomate italiano', 'tomate'],
    },
    {
      id: 'prod-limon-sutil',
      aliases: ['limon sutil', 'limon'],
    },
    {
      id: 'prod-zanahoria',
      aliases: ['zanahoria especial', 'zanahoria'],
    },
    {
      id: 'prod-platano-seda',
      aliases: ['platano de seda', 'platano'],
    },
    {
      id: 'prod-pescado-tilapia',
      aliases: ['pescado filete de tilapia', 'filete de tilapia', 'tilapia', 'pescado'],
    },
    {
      id: 'prod-carne-res',
      aliases: ['carne de res (bisteck / guiso)', 'carne de res', 'bisteck', 'carne molida'],
    },
    {
      id: 'prod-cemento-portland',
      aliases: ['cemento portland tipo i (42.5 kg)', 'cemento portland', 'cemento andino', 'cemento sol', 'cemento'],
    },
    {
      id: 'prod-fierro-corrugado',
      aliases: ['fierro corrugado 1/2" x 9 m', 'fierro corrugado', 'fierro 1/2', 'fierro'],
    },
    {
      id: 'prod-ladrillo-king-kong',
      aliases: ['ladrillo king kong 18 huecos', 'ladrillo king kong', 'ladrillo'],
    },
    {
      id: 'prod-arena-gruesa',
      aliases: ['arena gruesa de construccion', 'arena gruesa', 'arena'],
    },
    {
      id: 'prod-pintura-latex',
      aliases: ['pintura latex blanco 1 galon', 'pintura latex', 'pintura cpp', 'pintura'],
    },
    {
      id: 'prod-wincha-5m',
      aliases: ['cinta metrica (wincha) 5 metros', 'cinta metrica', 'wincha 5m', 'wincha'],
    },
  ];

  for (const entry of keywordAliases) {
    if (entry.aliases.includes(normName)) {
      const base = BASELINE_PRODUCTS.find((p) => p.id === entry.id) || null;
      return {
        id: entry.id,
        existingData: existingProducts.get(entry.id) || null,
        baseTemplate: base,
      };
    }
  }

  return null;
}

function upsertStorePriceList(
  existingList: StorePrice[],
  incoming: {
    storeName: string;
    brand?: string;
    presentation?: string;
    price: number;
    district: string;
    address: string;
    updatedAt: string;
    trustLevel: TrustLevel;
    verificationStatus: VerificationStatus;
    source: string;
  },
  allowOverwriteVerified: boolean
): StorePrice[] {
  const cleanList: StorePrice[] = Array.isArray(existingList)
    ? existingList.filter(
        (sp) =>
          sp &&
          typeof sp.storeName === 'string' &&
          !KNOWN_DEMO_STORE_PRICE_IDS.has(sp.id || '') &&
          typeof sp.price === 'number' &&
          sp.price > 0
      )
    : [];

  const targetNorm = normalizeText(incoming.storeName);
  const idx = cleanList.findIndex((sp) => normalizeText(sp.storeName) === targetNorm);

  const googleMapsQuery = `${incoming.storeName} ${incoming.district || 'Huánuco'}`.trim();

  if (idx >= 0) {
    const currentEntry = cleanList[idx];
    // Si el registro del puesto ya estaba VERIFICADO y llega un reporte sin verificar, no sobrescribir el verificado
    if (
      !allowOverwriteVerified &&
      (currentEntry.verificationStatus === 'VERIFICADO' || currentEntry.trustLevel === 'verified')
    ) {
      if (
        (incoming.brand && !currentEntry.brand) ||
        (incoming.presentation && !currentEntry.presentation)
      ) {
        const next = [...cleanList];
        next[idx] = {
          ...currentEntry,
          brand: incoming.brand || currentEntry.brand,
          presentation: incoming.presentation || currentEntry.presentation,
        };
        return next;
      }
      return cleanList;
    }

    const updatedEntry: StorePrice & { source?: string } = {
      ...currentEntry,
      storeName: incoming.storeName,
      brand: incoming.brand || currentEntry.brand,
      presentation: incoming.presentation || currentEntry.presentation,
      price: incoming.price,
      district: incoming.district || currentEntry.district || 'Huánuco Cercado',
      address: incoming.address || currentEntry.address || 'Huánuco',
      googleMapsQuery,
      updatedAt: incoming.updatedAt,
      trustLevel: incoming.trustLevel,
      verificationStatus: incoming.verificationStatus,
      source: incoming.source,
    };
    const next = [...cleanList];
    next[idx] = updatedEntry;
    return next;
  }

  const newEntry: StorePrice & { source?: string } = {
    id: `sp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    storeName: incoming.storeName,
    brand: incoming.brand,
    presentation: incoming.presentation,
    price: incoming.price,
    district: incoming.district || 'Huánuco Cercado',
    address: incoming.address || 'Huánuco',
    googleMapsQuery,
    updatedAt: incoming.updatedAt,
    trustLevel: incoming.trustLevel,
    verificationStatus: incoming.verificationStatus,
    source: incoming.source,
  };

  return [newEntry, ...cleanList];
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Huánuco Precios Hoy Backend & Ingestion Engine',
    timestamp: new Date().toISOString(),
  });
});

// Cache en memoria para respuestas de audio neuronal TTS generadas por Gemini
const ttsServerCache = new Map<string, string>();

// API: Generación de Voz Humana AI Conversacional para NotiperuX (Gemini 3.8 Flash TTS)
app.post('/api/speech/generate', async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Texto requerido' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'API Key de Gemini no configurada' });
    }

    const cleanText = text.trim().slice(0, 1600);
    // REGLA ABSOLUTA DE VOZ MASCULINA: Servidor utiliza ÚNICAMENTE voces masculinas ('Charon', 'Puck', 'Fenrir')
    const selectedVoice = ['Charon', 'Puck', 'Fenrir'].includes(voice) ? voice : 'Charon';

    const cacheKey = `${selectedVoice}:${cleanText}`;
    if (ttsServerCache.has(cacheKey)) {
      const cachedAudio = ttsServerCache.get(cacheKey)!;
      return res.json({
        audioUrl: cachedAudio,
        mimeType: 'audio/wav',
        voiceUsed: selectedVoice,
        cached: true,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: cleanText,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No se generó audio' });
    }

    const audioUrl = `data:audio/wav;base64,${base64Audio}`;
    ttsServerCache.set(cacheKey, audioUrl);
    // Mantener tamaño de caché controlado
    if (ttsServerCache.size > 200) {
      const firstKey = ttsServerCache.keys().next().value;
      if (firstKey) ttsServerCache.delete(firstKey);
    }

    res.json({
      audioUrl,
      mimeType: 'audio/wav',
      voiceUsed: selectedVoice,
    });
  } catch (err: any) {
    const isQuota = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('Quota exceeded');
    if (isQuota) {
      console.warn('[Gemini TTS API] Límite de cuota gratuita alcanzado (429). Activando fallback de voz local.');
      return res.status(429).json({ error: 'Límite de cuota alcanzado. Usando voz local en dispositivo.', isQuotaExceeded: true });
    }
    console.warn('[Gemini TTS API] Error generando voz humana:', err?.message || err);
    res.status(500).json({ error: 'Error al sintetizar voz humana con Gemini' });
  }
});

// API: Ingesta Oficial de Combustibles (Osinergmin)
app.post('/api/ingest/fuels', async (req, res) => {
  try {
    console.log('[Ingestion Engine] Ejecutando sincronización de combustibles Osinergmin...');
    const result = await runFuelIngestionPipeline();
    res.json(result);
  } catch (error) {
    console.error('[Ingestion Engine] Error durante ingesta:', error);
    res.status(500).json({
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Fallo en el pipeline de ingesta',
      timestamp: new Date().toISOString(),
    });
  }
});

// Helper to verify internal auth for automated ingestion
function verifyInternalAuth(req: express.Request, res: express.Response): boolean {
  const secretEnv = process.env.INTERNAL_SECRET;
  if (!secretEnv) {
    return true; // Allow if not strictly configured yet
  }
  const headerSecret = req.headers['x-internal-secret'] || req.headers['authorization']?.replace('Bearer ', '');
  if (headerSecret !== secretEnv) {
    res.status(401).json({ status: 'ERROR', message: 'Unauthorized: Invalid or missing internal secret' });
    return false;
  }
  return true;
}

// API Interna Protegida para GitHub Actions / Cloud Scheduler
app.post('/api/internal/ingest-fuels', async (req, res) => {
  if (!verifyInternalAuth(req, res)) return;
  const startTime = Date.now();
  try {
    console.log('[Internal Ingestion API] Recibida solicitud autenticada...');

    // Si GitHub Actions envió la lista normalizada de estaciones
    if (req.body && Array.isArray(req.body.stations) && req.body.stations.length > 0) {
      console.log(`[Internal Ingestion API] Procesando ${req.body.stations.length} estaciones enviadas desde GitHub Actions...`);
      const persistResult = await persistFuelsToFirestore(req.body.stations);
      const durationMs = Date.now() - startTime;

      return res.json({
        status: persistResult.success ? 'SUCCESS' : 'PARTIAL_SUCCESS',
        stationsProcessed: req.body.stations.length,
        stationsNew: 0,
        stationsUpdated: req.body.stations.length,
        priceVariationsDetected: persistResult.priceVariations,
        errors: persistResult.success ? 0 : 1,
        persistenceMethod: persistResult.method,
        durationMs,
        duration: `${durationMs}ms`,
        timestamp: new Date().toISOString(),
        message: persistResult.success
          ? `Éxito: ${req.body.stations.length} estaciones de Huánuco sincronizadas en Firestore sin duplicados.`
          : `Atención: Estaciones cacheadas en memoria. Aviso de persistencia: ${persistResult.error}`,
      });
    }

    // Si no vino payload, ejecutar el pipeline completo de Osinergmin en el servidor
    const result = await runFuelIngestionPipeline();
    const durationMs = Date.now() - startTime;
    res.json({
      status: result.status,
      stationsProcessed: result.recordsHuanucoFiltered,
      stationsNew: result.stationsUpdated,
      stationsUpdated: result.stationsUpdated,
      priceVariationsDetected: result.priceVariationsDetected,
      errors: result.status === 'SUCCESS' ? 0 : 1,
      durationMs,
      duration: `${durationMs}ms`,
      timestamp: result.timestamp,
      message: result.message,
      diagnostics: result.diagnostics,
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error('[Internal Ingestion API] Error:', error);
    res.status(500).json({
      status: 'ERROR',
      stationsProcessed: 0,
      stationsNew: 0,
      stationsUpdated: 0,
      priceVariationsDetected: 0,
      errors: 1,
      durationMs,
      duration: `${durationMs}ms`,
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Fallo en ingesta',
    });
  }
});

app.get('/api/internal/ingest-fuels', async (req, res) => {
  if (!verifyInternalAuth(req, res)) return;
  const startTime = Date.now();
  try {
    const result = await runFuelIngestionPipeline();
    const durationMs = Date.now() - startTime;
    res.json({
      status: result.status,
      stationsProcessed: result.recordsHuanucoFiltered,
      stationsNew: result.stationsUpdated,
      stationsUpdated: result.stationsUpdated,
      priceVariationsDetected: result.priceVariationsDetected,
      errors: result.status === 'SUCCESS' ? 0 : 1,
      durationMs,
      duration: `${durationMs}ms`,
      timestamp: result.timestamp,
      message: result.message,
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    res.status(500).json({
      status: 'ERROR',
      stationsProcessed: 0,
      stationsNew: 0,
      stationsUpdated: 0,
      priceVariationsDetected: 0,
      errors: 1,
      durationMs,
      duration: `${durationMs}ms`,
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Fallo en ingesta',
    });
  }
});

app.get('/api/ingest/fuels', async (req, res) => {
  try {
    const result = await runFuelIngestionPipeline();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Fallo en el pipeline de ingesta',
    });
  }
});

// API: Listado oficial de combustibles normalizados
app.get('/api/fuels', async (req, res) => {
  try {
    const result = await getFuelsFromServer();
    return res.json({
      status: result.status,
      timestamp: result.timestamp,
      count: result.stations.length,
      stations: result.stations,
    });
  } catch (err) {
    console.warn('[Server API] Error en /api/fuels, aplicando último fallback BASELINE_FUELS:', err);
    return res.json({
      status: 'FALLBACK',
      timestamp: BASELINE_FUELS[0]?.updatedAt || '2026/09/19 23:22:16',
      count: BASELINE_FUELS.length,
      stations: BASELINE_FUELS,
    });
  }
});

// API: Estado oficial de fuentes
app.get('/api/sources/status', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    sources: [
      {
        id: 'osinergmin',
        name: 'Osinergmin - Centro Documental SCOP (Reporte Diario Oficial)',
        url: 'https://www.osinergmin.gob.pe/seccion/centro_documental/hidrocarburos/SCOP/SCOP-DOCS/Reporte-Diario/CL-Registro-precios-DMA-V-CCA-CCE.csv',
        status: 'OPERATIVO (HTTP RANGE 206)',
        note: 'Descarga eficiente directa del archivo oficial diario CL-Registro-precios-DMA-V-CCA-CCE.csv. Sincroniza grifos de Huánuco, Amarilis y Pillco Marca hacia Firestore.',
        coverage: 'Huánuco, Amarilis, Pillco Marca',
        frequency: 'Cada 6 horas / Manual',
      },
      {
        id: 'midagri-sisap',
        name: 'MIDAGRI - SISAP Portal de Información de Mercados',
        url: 'https://sistemas.midagri.gob.pe/sisap/portal2/',
        status: 'NO IMPLEMENTADA — REQUIERE ACCESO/FUENTE ADICIONAL',
        note: 'MIDAGRI no dispone de API REST pública para mercados minoristas de Huánuco. Los datos abiertos se limitan al Mercado Mayorista de Lima y el portal SISAP bloquea conexiones desde datacenters.',
        coverage: 'Huánuco (Mercado Modelo / Mercado Puelles)',
        frequency: 'Relevamiento físico manual',
      },
    ],
  });
});

// ============================================================================
// CAPA DE DATOS REALES: PRODUCTOS, REPORTES CIUDADANOS, MODERACIÓN Y CONFIRMACIÓN
// ============================================================================

function formatVerifiedBrandLabel(rawBrand?: string): string {
  const clean = (rawBrand || '').trim();
  if (!clean) return '';
  const upper = clean.toUpperCase();
  if (upper === 'MAXIMA' || upper === 'MÁXIMA') return 'Máxima';
  if (upper === 'FARAON' || upper === 'FARAÓN') return 'Faraón';
  if (upper === "BELL'S" || upper === 'BELLS') return "Bell's";
  if (upper === 'PLAZA VEA') return 'Plaza Vea';
  if (upper === 'VEGA') return 'Vega';
  return clean;
}

interface LocalCatalogReference {
  verifiedName?: string;
  brand?: string;
  verifiedPresentation?: string;
  currentPrice: number;
  previousPrice: number | null;
  storeName: string;
  district: string;
  address: string;
  updatedAt: string;
  source: string;
  verificationStatus: VerificationStatus;
  trustLevel: TrustLevel;
  extraStorePrices?: Array<{
    storeName: string;
    brand?: string;
    presentation?: string;
    price: number;
    district: string;
    address: string;
    updatedAt: string;
    trustLevel: TrustLevel;
    verificationStatus: VerificationStatus;
    source: string;
  }>;
}

async function resolveLocalReferenceForCatalogProduct(
  productId: string,
  preloadedGroupsMap?: Map<string, InternetPriceGroup>
): Promise<LocalCatalogReference | null> {
  let groupsMap = preloadedGroupsMap;
  if (!groupsMap) {
    const loaded = await loadInternetPriceStateFromFirestore();
    groupsMap = loaded.groupsMap;
  }
  if (!groupsMap || groupsMap.size === 0) return null;

  const isHcoObs = (o: InternetPriceObservation) =>
    !o.isExpired &&
    o.availability === 'IN_STOCK' &&
    o.price > 0 &&
    (o.geographicScope === 'HUANUCO' ||
      o.scope === 'HUANUCO' ||
      o.isLocalHuanuco === true ||
      o.sellerId === 'metroios066mio' ||
      o.sellerId === 'promart_sc8_huanuco');

  const isValidObs = (o: InternetPriceObservation) =>
    !o.isExpired && o.availability === 'IN_STOCK' && o.price > 0;

  const buildOnlineRefStorePrices = (
    obsList: InternetPriceObservation[],
    presentationSuffix: string,
    fallbackUpdatedAt?: string | null
  ) =>
    obsList.slice(0, 3).map((o) => {
      const b = formatVerifiedBrandLabel(o.brand) || o.storeName;
      const isLocal = isHcoObs(o);
      return {
        storeName: isLocal
          ? o.branchName || `${o.storeName} Huánuco`
          : `${o.storeName} (Precio online de referencia · Marca ${b})`,
        brand: b,
        presentation: o.productName,
        price: Number(o.price.toFixed(2)),
        district: isLocal ? 'Huánuco Cercado' : 'Precio online de referencia',
        address: `${o.productName} · ${presentationSuffix}`,
        updatedAt: o.retrievedAt || fallbackUpdatedAt || new Date().toISOString(),
        trustLevel: (isLocal ? 'verified' : 'referential') as TrustLevel,
        verificationStatus: (isLocal ? 'VERIFICADO' : 'REFERENCIAL') as VerificationStatus,
        source: isLocal
          ? `Verificado en tienda física Huánuco (${o.storeName})`
          : `Precio online de referencia (${o.storeName})`,
      };
    });

  if (productId === 'prod-pollo-entero') {
    const grp = groupsMap.get('pollo_entero_1_kg');
    if (!grp) return null;
    const hco = (grp.observations || []).find(isHcoObs);
    const others = (grp.observations || []).filter((o) => isValidObs(o) && o !== hco);
    if (hco) {
      let prev: number | null = null;
      if (
        hco.previousPrice !== null &&
        hco.previousPrice > 0 &&
        !hasIncompatibleLegacyUnitPrice(hco.observationId, hco.previousPrice) &&
        Math.abs(hco.price - hco.previousPrice) > 0.005
      ) {
        prev = hco.previousPrice;
      } else if (hco.listPrice > hco.price + 0.005) {
        prev = hco.listPrice;
      } else if (others.length > 0) {
        const avgOther = Number(
          (others.reduce((acc, o) => acc + o.price, 0) / others.length).toFixed(2)
        );
        if (Math.abs(hco.price - avgOther) > 0.05) {
          prev = avgOther;
        }
      }
      const brandLabel = formatVerifiedBrandLabel(hco.brand) || 'Metro';
      return {
        verifiedName: 'Pollo Limpio Entero',
        brand: `${brandLabel} (Fresco)`,
        verifiedPresentation: hco.productName || 'Pollo Entero con Menudencia Metro x kg',
        currentPrice: Number(hco.price.toFixed(2)),
        previousPrice: prev,
        storeName: 'Metro Huánuco · Jr. San Martín (S066)',
        district: 'Huánuco Cercado',
        address: 'Jr. San Martín · Sucursal S066',
        updatedAt: hco.retrievedAt || grp.updatedAt || new Date().toISOString(),
        source: 'Verificado en sucursal Huánuco (Metro S066)',
        verificationStatus: 'VERIFICADO',
        trustLevel: 'verified',
        extraStorePrices: buildOnlineRefStorePrices(others, 'Por 1 kg', grp.updatedAt),
      };
    }
  }

  if (productId === 'prod-huevo-rosado') {
    const grp30 = groupsMap.get('huevo_pardo_30_un');
    const grp15 = groupsMap.get('huevo_pardo_15_un');
    const hco30 = (grp30?.observations || []).find(isHcoObs);
    const hco15 = (grp15?.observations || []).find(isHcoObs);
    const valid30 = (grp30?.observations || []).filter(isValidObs);

    if (hco30) {
      const prev =
        hco30.listPrice > hco30.price + 0.005
          ? hco30.listPrice
          : grp30?.nationalAveragePrice && Math.abs(hco30.price - grp30.nationalAveragePrice) > 0.05
          ? grp30.nationalAveragePrice
          : null;
      const brandLabel = formatVerifiedBrandLabel(hco30.brand) || 'Metro';
      return {
        verifiedName: `Huevo Rosado de Gallina · Marca ${brandLabel}`,
        brand: brandLabel,
        verifiedPresentation: `${hco30.productName} (Bandeja 30 unid.)`,
        currentPrice: Number(hco30.price.toFixed(2)),
        previousPrice: prev,
        storeName: 'Metro Huánuco · Jr. San Martín (S066)',
        district: 'Huánuco Cercado',
        address: 'Jr. San Martín · Sucursal S066',
        updatedAt: hco30.retrievedAt || grp30?.updatedAt || new Date().toISOString(),
        source: 'Verificado en sucursal Huánuco (Metro S066)',
        verificationStatus: 'VERIFICADO',
        trustLevel: 'verified',
      };
    }

    if (hco15) {
      const equiv30Price = Number((hco15.price * 2).toFixed(2));
      const ref30Price =
        valid30.length > 0
          ? Number((valid30.reduce((acc, o) => acc + o.price, 0) / valid30.length).toFixed(2))
          : hco15.listPrice > hco15.price + 0.005
          ? Number((hco15.listPrice * 2).toFixed(2))
          : null;
      const brandLabel = formatVerifiedBrandLabel(hco15.brand) || 'Metro';
      const extraStorePrices = buildOnlineRefStorePrices(
        valid30,
        'Bandeja 30 unid.',
        grp30?.updatedAt
      );
      return {
        verifiedName: `Huevo Rosado de Gallina · Marca ${brandLabel}`,
        brand: brandLabel,
        verifiedPresentation: `${hco15.productName} (S/ ${hco15.price.toFixed(2)} x 15 u. · Equiv. 30 u.)`,
        currentPrice: equiv30Price,
        previousPrice:
          ref30Price && Math.abs(equiv30Price - ref30Price) > 0.05 ? ref30Price : null,
        storeName: 'Metro Huánuco · Jr. San Martín (S066)',
        district: 'Huánuco Cercado',
        address: 'Jr. San Martín · Sucursal S066',
        updatedAt: hco15.retrievedAt || grp15?.updatedAt || new Date().toISOString(),
        source: 'Verificado en sucursal Huánuco (Metro S066 · equiv. 30 u.)',
        verificationStatus: 'VERIFICADO',
        trustLevel: 'verified',
        extraStorePrices,
      };
    }
  }

  if (productId === 'prod-arroz-extra') {
    const grp5 = groupsMap.get('arroz_extra_5_kg');
    const grp750 = groupsMap.get('arroz_extra_750_g');
    const hco5 = (grp5?.observations || []).find(isHcoObs);
    const hco750 = (grp750?.observations || []).find(isHcoObs);

    if (hco5) {
      const currentKg = Number((hco5.price / 5).toFixed(2));
      const prevKg =
        hco5.listPrice > hco5.price + 0.005
          ? Number((hco5.listPrice / 5).toFixed(2))
          : hco750
          ? Number((hco750.price / 0.75).toFixed(2))
          : null;
      const brandLabel = formatVerifiedBrandLabel(hco5.brand) || 'Metro';
      return {
        verifiedName: 'Arroz Extra Metro / Costeño',
        brand: `${brandLabel} / Costeño`,
        verifiedPresentation: `${hco5.productName} (Bolsa 5 kg S/ ${hco5.price.toFixed(2)} → S/ ${currentKg.toFixed(2)}/kg)`,
        currentPrice: currentKg,
        previousPrice: prevKg && Math.abs(currentKg - prevKg) > 0.02 ? prevKg : null,
        storeName: 'Metro Huánuco · Jr. San Martín (S066)',
        district: 'Huánuco Cercado',
        address: 'Jr. San Martín · Sucursal S066',
        updatedAt: hco5.retrievedAt || grp5?.updatedAt || new Date().toISOString(),
        source: 'Verificado en sucursal Huánuco (Metro S066 · equiv. por kg)',
        verificationStatus: 'VERIFICADO',
        trustLevel: 'verified',
      };
    }
  }

  if (productId === 'prod-papa-amarilla') {
    const grp = groupsMap.get('papa_amarilla_1_kg');
    if (grp) {
      const hco = (grp.observations || []).find(isHcoObs);
      const valid = (grp.observations || []).filter(isValidObs);
      const primary = hco || valid[0];
      if (primary) {
        const isLocal = Boolean(hco);
        const prev =
          primary.listPrice > primary.price + 0.005
            ? primary.listPrice
            : valid.length > 1
            ? Number(
                (
                  valid.slice(1).reduce((acc, o) => acc + o.price, 0) /
                  (valid.length - 1)
                ).toFixed(2)
              )
            : null;
        const brandLabel = formatVerifiedBrandLabel(primary.brand) || 'Tumbay / Peruanita';
        return {
          verifiedName: 'Papa Amarilla Tumbay',
          brand: `Tumbay · ${brandLabel}`,
          verifiedPresentation: primary.productName || 'Papa Amarilla Peruanita / Tumbay x kg',
          currentPrice: Number(primary.price.toFixed(2)),
          previousPrice: prev && Math.abs(primary.price - prev) > 0.02 ? prev : null,
          storeName: isLocal
            ? 'Metro Huánuco · Jr. San Martín (S066)'
            : `${primary.storeName} (Precio online de referencia)`,
          district: isLocal ? 'Huánuco Cercado' : 'Precio online de referencia',
          address: isLocal
            ? 'Jr. San Martín · Sucursal S066'
            : 'Catálogo online nacional (sin confirmación en tienda física de Huánuco)',
          updatedAt: primary.retrievedAt || grp.updatedAt || new Date().toISOString(),
          source: isLocal
            ? 'Verificado en sucursal Huánuco (Metro S066)'
            : `Precio online de referencia (${primary.storeName})`,
          verificationStatus: isLocal ? 'VERIFICADO' : 'REFERENCIAL',
          trustLevel: isLocal ? 'verified' : 'referential',
        };
      }
    }
  }

  if (productId === 'prod-aceite-vegetal') {
    const grp = groupsMap.get('aceite_vegetal_900_ml');
    if (grp) {
      const hco = (grp.observations || []).find(isHcoObs);
      if (hco) {
        const others = (grp.observations || []).filter((o) => isValidObs(o) && o !== hco);
        const prev =
          hco.listPrice > hco.price + 0.005
            ? hco.listPrice
            : others.length > 0
            ? Number((others.reduce((acc, o) => acc + o.price, 0) / others.length).toFixed(2))
            : null;
        const brandLabel = formatVerifiedBrandLabel(hco.brand) || 'Máxima';
        const extraStorePrices = buildOnlineRefStorePrices(
          others,
          'Botella 900 ml',
          grp.updatedAt
        );
        return {
          verifiedName: `Aceite Vegetal ${brandLabel} 900ml`,
          brand: brandLabel,
          verifiedPresentation: `${hco.productName || `Aceite Vegetal ${brandLabel} 900ml`} (Botella 900 ml)`,
          currentPrice: Number(hco.price.toFixed(2)),
          previousPrice: prev && Math.abs(hco.price - prev) > 0.02 ? prev : null,
          storeName: 'Metro Huánuco · Jr. San Martín (S066)',
          district: 'Huánuco Cercado',
          address: 'Jr. San Martín · Sucursal S066',
          updatedAt: hco.retrievedAt || grp.updatedAt || new Date().toISOString(),
          source: 'Verificado en sucursal Huánuco (Metro S066)',
          verificationStatus: 'VERIFICADO',
          trustLevel: 'verified',
          extraStorePrices,
        };
      }
    }
  }

  // Mapa unificado para los nuevos productos reales del catálogo ampliado
  const extendedCatalogGroupSpecs: Record<
    string,
    {
      groupKey: string;
      defaultName: string;
      presentationLabel: string;
      storeType: 'metro' | 'promart';
    }
  > = {
    'prod-azucar-rubia': {
      groupKey: 'azucar_rubia_1_kg',
      defaultName: 'Azúcar Rubia 1 kg',
      presentationLabel: 'Bolsa 1 kg',
      storeType: 'metro',
    },
    'prod-fideos-spaguetti': {
      groupKey: 'fideos_spaguetti_950_g',
      defaultName: 'Fideos Spaguetti 950 g',
      presentationLabel: 'Paquete 950 g',
      storeType: 'metro',
    },
    'prod-atun-filete': {
      groupKey: 'atun_filete_140_g',
      defaultName: 'Filete de Atún en Conserva 140 g',
      presentationLabel: 'Lata 140 g',
      storeType: 'metro',
    },
    'prod-lenteja': {
      groupKey: 'lenteja_400_g',
      defaultName: 'Lenteja (Menestra) 400 g',
      presentationLabel: 'Bolsa 400 g',
      storeType: 'metro',
    },
    'prod-cebolla-roja': {
      groupKey: 'cebolla_roja_1_kg',
      defaultName: 'Cebolla Roja',
      presentationLabel: 'Por 1 kg',
      storeType: 'metro',
    },
    'prod-tomate': {
      groupKey: 'tomate_1_kg',
      defaultName: 'Tomate Italiano',
      presentationLabel: 'Por 1 kg',
      storeType: 'metro',
    },
    'prod-limon-sutil': {
      groupKey: 'limon_sutil_1_kg',
      defaultName: 'Limón Sutil',
      presentationLabel: 'Por 1 kg',
      storeType: 'metro',
    },
    'prod-zanahoria': {
      groupKey: 'zanahoria_1_kg',
      defaultName: 'Zanahoria Especial',
      presentationLabel: 'Por 1 kg',
      storeType: 'metro',
    },
    'prod-platano-seda': {
      groupKey: 'platano_seda_1_kg',
      defaultName: 'Plátano de Seda',
      presentationLabel: 'Por 1 kg',
      storeType: 'metro',
    },
    'prod-pescado-tilapia': {
      groupKey: 'tilapia_1_kg',
      defaultName: 'Pescado Filete de Tilapia',
      presentationLabel: 'Por 1 kg',
      storeType: 'metro',
    },
    'prod-cemento-portland': {
      groupKey: 'cemento_portland_42_5_kg',
      defaultName: 'Cemento Portland Tipo I (42.5 kg)',
      presentationLabel: 'Bolsa 42.5 kg',
      storeType: 'promart',
    },
    'prod-fierro-corrugado': {
      groupKey: 'fierro_corrugado_1_2_9m',
      defaultName: 'Fierro Corrugado 1/2" x 9 m',
      presentationLabel: 'Varilla 9 m',
      storeType: 'promart',
    },
    'prod-ladrillo-king-kong': {
      groupKey: 'ladrillo_king_kong_un',
      defaultName: 'Ladrillo King Kong 18 Huecos',
      presentationLabel: 'Unidad',
      storeType: 'promart',
    },
    'prod-pintura-latex': {
      groupKey: 'pintura_latex_1_gal',
      defaultName: 'Pintura Látex Blanco 1 Galón',
      presentationLabel: 'Balde 1 galón',
      storeType: 'promart',
    },
    'prod-wincha-5m': {
      groupKey: 'wincha_5_m',
      defaultName: 'Cinta Métrica (Wincha) 5 metros',
      presentationLabel: 'Unidad 5 m',
      storeType: 'promart',
    },
  };

  const extSpec = extendedCatalogGroupSpecs[productId];
  if (extSpec) {
    const grp = groupsMap.get(extSpec.groupKey);
    if (grp) {
      const hco = (grp.observations || []).find(isHcoObs);
      const valid = (grp.observations || []).filter(isValidObs);
      const primary = hco || valid[0];
      if (primary) {
        const isLocal = Boolean(hco);
        const others = valid.filter((o) => o !== primary);
        let prev: number | null = null;
        if (
          primary.previousPrice !== null &&
          primary.previousPrice > 0 &&
          !hasIncompatibleLegacyUnitPrice(primary.observationId, primary.previousPrice) &&
          Math.abs(primary.price - primary.previousPrice) > 0.005
        ) {
          prev = primary.previousPrice;
        } else if (primary.listPrice > primary.price + 0.005) {
          prev = primary.listPrice;
        } else if (others.length > 0) {
          const avgOther = Number(
            (others.reduce((acc, o) => acc + o.price, 0) / others.length).toFixed(2)
          );
          if (Math.abs(primary.price - avgOther) > 0.05) {
            prev = avgOther;
          }
        }

        const brandLabel = formatVerifiedBrandLabel(primary.brand) || primary.storeName;
        const extraStorePrices = buildOnlineRefStorePrices(
          others,
          extSpec.presentationLabel,
          grp.updatedAt
        );

        const localStoreName =
          extSpec.storeType === 'promart'
            ? 'Promart Huánuco · Real Plaza'
            : 'Metro Huánuco · Jr. San Martín (S066)';
        const localAddress =
          extSpec.storeType === 'promart'
            ? 'Jr. Independencia 1601 · C.C. Real Plaza Huánuco'
            : 'Jr. San Martín · Sucursal S066';
        const localSource =
          extSpec.storeType === 'promart'
            ? 'Verificado en tienda física Promart Huánuco (Real Plaza · sc=8)'
            : 'Verificado en sucursal Huánuco (Metro S066)';

        return {
          verifiedName: extSpec.defaultName,
          brand: brandLabel,
          verifiedPresentation: `${primary.productName} (${extSpec.presentationLabel})`,
          currentPrice: Number(primary.price.toFixed(2)),
          previousPrice: prev,
          storeName: isLocal
            ? localStoreName
            : `${primary.storeName} (Precio online de referencia)`,
          district: isLocal ? 'Huánuco Cercado' : 'Precio online de referencia',
          address: isLocal
            ? localAddress
            : 'Catálogo online nacional (sin confirmación en tienda física de Huánuco)',
          updatedAt: primary.retrievedAt || grp.updatedAt || new Date().toISOString(),
          source: isLocal
            ? localSource
            : `Precio online de referencia (${primary.storeName})`,
          verificationStatus: isLocal ? 'VERIFICADO' : 'REFERENCIAL',
          trustLevel: isLocal ? 'verified' : 'referential',
          extraStorePrices,
        };
      }
    }
  }

  return null;
}

function buildLocalFallbackProductsMap(): Map<string, PriceItem> {
  const backup = loadLocalBackupState();
  const productMap = new Map<string, PriceItem>();

  for (const [id, raw] of Object.entries(backup.products || {})) {
    if (KNOWN_DEMO_PRODUCT_IDS.has(id)) continue;
    productMap.set(id, sanitizeProductFromFirestore(id, raw as Record<string, any>));
  }

  for (const base of BASELINE_PRODUCTS) {
    if (!productMap.has(base.id)) {
      productMap.set(base.id, buildCleanCatalogProduct(base));
    }
  }

  return productMap;
}

function saveProductsMapToLocalBackup(productMap: Map<string, PriceItem>): void {
  const backup = loadLocalBackupState();
  const nextProducts: Record<string, PriceItem> = {};
  for (const [id, item] of productMap.entries()) {
    nextProducts[id] = item;
  }
  backup.products = nextProducts;
  saveLocalBackupState();
}

async function enrichCatalogProductsFromReportsAndLocalReferences(
  productMap: Map<string, PriceItem>
): Promise<void> {
  try {
    const canUseFirestore = isServerFirestoreReady(serverFirestore) && Boolean(serverFirestore);
    const [reportsSnap, internetState] = await Promise.all([
      canUseFirestore && serverFirestore
        ? serverFirestore
            .collection('priceReports')
            .get()
            .catch((err) => {
              if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
              return null;
            })
        : Promise.resolve(null),
      loadInternetPriceStateFromFirestore(),
    ]);

    const groupsMap = internetState.groupsMap;
    const reportsByProduct = new Map<string, Array<Record<string, any>>>();
    const dummyProductsMap = new Map<string, Record<string, any>>();
    for (const [id, item] of productMap.entries()) {
      dummyProductsMap.set(id, item as unknown as Record<string, any>);
    }

    const rawReportEntries: Array<{ id: string; data: Record<string, any> }> = [];
    if (reportsSnap) {
      reportsSnap.forEach((docSnap) => {
        rawReportEntries.push({ id: docSnap.id, data: docSnap.data() || {} });
      });
    } else {
      const backupReports = loadLocalBackupState().reports || {};
      for (const [id, rData] of Object.entries(backupReports)) {
        rawReportEntries.push({ id, data: rData || {} });
      }
    }

    for (const { id: repId, data: r } of rawReportEntries) {
      if (r.status === 'RECHAZADO' || r.type === 'offer') continue;
      const priceVal = Number(r.price);
      if (isNaN(priceVal) || priceVal <= 0) continue;

      const match = findMatchingCatalogProduct(
        typeof r.productId === 'string' ? r.productId : undefined,
        typeof r.product === 'string' ? r.product : '',
        dummyProductsMap
      );
      if (!match) continue;
      const list = reportsByProduct.get(match.id) || [];
      list.push({ ...r, id: repId, price: Number(priceVal.toFixed(2)) });
      reportsByProduct.set(match.id, list);
    }

    for (const list of reportsByProduct.values()) {
      list.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }

    const batch =
      isServerFirestoreReady(serverFirestore) && serverFirestore
        ? serverFirestore.batch()
        : null;
    let batchCount = 0;

    for (const [prodId, item] of productMap.entries()) {
      const prodReports = reportsByProduct.get(prodId) || [];
      const localRef = await resolveLocalReferenceForCatalogProduct(prodId, groupsMap);

      let nextName = item.name;
      let nextBrand = item.brand;
      let nextPresentation = item.verifiedPresentation;
      let nextCurrent = item.currentPrice;
      let nextPrev = item.previousPrice;
      let nextStore = item.storeOrMarket;
      let nextDistrict = item.district;
      let nextAddress = item.address || '';
      let nextUpdatedAt = item.updatedAt;
      let nextSource = item.source || 'Reporte ciudadano';
      let nextVerif = item.verificationStatus;
      let nextTrust = item.trustLevel;
      let nextStorePrices = Array.isArray(item.storePrices) ? [...item.storePrices] : [];
      let changed = false;

      if (localRef) {
        if (localRef.verifiedName && nextName !== localRef.verifiedName) {
          nextName = localRef.verifiedName;
          changed = true;
        }
        if (localRef.brand && nextBrand !== localRef.brand) {
          nextBrand = localRef.brand;
          changed = true;
        }
        if (localRef.verifiedPresentation && nextPresentation !== localRef.verifiedPresentation) {
          nextPresentation = localRef.verifiedPresentation;
          changed = true;
        }
      }

      // 1. Si hay reportes ciudadanos en priceReports y el producto no tenía currentPrice
      if (nextCurrent === null && prodReports.length > 0) {
        const latest = prodReports[0];
        nextCurrent = latest.price;
        nextStore = latest.storeName || nextStore;
        nextDistrict = latest.district || nextDistrict;
        nextAddress = latest.address || latest.location || nextAddress;
        nextUpdatedAt = latest.createdAt || new Date().toISOString();
        nextVerif = latest.status === 'VERIFICADO' ? 'VERIFICADO' : 'REPORTADO';
        nextTrust = latest.status === 'VERIFICADO' ? 'verified' : 'reported';
        nextSource =
          latest.status === 'VERIFICADO' ? 'Reporte ciudadano verificado' : 'Reporte ciudadano';
        changed = true;
      }

      // 2. Si tiene currentPrice pero no previousPrice (o previousPrice === currentPrice), buscar en historial de reportes o referencia local
      if (
        nextCurrent !== null &&
        (nextPrev === null || Math.abs(nextCurrent - nextPrev) <= 0.005)
      ) {
        if (prodReports.length > 0) {
          const latest = prodReports[0];
          if (
            latest.previousPrice !== undefined &&
            Number(latest.previousPrice) > 0 &&
            Math.abs(nextCurrent - Number(latest.previousPrice)) > 0.005
          ) {
            nextPrev = Number(Number(latest.previousPrice).toFixed(2));
            changed = true;
          } else {
            const olderDiff = prodReports.find(
              (r) => Math.abs(nextCurrent! - Number(r.price)) > 0.005
            );
            if (olderDiff) {
              nextPrev = Number(Number(olderDiff.price).toFixed(2));
              changed = true;
            }
          }
        }

        if (
          (nextPrev === null || Math.abs(nextCurrent - nextPrev) <= 0.005) &&
          localRef
        ) {
          if (Math.abs(nextCurrent - localRef.currentPrice) > 0.005) {
            nextPrev = localRef.currentPrice;
            changed = true;
          } else if (
            localRef.previousPrice !== null &&
            Math.abs(nextCurrent - localRef.previousPrice) > 0.005
          ) {
            nextPrev = localRef.previousPrice;
            changed = true;
          }
        }
      }

      // 3. Si no hay reportes ciudadanos más recientes que la referencia verificada (localRef), actualizar con la observación verificada en Huánuco (Metro S066 / catálogo verificado)
      const latestReportMs = prodReports.length > 0 ? Date.parse(prodReports[0].createdAt || '') : 0;
      const localRefMs = localRef?.updatedAt ? Date.parse(localRef.updatedAt) : 0;
      const shouldApplyLocalRef =
        Boolean(localRef) &&
        (prodReports.length === 0 ||
          nextCurrent === null ||
          (!isNaN(localRefMs) && (isNaN(latestReportMs) || localRefMs >= latestReportMs)));

      if (shouldApplyLocalRef && localRef) {
        if (
          nextCurrent !== null &&
          Math.abs(localRef.currentPrice - nextCurrent) > 0.005
        ) {
          nextPrev = nextCurrent;
        } else if (localRef.previousPrice !== null) {
          nextPrev = localRef.previousPrice;
        }
        nextCurrent = localRef.currentPrice;
        nextStore = localRef.storeName;
        nextDistrict = localRef.district;
        nextAddress = localRef.address;
        nextUpdatedAt = localRef.updatedAt;
        nextSource = localRef.source;
        nextVerif = localRef.verificationStatus;
        nextTrust = localRef.trustLevel;
        // Limpiar entradas antiguas de referencias online cuyos nombres de etiqueta cambiaron
        nextStorePrices = nextStorePrices.filter(
          (sp) =>
            !sp.storeName.includes('(Ref. verificada') &&
            !sp.storeName.includes('(Ref. 30 unid.') &&
            !sp.storeName.includes('(Referencia verificada)')
        );
        nextStorePrices = upsertStorePriceList(
          nextStorePrices,
          {
            storeName: localRef.storeName,
            brand: localRef.brand,
            presentation: localRef.verifiedPresentation,
            price: localRef.currentPrice,
            district: localRef.district,
            address: localRef.address,
            updatedAt: localRef.updatedAt,
            trustLevel: localRef.trustLevel,
            verificationStatus: localRef.verificationStatus,
            source: localRef.source,
          },
          true
        );
      }

      if (localRef && Array.isArray(localRef.extraStorePrices) && localRef.extraStorePrices.length > 0) {
        for (const extraSp of localRef.extraStorePrices) {
          nextStorePrices = upsertStorePriceList(nextStorePrices, extraSp, true);
        }
      }

      if (nextCurrent !== null) {
        let changePercentage = 0;
        let trend: PriceTrend = 'stable';
        if (nextPrev !== null && nextPrev > 0 && Math.abs(nextCurrent - nextPrev) > 0.005) {
          const calc = calculatePriceChange(nextPrev, nextCurrent);
          changePercentage = calc.changePercentage;
          trend = calc.trend;
        }

        if (
          item.currentPrice !== nextCurrent ||
          item.previousPrice !== nextPrev ||
          item.updatedAt !== nextUpdatedAt ||
          item.name !== nextName ||
          item.brand !== nextBrand ||
          item.verifiedPresentation !== nextPresentation ||
          item.storeOrMarket !== nextStore ||
          item.source !== nextSource ||
          item.verificationStatus !== nextVerif ||
          JSON.stringify(item.storePrices || []) !== JSON.stringify(nextStorePrices)
        ) {
          changed = true;
        }

        const updatedItem: PriceItem = {
          ...item,
          name: nextName,
          brand: nextBrand,
          verifiedPresentation: nextPresentation,
          currentPrice: nextCurrent,
          previousPrice: nextPrev,
          changePercentage,
          trend,
          storeOrMarket: nextStore,
          district: nextDistrict,
          address: nextAddress,
          updatedAt: nextUpdatedAt,
          source: nextSource,
          verificationStatus: nextVerif,
          trustLevel: nextTrust,
          isVerified: nextVerif === 'VERIFICADO',
          storePrices: nextStorePrices,
        };

        productMap.set(prodId, updatedItem);

        if (changed && batch && serverFirestore) {
          batch.set(
            serverFirestore.collection('products').doc(prodId),
            JSON.parse(JSON.stringify(updatedItem)),
            { merge: true }
          );
          batchCount++;
        }
      }
    }

    saveProductsMapToLocalBackup(productMap);

    if (batch && batchCount > 0 && isServerFirestoreReady(serverFirestore)) {
      await batch.commit().catch((err) => {
        if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
      });
    }
  } catch (err) {
    if (isQuotaExceededError(err)) {
      markServerFirestoreQuotaExceeded(err);
    }
  }
}

async function runProductsBootstrapCleanup(): Promise<{
  cleanedProducts: string[];
  initializedProducts: string[];
  preservedRealProducts: string[];
  removedDemoFuels: string[];
  products: PriceItem[];
}> {
  const cleanedProducts: string[] = [];
  const initializedProducts: string[] = [];
  const preservedRealProducts: string[] = [];
  const removedDemoFuels: string[] = [];

  if (!isServerFirestoreReady(serverFirestore) || !serverFirestore) {
    const fallbackMap = buildLocalFallbackProductsMap();
    await enrichCatalogProductsFromReportsAndLocalReferences(fallbackMap);
    const products = Array.from(fallbackMap.values());
    return {
      cleanedProducts,
      initializedProducts,
      preservedRealProducts: products.map((p) => p.id),
      removedDemoFuels,
      products,
    };
  }

  try {
    const productsCol = serverFirestore.collection('products');
    const snap = await productsCol.get();
    const existingIds = new Set<string>();
    const batch = serverFirestore.batch();
    let batchOps = 0;

    snap.forEach((docSnap) => {
      const id = docSnap.id;
      const data = docSnap.data() || {};

      // Eliminar únicamente IDs de mock antiguos ('p-1'..'p-6') si no tienen reporte real
      if (KNOWN_DEMO_PRODUCT_IDS.has(id) && !data.lastReportId && !data.verifiedReportId) {
        batch.delete(productsCol.doc(id));
        batchOps++;
        cleanedProducts.push(id);
        return;
      }

      existingIds.add(id);

      if (isKnownDemoProductRecord(id, data)) {
        const base = BASELINE_PRODUCTS.find((p) => p.id === id);
        if (base) {
          const cleanDoc = buildCleanCatalogProduct(base);
          batch.set(productsCol.doc(id), JSON.parse(JSON.stringify(cleanDoc)));
          batchOps++;
          cleanedProducts.push(id);
        }
      } else {
        preservedRealProducts.push(id);
      }
    });

    // Asegurar que los 5 productos del catálogo base existan en Firestore sin precios DEMO
    for (const base of BASELINE_PRODUCTS) {
      if (!existingIds.has(base.id)) {
        const cleanDoc = buildCleanCatalogProduct(base);
        batch.set(productsCol.doc(base.id), JSON.parse(JSON.stringify(cleanDoc)));
        batchOps++;
        initializedProducts.push(base.id);
      }
    }

    // Revisar únicamente antiguos IDs ficticios de combustibles sin tocar ninguna estación de Osinergmin
    const fuelsCol = serverFirestore.collection('fuelStations');
    const fuelsSnap = await fuelsCol.get();
    fuelsSnap.forEach((docSnap) => {
      const id = docSnap.id;
      const data = docSnap.data() || {};
      const isOsinergminStation =
        id.startsWith('fuel-osn-') ||
        Boolean(data.registroHidrocarburos) ||
        String(data.source || '').toLowerCase().includes('osinergmin');

      if (!isOsinergminStation && KNOWN_DEMO_FUEL_IDS.has(id)) {
        batch.delete(fuelsCol.doc(id));
        batchOps++;
        removedDemoFuels.push(id);
      }
    });

    if (batchOps > 0) {
      await batch.commit();
    }

    // Leer estado final limpio de productos
    const finalSnap = await productsCol.get();
    const productMap = new Map<string, PriceItem>();
    finalSnap.forEach((docSnap) => {
      if (!KNOWN_DEMO_PRODUCT_IDS.has(docSnap.id)) {
        productMap.set(docSnap.id, sanitizeProductFromFirestore(docSnap.id, docSnap.data()));
      }
    });

    await enrichCatalogProductsFromReportsAndLocalReferences(productMap);
    const products = Array.from(productMap.values());

    return {
      cleanedProducts,
      initializedProducts,
      preservedRealProducts,
      removedDemoFuels,
      products,
    };
  } catch (err) {
    if (isQuotaExceededError(err)) {
      markServerFirestoreQuotaExceeded(err);
    }
    const fallbackMap = buildLocalFallbackProductsMap();
    await enrichCatalogProductsFromReportsAndLocalReferences(fallbackMap);
    const products = Array.from(fallbackMap.values());
    return {
      cleanedProducts,
      initializedProducts,
      preservedRealProducts: products.map((p) => p.id),
      removedDemoFuels,
      products,
    };
  }
}

// 2. GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    // Verificar si las fuentes de precios en internet requieren actualización (> 6h)
    if (!isInternetSyncRunning) {
      const { sourcesMap, groupsMap } = await loadInternetPriceStateFromFirestore();
      let latestMs = lastInternetSyncTimestampMs;
      for (const s of sourcesMap.values()) {
        if (s.lastFetchedAt) {
          const parsed = Date.parse(s.lastFetchedAt);
          if (!isNaN(parsed) && parsed > latestMs) latestMs = parsed;
        }
      }
      if (groupsMap.size === 0 || !latestMs || Date.now() - latestMs >= INTERNET_COOLDOWN_MS) {
        await runAndPersistInternetPriceSync(false).catch(() => {});
      }
    }

    if (!isServerFirestoreReady(serverFirestore) || !serverFirestore) {
      const fallbackMap = buildLocalFallbackProductsMap();
      await enrichCatalogProductsFromReportsAndLocalReferences(fallbackMap);
      const products = Array.from(fallbackMap.values());
      return res.status(200).json({
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        count: products.length,
        products,
      });
    }

    const snap = await serverFirestore.collection('products').get();
    if (snap.empty) {
      const fallbackMap = buildLocalFallbackProductsMap();
      await enrichCatalogProductsFromReportsAndLocalReferences(fallbackMap);
      const cleanCatalog = Array.from(fallbackMap.values());
      return res.status(200).json({
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        count: cleanCatalog.length,
        products: cleanCatalog,
      });
    }

    const existingFirestoreIds = new Set<string>();
    const productMap = new Map<string, PriceItem>();
    snap.forEach((docSnap) => {
      if (KNOWN_DEMO_PRODUCT_IDS.has(docSnap.id)) return;
      existingFirestoreIds.add(docSnap.id);
      const sanitized = sanitizeProductFromFirestore(docSnap.id, docSnap.data());
      productMap.set(docSnap.id, sanitized);
    });

    // Asegurar presencia del catálogo base sin precios ficticios
    const missingBaseIds: string[] = [];
    for (const base of BASELINE_PRODUCTS) {
      if (!productMap.has(base.id)) {
        productMap.set(base.id, buildCleanCatalogProduct(base));
      }
      if (!existingFirestoreIds.has(base.id)) {
        missingBaseIds.push(base.id);
      }
    }

    await enrichCatalogProductsFromReportsAndLocalReferences(productMap);

    if (missingBaseIds.length > 0 && isServerFirestoreReady(serverFirestore) && serverFirestore) {
      try {
        const b = serverFirestore.batch();
        for (const mId of missingBaseIds) {
          const item = productMap.get(mId);
          if (item) {
            b.set(
              serverFirestore.collection('products').doc(mId),
              JSON.parse(JSON.stringify(item)),
              { merge: true }
            );
          }
        }
        await b.commit();
      } catch (e) {
        if (isQuotaExceededError(e)) markServerFirestoreQuotaExceeded(e);
      }
    }

    const products = Array.from(productMap.values());
    return res.status(200).json({
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      count: products.length,
      products,
    });
  } catch (error) {
    if (isQuotaExceededError(error)) {
      markServerFirestoreQuotaExceeded(error);
    }
    const fallbackMap = buildLocalFallbackProductsMap();
    await enrichCatalogProductsFromReportsAndLocalReferences(fallbackMap);
    const products = Array.from(fallbackMap.values());
    return res.status(200).json({
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      count: products.length,
      products,
    });
  }
});

function formatReportDoc(id: string, data: Record<string, any>): CommunityReport {
  return {
    id,
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
  };
}

function getLocalFallbackReportsList(): CommunityReport[] {
  const backup = loadLocalBackupState();
  const reports: CommunityReport[] = [];
  for (const [id, data] of Object.entries(backup.reports || {})) {
    reports.push(formatReportDoc(id, data || {}));
  }
  reports.sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  return reports;
}

// 2b. GET /api/reports (Lectura de reportes ciudadanos desde el servidor)
app.get('/api/reports', async (req, res) => {
  try {
    if (!isServerFirestoreReady(serverFirestore) || !serverFirestore) {
      const fallbackReports = getLocalFallbackReportsList();
      return res.status(200).json({
        status: 'SUCCESS',
        count: fallbackReports.length,
        reports: fallbackReports,
      });
    }
    const snap = await serverFirestore.collection('priceReports').get();
    const reports: CommunityReport[] = [];
    const backup = loadLocalBackupState();
    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const formatted = formatReportDoc(docSnap.id, data);
      reports.push(formatted);
      backup.reports[docSnap.id] = { ...data, ...formatted };
    });
    saveLocalBackupState();
    reports.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return res.status(200).json({
      status: 'SUCCESS',
      count: reports.length,
      reports,
    });
  } catch (error) {
    if (isQuotaExceededError(error)) {
      markServerFirestoreQuotaExceeded(error);
    }
    const fallbackReports = getLocalFallbackReportsList();
    return res.status(200).json({
      status: 'SUCCESS',
      count: fallbackReports.length,
      reports: fallbackReports,
    });
  }
});

// 3. POST /api/products/bootstrap
app.post('/api/products/bootstrap', async (req, res) => {
  try {
    const result = await runProductsBootstrapCleanup();
    return res.status(200).json({
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      cleanedProducts: result.cleanedProducts,
      initializedProducts: result.initializedProducts,
      preservedRealProducts: result.preservedRealProducts,
      removedDemoFuels: result.removedDemoFuels,
      count: result.products.length,
      products: result.products,
    });
  } catch (error) {
    if (isQuotaExceededError(error)) {
      markServerFirestoreQuotaExceeded(error);
    }
    const fallbackMap = buildLocalFallbackProductsMap();
    await enrichCatalogProductsFromReportsAndLocalReferences(fallbackMap);
    const products = Array.from(fallbackMap.values());
    return res.status(200).json({
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      cleanedProducts: [],
      initializedProducts: [],
      preservedRealProducts: products.map((p) => p.id),
      removedDemoFuels: [],
      count: products.length,
      products,
    });
  }
});

// 4, 5, 6, 7. POST /api/reports
app.post('/api/reports', async (req, res) => {
  try {
    const body = req.body || {};
    const productName = typeof body.product === 'string' ? body.product.trim() : '';
    const storeName = typeof body.storeName === 'string' ? body.storeName.trim() : '';
    const priceNum = Number(body.price);

    if (!productName) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'El nombre del producto es obligatorio.',
      });
    }
    if (!storeName) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'El nombre del mercado, tienda o puesto es obligatorio.',
      });
    }
    if (isNaN(priceNum) || !isFinite(priceNum) || priceNum <= 0) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'El precio reportado debe ser un número mayor a 0.',
      });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const formattedDate = `${now.toLocaleDateString('es-PE')} · ${now.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const reportType: 'price' | 'offer' = body.type === 'offer' ? 'offer' : 'price';
    const district =
      typeof body.district === 'string' && body.district.trim()
        ? body.district.trim()
        : 'Huánuco Cercado';
    const address =
      typeof body.address === 'string' && body.address.trim()
        ? body.address.trim()
        : typeof body.location === 'string' && body.location.trim()
        ? body.location.trim()
        : '';
    const location =
      typeof body.location === 'string' && body.location.trim()
        ? body.location.trim()
        : address || district;

    const prevPriceNum =
      body.previousPrice !== undefined &&
      body.previousPrice !== null &&
      body.previousPrice !== '' &&
      !isNaN(Number(body.previousPrice)) &&
      Number(body.previousPrice) > 0
        ? Number(body.previousPrice)
        : undefined;

    const backup = loadLocalBackupState();
    const existingProductsMap = new Map<string, Record<string, any>>();
    for (const [id, pData] of Object.entries(backup.products || {})) {
      if (!KNOWN_DEMO_PRODUCT_IDS.has(id)) {
        existingProductsMap.set(id, pData as Record<string, any>);
      }
    }

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      try {
        const productsSnap = await serverFirestore.collection('products').get();
        productsSnap.forEach((docSnap) => {
          if (!KNOWN_DEMO_PRODUCT_IDS.has(docSnap.id)) {
            existingProductsMap.set(docSnap.id, docSnap.data());
          }
        });
      } catch (err) {
        if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
      }
    }

    const catalogMatch = findMatchingCatalogProduct(
      typeof body.productId === 'string' ? body.productId : undefined,
      productName,
      existingProductsMap
    );

    const reportId =
      typeof body.id === 'string' && body.id.trim().startsWith('rep-')
        ? body.id.trim()
        : `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const reportDoc: Record<string, any> = {
      id: reportId,
      type: reportType,
      productId: catalogMatch ? catalogMatch.id : body.productId || null,
      product: productName,
      price: Number(priceNum.toFixed(2)),
      storeName,
      district,
      address,
      location,
      date: formattedDate,
      comment: typeof body.comment === 'string' ? body.comment.trim() : '',
      description:
        typeof body.description === 'string' && body.description.trim()
          ? body.description.trim()
          : typeof body.comment === 'string'
          ? body.comment.trim()
          : '',
      whatsapp: typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '',
      photoUrl: typeof body.photoUrl === 'string' && body.photoUrl ? body.photoUrl : null,
      authorId: typeof body.authorId === 'string' && body.authorId ? body.authorId : null,
      validUntil: typeof body.validUntil === 'string' ? body.validUntil.trim() : '',
      trustLevel: 'reported',
      status: 'PENDIENTE',
      isVerified: false,
      createdAt: nowIso,
    };

    if (prevPriceNum !== undefined) {
      reportDoc.previousPrice = Number(prevPriceNum.toFixed(2));
    }

    backup.reports[reportId] = { ...reportDoc, ...formatReportDoc(reportId, reportDoc) };
    saveLocalBackupState();

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      await serverFirestore
        .collection('priceReports')
        .doc(reportId)
        .set(reportDoc)
        .catch((err) => {
          if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
        });
    }

    let updatedProductResult: PriceItem | null = null;

    // 5. Si type === 'price' y el producto pertenece al catálogo
    if (reportType === 'price' && catalogMatch) {
      const targetProdId = catalogMatch.id;
      const rawExisting = catalogMatch.existingData || {};
      const baseTemplate =
        catalogMatch.baseTemplate ||
        BASELINE_PRODUCTS.find((p) => p.id === targetProdId) || {
          id: targetProdId,
          name: productName,
          category: 'alimentos',
          unit: 'kg',
          icon: '📦',
          currentPrice: null,
          previousPrice: null,
          changePercentage: 0,
          trend: 'stable',
          storeOrMarket: storeName,
          district,
          address,
          location,
          googleMapsQuery: `${storeName} ${district} Huánuco`,
          updatedAt: '',
          trustLevel: 'pending',
          verificationStatus: 'PENDIENTE',
          isVerified: false,
          source: 'Pendiente de reporte ciudadano',
          priceType: 'minorista',
          storePrices: [],
        };

      // Limpiar si el documento existente tenía datos DEMO antiguos
      const cleanExisting = isKnownDemoProductRecord(targetProdId, rawExisting)
        ? buildCleanCatalogProduct(baseTemplate)
        : sanitizeProductFromFirestore(targetProdId, rawExisting);

      const reportedPrice = Number(priceNum.toFixed(2));

      // Actualizar lista de storePrices
      const updatedStorePrices = upsertStorePriceList(
        cleanExisting.storePrices || [],
        {
          storeName,
          price: reportedPrice,
          district,
          address: address || location || district,
          updatedAt: nowIso,
          trustLevel: 'reported',
          verificationStatus: 'REPORTADO',
          source: 'Reporte ciudadano',
        },
        true
      );

      // Determinar el precio anterior real para detectar subidas y bajadas sin perder variaciones del día
      let realPrevPrice: number | null = null;
      if (cleanExisting.currentPrice !== null && cleanExisting.currentPrice > 0) {
        if (Math.abs(reportedPrice - cleanExisting.currentPrice) > 0.005) {
          realPrevPrice = cleanExisting.currentPrice;
        } else if (
          prevPriceNum !== undefined &&
          prevPriceNum > 0 &&
          Math.abs(reportedPrice - prevPriceNum) > 0.005
        ) {
          realPrevPrice = Number(prevPriceNum.toFixed(2));
        } else if (
          cleanExisting.previousPrice !== null &&
          cleanExisting.previousPrice > 0 &&
          Math.abs(reportedPrice - cleanExisting.previousPrice) > 0.005
        ) {
          realPrevPrice = cleanExisting.previousPrice;
        }
      } else if (
        prevPriceNum !== undefined &&
        prevPriceNum > 0 &&
        Math.abs(reportedPrice - prevPriceNum) > 0.005
      ) {
        realPrevPrice = Number(prevPriceNum.toFixed(2));
      }

      if (realPrevPrice === null) {
        const localRef = await resolveLocalReferenceForCatalogProduct(targetProdId);
        if (localRef) {
          if (Math.abs(reportedPrice - localRef.currentPrice) > 0.005) {
            realPrevPrice = localRef.currentPrice;
          } else if (
            localRef.previousPrice !== null &&
            localRef.previousPrice > 0 &&
            Math.abs(reportedPrice - localRef.previousPrice) > 0.005
          ) {
            realPrevPrice = localRef.previousPrice;
          }
        }
      }

      const calc =
        realPrevPrice !== null && realPrevPrice > 0
          ? calculatePriceChange(realPrevPrice, reportedPrice)
          : { changePercentage: 0, trend: 'stable' as PriceTrend };

      const nextProductDoc: Record<string, any> = {
        ...cleanExisting,
        id: targetProdId,
        previousPrice: realPrevPrice,
        currentPrice: reportedPrice,
        changePercentage: calc.changePercentage,
        trend: calc.trend,
        verificationStatus: 'REPORTADO',
        trustLevel: 'reported',
        isVerified: false,
        storeOrMarket: storeName,
        district,
        address: address || cleanExisting.address || '',
        location: location || cleanExisting.location || '',
        googleMapsQuery: `${storeName} ${district} Huánuco`.trim(),
        updatedAt: nowIso,
        source: 'Reporte ciudadano',
        storePrices: updatedStorePrices,
        lastReportId: reportId,
        lastReportAuthorId: reportDoc.authorId || null,
        confirmedBy: [],
        confirmationsCount: 0,
      };

      updatedProductResult = sanitizeProductFromFirestore(targetProdId, nextProductDoc);
      backup.products[targetProdId] = { ...nextProductDoc, ...updatedProductResult } as PriceItem;
      saveLocalBackupState();

      if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
        await serverFirestore
          .collection('products')
          .doc(targetProdId)
          .set(JSON.parse(JSON.stringify(nextProductDoc)), {
            merge: true,
          })
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
          });
      }
    }

    return res.status(201).json({
      status: 'SUCCESS',
      reportId,
      report: reportDoc,
      productUpdated: updatedProductResult,
      message: 'Reporte ciudadano registrado con estado PENDIENTE.',
    });
  } catch (error) {
    if (isQuotaExceededError(error)) {
      markServerFirestoreQuotaExceeded(error);
    }
    return res.status(500).json({
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Error interno al guardar el reporte.',
    });
  }
});

// 8, 9, 10. POST /api/reports/:id/verify
app.post('/api/reports/:id/verify', async (req, res) => {
  try {
    const reportId = req.params.id;
    if (!reportId) {
      return res.status(400).json({
        status: 'ERROR',
        success: false,
        message: 'ID de reporte requerido.',
      });
    }

    const backup = loadLocalBackupState();
    let reportData: Record<string, any> | null = backup.reports[reportId] || null;

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      try {
        const reportSnap = await serverFirestore.collection('priceReports').doc(reportId).get();
        if (reportSnap.exists) {
          reportData = reportSnap.data() || {};
        }
      } catch (err) {
        if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
      }
    }

    if (!reportData) {
      return res.status(404).json({
        status: 'ERROR',
        success: false,
        message: 'El reporte especificado no existe.',
      });
    }

    if (reportData.status === 'RECHAZADO') {
      return res.status(409).json({
        status: 'ERROR',
        success: false,
        message: 'No se puede verificar un reporte que ya fue rechazado.',
      });
    }

    if (reportData.status === 'VERIFICADO') {
      return res.status(409).json({
        status: 'ERROR',
        success: false,
        message: 'Este reporte ya fue verificado anteriormente.',
      });
    }

    const reviewerId =
      req.body?.reviewer?.id || req.body?.reviewerId || req.headers['x-client-id'] || '';
    const reviewerName =
      req.body?.reviewer?.name || req.body?.reviewerName || 'Moderador Autorizado';
    const notes =
      typeof req.body?.notes === 'string' && req.body.notes.trim()
        ? req.body.notes.trim()
        : 'Verificado mediante comprobación oficial / campo';

    // 4. Comprobar que el revisor no sea el mismo authorId cuando exista identidad disponible
    if (reportData.authorId && reviewerId && String(reportData.authorId) === String(reviewerId)) {
      return res.status(409).json({
        status: 'ERROR',
        success: false,
        message: 'Acción rechazada: Un usuario no puede verificar su propio reporte.',
      });
    }

    const verifiedAt = new Date().toISOString();
    const updatedReportFields = {
      status: 'VERIFICADO' as const,
      isVerified: true,
      verifiedAt,
      verifiedBy: reviewerName,
      verifiedById: reviewerId || null,
      moderationNotes: notes,
    };

    const mergedReport = { ...reportData, ...updatedReportFields };
    backup.reports[reportId] = { ...mergedReport, ...formatReportDoc(reportId, mergedReport) };
    saveLocalBackupState();

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      await serverFirestore
        .collection('priceReports')
        .doc(reportId)
        .set(updatedReportFields, { merge: true })
        .catch((err) => {
          if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
        });
    }

    const reportType: 'price' | 'offer' = reportData.type === 'offer' ? 'offer' : 'price';
    let updatedProduct: PriceItem | null = null;
    let publishedOffer: OfferItem | null = null;

    if (reportType === 'price') {
      // 9. SI EL REPORTE VERIFICADO ES DE PRECIO -> Actualizar products
      const existingProductsMap = new Map<string, Record<string, any>>();
      for (const [id, pData] of Object.entries(backup.products || {})) {
        if (!KNOWN_DEMO_PRODUCT_IDS.has(id)) {
          existingProductsMap.set(id, pData as Record<string, any>);
        }
      }

      if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
        try {
          const productsSnap = await serverFirestore.collection('products').get();
          productsSnap.forEach((docSnap) => {
            if (!KNOWN_DEMO_PRODUCT_IDS.has(docSnap.id)) {
              existingProductsMap.set(docSnap.id, docSnap.data());
            }
          });
        } catch (err) {
          if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
        }
      }

      const catalogMatch = findMatchingCatalogProduct(
        reportData.productId || undefined,
        reportData.product || '',
        existingProductsMap
      );

      const targetProdId = catalogMatch
        ? catalogMatch.id
        : `prod-${normalizeText(reportData.product || 'item').replace(/[^a-z0-9]+/g, '-')}`;

      const rawExisting = catalogMatch?.existingData || existingProductsMap.get(targetProdId) || {};
      const baseTemplate =
        catalogMatch?.baseTemplate ||
        BASELINE_PRODUCTS.find((p) => p.id === targetProdId) || {
          id: targetProdId,
          name: reportData.product || 'Producto',
          category: 'alimentos',
          unit: 'kg',
          icon: '📦',
          currentPrice: null,
          previousPrice: null,
          changePercentage: 0,
          trend: 'stable',
          storeOrMarket: reportData.storeName || 'Huánuco',
          district: reportData.district || 'Huánuco Cercado',
          address: reportData.address || reportData.location || '',
          location: reportData.location || '',
          googleMapsQuery: `${reportData.storeName || ''} ${reportData.district || 'Huánuco'}`.trim(),
          updatedAt: '',
          trustLevel: 'pending',
          verificationStatus: 'PENDIENTE',
          isVerified: false,
          source: 'Reporte ciudadano verificado',
          priceType: 'minorista',
          storePrices: [],
        };

      const cleanExisting = isKnownDemoProductRecord(targetProdId, rawExisting)
        ? buildCleanCatalogProduct(baseTemplate)
        : sanitizeProductFromFirestore(targetProdId, rawExisting);

      const verifiedPrice = Number(Number(reportData.price).toFixed(2));

      let realPreviousPrice: number | null = null;
      if (rawExisting && rawExisting.lastReportId === reportId) {
        realPreviousPrice =
          typeof cleanExisting.previousPrice === 'number' && cleanExisting.previousPrice > 0
            ? cleanExisting.previousPrice
            : null;
      } else if (
        typeof cleanExisting.currentPrice === 'number' &&
        cleanExisting.currentPrice > 0 &&
        Math.abs(cleanExisting.currentPrice - verifiedPrice) > 0.005
      ) {
        realPreviousPrice = cleanExisting.currentPrice;
      } else if (
        typeof cleanExisting.previousPrice === 'number' &&
        cleanExisting.previousPrice > 0 &&
        Math.abs(cleanExisting.previousPrice - verifiedPrice) > 0.005
      ) {
        realPreviousPrice = cleanExisting.previousPrice;
      }

      if (
        realPreviousPrice === null &&
        reportData.previousPrice !== undefined &&
        Number(reportData.previousPrice) > 0 &&
        Math.abs(Number(reportData.previousPrice) - verifiedPrice) > 0.005
      ) {
        realPreviousPrice = Number(Number(reportData.previousPrice).toFixed(2));
      }

      if (realPreviousPrice === null) {
        const localRef = await resolveLocalReferenceForCatalogProduct(targetProdId);
        if (localRef) {
          if (Math.abs(verifiedPrice - localRef.currentPrice) > 0.005) {
            realPreviousPrice = localRef.currentPrice;
          } else if (
            localRef.previousPrice !== null &&
            localRef.previousPrice > 0 &&
            Math.abs(verifiedPrice - localRef.previousPrice) > 0.005
          ) {
            realPreviousPrice = localRef.previousPrice;
          }
        }
      }

      let changePercentage = 0;
      let trend: PriceTrend = 'stable';
      if (realPreviousPrice !== null && realPreviousPrice > 0 && verifiedPrice > 0) {
        const calc = calculatePriceChange(realPreviousPrice, verifiedPrice);
        changePercentage = calc.changePercentage;
        trend = calc.trend;
      }

      const storeName = reportData.storeName || cleanExisting.storeOrMarket || 'Huánuco';
      const district = reportData.district || cleanExisting.district || 'Huánuco Cercado';
      const address = reportData.address || reportData.location || cleanExisting.address || '';

      const updatedStorePrices = upsertStorePriceList(
        cleanExisting.storePrices || [],
        {
          storeName,
          price: verifiedPrice,
          district,
          address: address || district,
          updatedAt: verifiedAt,
          trustLevel: 'verified',
          verificationStatus: 'VERIFICADO',
          source: 'Reporte ciudadano verificado',
        },
        true
      );

      const nextProductDoc: Record<string, any> = {
        ...cleanExisting,
        id: targetProdId,
        name: cleanExisting.name || reportData.product,
        currentPrice: verifiedPrice,
        previousPrice: realPreviousPrice,
        changePercentage,
        trend,
        storeOrMarket: storeName,
        district,
        address,
        location: reportData.location || cleanExisting.location || address,
        googleMapsQuery: `${storeName} ${district} Huánuco`.trim(),
        storePrices: updatedStorePrices,
        updatedAt: verifiedAt,
        source: 'Reporte ciudadano verificado',
        verificationStatus: 'VERIFICADO',
        trustLevel: 'verified',
        isVerified: true,
        lastReportId: reportId,
        verifiedReportId: reportId,
        verifiedAt,
        verifiedBy: reviewerName,
      };

      updatedProduct = sanitizeProductFromFirestore(targetProdId, nextProductDoc);
      backup.products[targetProdId] = { ...nextProductDoc, ...updatedProduct } as PriceItem;
      saveLocalBackupState();

      if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
        await serverFirestore
          .collection('products')
          .doc(targetProdId)
          .set(JSON.parse(JSON.stringify(nextProductDoc)), {
            merge: true,
          })
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
          });
      }
    } else {
      // 10. SI EL REPORTE VERIFICADO ES UNA OFERTA -> Crear/actualizar offers
      const offerPrice = Number(Number(reportData.price).toFixed(2));
      const originalPrice =
        reportData.previousPrice !== undefined &&
        reportData.previousPrice !== null &&
        Number(reportData.previousPrice) > 0
          ? Number(Number(reportData.previousPrice).toFixed(2))
          : 0;

      const discountPercentage =
        originalPrice > 0 && originalPrice > offerPrice
          ? calculateDiscount(originalPrice, offerPrice)
          : 0;

      const validUntil = typeof reportData.validUntil === 'string' ? reportData.validUntil : '';
      const offerId = `offer-${reportId}`;
      const store = reportData.storeName || 'Comercio local';
      const district = reportData.district || 'Huánuco Cercado';
      const location = reportData.location || reportData.address || district;

      const offerDoc: Record<string, any> = {
        id: offerId,
        title: reportData.product || 'Oferta verificada',
        product: reportData.product || 'Oferta verificada',
        unit: reportData.unit || 'unidad',
        category: reportData.category || 'alimentos',
        originalPrice,
        oldPrice: originalPrice,
        offerPrice,
        currentPrice: offerPrice,
        discountPercentage,
        store,
        storePhotoUrl: reportData.photoUrl || null,
        location,
        district,
        googleMapsQuery: `${store} ${location} ${district} Huánuco`.trim(),
        whatsapp: reportData.whatsapp || '',
        description: reportData.description || reportData.comment || '',
        validUntil,
        isActive: true,
        isVerified: true,
        trustLevel: 'verified',
        verificationStatus: 'VERIFICADO',
        isExpired: false,
        source: 'Reporte ciudadano verificado',
        imageUrl: reportData.photoUrl || null,
        createdAt: reportData.createdAt || verifiedAt,
        verifiedAt,
        verifiedBy: reviewerName,
        updatedAt: verifiedAt,
        reportId,
      };

      backup.offers[offerId] = offerDoc;
      saveLocalBackupState();

      if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
        await serverFirestore
          .collection('offers')
          .doc(offerId)
          .set(JSON.parse(JSON.stringify(offerDoc)), { merge: true })
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
          });
      }

      publishedOffer = offerDoc as unknown as OfferItem;
    }

    return res.status(200).json({
      status: 'SUCCESS',
      success: true,
      message: 'Reporte verificado con éxito y publicado en el sistema.',
      reportId,
      verifiedAt,
      verifiedBy: reviewerName,
      product: updatedProduct,
      offer: publishedOffer,
    });
  } catch (error) {
    if (isQuotaExceededError(error)) {
      markServerFirestoreQuotaExceeded(error);
    }
    return res.status(500).json({
      status: 'ERROR',
      success: false,
      message: error instanceof Error ? error.message : 'Error al verificar el reporte.',
    });
  }
});

// 11. POST /api/reports/:id/reject
app.post('/api/reports/:id/reject', async (req, res) => {
  try {
    const reportId = req.params.id;
    if (!reportId) {
      return res.status(400).json({
        status: 'ERROR',
        success: false,
        message: 'ID de reporte requerido.',
      });
    }

    const backup = loadLocalBackupState();
    let existingReport: Record<string, any> | null = backup.reports[reportId] || null;

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      try {
        const reportSnap = await serverFirestore.collection('priceReports').doc(reportId).get();
        if (reportSnap.exists) {
          existingReport = reportSnap.data() || {};
        }
      } catch (err) {
        if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
      }
    }

    if (!existingReport) {
      return res.status(404).json({
        status: 'ERROR',
        success: false,
        message: 'El reporte especificado no existe.',
      });
    }

    const reviewerId =
      req.body?.reviewer?.id || req.body?.reviewerId || req.headers['x-client-id'] || '';
    const reviewerName =
      req.body?.reviewer?.name || req.body?.reviewerName || 'Moderador Autorizado';
    const reason =
      (typeof req.body?.reason === 'string' && req.body.reason.trim()) ||
      (typeof req.body?.rejectionReason === 'string' && req.body.rejectionReason.trim()) ||
      'Rechazado por inconsistencia o falta de evidencia';

    const rejectedAt = new Date().toISOString();
    const rejectFields = {
      status: 'RECHAZADO' as const,
      isVerified: false,
      rejectedAt,
      rejectedBy: reviewerName,
      rejectedById: reviewerId || null,
      rejectionReason: reason,
      moderationNotes: reason,
    };

    const mergedReport = { ...existingReport, ...rejectFields };
    backup.reports[reportId] = { ...mergedReport, ...formatReportDoc(reportId, mergedReport) };
    saveLocalBackupState();

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      await serverFirestore
        .collection('priceReports')
        .doc(reportId)
        .set(rejectFields, { merge: true })
        .catch((err) => {
          if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
        });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      success: true,
      message: 'Reporte rechazado y marcado en el sistema.',
      reportId,
      rejectedAt,
      rejectedBy: reviewerName,
      rejectionReason: reason,
    });
  } catch (error) {
    if (isQuotaExceededError(error)) {
      markServerFirestoreQuotaExceeded(error);
    }
    return res.status(500).json({
      status: 'ERROR',
      success: false,
      message: error instanceof Error ? error.message : 'Error al rechazar el reporte.',
    });
  }
});

// 12 & 13. POST /api/products/:id/confirm
app.post('/api/products/:id/confirm', async (req, res) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      return res.status(400).json({
        status: 'ERROR',
        success: false,
        message: 'ID de producto requerido.',
      });
    }

    const clientId =
      (typeof req.body?.clientId === 'string' && req.body.clientId.trim()) ||
      (typeof req.body?.userId === 'string' && req.body.userId.trim()) ||
      (typeof req.headers['x-client-id'] === 'string' && req.headers['x-client-id'].trim()) ||
      '';

    if (!clientId) {
      return res.status(400).json({
        status: 'ERROR',
        success: false,
        message: 'Se requiere identificador de dispositivo (huanuco_user_client_id) para confirmar.',
      });
    }

    const backup = loadLocalBackupState();
    let rawData: Record<string, any> | null =
      (backup.products[productId] as unknown as Record<string, any>) || null;

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      try {
        const prodSnap = await serverFirestore.collection('products').doc(productId).get();
        if (prodSnap.exists) {
          rawData = prodSnap.data() || {};
        }
      } catch (err) {
        if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
      }
    }

    if (!rawData) {
      const fallbackMap = buildLocalFallbackProductsMap();
      await enrichCatalogProductsFromReportsAndLocalReferences(fallbackMap);
      rawData = (fallbackMap.get(productId) as unknown as Record<string, any>) || null;
    }

    if (!rawData) {
      return res.status(404).json({
        status: 'ERROR',
        success: false,
        message: 'El producto especificado no existe.',
      });
    }

    const sanitized = sanitizeProductFromFirestore(productId, rawData);

    if (sanitized.currentPrice === null) {
      return res.status(400).json({
        status: 'ERROR',
        success: false,
        message: 'No se puede confirmar un producto que no tiene precio reportado.',
      });
    }

    const confirmedBy: string[] = Array.isArray(rawData.confirmedBy)
      ? rawData.confirmedBy.filter((id: unknown) => typeof id === 'string')
      : [];

    if (confirmedBy.includes(clientId)) {
      return res.status(409).json({
        status: 'CONFLICT',
        success: false,
        alreadyConfirmed: true,
        confirmationsCount: confirmedBy.length,
        message: 'Este dispositivo ya confirmó este precio anteriormente.',
      });
    }

    const nextConfirmedBy = [...confirmedBy, clientId];
    const confirmationsCount = nextConfirmedBy.length;
    const lastConfirmedAt = new Date().toISOString();

    const updatedProd = {
      ...rawData,
      ...sanitized,
      confirmedBy: nextConfirmedBy,
      confirmationsCount,
      lastConfirmedAt,
    };
    backup.products[productId] = updatedProd as PriceItem;
    saveLocalBackupState();

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      await serverFirestore
        .collection('products')
        .doc(productId)
        .set(
          {
            confirmedBy: nextConfirmedBy,
            confirmationsCount,
            lastConfirmedAt,
          },
          { merge: true }
        )
        .catch((err) => {
          if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
        });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      success: true,
      alreadyConfirmed: false,
      productId,
      confirmationsCount,
      lastConfirmedAt,
      message: 'Confirmación de precio registrada correctamente.',
    });
  } catch (error) {
    if (isQuotaExceededError(error)) {
      markServerFirestoreQuotaExceeded(error);
    }
    return res.status(500).json({
      status: 'ERROR',
      success: false,
      message: error instanceof Error ? error.message : 'Error al registrar confirmación.',
    });
  }
});

// ============================================================================
// MÓDULO DE TIENDAS CON PROMOCIÓN Y AUTENTICACIÓN DE VENDEDORES POR CORREO
// ============================================================================

const VENDOR_HASH_SALT = process.env.VENDOR_HASH_SALT || 'huanuco-precios-hoy-vendor-salt-v1';

function parseFlexibleDateMs(dateStr: string | undefined | null, endOfDay: boolean): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Si es formato YYYY-MM-DD
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

function computePromotionLifecycle(
  validFrom?: string,
  validUntil?: string
): {
  promotionStatus: 'PROXIMAMENTE' | 'OFERTA_ACTIVA' | 'PROMOCION_VENCIDA';
  isExpired: boolean;
} {
  const nowMs = Date.now();
  const startMs = parseFlexibleDateMs(validFrom, false);
  const endMs = parseFlexibleDateMs(validUntil, true);

  if (endMs !== null && nowMs > endMs) {
    return { promotionStatus: 'PROMOCION_VENCIDA', isExpired: true };
  }
  if (startMs !== null && nowMs < startMs) {
    return { promotionStatus: 'PROXIMAMENTE', isExpired: false };
  }
  return { promotionStatus: 'OFERTA_ACTIVA', isExpired: false };
}

function normalizePeruvianPhone(rawPhone: string): string | null {
  const trimmed = (rawPhone || '').trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  // Si viene con prefijo +51 o 51 seguido de exactamente 9 dígitos
  if (digits.length === 11 && digits.startsWith('51')) {
    const nineDigits = digits.slice(2);
    if (/^\d{9}$/.test(nineDigits)) {
      return `+51${nineDigits}`;
    }
  }
  // Si el vendedor ingresa directamente sus 9 dígitos
  if (digits.length === 9 && /^\d{9}$/.test(digits)) {
    return `+51${digits}`;
  }
  return null;
}

function cleanWhatsAppDigitsPeru(rawPhone?: string | null): string | null {
  if (!rawPhone || typeof rawPhone !== 'string') return null;
  const normalized = normalizePeruvianPhone(rawPhone);
  if (!normalized) return null;
  return normalized.replace(/[^\d]/g, ''); // 51XXXXXXXXX (11 dígitos)
}

function normalizeVendorEmail(rawEmail: string): string | null {
  const email = (rawEmail || '').trim().toLowerCase();
  if (!email || email.length > 180) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function deriveVendorIdFromEmail(normalizedEmail: string): string {
  const hash = crypto
    .createHmac('sha256', VENDOR_HASH_SALT)
    .update(`email:${normalizedEmail}`)
    .digest('hex')
    .slice(0, 16);
  return `vnd-${hash}`;
}

interface VendorSessionRecord {
  uid: string;
  vendorId: string;
  email: string;
}

const memoryPrivateContacts = new Map<string, { whatsapp: string }>();

async function verifyVendorSession(req: express.Request): Promise<VendorSessionRecord | null> {
  const authHeader = req.headers['authorization'] || '';
  const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!idToken) return null;

  const apiKey = (firebaseConfig as Record<string, any>)?.apiKey;
  if (!apiKey) return null;

  try {
    const fbRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!fbRes.ok) {
      return null;
    }

    const fbData = (await fbRes.json().catch(() => ({}))) as {
      users?: Array<{
        localId?: string;
        email?: string;
      }>;
    };

    const user = Array.isArray(fbData.users) ? fbData.users[0] : undefined;
    if (!user || !user.localId) {
      return null;
    }

    const normalizedEmail = user.email ? normalizeVendorEmail(user.email) : null;
    const vendorId = normalizedEmail
      ? deriveVendorIdFromEmail(normalizedEmail)
      : `vnd-${user.localId.slice(0, 16)}`;

    return {
      uid: user.localId,
      vendorId,
      email: normalizedEmail || user.email || '',
    };
  } catch (e) {
    console.warn('[VendorAuth] Aviso al verificar token con Firebase Authentication:', e);
    return null;
  }
}

function sanitizePublicOffer(
  docId: string,
  data: Record<string, any>,
  resolvedPrivateWhatsapp?: string | null
): OfferItem {
  const validFrom = data.validFrom || '';
  const validUntil = data.validUntil || '';
  const lifecycle = computePromotionLifecycle(validFrom, validUntil);

  const originalPrice = Number(data.originalPrice ?? data.oldPrice) || 0;
  const offerPrice = Number(data.offerPrice ?? data.currentPrice) || 0;
  const discountPercentage =
    typeof data.discountPercentage === 'number' && data.discountPercentage > 0
      ? data.discountPercentage
      : originalPrice > offerPrice && originalPrice > 0
      ? calculateDiscount(originalPrice, offerPrice)
      : 0;

  const storePhotoUrl = data.storePhotoUrl || data.imageUrl || data.image || undefined;
  const cleanWa =
    cleanWhatsAppDigitsPeru(resolvedPrivateWhatsapp) ||
    cleanWhatsAppDigitsPeru(data.whatsapp) ||
    undefined;

  const hasWhatsapp =
    Boolean(cleanWa) ||
    data.hasWhatsapp === true ||
    Boolean(data.ownerVendorId);

  // Nunca exponer el correo del vendedor ni datos privados como texto público
  return {
    id: docId,
    title: data.title || data.product || 'Producto en promoción',
    product: data.product || data.title || 'Producto en promoción',
    productPhotoUrl: data.productPhotoUrl || undefined,
    unit: data.unit || 'unidad',
    category: data.category || 'abarrotes',
    originalPrice,
    offerPrice,
    discountPercentage,
    store: data.store || data.storeName || 'Comercio local',
    storePhotoUrl,
    location: data.location || data.address || 'Huánuco',
    district: data.district || 'Huánuco Cercado',
    googleMapsQuery:
      data.googleMapsQuery || `${data.store || ''} ${data.location || ''} Huánuco`.trim(),
    googleMapsUrl: data.googleMapsUrl || undefined,
    whatsapp: cleanWa,
    hasWhatsapp,
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
    source: data.source || 'Tienda con promoción en Huánuco',
    sourceUrl: data.sourceUrl,
    imageUrl: storePhotoUrl,
    verifiedAt: data.verifiedAt,
    updatedAt: data.updatedAt || '',
    createdAt: data.createdAt,
  };
}

// Cerrar sesión de vendedor
app.post('/api/vendor-auth/logout', async (_req, res) => {
  return res.status(200).json({
    status: 'SUCCESS',
    message: 'Sesión cerrada correctamente.',
  });
});

function getLocalFallbackOffersList(): OfferItem[] {
  const backup = loadLocalBackupState();
  const offers: OfferItem[] = [];
  for (const [docId, data] of Object.entries(backup.offers || {})) {
    if (!data || data.isActive === false) continue;
    const privWa =
      backup.vendorPrivateContacts?.[docId]?.whatsapp ||
      (data.ownerVendorId
        ? backup.vendorPrivateContacts?.[`store-${data.ownerVendorId}`]?.whatsapp
        : undefined) ||
      memoryPrivateContacts.get(docId)?.whatsapp;
    const item = sanitizePublicOffer(docId, data, privWa);
    if (item.offerPrice > 0) {
      offers.push(item);
    }
  }
  offers.sort(
    (a, b) =>
      new Date(b.updatedAt || b.createdAt || 0).getTime() -
      new Date(a.updatedAt || a.createdAt || 0).getTime()
  );
  return offers;
}

// 3. Consultar sesión y tienda propia del vendedor autenticado
app.get('/api/vendor/my-store', async (req, res) => {
  try {
    const session = await verifyVendorSession(req);
    if (!session) {
      return res.status(401).json({
        status: 'ERROR',
        authenticated: false,
        message: 'Sesión no válida o expirada.',
      });
    }

    const storeDocId = `store-${session.vendorId}`;
    const backup = loadLocalBackupState();
    let store: OfferItem | null = null;
    let resolvedWhatsappFull =
      backup.vendorPrivateContacts?.[storeDocId]?.whatsapp ||
      memoryPrivateContacts.get(storeDocId)?.whatsapp ||
      '';
    let rawOfferData: Record<string, any> | null = backup.offers?.[storeDocId] || null;

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      const [snap, privSnap] = await Promise.all([
        serverFirestore
          .collection('offers')
          .doc(storeDocId)
          .get()
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
            return null;
          }),
        serverFirestore
          .collection('vendorPrivateContacts')
          .doc(storeDocId)
          .get()
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
            return null;
          }),
      ]);

      if (privSnap && privSnap.exists) {
        const pData = privSnap.data();
        if (pData?.whatsapp) {
          resolvedWhatsappFull = normalizePeruvianPhone(String(pData.whatsapp)) || '';
        }
      }

      if (snap && snap.exists) {
        rawOfferData = snap.data() || {};
      }
    }

    if (rawOfferData && rawOfferData.ownerVendorId === session.vendorId) {
      if (rawOfferData.whatsapp && !resolvedWhatsappFull) {
        resolvedWhatsappFull = normalizePeruvianPhone(String(rawOfferData.whatsapp)) || '';
      }
      store = sanitizePublicOffer(storeDocId, rawOfferData, resolvedWhatsappFull || null);
    }

    const privateWhatsapp = resolvedWhatsappFull ? resolvedWhatsappFull.replace(/^\+?51/, '') : '';

    return res.status(200).json({
      status: 'SUCCESS',
      authenticated: true,
      vendorId: session.vendorId,
      email: session.email,
      privateWhatsapp,
      store,
    });
  } catch (error) {
    if (isQuotaExceededError(error)) {
      markServerFirestoreQuotaExceeded(error);
    }
    return res.status(500).json({
      status: 'ERROR',
      message: 'Error al obtener datos de tu tienda.',
    });
  }
});

// 4. Crear o editar los datos de la propia tienda (Perfil → Mi tienda → Editar tienda)
app.put('/api/vendor/my-store', async (req, res) => {
  try {
    const session = await verifyVendorSession(req);
    if (!session) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Debes vincular o iniciar sesión con tu cuenta de Google para administrar tu tienda.',
      });
    }

    const storeDocId = `store-${session.vendorId}`;
    const backup = loadLocalBackupState();
    let existingData: Record<string, any> = backup.offers?.[storeDocId] || {};
    let existingPrivData: Record<string, any> = backup.vendorPrivateContacts?.[storeDocId] || {};

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      const [existingSnap, privSnap] = await Promise.all([
        serverFirestore
          .collection('offers')
          .doc(storeDocId)
          .get()
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
            return null;
          }),
        serverFirestore
          .collection('vendorPrivateContacts')
          .doc(storeDocId)
          .get()
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
            return null;
          }),
      ]);
      if (existingSnap && existingSnap.exists) {
        existingData = existingSnap.data() || {};
      }
      if (privSnap && privSnap.exists) {
        existingPrivData = privSnap.data() || {};
      }
    }

    // Autorización estricta: verificar propiedad si ya existe
    if (
      existingData.ownerVendorId &&
      existingData.ownerVendorId !== session.vendorId
    ) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'No tienes permiso para modificar otra tienda.',
      });
    }

    const body = req.body || {};
    const storeName =
      typeof body.store === 'string' && body.store.trim()
        ? body.store.trim()
        : existingData.store || '';
    const location =
      typeof body.location === 'string' && body.location.trim()
        ? body.location.trim()
        : existingData.location || '';
    const district =
      typeof body.district === 'string' && body.district.trim()
        ? body.district.trim()
        : existingData.district || 'Huánuco Cercado';

    if (!storeName || !location) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'El nombre de la tienda y la dirección son obligatorios.',
      });
    }

    // Descripción con máximo estricto de 300 caracteres
    const rawDescription =
      typeof body.description === 'string'
        ? body.description.trim()
        : existingData.description || '';
    const description = rawDescription.slice(0, 300);

    const storePhotoUrl =
      body.storePhotoUrl !== undefined
        ? body.storePhotoUrl || null
        : existingData.storePhotoUrl || null;

    const googleMapsUrl =
      typeof body.googleMapsUrl === 'string'
        ? body.googleMapsUrl.trim() || null
        : existingData.googleMapsUrl || null;

    // Validar y normalizar número de WhatsApp peruano (+51XXXXXXXXX / 51XXXXXXXXX)
    let normalizedWhatsapp = '';
    if (typeof body.whatsapp === 'string' && body.whatsapp.trim()) {
      const parsedWa = normalizePeruvianPhone(body.whatsapp.trim());
      if (!parsedWa) {
        return res.status(400).json({
          status: 'ERROR',
          message: 'El número de WhatsApp debe tener exactamente 9 dígitos peruanos.',
        });
      }
      normalizedWhatsapp = parsedWa;
    } else if (existingPrivData.whatsapp) {
      normalizedWhatsapp = normalizePeruvianPhone(String(existingPrivData.whatsapp)) || '';
    } else if (existingData.whatsapp) {
      normalizedWhatsapp = normalizePeruvianPhone(String(existingData.whatsapp)) || '';
    }

    const cleanWaDigits = cleanWhatsAppDigitsPeru(normalizedWhatsapp) || '';

    if (normalizedWhatsapp) {
      memoryPrivateContacts.set(storeDocId, {
        whatsapp: normalizedWhatsapp,
      });
      backup.vendorPrivateContacts[storeDocId] = {
        whatsapp: normalizedWhatsapp,
        ownerVendorId: session.vendorId,
      };
      if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
        await serverFirestore
          .collection('vendorPrivateContacts')
          .doc(storeDocId)
          .set(
            {
              storeId: storeDocId,
              ownerVendorId: session.vendorId,
              whatsapp: normalizedWhatsapp,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          )
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
          });
      }
    }

    // Mantener o inicializar datos de promoción si se enviaron juntos
    const title =
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim()
        : existingData.title || existingData.product || 'Promoción en tienda';
    const originalPrice =
      body.originalPrice !== undefined
        ? Number(body.originalPrice) || 0
        : Number(existingData.originalPrice) || 0;
    const offerPrice =
      body.offerPrice !== undefined
        ? Number(body.offerPrice) || 0
        : Number(existingData.offerPrice) || 0;
    const validFrom =
      typeof body.validFrom === 'string'
        ? body.validFrom.trim()
        : existingData.validFrom || new Date().toISOString().slice(0, 10);
    const validUntil =
      typeof body.validUntil === 'string'
        ? body.validUntil.trim()
        : existingData.validUntil || '';
    const conditions =
      typeof body.conditions === 'string'
        ? body.conditions.trim()
        : existingData.conditions || '';
    const productPhotoUrl =
      body.productPhotoUrl !== undefined
        ? body.productPhotoUrl || null
        : existingData.productPhotoUrl || null;

    const discountPercentage =
      originalPrice > 0 && originalPrice > offerPrice
        ? calculateDiscount(originalPrice, offerPrice)
        : 0;

    const lifecycle = computePromotionLifecycle(validFrom, validUntil);
    const nowIso = new Date().toISOString();

    const nextDoc: Record<string, any> = {
      id: storeDocId,
      ownerVendorId: session.vendorId,
      store: storeName,
      storePhotoUrl,
      imageUrl: storePhotoUrl,
      location,
      district,
      googleMapsQuery: `${storeName} ${location} ${district} Huánuco`.trim(),
      googleMapsUrl,
      whatsapp: cleanWaDigits,
      hasWhatsapp: Boolean(cleanWaDigits),
      description,
      title,
      product: title,
      productPhotoUrl,
      unit: existingData.unit || 'unidad',
      category: existingData.category || 'abarrotes',
      originalPrice: Number(originalPrice.toFixed(2)),
      oldPrice: Number(originalPrice.toFixed(2)),
      offerPrice: Number(offerPrice.toFixed(2)),
      currentPrice: Number(offerPrice.toFixed(2)),
      discountPercentage,
      validFrom,
      validUntil,
      conditions,
      promotionStatus: lifecycle.promotionStatus,
      isExpired: lifecycle.isExpired,
      isActive: true,
      isVerified: true,
      trustLevel: 'verified',
      verificationStatus: 'VERIFICADO',
      source: 'Tienda verificada en Huánuco',
      createdAt: existingData.createdAt || nowIso,
      verifiedAt: existingData.verifiedAt || nowIso,
      updatedAt: nowIso,
    };

    backup.offers[storeDocId] = nextDoc;
    saveLocalBackupState();

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      await serverFirestore
        .collection('offers')
        .doc(storeDocId)
        .set(JSON.parse(JSON.stringify(nextDoc)), { merge: true })
        .catch((err) => {
          if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
        });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      store: sanitizePublicOffer(storeDocId, nextDoc, normalizedWhatsapp || null),
      privateWhatsapp: normalizedWhatsapp ? normalizedWhatsapp.replace(/^\+?51/, '') : '',
      message: 'Datos de tu tienda guardados correctamente.',
    });
  } catch (error) {
    if (isQuotaExceededError(error)) {
      markServerFirestoreQuotaExceeded(error);
    }
    return res.status(500).json({
      status: 'ERROR',
      message: 'Error al guardar los datos de tu tienda.',
    });
  }
});

// 5. Editar promoción de la propia tienda (Perfil → Mi tienda → Editar promoción)
app.put('/api/vendor/my-promotion', async (req, res) => {
  try {
    const session = await verifyVendorSession(req);
    if (!session) {
      return res.status(401).json({
        status: 'ERROR',
        message: 'Debes vincular o iniciar sesión con tu cuenta de Google para editar tu promoción.',
      });
    }

    const storeDocId = `store-${session.vendorId}`;
    const backup = loadLocalBackupState();
    let existingData: Record<string, any> = backup.offers?.[storeDocId] || {};
    let privData: Record<string, any> = backup.vendorPrivateContacts?.[storeDocId] || {};

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      const [existingSnap, privSnap] = await Promise.all([
        serverFirestore
          .collection('offers')
          .doc(storeDocId)
          .get()
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
            return null;
          }),
        serverFirestore
          .collection('vendorPrivateContacts')
          .doc(storeDocId)
          .get()
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
            return null;
          }),
      ]);
      if (existingSnap && existingSnap.exists) {
        existingData = existingSnap.data() || {};
      }
      if (privSnap && privSnap.exists) {
        privData = privSnap.data() || {};
      }
    }

    if (
      existingData.ownerVendorId &&
      existingData.ownerVendorId !== session.vendorId
    ) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'No tienes permiso para modificar la promoción de otra tienda.',
      });
    }

    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const originalPrice = Number(body.originalPrice) || 0;
    const offerPrice = Number(body.offerPrice) || 0;
    const validFrom = typeof body.validFrom === 'string' ? body.validFrom.trim() : '';
    const validUntil = typeof body.validUntil === 'string' ? body.validUntil.trim() : '';
    const conditions =
      typeof body.conditions === 'string' ? body.conditions.trim().slice(0, 300) : '';
    const productPhotoUrl =
      body.productPhotoUrl !== undefined
        ? body.productPhotoUrl || null
        : existingData.productPhotoUrl || null;

    if (!title || offerPrice <= 0 || !validFrom || !validUntil) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Producto en oferta, precio promocional, fecha de inicio y fecha de vencimiento son obligatorios.',
      });
    }

    const resolvedWhatsappFull =
      normalizePeruvianPhone(String(privData.whatsapp || existingData.whatsapp || '')) || '';
    const cleanWaDigits = cleanWhatsAppDigitsPeru(resolvedWhatsappFull) || '';

    if (resolvedWhatsappFull) {
      memoryPrivateContacts.set(storeDocId, {
        whatsapp: resolvedWhatsappFull,
      });
      backup.vendorPrivateContacts[storeDocId] = {
        whatsapp: resolvedWhatsappFull,
        ownerVendorId: session.vendorId,
      };
      if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
        await serverFirestore
          .collection('vendorPrivateContacts')
          .doc(storeDocId)
          .set(
            {
              storeId: storeDocId,
              ownerVendorId: session.vendorId,
              whatsapp: resolvedWhatsappFull,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          )
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
          });
      }
    }

    const discountPercentage =
      originalPrice > 0 && originalPrice > offerPrice
        ? calculateDiscount(originalPrice, offerPrice)
        : 0;

    const lifecycle = computePromotionLifecycle(validFrom, validUntil);
    const nowIso = new Date().toISOString();

    const updatedFields: Record<string, any> = {
      id: storeDocId,
      ownerVendorId: session.vendorId,
      store: existingData.store || 'Mi Tienda',
      location: existingData.location || 'Huánuco',
      district: existingData.district || 'Huánuco Cercado',
      whatsapp: cleanWaDigits,
      hasWhatsapp: Boolean(cleanWaDigits),
      title,
      product: title,
      productPhotoUrl,
      originalPrice: Number(originalPrice.toFixed(2)),
      oldPrice: Number(originalPrice.toFixed(2)),
      offerPrice: Number(offerPrice.toFixed(2)),
      currentPrice: Number(offerPrice.toFixed(2)),
      discountPercentage,
      validFrom,
      validUntil,
      conditions,
      promotionStatus: lifecycle.promotionStatus,
      isExpired: lifecycle.isExpired,
      isActive: true,
      isVerified: true,
      trustLevel: 'verified',
      verificationStatus: 'VERIFICADO',
      createdAt: existingData.createdAt || nowIso,
      verifiedAt: existingData.verifiedAt || nowIso,
      updatedAt: nowIso,
    };

    const merged = { ...existingData, ...updatedFields };
    backup.offers[storeDocId] = merged;
    saveLocalBackupState();

    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      await serverFirestore
        .collection('offers')
        .doc(storeDocId)
        .set(JSON.parse(JSON.stringify(updatedFields)), { merge: true })
        .catch((err) => {
          if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
        });
    }

    return res.status(200).json({
      status: 'SUCCESS',
      store: sanitizePublicOffer(storeDocId, merged, resolvedWhatsappFull || null),
      message: 'Promoción actualizada correctamente.',
    });
  } catch (error) {
    if (isQuotaExceededError(error)) {
      markServerFirestoreQuotaExceeded(error);
    }
    return res.status(500).json({
      status: 'ERROR',
      message: 'Error al actualizar la promoción.',
    });
  }
});

// 6. Redirección a WhatsApp de la tienda (https://wa.me/51XXXXXXXXX?text=...)
app.get('/api/offers/:id/whatsapp', async (req, res) => {
  try {
    const offerId = req.params.id;
    let productLabel =
      typeof req.query.product === 'string' && req.query.product.trim()
        ? req.query.product.trim()
        : 'su producto';
    let targetPhone = '';

    const backup = loadLocalBackupState();
    const localOffer = backup.offers?.[offerId];
    if (localOffer) {
      productLabel = localOffer.product || localOffer.title || productLabel;
      if (localOffer.whatsapp) {
        targetPhone = normalizePeruvianPhone(String(localOffer.whatsapp)) || '';
      }
    }
    if (!targetPhone && backup.vendorPrivateContacts?.[offerId]?.whatsapp) {
      targetPhone = normalizePeruvianPhone(backup.vendorPrivateContacts[offerId].whatsapp) || '';
    }

    if (
      !targetPhone &&
      isServerFirestoreReady(serverFirestore) &&
      serverFirestore &&
      offerId &&
      offerId !== 'preview-promo-arroz'
    ) {
      const [offerSnap, privSnap] = await Promise.all([
        serverFirestore
          .collection('offers')
          .doc(offerId)
          .get()
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
            return null;
          }),
        serverFirestore
          .collection('vendorPrivateContacts')
          .doc(offerId)
          .get()
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
            return null;
          }),
      ]);

      let ownerVendorId = '';
      if (offerSnap && offerSnap.exists) {
        const oData = offerSnap.data() || {};
        productLabel = oData.product || oData.title || productLabel;
        ownerVendorId = typeof oData.ownerVendorId === 'string' ? oData.ownerVendorId : '';
        if (oData.whatsapp) {
          targetPhone = normalizePeruvianPhone(String(oData.whatsapp)) || '';
        }
      }
      if (privSnap && privSnap.exists) {
        const pData = privSnap.data() || {};
        if (pData.whatsapp) {
          targetPhone = normalizePeruvianPhone(String(pData.whatsapp)) || targetPhone;
        }
      }
      if (!targetPhone && ownerVendorId && isServerFirestoreReady(serverFirestore)) {
        const vendorPrivSnap = await serverFirestore
          .collection('vendorPrivateContacts')
          .doc(`store-${ownerVendorId}`)
          .get()
          .catch((err) => {
            if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
            return null;
          });
        if (vendorPrivSnap && vendorPrivSnap.exists) {
          const vpData = vendorPrivSnap.data() || {};
          if (vpData.whatsapp) {
            targetPhone = normalizePeruvianPhone(String(vpData.whatsapp)) || '';
          }
        }
      }
    }

    if (!targetPhone && memoryPrivateContacts.has(offerId)) {
      targetPhone = memoryPrivateContacts.get(offerId)?.whatsapp || '';
    }

    const message = `Hola, vi su promoción de ${productLabel} en Huánuco Precios Hoy. ¿Sigue disponible?`;
    const waDigits = cleanWhatsAppDigitsPeru(targetPhone) || '';
    const waUrl = waDigits
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    if (req.query.format === 'json') {
      return res.status(200).json({
        status: 'SUCCESS',
        url: waUrl,
      });
    }

    return res.redirect(302, waUrl);
  } catch (error) {
    const fallbackMsg = 'Hola, vi su promoción en Huánuco Precios Hoy. ¿Sigue disponible?';
    return res.redirect(302, `https://wa.me/?text=${encodeURIComponent(fallbackMsg)}`);
  }
});

// 7. Listado público de Tiendas con promoción (con número WhatsApp normalizado para enlace wa.me)
app.get('/api/offers', async (req, res) => {
  try {
    if (!isServerFirestoreReady(serverFirestore) || !serverFirestore) {
      const fallbackOffers = getLocalFallbackOffersList();
      return res.status(200).json({
        status: 'SUCCESS',
        count: fallbackOffers.length,
        offers: fallbackOffers,
      });
    }
    const [snap, privSnap] = await Promise.all([
      serverFirestore.collection('offers').get(),
      serverFirestore
        .collection('vendorPrivateContacts')
        .get()
        .catch((err) => {
          if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
          return null;
        }),
    ]);

    const backup = loadLocalBackupState();
    const privateContactsMap = new Map<string, string>();
    if (privSnap) {
      privSnap.forEach((docSnap) => {
        const pData = docSnap.data() || {};
        if (pData.whatsapp) {
          privateContactsMap.set(docSnap.id, String(pData.whatsapp));
          backup.vendorPrivateContacts[docSnap.id] = {
            whatsapp: String(pData.whatsapp),
            ownerVendorId: pData.ownerVendorId ? String(pData.ownerVendorId) : undefined,
          };
          if (pData.ownerVendorId) {
            privateContactsMap.set(`store-${pData.ownerVendorId}`, String(pData.whatsapp));
          }
        }
      });
    }

    const offers: OfferItem[] = [];
    const backfillPromises: Promise<unknown>[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      backup.offers[docSnap.id] = data;
      if (data.isActive === false) return;
      const privWa =
        privateContactsMap.get(docSnap.id) ||
        (data.ownerVendorId ? privateContactsMap.get(`store-${data.ownerVendorId}`) : undefined) ||
        memoryPrivateContacts.get(docSnap.id)?.whatsapp;

      const cleanWa = cleanWhatsAppDigitsPeru(privWa || data.whatsapp);
      if (
        cleanWa &&
        data.whatsapp !== cleanWa &&
        isServerFirestoreReady(serverFirestore) &&
        serverFirestore
      ) {
        backfillPromises.push(
          serverFirestore
            .collection('offers')
            .doc(docSnap.id)
            .set({ whatsapp: cleanWa, hasWhatsapp: true }, { merge: true })
            .catch((err) => {
              if (isQuotaExceededError(err)) markServerFirestoreQuotaExceeded(err);
            })
        );
      }

      const item = sanitizePublicOffer(docSnap.id, data, privWa);
      // Solo publicar si tiene precio promocional válido
      if (item.offerPrice > 0) {
        offers.push(item);
      }
    });

    saveLocalBackupState();

    if (backfillPromises.length > 0) {
      await Promise.all(backfillPromises);
    }

    offers.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime()
    );

    return res.status(200).json({
      status: 'SUCCESS',
      count: offers.length,
      offers,
    });
  } catch (error) {
    if (isQuotaExceededError(error)) {
      markServerFirestoreQuotaExceeded(error);
    }
    const fallbackOffers = getLocalFallbackOffersList();
    return res.status(200).json({
      status: 'SUCCESS',
      count: fallbackOffers.length,
      offers: fallbackOffers,
    });
  }
});

// ============================================================================
// MÓDULO DE PRECIOS AUTOMÁTICOS DE REFERENCIA EN INTERNET (VTEX JSON PÚBLICO)
// Colecciones independientes en Firestore:
//   - internetPriceSources
//   - internetPrices
//   - internetPriceSnapshots
// ============================================================================

const INTERNET_COOLDOWN_MS = 6 * 60 * 60 * 1000; // Cooldown mínimo de 6 horas
let lastInternetSyncTimestampMs = 0;
let isInternetSyncRunning = false;
let lastDiscardedInternetSamples: DiscardedProductLog[] = [];

// Caché en memoria de respaldo rápido
const memoryInternetSources = new Map<string, InternetPriceSourceStatus>();
const memoryInternetGroups = new Map<string, InternetPriceGroup>();
const memoryInternetSnapshots = new Map<
  string,
  { price: number; updatedAt: string; unit?: string; normalizedUnitName?: string }
>();

function hydrateMemoryInternetFromBackupOnce(): void {
  if (memoryInternetGroups.size > 0) return;
  const backup = loadLocalBackupState();
  for (const [k, v] of Object.entries(backup.internetSources || {})) {
    memoryInternetSources.set(k, v);
  }
  for (const [k, v] of Object.entries(backup.internetGroups || {})) {
    memoryInternetGroups.set(k, v);
  }
  for (const [k, v] of Object.entries(backup.internetSnapshots || {})) {
    memoryInternetSnapshots.set(k, v);
  }
}

let internetStateHydratedFromFirestore = false;

async function loadInternetPriceStateFromFirestore(): Promise<{
  sourcesMap: Map<string, InternetPriceSourceStatus>;
  groupsMap: Map<string, InternetPriceGroup>;
  snapshotsMap: Map<string, { price: number; updatedAt: string; unit?: string; normalizedUnitName?: string }>;
}> {
  hydrateMemoryInternetFromBackupOnce();

  const sourcesMap = new Map<string, InternetPriceSourceStatus>(memoryInternetSources);
  const groupsMap = new Map<string, InternetPriceGroup>(memoryInternetGroups);
  const snapshotsMap = new Map<
    string,
    { price: number; updatedAt: string; unit?: string; normalizedUnitName?: string }
  >(memoryInternetSnapshots);

  if (
    internetStateHydratedFromFirestore ||
    !isServerFirestoreReady(serverFirestore) ||
    !serverFirestore
  ) {
    return { sourcesMap, groupsMap, snapshotsMap };
  }

  try {
    const [sourcesSnap, pricesSnap, snapsSnap] = await Promise.all([
      serverFirestore.collection('internetPriceSources').get(),
      serverFirestore.collection('internetPrices').get(),
      serverFirestore.collection('internetPriceSnapshots').get(),
    ]);
    internetStateHydratedFromFirestore = true;

    const backup = loadLocalBackupState();

    sourcesSnap.forEach((doc) => {
      const data = doc.data() as InternetPriceSourceStatus;
      if (data && data.source) {
        sourcesMap.set(data.source, data);
        memoryInternetSources.set(data.source, data);
        backup.internetSources[data.source] = data;
      }
    });

    pricesSnap.forEach((doc) => {
      const data = doc.data() as InternetPriceGroup;
      if (data && data.comparisonGroupKey) {
        groupsMap.set(data.comparisonGroupKey, data);
        memoryInternetGroups.set(data.comparisonGroupKey, data);
        backup.internetGroups[data.comparisonGroupKey] = data;
      }
    });

    snapsSnap.forEach((doc) => {
      const data = doc.data();
      if (data && typeof data.price === 'number') {
        const snapEntry = {
          price: data.price,
          updatedAt: String(data.updatedAt || ''),
          unit: typeof data.unit === 'string' ? data.unit : undefined,
          normalizedUnitName:
            typeof data.normalizedUnitName === 'string' ? data.normalizedUnitName : undefined,
        };
        snapshotsMap.set(doc.id, snapEntry);
        memoryInternetSnapshots.set(doc.id, snapEntry);
        backup.internetSnapshots[doc.id] = snapEntry;
      }
    });

    saveLocalBackupState();
  } catch (err) {
    if (isQuotaExceededError(err)) {
      markServerFirestoreQuotaExceeded(err);
    }
  }

  return { sourcesMap, groupsMap, snapshotsMap };
}

function refreshAndValidateInternetGroups(
  rawGroups: InternetPriceGroup[]
): InternetPriceGroup[] {
  const nowMs = Date.now();
  return rawGroups.map((group) => {
    const refreshedObservations: InternetPriceObservation[] = (group.observations || [])
      .map((obs) => {
        const expMs = Date.parse(obs.expiresAt);
        const expiredByTtl = isNaN(expMs) ? true : nowMs > expMs;
        const resolvedScope =
          obs.geographicScope ||
          obs.scope ||
          (obs.sellerId === 'metroios066mio' ||
          obs.sellerId === 'promart_sc8_huanuco' ||
          obs.isLocalHuanuco
            ? 'HUANUCO'
            : 'LIMA_NACIONAL');

        let normalizedBadge = obs.locationBadge;
        let normalizedNote = obs.locationNote;

        if (obs.source === 'metro') {
          if (resolvedScope === 'HUANUCO') {
            normalizedBadge =
              '📍 PRECIO EN HUÁNUCO · Metro Huánuco · Jr. San Martín (Sucursal S066)';
            normalizedNote =
              'Precio y stock verificados en la sucursal Metro Huánuco (Jr. San Martín · Sucursal S066, seller: metroios066mio).';
          } else {
            normalizedBadge =
              '🌐 PRECIO ONLINE DE REFERENCIA · Sin stock en Metro Huánuco (S066)';
            normalizedNote =
              'Este producto no cuenta con stock habilitado hoy en la sucursal Metro Huánuco (Jr. San Martín · Sucursal S066). Se muestra únicamente como precio online de referencia.';
          }
        } else if (obs.source === 'promart') {
          if (resolvedScope === 'HUANUCO') {
            normalizedBadge =
              '📍 PRECIO EN HUÁNUCO · Promart Huánuco · Real Plaza (Jr. Independencia 1601)';
            normalizedNote =
              'Precio y retiro en tienda verificados en la sede física Promart Huánuco (Jr. Independencia 1601 · C.C. Real Plaza Huánuco, canal regional sc=8).';
          } else {
            normalizedBadge =
              '🌐 PRECIO ONLINE DE REFERENCIA · Sin stock para retiro en Promart Huánuco';
            normalizedNote =
              'Este producto no cuenta con stock habilitado hoy para retiro en Promart Huánuco. Se muestra únicamente como precio online de referencia.';
          }
        } else if (obs.source === 'plazavea') {
          normalizedBadge = '🌐 Precio Online de Referencia · Cadena con sede física en Huánuco';
          normalizedNote =
            'El catálogo online de alimentos no tiene despacho ni retiro habilitado en Huánuco según la verificación VTEX realizada; se muestra como precio online de referencia.';
        } else if (obs.source === 'wong') {
          normalizedBadge = '🌐 Precio Online de Referencia · Lima/Nacional';
          normalizedNote =
            'Precio Online de Referencia Lima/Nacional. Wong no cuenta con supermercado físico en Huánuco.';
        } else if (obs.source === 'vega') {
          normalizedBadge = '🌐 Precio Online de Referencia · Lima/Nacional';
          normalizedNote =
            'Precio Online de Referencia Lima/Nacional. Vega no cuenta con tienda o sede verificada en Huánuco.';
        }

        const isLegacyIncompatible = hasIncompatibleLegacyUnitPrice(
          obs.observationId,
          obs.previousPrice
        );

        let resolvedPreviousPrice = isLegacyIncompatible ? obs.price : obs.previousPrice;
        let resolvedChangeAmount = isLegacyIncompatible ? 0 : obs.changeAmount;
        let resolvedChangePercentage = isLegacyIncompatible ? 0 : obs.changePercentage;
        let resolvedTrend: PriceTrend = isLegacyIncompatible ? 'stable' : obs.trend;
        let resolvedChangeLabel = isLegacyIncompatible
          ? 'Sin cambio respecto a lectura previa'
          : obs.changeLabel;

        if (
          (resolvedPreviousPrice === null ||
            Math.abs(obs.price - resolvedPreviousPrice) <= 0.005) &&
          obs.listPrice > obs.price + 0.005
        ) {
          resolvedPreviousPrice = obs.listPrice;
          resolvedChangeAmount = Number((obs.price - obs.listPrice).toFixed(2));
          resolvedChangePercentage = Number(
            (((obs.price - obs.listPrice) / obs.listPrice) * 100).toFixed(1)
          );
          resolvedTrend = 'down';
          resolvedChangeLabel = `${resolvedChangePercentage}% vs precio regular`;
        }

        return {
          ...obs,
          previousPrice: resolvedPreviousPrice,
          changeAmount: resolvedChangeAmount,
          changePercentage: resolvedChangePercentage,
          trend: resolvedTrend,
          changeLabel: resolvedChangeLabel,
          geographicScope: resolvedScope,
          scope: resolvedScope,
          isLocalHuanuco: resolvedScope === 'HUANUCO',
          locationBadge: normalizedBadge,
          locationNote: normalizedNote,
          isExpired: Boolean(obs.isExpired || expiredByTtl),
          trustLabel: 'REFERENCIA ONLINE' as const,
        };
      })
      .sort((a, b) => {
        if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1;
        const aHuanuco = a.geographicScope === 'HUANUCO';
        const bHuanuco = b.geographicScope === 'HUANUCO';
        if (aHuanuco !== bHuanuco) return aHuanuco ? -1 : 1;
        const aStock = a.availability === 'IN_STOCK';
        const bStock = b.availability === 'IN_STOCK';
        if (aStock !== bStock) return aStock ? -1 : 1;
        return a.price - b.price;
      });

    const stats = computeGroupStatistics(refreshedObservations);
    return {
      ...group,
      lowestPrice: stats.lowestPrice,
      highestPrice: stats.highestPrice,
      averagePrice: stats.averagePrice,
      medianPrice: stats.medianPrice,
      lowestNormalizedUnitPrice: stats.lowestNormalizedUnitPrice,
      sourcesCount: stats.sourcesCount,
      hasHuanucoPrice: stats.hasHuanucoPrice,
      primaryGeographicScope: stats.primaryGeographicScope,
      huanucoLowestPrice: stats.huanucoLowestPrice,
      huanucoAveragePrice: stats.huanucoAveragePrice,
      huanucoHighestPrice: stats.huanucoHighestPrice,
      huanucoSourcesCount: stats.huanucoSourcesCount,
      nationalLowestPrice: stats.nationalLowestPrice,
      nationalAveragePrice: stats.nationalAveragePrice,
      nationalHighestPrice: stats.nationalHighestPrice,
      nationalSourcesCount: stats.nationalSourcesCount,
      trustLabel: 'REFERENCIA ONLINE',
      observations: refreshedObservations,
    };
  });
}

function refreshInternetSourcesList(
  sourcesMap: Map<string, InternetPriceSourceStatus>
): InternetPriceSourceStatus[] {
  return INTERNET_STORES.map((store) => {
    const existing = sourcesMap.get(store.id);
    if (!existing) {
      return {
        source: store.id,
        name: store.name,
        domain: store.domain,
        geographicScope: store.geographicScope,
        locationBadge: store.locationBadge,
        locationNote: store.locationNote,
        lastFetchedAt: null,
        nextFetchAt: computeNextScheduledFetchIso(new Date()),
        fetchStatus: 'PENDING',
        errorCount: 0,
        lastError: null,
        dataAge: 'Pendiente de primera consulta',
        dataAgeMinutes: null,
        sourceReliability: 100,
      };
    }

    const age = formatDataAge(existing.lastFetchedAt);
    return {
      ...existing,
      geographicScope: store.geographicScope,
      locationBadge: store.locationBadge,
      locationNote: store.locationNote,
      dataAge: age.dataAge,
      dataAgeMinutes: age.dataAgeMinutes,
    };
  });
}

async function runAndPersistInternetPriceSync(force = false) {
  const { sourcesMap, groupsMap, snapshotsMap } = await loadInternetPriceStateFromFirestore();

  // Determinar última sincronización real
  let latestSyncedMs = lastInternetSyncTimestampMs;
  for (const src of sourcesMap.values()) {
    if (src.lastFetchedAt) {
      const t = Date.parse(src.lastFetchedAt);
      if (!isNaN(t) && t > latestSyncedMs) {
        latestSyncedMs = t;
      }
    }
  }

  const hasAllWhitelistGroups = WHITELIST_PRODUCT_GROUPS.every((g) =>
    groupsMap.has(g.comparisonGroupKey)
  );
  const hasExistingData = hasAllWhitelistGroups && latestSyncedMs > 0;
  const elapsedMs = Date.now() - latestSyncedMs;

  if (!force && hasExistingData && elapsedMs < INTERNET_COOLDOWN_MS) {
    try {
      const catalogMap = buildLocalFallbackProductsMap();
      if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
        const prodSnap = await serverFirestore.collection('products').get();
        prodSnap.forEach((docSnap) => {
          if (!KNOWN_DEMO_PRODUCT_IDS.has(docSnap.id)) {
            catalogMap.set(docSnap.id, sanitizeProductFromFirestore(docSnap.id, docSnap.data()));
          }
        });
      }
      await enrichCatalogProductsFromReportsAndLocalReferences(catalogMap);
    } catch {
      // Non-fatal
    }
    const remainingMin = Math.ceil((INTERNET_COOLDOWN_MS - elapsedMs) / 60000);
    return {
      executed: false,
      cooldownActive: true,
      message: `Cooldown de 6 horas activo. Próxima sincronización permitida en ${remainingMin} minutos.`,
      syncedAt: new Date(latestSyncedMs).toISOString(),
      sources: refreshInternetSourcesList(sourcesMap),
      items: refreshAndValidateInternetGroups(Array.from(groupsMap.values())),
      discardedSamples: lastDiscardedInternetSamples,
    };
  }

  if (isInternetSyncRunning) {
    return {
      executed: false,
      cooldownActive: false,
      message: 'Ya hay una sincronización de precios de Internet en curso.',
      syncedAt: latestSyncedMs ? new Date(latestSyncedMs).toISOString() : null,
      sources: refreshInternetSourcesList(sourcesMap),
      items: refreshAndValidateInternetGroups(Array.from(groupsMap.values())),
      discardedSamples: lastDiscardedInternetSamples,
    };
  }

  isInternetSyncRunning = true;
  try {
    const report = await executeInternetPriceSync(snapshotsMap, groupsMap, sourcesMap);
    lastInternetSyncTimestampMs = Date.parse(report.syncedAt) || Date.now();
    lastDiscardedInternetSamples = report.discardedSamples;

    const backup = loadLocalBackupState();
    // Actualizar memoria caché y respaldo local
    for (const src of report.sources) {
      memoryInternetSources.set(src.source, src);
      backup.internetSources[src.source] = src;
    }
    for (const grp of report.groups) {
      memoryInternetGroups.set(grp.comparisonGroupKey, grp);
      backup.internetGroups[grp.comparisonGroupKey] = grp;
    }
    for (const snap of report.newSnapshots) {
      const snapEntry = {
        price: snap.price,
        updatedAt: snap.updatedAt,
        unit: snap.unit,
        normalizedUnitName: snap.normalizedUnitName,
      };
      memoryInternetSnapshots.set(snap.observationId, snapEntry);
      backup.internetSnapshots[snap.observationId] = snapEntry;
    }
    saveLocalBackupState();

    // Persistir en las 3 colecciones independientes de Firestore
    if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
      try {
        const batch = serverFirestore.batch();

        for (const src of report.sources) {
          const ref = serverFirestore.collection('internetPriceSources').doc(src.source);
          batch.set(ref, JSON.parse(JSON.stringify(src)), { merge: true });
        }

        for (const grp of report.groups) {
          const ref = serverFirestore.collection('internetPrices').doc(grp.comparisonGroupKey);
          batch.set(ref, JSON.parse(JSON.stringify(grp)), { merge: true });
        }

        for (const snap of report.newSnapshots) {
          const ref = serverFirestore.collection('internetPriceSnapshots').doc(snap.observationId);
          batch.set(
            ref,
            {
              observationId: snap.observationId,
              source: snap.source,
              productId: snap.productId,
              price: snap.price,
              unit: snap.unit,
              normalizedUnitName: snap.normalizedUnitName,
              updatedAt: snap.updatedAt,
            },
            { merge: true }
          );
        }

        await batch.commit();
      } catch (err) {
        if (isQuotaExceededError(err)) {
          markServerFirestoreQuotaExceeded(err);
        }
      }
    }

    // Propagar inmediatamente los precios y timestamps verificados hacia la colección 'products'
    try {
      const catalogMap = buildLocalFallbackProductsMap();
      if (isServerFirestoreReady(serverFirestore) && serverFirestore) {
        const prodSnap = await serverFirestore.collection('products').get();
        prodSnap.forEach((docSnap) => {
          if (!KNOWN_DEMO_PRODUCT_IDS.has(docSnap.id)) {
            catalogMap.set(docSnap.id, sanitizeProductFromFirestore(docSnap.id, docSnap.data()));
          }
        });
      }
      await enrichCatalogProductsFromReportsAndLocalReferences(catalogMap);
    } catch (enrichErr) {
      console.warn('[InternetPrices] Aviso al propagar precios hacia products:', enrichErr);
    }

    return {
      executed: true,
      cooldownActive: false,
      message: `Sincronización completada (${report.successfulSourcesCount}/4 fuentes exitosas, ${report.validProductsCount} observaciones válidas).`,
      syncedAt: report.syncedAt,
      successfulSourcesCount: report.successfulSourcesCount,
      validProductsCount: report.validProductsCount,
      sourceErrors: report.sourceErrors,
      sources: report.sources,
      items: report.groups,
      discardedSamples: report.discardedSamples,
    };
  } finally {
    isInternetSyncRunning = false;
  }
}

// 1. GET /api/internet-prices
app.get('/api/internet-prices', async (req, res) => {
  try {
    let { sourcesMap, groupsMap } = await loadInternetPriceStateFromFirestore();

    // Si aún no hay datos sincronizados en Firestore, disparar primera sincronización inicial
    if (groupsMap.size === 0 && !isInternetSyncRunning) {
      const syncRes = await runAndPersistInternetPriceSync(false);
      return res.json({
        status: syncRes.items.length > 0 ? 'OK' : 'EMPTY',
        updatedAt: syncRes.syncedAt,
        sources: syncRes.sources,
        items: syncRes.items,
      });
    }

    const sources = refreshInternetSourcesList(sourcesMap);
    const items = refreshAndValidateInternetGroups(Array.from(groupsMap.values()));

    let updatedAt: string | null = null;
    for (const s of sources) {
      if (s.lastFetchedAt && (!updatedAt || s.lastFetchedAt > updatedAt)) {
        updatedAt = s.lastFetchedAt;
      }
    }

    return res.json({
      status: items.length > 0 ? 'OK' : 'EMPTY',
      updatedAt,
      sources,
      items,
    });
  } catch (error) {
    console.error('[Server API] Error en GET /api/internet-prices:', error);
    return res.status(500).json({
      status: 'ERROR',
      updatedAt: null,
      sources: [],
      items: [],
      message: error instanceof Error ? error.message : 'Error al obtener precios de Internet',
    });
  }
});

// 2. GET /api/internet-prices/sources
app.get('/api/internet-prices/sources', async (req, res) => {
  try {
    const { sourcesMap } = await loadInternetPriceStateFromFirestore();
    const sources = refreshInternetSourcesList(sourcesMap);
    return res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      sources,
    });
  } catch (error) {
    console.error('[Server API] Error en GET /api/internet-prices/sources:', error);
    return res.status(500).json({
      status: 'ERROR',
      sources: [],
      message: error instanceof Error ? error.message : 'Error al consultar estado de fuentes',
    });
  }
});

// 3. POST /api/internal/sync-internet-prices
app.post('/api/internal/sync-internet-prices', async (req, res) => {
  try {
    const result = await runAndPersistInternetPriceSync(false);
    return res.status(200).json({
      status: 'OK',
      ...result,
    });
  } catch (error) {
    console.error('[Server API] Error en POST /api/internal/sync-internet-prices:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Error en sincronización de precios de Internet',
    });
  }
});

// ============================================================================
// MÓDULO DE NOTICIAS AUTOMÁTICAS DE HUÁNUCO (RSS Y FUENTES PÚBLICAS VERIFICADAS)
// Colecciones independientes en Firestore:
//   - news
//   - newsSources
// ============================================================================

const NEWS_AUTO_REFRESH_MS = 15 * 60 * 1000; // Actualización automática cada 15 minutos
const NEWS_MANUAL_COOLDOWN_MS = 3 * 60 * 1000; // Cooldown de 3 minutos para refrescos consecutivos
let isNewsSyncRunning = false;
let lastNewsSyncTimeMs = 0;

async function runOrReuseHuanucoNewsSync(force = false) {
  const currentState = await loadNewsFromFirestore(serverFirestore);
  const existingUpdatedMs = currentState.updatedAt ? Date.parse(currentState.updatedAt) : 0;
  const latestSyncMs = Math.max(lastNewsSyncTimeMs, isNaN(existingUpdatedMs) ? 0 : existingUpdatedMs);
  const elapsedMs = Date.now() - latestSyncMs;

  if (
    !force &&
    currentState.items.length > 0 &&
    latestSyncMs > 0 &&
    elapsedMs < NEWS_MANUAL_COOLDOWN_MS
  ) {
    return {
      executed: false,
      updatedAt: currentState.updatedAt,
      sources: currentState.sources,
      items: currentState.items,
      count: currentState.items.length,
    };
  }

  if (isNewsSyncRunning) {
    return {
      executed: false,
      updatedAt: currentState.updatedAt,
      sources: currentState.sources,
      items: currentState.items,
      count: currentState.items.length,
    };
  }

  isNewsSyncRunning = true;
  try {
    console.log('[NewsEngine] Sincronizando últimas noticias reales de Huánuco...');
    const syncRes = await syncHuanucoNews(serverFirestore);
    lastNewsSyncTimeMs = Date.parse(syncRes.syncedAt) || Date.now();
    return {
      executed: true,
      updatedAt: syncRes.syncedAt,
      sources: syncRes.sources,
      items: syncRes.items,
      count: syncRes.items.length,
    };
  } finally {
    isNewsSyncRunning = false;
  }
}

// GET /api/news-v2 — Obtiene las últimas noticias verificadas de Huánuco
app.get('/api/news-v2', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  try {
    const state = await loadNewsFromFirestore(serverFirestore);
    const updatedMs = state.updatedAt ? Date.parse(state.updatedAt) : 0;
    const isStale = !updatedMs || isNaN(updatedMs) || Date.now() - updatedMs > NEWS_AUTO_REFRESH_MS;

    // Si no hay ninguna noticia en la base de datos, esperar la primera sincronización
    if (state.items.length === 0 && !isNewsSyncRunning) {
      const fresh = await runOrReuseHuanucoNewsSync(false);
      return res.status(200).json({
        status: fresh.items.length > 0 ? 'OK' : 'EMPTY',
        updatedAt: fresh.updatedAt,
        count: fresh.items.length,
        sources: fresh.sources,
        items: fresh.items,
      });
    }

    // PATRÓN STALE-WHILE-REVALIDATE:
    // Si ya hay noticias en memoria/Firestore pero pasó el intervalo de refresco,
    // devolver INMEDIATAMENTE (<10ms) el contenido existente para que el usuario no espere 4 segundos,
    // y disparar la revalidación de fuentes RSS en segundo plano.
    if (isStale && !isNewsSyncRunning) {
      runOrReuseHuanucoNewsSync(false).catch((err) => {
        console.warn('[NewsEngine SWR Background]', err);
      });
    }

    return res.status(200).json({
      status: state.items.length > 0 ? 'OK' : 'EMPTY',
      updatedAt: state.updatedAt,
      count: state.items.length,
      sources: state.sources,
      items: state.items,
    });
  } catch (error) {
    console.error('[Server API] Error en GET /api/news-v2:', error);
    return res.status(500).json({
      status: 'ERROR',
      updatedAt: null,
      count: 0,
      sources: [],
      items: [],
      message: error instanceof Error ? error.message : 'Error al obtener noticias de Huánuco',
    });
  }
});

// GET /api/news/sources — Estado de las fuentes periodísticas configuradas
app.get('/api/news/sources', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const state = await loadNewsFromFirestore(serverFirestore);
    const sources =
      state.sources.length > 0
        ? state.sources
        : NEWS_SOURCES.map((s) => ({
            id: s.id,
            name: s.name,
            rssUrl: s.rssUrl,
            websiteUrl: s.websiteUrl,
            enabled: s.enabled,
            lastFetchedAt: null,
            fetchStatus: 'PENDING' as const,
            itemsFound: 0,
            huanucoItemsAccepted: 0,
            lastError: null,
          }));
    return res.status(200).json({
      status: 'OK',
      updatedAt: state.updatedAt,
      sources,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      sources: [],
      message: error instanceof Error ? error.message : 'Error al consultar fuentes de noticias',
    });
  }
});

// GET /api/news/image-proxy — Proxy seguro para imágenes de noticias con hotlink protection o bloqueo de Referer/CORS
app.get('/api/news/image-proxy', async (req, res) => {
  try {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      return res.status(400).end();
    }

    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return res.status(400).end();
    }

    const upstream = await fetch(parsed.href, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: `${parsed.protocol}//${parsed.host}/`,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(7000),
    });

    if (!upstream.ok) {
      return res.status(404).end();
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return res.status(415).end();
    }

    const arrayBuffer = await upstream.arrayBuffer();
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch {
    return res.status(404).end();
  }
});

// POST /api/news-v2/sync y POST /api/internal/sync-news — Sincronización bajo demanda o programada
app.post(['/api/news-v2/sync', '/api/internal/sync-news'], async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const force = Boolean(req.body?.force);
    const result = await runOrReuseHuanucoNewsSync(force);
    return res.status(200).json({
      status: result.items.length > 0 ? 'OK' : 'EMPTY',
      executed: result.executed,
      updatedAt: result.updatedAt,
      count: result.count,
      sources: result.sources,
      items: result.items,
    });
  } catch (error) {
    console.error('[Server API] Error en POST /api/news-v2/sync:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: error instanceof Error ? error.message : 'Error al sincronizar noticias de Huánuco',
    });
  }
});

// Sincronización automática inicial y periódica de noticias de Huánuco
setTimeout(() => {
  runOrReuseHuanucoNewsSync(false).catch((err) =>
    console.warn('[NewsEngine Startup] Aviso en sincronización inicial de noticias:', err)
  );
}, 2500);

setInterval(() => {
  runOrReuseHuanucoNewsSync(false).catch((err) =>
    console.warn('[NewsEngine Scheduler] Aviso en tarea periódica de noticias:', err)
  );
}, NEWS_AUTO_REFRESH_MS);

// Sincronización programada de precios de Internet (3 veces al día: ~07:00, 14:00 y 19:00 America/Lima, o si superó el cooldown de 6h)
setTimeout(() => {
  runAndPersistInternetPriceSync(false).catch((err) =>
    console.warn('[InternetPrices Startup] Aviso en carga inicial:', err)
  );
}, 3500);

setInterval(() => {
  const now = new Date();
  // America/Lima es UTC-5
  const limaHour = (now.getUTCHours() - 5 + 24) % 24;
  const isScheduledWindow = limaHour === 7 || limaHour === 14 || limaHour === 19;
  const isStaleByCooldown =
    !lastInternetSyncTimestampMs || Date.now() - lastInternetSyncTimestampMs >= INTERNET_COOLDOWN_MS;
  if (isScheduledWindow || isStaleByCooldown) {
    runAndPersistInternetPriceSync(false).catch((err) =>
      console.warn('[InternetPrices Scheduler] Aviso en tarea programada:', err)
    );
  }
}, 30 * 60 * 1000);

// Iniciar ingesta inicial en segundo plano al arrancar el servidor
setTimeout(() => {
  console.log('[Server Startup] Disparando ingesta inicial de combustibles desde Osinergmin SCOP...');
  runFuelIngestionPipeline().catch((err) => console.warn('[Server Startup] Aviso en ingesta inicial:', err));
}, 1500);

// Programador automático en segundo plano: Ejecuta cada 6 horas
const INGESTION_INTERVAL_MS = 6 * 60 * 60 * 1000;
setInterval(() => {
  console.log('[Scheduler] Disparando tarea periódica de ingesta de combustibles...');
  runFuelIngestionPipeline().catch((err) => {
    console.error('[Scheduler] Error en tarea programada:', err);
  });
}, INGESTION_INTERVAL_MS);

// Inicializar servidor con middleware de Vite o estáticos en producción
async function startServer() {
  app.get(['/ads.txt', '/app-ads.txt'], (_req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res
      .status(200)
      .send('google.com, pub-3994399165136183, DIRECT, f08c47fec0942fa0\n');
  });

  app.get('/og-image.jpg', (_req, res) => {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const publicImg = path.join(process.cwd(), 'public', 'og-image.jpg');
    const distImg = path.join(process.cwd(), 'dist', 'og-image.jpg');
    const target = fs.existsSync(publicImg) ? publicImg : distImg;
    return res.sendFile(target);
  });

  app.get('/og-image.png', (_req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const publicImg = path.join(process.cwd(), 'public', 'og-image.png');
    const distImg = path.join(process.cwd(), 'dist', 'og-image.png');
    const target = fs.existsSync(publicImg) ? publicImg : distImg;
    return res.sendFile(target);
  });

  app.get(['/manifest.json', '/manifest.webmanifest'], (_req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const publicManifest = path.join(process.cwd(), 'public', 'manifest.json');
    const distManifest = path.join(process.cwd(), 'dist', 'manifest.json');
    const target = fs.existsSync(publicManifest) ? publicManifest : distManifest;
    return res.sendFile(target);
  });

  app.get(['/sw.js', '/sw.js*'], (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const publicSw = path.join(process.cwd(), 'public', 'sw.js');
    const distSw = path.join(process.cwd(), 'dist', 'sw.js');
    const target = fs.existsSync(publicSw) ? publicSw : distSw;
    return res.sendFile(target);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Servir archivos estáticos omitiendo index.html
    app.use(express.static(distPath, { index: false }));

    function injectDynamicMetadata(html: string, reqPath: string): string {
      let title = 'NotiperuX - El Diario de Mayor Circulación Informativa del Perú';
      let description = 'Todas las noticias del Perú y del mundo, en audio y escrito en una sola web.';
      let ogImage = 'https://www.notiperux.com/og-image.jpg';
      const ogUrl = `https://www.notiperux.com${reqPath}`;

      if (reqPath.startsWith('/noticia/')) {
        const newsId = reqPath.replace('/noticia/', '').trim();
        const article = ORIGINAL_REPORTS.find((r) => r.id === newsId);
        if (article) {
          title = `${article.title} | NotiPerúx`;
          description = article.summary || description;
          if (article.imageUrl) ogImage = article.imageUrl;
        }
      } else if (reqPath.includes('privacidad')) {
        title = 'Política de Privacidad y Cookies Google AdSense | NotiPerúx';
        description = 'Información detallada sobre el tratamiento de datos personales, cookies publicitarias y derechos de privacidad.';
      } else if (reqPath.includes('termino')) {
        title = 'Términos y Condiciones del Servicio | NotiPerúx';
        description = 'Términos de uso, normas de la comunidad y responsabilidades de los usuarios en NotiPerúx.';
      } else if (reqPath.includes('quienes-somos') || reqPath.includes('editorial')) {
        title = 'Quiénes Somos y Principios Editoriales | NotiPerúx';
        description = 'Equipo periodístico, misión institucional, independencia y compromiso ético de NotiPerúx.';
      } else if (reqPath.includes('contacto')) {
        title = 'Contacto, Redacción y Rectificaciones | NotiPerúx';
        description = 'Canal de comunicación directa con la redacción y buzón de rectificaciones de NotiPerúx.';
      }

      return html
        .replace(/<title>.*?<\/title>/i, `<title>${title}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${description.replace(/"/g, '&quot;')}" />`)
        .replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />`)
        .replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${description.replace(/"/g, '&quot;')}" />`)
        .replace(/<meta property="og:image" content=".*?" \/>/i, `<meta property="og:image" content="${ogImage}" />`)
        .replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${ogUrl}" />`);
    }

    // Servir index.html con anti-cache estricto y metadata dinámica para AdSense
    app.get('*', (req, res) => {
      fs.readFile(path.join(distPath, 'index.html'), 'utf8', (err, data) => {
        if (err) {
          res.status(500).send('Error loading page');
          return;
        }
        let updatedHtml = data.replace(
          'src="/src/main.tsx"',
          'src="/src/main.tsx?t=' + Date.now() + '"'
        );
        updatedHtml = injectDynamicMetadata(updatedHtml, req.path);

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(updatedHtml);
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Huánuco Precios Hoy] Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
