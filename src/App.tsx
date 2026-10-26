import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, Download, User } from 'lucide-react';
import { MainTopNav } from './components/MainTopNav';
import { BottomNav } from './components/BottomNav';
import { HomeNewsView } from './components/HomeNewsView';
import { PeruNewsView } from './components/PeruNewsView';
import { InternationalNewsView } from './components/InternationalNewsView';
import { NewspaperStandView } from './components/NewspaperStandView';
import { NewsDetailView } from './components/NewsDetailView';
import { NewsMoreView } from './components/NewsMoreView';
import { InstallModal } from './components/InstallModal';
import { AccountModal } from './components/AccountModal';
import { InstitutionalFooter } from './components/InstitutionalFooter';
import { CookieBanner } from './components/CookieBanner';
import { LegalModals, LegalDocType } from './components/LegalModals';
import { ORIGINAL_REPORTS } from './data/originalArticles';
import { NEWS_CATEGORIES } from './data/categories';
import {
  INITIAL_NEWS_ITEMS,
  INITIAL_NEWS_SOURCES,
  INITIAL_NEWS_UPDATED_AT,
} from './data/initialNewsSnapshot';
import {
  subscribeToHuanucoNews,
  triggerManualNewsSync,
  getLocalCachedNews,
} from './services/realDataStore';
import { speechManager } from './services/speechService';
import { initializeFirestoreDatabase } from './services/dbBootstrap';
import {
  recordVisitorHit,
  recordAppInstall,
  subscribeVisitorStats,
  getLocalCachedStats,
  VisitorStats,
} from './services/visitorService';
import {
  ActiveTab,
  NewsItem,
  NewsSourceStatus,
} from './types';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
    __isPwaInstalled?: boolean;
    __refreshPwaManifest?: () => void;
  }
}

function detectStandaloneInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandaloneMedia = Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  const isIosStandalone = (window.navigator as any)?.standalone === true;
  return isStandaloneMedia || isIosStandalone;
}

