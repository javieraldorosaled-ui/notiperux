import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Zap,
  MoreVertical,
  Share2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Apple,
} from 'lucide-react';
import { CloseModalButton } from './CloseModalButton';
import {
  detectBrowserEnv,
  openInExternalChrome,
  triggerNativeInstall,
} from '../utils/installHelper';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNativeInstall: () => void;
  canInstallNative: boolean;
  isStandalone: boolean;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  onNativeInstall,
  canInstallNative,
  isStandalone,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [env, setEnv] = useState(() => detectBrowserEnv());

  useEffect(() => {
    if (isOpen) {
      setEnv(detectBrowserEnv());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const input = document.createElement('input');
        input.value = window.location.href;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3500);
    } catch {
      setCopiedLink(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'NotiPerúx - Noticias del Perú y el Mundo',
          text: 'Instala la aplicación de NotiPerúx en tu celular para ver noticias en tiempo real.',
          url: window.location.href,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleOpenChrome = () => {
    const opened = openInExternalChrome();
    if (!opened) {
      handleCopyLink();
    }
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      localStorage.removeItem('notiperux_pwa_installed');
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('install', '1');
    nextUrl.searchParams.set('_t', String(Date.now()));
    window.location.replace(nextUrl.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full bg-[#0d0d0d] rounded-t-3xl sm:rounded-3xl max-w-lg max-h-[90vh] p-5 sm:p-6 shadow-2xl border-t sm:border border-white/20 overflow-y-auto text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
      >
        {/* Manija táctil en móvil */}
        <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl p-1.5 border border-white/20 flex items-center justify-center shrink-0">
              <img
                src="/logo.png"
                alt="NotiPerúx Logo"
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/icon-192x192.png';
                }}
              />
            </div>
            <div>
              <h2 id="install-title" className="text-base sm:text-lg font-black text-white leading-tight">
                Instalar NotiPerúx en tu Celular
              </h2>
              <p className="text-xs text-white/70 font-medium">
                Acceso directo directo en tu pantalla de inicio
              </p>
            </div>
          </div>
          <CloseModalButton onClose={onClose} ariaLabel="Cerrar modal de instalación" />
        </div>

        {isStandalone ? (
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-5 text-center my-4 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-base font-black text-white">
              ¡La aplicación ya está instalada!
            </p>
            <p className="text-xs text-emerald-200">
              Estás navegando en modo aplicación independiente a pantalla completa.
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-5 py-2.5 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 transition cursor-pointer"
            >
              Continuar leyendo noticias
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Si estamos en WhatsApp o navegador interno */}
            {env.isInAppBrowser && (
              <div className="bg-amber-950/70 border border-amber-500/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <p className="text-xs font-black text-amber-300 uppercase tracking-wide">
                    Estás dentro del navegador de WhatsApp / Red Social
                  </p>
                </div>
                <p className="text-xs text-amber-100 leading-relaxed">
                  WhatsApp bloquea la instalación directa en el celular. Para instalar la app en 1 toque, ábrela en <strong>Google Chrome</strong>:
                </p>
                {env.isAndroid && (
                  <button
                    onClick={handleOpenChrome}
                    className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 active:scale-98 text-black font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide transition cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir en Google Chrome para Instalar</span>
                  </button>
                )}
                <div className="text-[11px] text-amber-200/90 bg-black/40 p-2.5 rounded-lg border border-amber-500/30">
                  O toca los <strong>tres puntos (⋮)</strong> arriba a la derecha y selecciona <strong>&ldquo;Abrir en el navegador&rdquo;</strong>.
                </div>
              </div>
            )}

            {/* BOTÓN PRINCIPAL DE INSTALACIÓN (Si el navegador nativo lo permite) */}
            {canInstallNative && (
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-4 shadow-xl text-black space-y-2">
                <p className="text-xs font-black flex items-center gap-1.5 uppercase tracking-wide text-neutral-900">
                  <Zap className="w-4 h-4 text-neutral-950 animate-bounce" />
                  <span>Instalador oficial listo:</span>
                </p>
                <button
                  id="btn-confirm-native-install"
                  onClick={() => {
                    onNativeInstall();
                    onClose();
                  }}
                  className="w-full py-3.5 px-4 bg-black text-white hover:bg-neutral-900 active:scale-98 transition font-black text-sm rounded-xl shadow-2xl flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer"
                >
                  <Download className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <span>INSTALAR APLICACIÓN AHORA</span>
                </button>
                <p className="text-[11px] font-bold text-neutral-900/90 text-center">
                  Al pulsar se abrirá el diálogo oficial de Android para agregarla a tu pantalla.
                </p>
              </div>
            )}

            {/* Si NO es iPhone (es Android / Desktop / Chrome) */}
            {!env.isIOS ? (
              <div className="bg-white/5 border border-white/15 rounded-2xl p-4 space-y-3">
                <p className="font-black text-white text-xs flex items-center gap-2 uppercase tracking-wide">
                  <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Pasos para instalar en tu celular Android (Chrome):</span>
                </p>
                <ol className="space-y-2 text-xs text-white/90 font-medium">
                  <li className="flex items-start gap-2.5 bg-black/60 p-2.5 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      En Google Chrome, toca el menú de <strong>tres puntos</strong>{' '}
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-white/20 text-white rounded font-bold">
                        <MoreVertical className="w-3 h-3 inline" /> ⋮
                      </span>{' '}
                      arriba a la derecha.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-black/60 p-2.5 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Toca la opción <strong className="text-white">&ldquo;Instalar aplicación&rdquo;</strong> (o <strong className="text-white">&ldquo;Agregar a la pantalla principal&rdquo;</strong>).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-black/60 p-2.5 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Confirma en <strong className="text-white">&ldquo;Instalar&rdquo;</strong> y listo: el icono de <strong>NotiPerúx</strong> aparecerá junto a tus otras aplicaciones.
                    </span>
                  </li>
                </ol>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 active:scale-98 text-xs font-bold text-white rounded-xl border border-white/15 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">¡Enlace copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar enlace web</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 active:scale-98 text-xs font-bold text-white rounded-xl border border-white/15 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartir</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Guía para iPhone / iPad en Safari */
              <div className="bg-white/5 border border-white/15 rounded-2xl p-4 space-y-3">
                <p className="font-black text-white text-xs flex items-center gap-2 uppercase tracking-wide">
                  <Apple className="w-4 h-4 text-white shrink-0" />
                  <span>Pasos para instalar en iPhone / iPad (Safari):</span>
                </p>
                <ol className="space-y-2 text-xs text-white/90 font-medium">
                  <li className="flex items-start gap-2.5 bg-black/60 p-2.5 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Toca el botón <strong>Compartir</strong>{' '}
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-white/20 text-white rounded font-bold">
                        ⎋
                      </span>{' '}
                      en la barra inferior de Safari.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-black/60 p-2.5 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Desliza hacia abajo en el menú y toca <strong className="text-white">&ldquo;Agregar a inicio&rdquo;</strong> (o &ldquo;Añadir a pantalla de inicio&rdquo;).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 bg-black/60 p-2.5 rounded-xl border border-white/10">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Toca <strong>Agregar</strong> arriba a la derecha. ¡Listo!
                    </span>
                  </li>
                </ol>
              </div>
            )}

            {/* Ventajas y botón de refresco */}
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/15 space-y-2.5 text-xs text-white/80">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Ligera (menos de 1 MB) • Notificaciones • Modo sin barras</span>
              </div>
              <button
                type="button"
                onClick={handleForceRefresh}
                disabled={isRefreshing}
                className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 active:scale-98 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-white/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>
                  {isRefreshing
                    ? 'Actualizando caché e instalador…'
                    : 'Recargar instalador limpio si tu navegador guardó caché antigua'}
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
          <span>NotiPerúx PWA Oficial</span>
          <button
            onClick={onClose}
            className="text-white font-bold hover:underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
