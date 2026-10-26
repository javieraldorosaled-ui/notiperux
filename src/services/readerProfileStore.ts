import { NewsItem } from '../types';

export interface ReaderProfile {
  name: string;
  avatarId: string;
  avatarTitle: string;
  preferredEdition: string;
  fontSize: 'normal' | 'large' | 'extralarge';
  categories: string[];
  notifications: {
    breakingNews: boolean;
    morningDigest: boolean;
    sportsAlerts: boolean;
  };
  dataSaver: boolean;
  memberSince: string;
}

export interface ReadingHistoryEntry {
  id: string;
  title: string;
  sourceName: string;
  publishedAt: string;
  readAt: string;
  section: string;
}

const PROFILE_KEY = 'notiperu_reader_profile_v1';
const SAVED_NEWS_KEY = 'notiperu_saved_articles_v1';
const HISTORY_KEY = 'notiperu_reading_history_v1';

export const AVATAR_OPTIONS = [
  { id: 'lector', label: 'Lector Digital', iconName: 'BookOpen', badge: 'Ciudadano' },
  { id: 'periodista', label: 'Periodista', iconName: 'PenTool', badge: 'Prensa' },
  { id: 'corresponsal', label: 'Corresponsal Regional', iconName: 'Compass', badge: 'Regiones' },
  { id: 'editor', label: 'Editor de Opinión', iconName: 'FileText', badge: 'Editorial' },
  { id: 'fotoperiodista', label: 'Reportero Gráfico', iconName: 'Camera', badge: 'Fotografía' },
];

export const EDITION_OPTIONS = [
  { id: 'nacional', label: 'Perú Nacional (Todo el País)', desc: 'Todas las portadas y despachos de costa, sierra y selva' },
  { id: 'lima', label: 'Lima Metropolitana', desc: 'Sucesos del poder, congreso, palacio y la capital' },
  { id: 'huanuco', label: 'Huánuco y Zona Centro', desc: 'Actualidad de Huánuco, Amarilis, Pillco Marca y valles' },
  { id: 'sur', label: 'Macrorregión Sur', desc: 'Arequipa, Cusco, Puno, Moquegua y Tacna' },
  { id: 'norte', label: 'Macrorregión Norte', desc: 'Trujillo, Chiclayo, Piura, Tumbes y Cajamarca' },
  { id: 'internacional', label: 'Edición Internacional', desc: 'Acontecimientos mundiales, geopolítica y América Latina' },
];

export const CATEGORY_OPTIONS = [
  'Política y Gobierno',
  'Economía y Mercados',
  'Policial y Judicial',
  'Deportes y Fútbol',
  'Regiones del Perú',
  'Mundo e Internacional',
  'Cultura y Sociedad',
];

const DEFAULT_PROFILE: ReaderProfile = {
  name: 'Lector de Prensa',
  avatarId: 'lector',
  avatarTitle: 'Lector Digital',
  preferredEdition: 'nacional',
  fontSize: 'normal',
  categories: ['Política y Gobierno', 'Economía y Mercados', 'Regiones del Perú'],
  notifications: {
    breakingNews: true,
    morningDigest: true,
    sportsAlerts: false,
  },
  dataSaver: false,
  memberSince: new Date().getFullYear().toString(),
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.warn('[ReaderProfileStore] Error in listener:', e);
    }
  });
}

export function getReaderProfile(): ReaderProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveReaderProfile(profile: Partial<ReaderProfile>): ReaderProfile {
  const current = getReaderProfile();
  const updated = { ...current, ...profile };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    notify();
  } catch (e) {
    console.warn('[ReaderProfileStore] Could not save profile:', e);
  }
  return updated;
}

export function getSavedNews(): NewsItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_NEWS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function isNewsSaved(newsId: string): boolean {
  const saved = getSavedNews();
  return saved.some((item) => item.id === newsId);
}

export function toggleSaveNews(item: NewsItem): boolean {
  const saved = getSavedNews();
  const exists = saved.some((s) => s.id === item.id);
  let updated: NewsItem[];
  let nowSaved = false;
  if (exists) {
    updated = saved.filter((s) => s.id !== item.id);
    nowSaved = false;
  } else {
    updated = [item, ...saved].slice(0, 100);
    nowSaved = true;
  }
  try {
    localStorage.setItem(SAVED_NEWS_KEY, JSON.stringify(updated));
    notify();
  } catch (e) {
    console.warn('[ReaderProfileStore] Could not save article:', e);
  }
  return nowSaved;
}

export function removeSavedNews(newsId: string): void {
  const saved = getSavedNews();
  const updated = saved.filter((s) => s.id !== newsId);
  try {
    localStorage.setItem(SAVED_NEWS_KEY, JSON.stringify(updated));
    notify();
  } catch (e) {
    console.warn('[ReaderProfileStore] Could not remove saved article:', e);
  }
}

export function clearSavedNews(): void {
  try {
    localStorage.removeItem(SAVED_NEWS_KEY);
    notify();
  } catch {}
}

export function getReadingHistory(): ReadingHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function recordNewsRead(item: NewsItem): void {
  if (!item || !item.id) return;
  try {
    const history = getReadingHistory();
    const entry: ReadingHistoryEntry = {
      id: item.id,
      title: item.title,
      sourceName: item.sourceName || 'Prensa Nacional',
      publishedAt: item.publishedAt,
      readAt: new Date().toISOString(),
      section: item.section || 'peru',
    };
    const filtered = history.filter((h) => h.id !== item.id);
    const updated = [entry, ...filtered].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    notify();
  } catch (e) {
    console.warn('[ReaderProfileStore] Could not record history:', e);
  }
}

export function clearReadingHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
    notify();
  } catch {}
}

export function resetAllReaderData(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(SAVED_NEWS_KEY);
    localStorage.removeItem(HISTORY_KEY);
    notify();
  } catch {}
}

export function subscribeReaderStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