export function App() {
  // Estado de navegación principal (PERÚ, INTERNACIONAL, PERFIL)
  const [activeTab, setActiveTab] = useState<ActiveTab>('peru');

  // Estado de noticia individual seleccionada (/noticia/:id)
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/noticia/')) {
        return path.replace('/noticia/', '').trim() || null;
      }
    }
    return null;
  });

  // Estado de noticias inicializado con caché local o snapshot pre-compilado (0 ms de latencia absoluta, jamás muestra noticias viejas)
  const [news, setNews] = useState<NewsItem[]>(() => {
    const cached = getLocalCachedNews();
    if (cached && Array.isArray(cached.items) && cached.items.length > 0) {
      return cached.items;
    }
    return INITIAL_NEWS_ITEMS;
  });
  const [newsSources, setNewsSources] = useState<NewsSourceStatus[]>(() => {
    const cached = getLocalCachedNews();
    if (cached?.sources && cached.sources.length > 0) return cached.sources;
    return INITIAL_NEWS_SOURCES;
  });
  const [newsUpdatedAt, setNewsUpdatedAt] = useState<string | null>(() => {
    const cached = getLocalCachedNews();
    return cached?.updatedAt || INITIAL_NEWS_UPDATED_AT;
  });
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('categoria') || params.get('cat');
      if (catParam && NEWS_CATEGORIES.some((c) => c.id === catParam.toLowerCase())) {
        return catParam.toLowerCase();
      }
    }
    return 'todas';
  });

  // Modales legales (Google AdSense, Privacidad, Términos, Quiénes Somos, Contacto)
  const [activeLegalDoc, setActiveLegalDoc] = useState<LegalDocType | null>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('privacidad')) return 'privacidad';
      if (p.includes('termino')) return 'terminos';
      if (p.includes('quienes-somos') || p.includes('editorial')) return 'quienes-somos';
      if (p.includes('contacto') || p.includes('rectificacion')) return 'contacto';
    }
    return null;
  });

  // Modales
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Contador de visitas en tiempo real (Firebase Firestore)
  const [visitorStats, setVisitorStats] = useState<VisitorStats>(() => getLocalCachedStats());

  // Conectividad & PWA
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && !detectStandaloneInstalled() && window.__deferredPwaPrompt) {
      return window.__deferredPwaPrompt;
    }
    return null;
  });
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(deferredPrompt);
  const isPromptingInstallRef = useRef<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => detectStandaloneInstalled());

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Inicializar Firebase Firestore y contabilizar visita de usuario
  useEffect(() => {
    initializeFirestoreDatabase().catch((err) =>
      console.warn('[Bootstrap] Aviso en inicialización:', err)
    );

    // Contabilizar visita de usuario externo
    recordVisitorHit().catch(() => {});

    // Contabilizar si el usuario está abriendo la aplicación ya instalada
    if (detectStandaloneInstalled()) {
      recordAppInstall().catch(() => {});
    }

    // Escuchar contador de lecturas en tiempo real
    const unsubVisitors = subscribeVisitorStats((stats) => {
      setVisitorStats(stats);
    });

    return () => unsubVisitors();
  }, []);

  // Suscripción al flujo continuo de noticias desde el backend y Firestore
  useEffect(() => {
    const unsubNews = subscribeToHuanucoNews((payload) => {
      if (Array.isArray(payload.items) && payload.items.length > 0) {
        setNews(payload.items);
        speechManager.preloadTopNews(payload.items);
      }
      if (Array.isArray(payload.sources)) {
        setNewsSources(payload.sources);
      }
      if (payload.updatedAt) {
        setNewsUpdatedAt(payload.updatedAt);
      }
      setIsNewsLoading(false);
    });

    // Timeout de seguridad: Si pasan 1.2 segundos, desactiva el estado de carga
    const safetyTimeout = setTimeout(() => {
      setIsNewsLoading(false);
    }, 1200);

    return () => {
      clearTimeout(safetyTimeout);
      unsubNews();
    };
  }, []);

  // Soporte de navegación interna e historial del navegador (/noticia/:id, páginas legales y botón atrás)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // 1. Noticia individual
      if (e.state?.newsId) {
        setSelectedNewsId(e.state.newsId);
      } else {
        const curPath = window.location.pathname;
        if (curPath.startsWith('/noticia/')) {
          setSelectedNewsId(curPath.replace('/noticia/', '').trim());
        } else {
          setSelectedNewsId(null);
        }
      }

      // 2. Modales legales por URL
      if (e.state?.legalDoc) {
        setActiveLegalDoc(e.state.legalDoc);
      } else {
        const p = window.location.pathname.toLowerCase();
        if (p.includes('privacidad')) setActiveLegalDoc('privacidad');
        else if (p.includes('termino')) setActiveLegalDoc('terminos');
        else if (p.includes('quienes-somos') || p.includes('editorial')) setActiveLegalDoc('quienes-somos');
        else if (p.includes('contacto') || p.includes('rectificacion')) setActiveLegalDoc('contacto');
        else setActiveLegalDoc(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Inicializar PWA y ciclo de vida de primer plano / segundo plano
  useEffect(() => {
    const syncStandaloneState = () => {
      const installed = detectStandaloneInstalled();
      setIsStandalone(installed);
      if (installed) {
        deferredPromptRef.current = null;
        window.__deferredPwaPrompt = null;
        setDeferredPrompt(null);
      }
    };

    syncStandaloneState();

    if (!detectStandaloneInstalled() && window.__deferredPwaPrompt) {
      deferredPromptRef.current = window.__deferredPwaPrompt;
      setDeferredPrompt(window.__deferredPwaPrompt);
    }

    const handleOnline = () => {
      setIsOnline(true);
      // Al recuperar conexión a internet, refrescar noticias de inmediato
      triggerManualNewsSync()
        .then((res) => {
          if (Array.isArray(res.items) && res.items.length > 0) {
            setNews(res.items);
            if (Array.isArray(res.sources)) setNewsSources(res.sources);
            setNewsUpdatedAt(res.updatedAt);
          }
        })
        .catch(() => {});
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // CRÍTICO PARA LA APLICACIÓN INSTALADA:
    // Cuando el usuario vuelve a abrir o regresa a la aplicación desde segundo plano
    let lastResumeRefreshTime = Date.now();
    const handleAppResume = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Si pasaron más de 2 minutos desde el último chequeo, sincronizar noticias frescas
        if (now - lastResumeRefreshTime > 2 * 60 * 1000) {
          lastResumeRefreshTime = now;
          triggerManualNewsSync()
            .then((res) => {
              if (Array.isArray(res.items) && res.items.length > 0) {
                setNews(res.items);
                if (Array.isArray(res.sources)) setNewsSources(res.sources);
                setNewsUpdatedAt(res.updatedAt);
              }
            })
            .catch(() => {});
        }

        // Forzar actualización del Service Worker para detectar nuevas versiones
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg && typeof reg.update === 'function') {
              reg.update().catch(() => {});
            }
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleAppResume);
    window.addEventListener('focus', handleAppResume);

    // Si se activa un nuevo Service Worker, refrescar las noticias silenciosamente
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        triggerManualNewsSync()
          .then((res) => {
            if (Array.isArray(res.items) && res.items.length > 0) {
              setNews(res.items);
              if (Array.isArray(res.sources)) setNewsSources(res.sources);
              setNewsUpdatedAt(res.updatedAt);
            }
          })
          .catch(() => {});
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__isPwaInstalled = false;
      if (detectStandaloneInstalled()) {
        deferredPromptRef.current = null;
        window.__deferredPwaPrompt = null;
        setDeferredPrompt(null);
        return;
      }
      const promptEvent = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = promptEvent;
      window.__deferredPwaPrompt = promptEvent;
      setIsStandalone(false);
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      window.__isPwaInstalled = true;
      window.__deferredPwaPrompt = null;
      deferredPromptRef.current = null;
      isPromptingInstallRef.current = false;
      setDeferredPrompt(null);
      setIsStandalone(true);
      recordAppInstall().catch(() => {});
    };

    const handlePwaCustomPrompt = () => {
      if (window.__deferredPwaPrompt) {
        deferredPromptRef.current = window.__deferredPwaPrompt;
        setDeferredPrompt(window.__deferredPwaPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa:beforeinstallprompt', handlePwaCustomPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleAppResume);
      window.removeEventListener('focus', handleAppResume);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa:beforeinstallprompt', handlePwaCustomPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleNativeInstall = async () => {
    if (detectStandaloneInstalled()) {
      showNotification('La aplicación ya está instalada en tu dispositivo.', 'success');
      return;
    }
    const currentPrompt = deferredPromptRef.current || deferredPrompt || window.__deferredPwaPrompt;
    if (currentPrompt && typeof currentPrompt.prompt === 'function') {
      try {
        isPromptingInstallRef.current = true;
        await currentPrompt.prompt();
        const choice = await currentPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          deferredPromptRef.current = null;
          window.__deferredPwaPrompt = null;
          setDeferredPrompt(null);
          recordAppInstall().catch(() => {});
          showNotification('¡Aplicación instalada con éxito!', 'success');
          return;
        }
      } catch (err) {
        console.warn('Error en prompt de instalación:', err);
      } finally {
        isPromptingInstallRef.current = false;
      }
    }
    // Si no está disponible el prompt directo del sistema o es iOS / navegador in-app, abrir guía e intent
    setIsInstallModalOpen(true);
  };

  const handleRefreshNews = async () => {
    try {
      setIsNewsLoading(true);
      const res = await triggerManualNewsSync();
      if (Array.isArray(res.items) && res.items.length > 0) {
        setNews(res.items);
      }
      if (Array.isArray(res.sources)) {
        setNewsSources(res.sources);
      }
      setNewsUpdatedAt(res.updatedAt);
      showNotification('Despachos informativos sincronizados en vivo.', 'success');
    } catch {
      showNotification('No se pudo actualizar en este momento.', 'error');
    } finally {
      setIsNewsLoading(false);
    }
  };

  const handleOpenNewsDetail = (newsId: string) => {
    setSelectedNewsId(newsId);
    try {
      window.history.pushState({ newsId }, '', `/noticia/${newsId}`);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromDetail = () => {
    setSelectedNewsId(null);
    try {
      if (window.history.state?.newsId) {
        window.history.back();
      } else {
        window.history.pushState({}, '', '/');
      }
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLegal = (doc: LegalDocType) => {
    setActiveLegalDoc(doc);
    try {
      const slug = doc === 'privacidad' ? 'politica-de-privacidad' : doc;
      window.history.pushState({ legalDoc: doc }, '', `/${slug}`);
    } catch {}
  };

  const handleCloseLegal = () => {
    setActiveLegalDoc(null);
    try {
      if (window.history.state?.legalDoc) {
        window.history.back();
      } else if (!window.location.pathname.startsWith('/noticia/')) {
        window.history.pushState({}, '', '/');
      }
    } catch {}
  };

  // Buscar noticia seleccionada
  const activeSelectedNews = selectedNewsId
    ? news.find((n) => n.id === selectedNewsId) || null
    : null;

  // Lista de noticias de la sección actual para el reproductor continuo de canto a canto
  const isInternational = activeTab === 'internacional' || activeSelectedNews?.section === 'internacional';
  const currentSectionNews = activeTab === 'kiosko'
    ? []
    : news.filter((n) => isInternational ? n.section === 'internacional' : n.section === 'peru');
  const currentSectionLabel = isInternational ? 'Mundo' : 'Perú';

  // Sincronizar título y metadatos con la vista activa para Google AdSense y SEO
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (activeSelectedNews) {
      document.title = `${activeSelectedNews.title} | NotiPerúx`;
    } else if (activeTab === 'internacional') {
      document.title = `Noticias del Mundo en Vivo y Cables Globales | NotiPerúx`;
    } else if (activeTab === 'kiosko') {
      document.title = `Kiosko Digital de Portadas de Diarios del Perú | NotiPerúx`;
    } else if (selectedTopicId !== 'todas') {
      const cat = NEWS_CATEGORIES.find((c) => c.id === selectedTopicId);
      document.title = `${cat ? cat.name : 'Noticias'} | NotiPerúx - El Diario Digital del Perú`;
    } else {
      document.title = `NotiperuX - El Diario de Mayor Circulación Informativa del Perú`;
    }
  }, [activeSelectedNews, activeTab, selectedTopicId]);

  return (
    <div className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col font-sans selection:bg-[#FFFFFF] selection:text-[#000000] relative pt-20">
      {/* Toast Notificaciones */}
        {toastMessage && (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-xs w-[90%] px-4 py-2.5 rounded-2xl shadow-lg text-xs font-bold flex items-center justify-between border ${
              toastMessage.type === 'success'
                ? 'bg-[#165338] text-white border-[#165338]'
                : 'bg-[#BF1C10] text-white border-[#BF1C10]'
            }`}
          >
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 text-white/80 hover:text-white font-black cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Alerta de modo sin conexión */}
        {!isOnline && (
          <div className="bg-[#FDEDD4] border-b border-[#BAD0B5] px-4 py-1 flex items-center justify-center gap-2 text-xs text-[#102610] font-medium safe-top">
            <WifiOff className="w-3.5 h-3.5 text-[#56654F]" />
            <span>Modo sin conexión · Noticias en caché</span>
          </div>
        )}

        {/* NAVEGACIÓN PRINCIPAL SUPERIOR (Única navegación de la aplicación: Perú | Internacional | Perfil) */}
        <MainTopNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (tab === 'perfil') {
              setIsAccountOpen(true);
              return;
            }
            setSelectedNewsId(null);
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenAccount={() => setIsAccountOpen(true)}
          isAccountOpen={isAccountOpen}
          selectedTopicId={selectedTopicId}
          onSelectTopic={setSelectedTopicId}
          currentSectionNews={currentSectionNews}
          sectionLabel={currentSectionLabel}
        />

        {/* Vista Dinámica Principal */}
        <main className="flex-1 pb-24">
          {selectedNewsId ? (
            activeSelectedNews ? (
              <NewsDetailView
                item={activeSelectedNews}
                allNews={news}
                onSelectNews={handleOpenNewsDetail}
                onBack={handleBackFromDetail}
              />
            ) : isNewsLoading ? (
              <div className="p-8 text-center space-y-4 my-12">
                <div className="w-10 h-10 border-4 border-[#165338] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-[#165338]">Cargando reporte informativo...</p>
              </div>
            ) : (
              <div className="p-8 text-center space-y-4 my-12 bg-white rounded-2xl border border-[#D5E5D1] mx-4 shadow-xs">
                <p className="text-base font-bold text-[#102610]">
                  La noticia solicitada no se encuentra disponible o ha sido actualizada.
                </p>
                <button
                  type="button"
                  onClick={handleBackFromDetail}
                  className="px-5 py-2.5 rounded-xl bg-[#165338] hover:bg-[#11442D] text-white font-bold text-sm cursor-pointer shadow-xs transition-colors"
                >
                  Volver a Noticias
                </button>
              </div>
            )
          ) : (
            <>
              {activeTab === 'internacional' ? (
                <InternationalNewsView
                  news={news}
                  isLoading={isNewsLoading}
                  onSelectNews={handleOpenNewsDetail}
                  onRefresh={handleRefreshNews}
                  lastUpdated={newsUpdatedAt}
                  onNotify={showNotification}
                />
              ) : activeTab === 'kiosko' ? (
                <NewspaperStandView />
              ) : (
                <PeruNewsView
                  news={news}
                  isLoading={isNewsLoading}
                  onSelectNews={handleOpenNewsDetail}
                  onRefresh={handleRefreshNews}
                  selectedTopicId={selectedTopicId}
                  onSelectTopic={setSelectedTopicId}
                  lastUpdated={newsUpdatedAt}
                  onNotify={showNotification}
                />
              )}
            </>
          )}
        </main>

        {/* Pie de Página Institucional (Obligatorio para Google AdSense & Confianza Editorial) */}
        <InstitutionalFooter onOpenLegal={handleOpenLegal} />

        {/* Banner de Consentimiento de Cookies y AdSense */}
        <CookieBanner onOpenLegal={handleOpenLegal} />

        {/* Modales de Políticas Legales, Términos, Quiénes Somos y Contacto */}
        <LegalModals
          activeDoc={activeLegalDoc}
          onClose={handleCloseLegal}
          onSwitchDoc={handleOpenLegal}
        />

        {/* Botón flotante de instalación (solo visible si no está abierta como app instalada) */}
        {!isStandalone && (
          <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
            <button
              type="button"
              onClick={handleNativeInstall}
              className="pointer-events-auto bg-white text-black font-black text-xs sm:text-sm px-5 py-3 rounded-full border-2 border-white shadow-[0_4px_25px_rgba(255,255,255,0.4)] flex items-center gap-2.5 uppercase tracking-wider hover:bg-neutral-200 active:scale-95 transition-all cursor-pointer select-none"
            >
              <Download className="w-4 h-4 text-black stroke-[2.5]" />
              <span>Instala está web  como aplicación</span>
            </button>
          </div>
        )}

        {/* Modal de Perfil del Lector */}
        <AccountModal
          isOpen={isAccountOpen}
          onClose={() => setIsAccountOpen(false)}
          onSelectNews={handleOpenNewsDetail}
          onOpenInstall={handleNativeInstall}
          onOpenLegal={handleOpenLegal}
          visitorStats={visitorStats}
        />

        {/* Modal de Ayuda para Instalar PWA */}
        <InstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          onNativeInstall={handleNativeInstall}
          canInstallNative={!!deferredPrompt}
          isStandalone={isStandalone}
        />
    </div>
  );
}

export default App;
