// Utilidades oficiales para la instalación de PWA en todos los dispositivos móviles (Android, iOS, WhatsApp, Chrome)

export interface BrowserEnv {
  isIOS: boolean;
  isAndroid: boolean;
  isWhatsApp: boolean;
  isInAppBrowser: boolean;
  isChrome: boolean;
  isStandalone: boolean;
}

export function detectBrowserEnv(): BrowserEnv {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isWhatsApp: false,
      isInAppBrowser: false,
      isChrome: false,
      isStandalone: false,
    };
  }

  const ua = (navigator.userAgent || '').toLowerCase();

  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isWhatsApp = /whatsapp/.test(ua);
  const isInAppBrowser = /whatsapp|instagram|fban|fbav|telegram|twitter|line|musical_ly|bytedance/i.test(
    ua
  );
  const isChrome = /chrome|crios/.test(ua) && !isInAppBrowser;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    localStorage.getItem('notiperux_pwa_installed') === '1';

  return {
    isIOS,
    isAndroid,
    isWhatsApp,
    isInAppBrowser,
    isChrome,
    isStandalone,
  };
}

/**
 * Abre la URL actual directamente en la aplicación nativa Google Chrome en Android.
 * Útil cuando el usuario abre la web desde WhatsApp, Facebook u otros navegadores internos.
 */
export function openInExternalChrome(): boolean {
  if (typeof window === 'undefined') return false;

  const cleanHost = window.location.host;
  const pathAndSearch = window.location.pathname + window.location.search;
  const chromeIntentUrl = `intent://${cleanHost}${pathAndSearch}#Intent;scheme=https;package=com.android.chrome;end`;

  try {
    window.location.href = chromeIntentUrl;
    return true;
  } catch (e) {
    console.warn('No se pudo abrir el intent de Chrome:', e);
    return false;
  }
}

/**
 * Activa la instalación nativa si el evento beforeinstallprompt está disponible.
 */
export async function triggerNativeInstall(
  promptEvent: any
): Promise<{ outcome: 'accepted' | 'dismissed' | 'unsupported'; error?: any }> {
  const event =
    promptEvent ||
    (typeof window !== 'undefined' ? (window as any).__deferredPwaPrompt : null);

  if (!event || typeof event.prompt !== 'function') {
    return { outcome: 'unsupported' };
  }

  try {
    await event.prompt();
    const choice = await event.userChoice;
    if (choice && choice.outcome === 'accepted') {
      if (typeof window !== 'undefined') {
        (window as any).__deferredPwaPrompt = null;
        (window as any).__isPwaInstalled = true;
        try {
          localStorage.setItem('notiperux_pwa_installed', '1');
        } catch {}
      }
      return { outcome: 'accepted' };
    }
    return { outcome: 'dismissed' };
  } catch (err) {
    console.warn('Error al ejecutar install prompt:', err);
    return { outcome: 'unsupported', error: err };
  }
}
