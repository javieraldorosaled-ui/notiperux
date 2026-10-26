import fs from 'fs';
import path from 'path';
import {
  PriceItem,
  CommunityReport,
  OfferItem,
  InternetPriceSourceStatus,
  InternetPriceGroup,
} from '../types';

const BACKUP_FILE_PATH = path.join(process.cwd(), 'data', 'app-state-backup.json');
const QUOTA_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutos de enfriamiento cuando se agota la cuota gratuita

let quotaExceededUntilMs = 0;
let lastQuotaNoticeLoggedAt = 0;

export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as { code?: number | string; message?: string; details?: string };
  const code = anyErr.code;
  const msg = `${anyErr.message || ''} ${anyErr.details || ''} ${String(err)}`.toLowerCase();
  return (
    code === 8 ||
    code === '8' ||
    code === 'resource-exhausted' ||
    code === 'RESOURCE_EXHAUSTED' ||
    msg.includes('resource_exhausted') ||
    msg.includes('resource-exhausted') ||
    msg.includes('quota exceeded')
  );
}

export function markServerFirestoreQuotaExceeded(err?: unknown): void {
  const now = Date.now();
  quotaExceededUntilMs = now + QUOTA_COOLDOWN_MS;
  if (now - lastQuotaNoticeLoggedAt > 60_000) {
    lastQuotaNoticeLoggedAt = now;
    const reason = err instanceof Error ? err.message : 'RESOURCE_EXHAUSTED';
    console.log(
      `[Firestore Resiliencia] Cuota diaria de Firestore alcanzada (${reason}). Operando con respaldo local en memoria y disco durante los próximos 15 min.`
    );
  }
}

export function isServerFirestoreReady(firestoreInstance: unknown): boolean {
  if (!firestoreInstance) return false;
  return Date.now() >= quotaExceededUntilMs;
}

export interface LocalBackupState {
  updatedAt: string;
  products: Record<string, PriceItem>;
  reports: Record<string, CommunityReport & Record<string, any>>;
  offers: Record<string, Record<string, any>>;
  vendorPrivateContacts: Record<string, { whatsapp: string; ownerVendorId?: string }>;
  internetSources: Record<string, InternetPriceSourceStatus>;
  internetGroups: Record<string, InternetPriceGroup>;
  internetSnapshots: Record<
    string,
    { price: number; updatedAt: string; unit?: string; normalizedUnitName?: string }
  >;
}

let memoryState: LocalBackupState | null = null;

function createEmptyBackupState(): LocalBackupState {
  return {
    updatedAt: new Date().toISOString(),
    products: {},
    reports: {},
    offers: {},
    vendorPrivateContacts: {},
    internetSources: {},
    internetGroups: {},
    internetSnapshots: {},
  };
}

export function loadLocalBackupState(): LocalBackupState {
  if (memoryState) return memoryState;
  try {
    if (fs.existsSync(BACKUP_FILE_PATH)) {
      const raw = fs.readFileSync(BACKUP_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<LocalBackupState>;
      memoryState = {
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        products: parsed.products || {},
        reports: parsed.reports || {},
        offers: parsed.offers || {},
        vendorPrivateContacts: parsed.vendorPrivateContacts || {},
        internetSources: parsed.internetSources || {},
        internetGroups: parsed.internetGroups || {},
        internetSnapshots: parsed.internetSnapshots || {},
      };
      return memoryState;
    }
  } catch {
    // Si el archivo aún no existe o está vacío, iniciar estado limpio
  }
  memoryState = createEmptyBackupState();
  return memoryState;
}

export function saveLocalBackupState(): void {
  if (!memoryState) return;
  memoryState.updatedAt = new Date().toISOString();
  try {
    const dir = path.dirname(BACKUP_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BACKUP_FILE_PATH, JSON.stringify(memoryState, null, 2), 'utf-8');
  } catch {
    // Ignorar errores de escritura en entornos de solo lectura
  }
}
