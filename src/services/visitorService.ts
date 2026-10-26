import {
  doc,
  setDoc,
  increment,
  getDoc,
  getDocs,
  collection
} from 'firebase/firestore';
import { db } from './firebase';

export interface VisitorStats {
  totalVisits: number;
  todayVisits: number;
  installedApps: number;
  registeredUsers: number;
  lastVisitAt?: string;
}

const STATS_DOC_PATH = 'stats';
const STATS_DOC_ID = 'global';
const LOCAL_STORAGE_KEY = 'notiperux_cached_visits_v2';
const SESSION_FLAG_KEY = 'notiperux_session_counted_v2';
const INSTALL_FLAG_KEY = 'notiperux_install_counted_v2';
const USER_REGISTERED_KEY = 'notiperux_user_registered_v2';

// 100% REAL: Arranca desde 0 y sube en tiempo real con cada visitante, app instalada y usuario real
const BASELINE_VISITS = 0;
const BASELINE_INSTALLS = 0;
const BASELINE_USERS = 0;

function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Obtener estadísticas guardadas localmente para renderizado instantáneo
 */
export function getLocalCachedStats(): VisitorStats {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.totalVisits === 'number') {
        return {
          totalVisits: parsed.totalVisits,
          todayVisits: typeof parsed.todayVisits === 'number' ? parsed.todayVisits : 0,
          installedApps: typeof parsed.installedApps === 'number' ? parsed.installedApps : BASELINE_INSTALLS,
          registeredUsers: typeof parsed.registeredUsers === 'number' ? parsed.registeredUsers : BASELINE_USERS,
          lastVisitAt: parsed.lastVisitAt,
        };
      }
    }
  } catch {
    // Ignorar error de storage
  }
  return {
    totalVisits: BASELINE_VISITS,
    todayVisits: 0,
    installedApps: BASELINE_INSTALLS,
    registeredUsers: BASELINE_USERS,
  };
}

/**
 * Guarda en caché local
 */
function saveLocalCachedStats(stats: VisitorStats) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignorar
  }
}

/**
 * Registra una nueva visita única por sesión en Firestore
 */
export async function recordVisitorHit(): Promise<void> {
  try {
    const alreadyCountedInSession = sessionStorage.getItem(SESSION_FLAG_KEY);
    if (alreadyCountedInSession) {
      return;
    }

    sessionStorage.setItem(SESSION_FLAG_KEY, '1');

    const docRef = doc(db, STATS_DOC_PATH, STATS_DOC_ID);
    const today = getTodayString();

    let resetToday = false;
    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data?.lastDate && data.lastDate !== today) {
          resetToday = true;
        }
      }
    } catch {
      // Ignorar
    }

    if (resetToday) {
      await setDoc(
        docRef,
        {
          totalVisits: increment(1),
          todayVisits: 1,
          lastDate: today,
          lastVisitAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      await setDoc(
        docRef,
        {
          totalVisits: increment(1),
          todayVisits: increment(1),
          lastDate: today,
          lastVisitAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('[VisitorService] No se pudo sincronizar visita:', err);
    const local = getLocalCachedStats();
    const updated = {
      ...local,
      totalVisits: local.totalVisits + 1,
      todayVisits: local.todayVisits + 1,
    };
    saveLocalCachedStats(updated);
  }
}

/**
 * Registra una instalación de la aplicación PWA en Firestore
 */
export async function recordAppInstall(): Promise<void> {
  try {
    const alreadyRecorded = localStorage.getItem(INSTALL_FLAG_KEY);
    if (alreadyRecorded) {
      return;
    }

    localStorage.setItem(INSTALL_FLAG_KEY, '1');

    const docRef = doc(db, STATS_DOC_PATH, STATS_DOC_ID);
    await setDoc(
      docRef,
      {
        installedApps: increment(1),
        lastInstallAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[VisitorService] No se pudo registrar instalación:', err);
    const local = getLocalCachedStats();
    const updated = {
      ...local,
      installedApps: local.installedApps + 1,
    };
    saveLocalCachedStats(updated);
  }
}

/**
 * Registra un usuario real vinculado por Google Auth en Firestore
 */
export async function recordUserRegistration(uid: string): Promise<void> {
  try {
    const userKey = `${USER_REGISTERED_KEY}_${uid}`;
    const alreadyRecorded = localStorage.getItem(userKey);
    if (alreadyRecorded) {
      return;
    }

    localStorage.setItem(userKey, '1');

    // Guardar documento individual del usuario
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, { registeredAt: new Date().toISOString() }, { merge: true });

    // Incrementar contador global en stats
    const statsDocRef = doc(db, STATS_DOC_PATH, STATS_DOC_ID);
    await setDoc(
      statsDocRef,
      {
        registeredUsers: increment(1),
        lastUserAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[VisitorService] No se pudo registrar usuario:', err);
  }
}

/**
 * Consulta y sincroniza las estadísticas desde Firestore de forma segura
 */
export async function refreshVisitorStats(callback?: (stats: VisitorStats) => void): Promise<VisitorStats> {
  const currentLocal = getLocalCachedStats();
  try {
    const docRef = doc(db, STATS_DOC_PATH, STATS_DOC_ID);
    const snap = await getDoc(docRef);

    // Contar también el número real de documentos en la colección 'users' si existe
    let realUsersCount = currentLocal.registeredUsers;
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      if (!usersSnap.empty) {
        realUsersCount = usersSnap.size;
      }
    } catch {
      // Ignorar si la colección aún no tiene permisos o está vacía
    }

    if (snap.exists()) {
      const data = snap.data();
      const stats: VisitorStats = {
        totalVisits: typeof data?.totalVisits === 'number' && data.totalVisits >= 0 ? data.totalVisits : currentLocal.totalVisits,
        todayVisits: typeof data?.todayVisits === 'number' && data.todayVisits >= 0 ? data.todayVisits : currentLocal.todayVisits,
        installedApps: typeof data?.installedApps === 'number' && data.installedApps >= 0 ? data.installedApps : currentLocal.installedApps,
        registeredUsers: Math.max(typeof data?.registeredUsers === 'number' ? data.registeredUsers : 0, realUsersCount),
        lastVisitAt: data?.lastVisitAt || new Date().toISOString(),
      };
      saveLocalCachedStats(stats);
      if (callback) callback(stats);
      return stats;
    } else {
      // Crear documento inicial en 0 si no existe
      await setDoc(
        docRef,
        {
          totalVisits: 0,
          todayVisits: 0,
          installedApps: 0,
          registeredUsers: realUsersCount,
          lastDate: getTodayString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    }
  } catch {
    // Operar con caché local si hay fallo de red
  }
  if (callback) callback(currentLocal);
  return currentLocal;
}

/**
 * Suscribirse a las estadísticas de visitantes de forma resiliente
 */
export function subscribeVisitorStats(
  callback: (stats: VisitorStats) => void
): () => void {
  callback(getLocalCachedStats());
  refreshVisitorStats(callback).catch(() => {});

  const intervalId = setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      refreshVisitorStats(callback).catch(() => {});
    }
  }, 45000);

  return () => clearInterval(intervalId);
}
