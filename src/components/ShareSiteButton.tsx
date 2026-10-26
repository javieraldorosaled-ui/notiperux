import React, { useState, useRef, useEffect } from 'react';
import { Share2, Check, Copy, MessageCircle, Facebook, Send } from 'lucide-react';

interface ShareSiteButtonProps {
  onNotify?: (text: string, type?: 'success' | 'error') => void;
  className?: string;
  showText?: boolean;
}

const SITE_URL = 'https://www.notiperux.com';
const SHARE_TITLE = 'NotiPerúx | El Diario de Mayor Circulación Informativa del Perú';
const SHARE_TEXT = 'NotiPerúx: Noticias del Perú y el mundo en vivo, periodismo independiente y verificación en tiempo real.';

export const ShareSiteButton: React.FC<ShareSiteButtonProps> = ({
  onNotify,
  className = '',
  showText = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú desplegable al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Intentar Web Share API nativo si está disponible en celulares
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url: SITE_URL,
        });
        if (onNotify) {
          onNotify('¡Gracias por compartir NotiPerúx!', 'success');
        }
        return;
      } catch (err: any) {
        // Si el usuario canceló voluntariamente la ventana nativa de compartir
        if (err?.name === 'AbortError') {
          return;
        }
      }
    }

    // Si no tiene soporte nativo o estamos en escritorio, alternar popover
    setIsOpen((prev) => !prev);
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(SITE_URL);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = SITE_URL;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setIsCopied(true);
      if (onNotify) {
        onNotify('Enlace copiado: www.notiperux.com', 'success');
      }
      setTimeout(() => {
        setIsCopied(false);
        setIsOpen(false);
      }, 2000);
    } catch {
      if (onNotify) {
        onNotify('No se pudo copiar el enlace', 'error');
      }
    }
  };

  const handleOpenSocial = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'telegram') => {
    let url = '';
    const encodedUrl = encodeURIComponent(SITE_URL);
    const encodedText = encodeURIComponent(`${SHARE_TEXT} 👉 ${SITE_URL}`);

    switch (platform) {
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodedText}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodedUrl}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(SHARE_TEXT)}`;
        break;
    }

    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
    setIsOpen(false);
    if (onNotify) {
      onNotify('¡Gracias por difundir NotiPerúx!', 'success');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center select-none ${className}`}
    >
      {/* Botón sutil, pequeño, circular al lado de la X con texto 'compartir página' */}
      <button
        type="button"
        onClick={handleShareClick}
        aria-label="Compartir NotiPerúx (www.notiperux.com)"
        title="Compartir NotiPerúx (www.notiperux.com)"
        className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/20 hover:border-white/40 text-neutral-300 hover:text-white transition-all duration-200 cursor-pointer group active:scale-95 focus:outline-none"
      >
        {/* Círculo sutil con el ícono de compartir */}
        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-neutral-900 border border-white/25 flex items-center justify-center group-hover:border-white/60 group-hover:bg-neutral-800 transition-colors shrink-0 shadow-xs">
          {isCopied ? (
            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
          ) : (
            <Share2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/80 group-hover:text-white" />
          )}
        </span>

        {/* Texto sutil 'compartir página' */}
        {showText && (
          <span className="text-[10px] sm:text-[11px] font-sans font-medium tracking-wide lowercase text-neutral-400 group-hover:text-neutral-200 transition-colors whitespace-nowrap">
            {isCopied ? '¡enlace copiado!' : 'compartir página'}
          </span>
        )}
      </button>

      {/* Popover desplegable elegante para redes sociales y copiar enlace */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Opciones para compartir NotiPerúx"
          className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-full mt-2 w-56 sm:w-64 bg-neutral-950 border border-white/20 rounded-xl shadow-2xl p-2 z-50 text-white font-sans backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2 py-1 border-b border-white/10 mb-1.5 flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-400">
              Difundir página
            </span>
            <span className="text-[11px] font-mono text-neutral-300">
              notiperux.com
            </span>
          </div>

          <div className="space-y-1">
            {/* Opción WhatsApp */}
            <button
              type="button"
              onClick={() => handleOpenSocial('whatsapp')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-lg hover:bg-emerald-600/20 text-neutral-200 hover:text-emerald-300 transition-colors text-left cursor-pointer"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-3 h-3 text-emerald-400" />
              </span>
              <span>WhatsApp</span>
            </button>

            {/* Opción Facebook */}
            <button
              type="button"
              onClick={() => handleOpenSocial('facebook')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-lg hover:bg-blue-600/20 text-neutral-200 hover:text-blue-300 transition-colors text-left cursor-pointer"
            >
              <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Facebook className="w-3 h-3 text-blue-400" />
              </span>
              <span>Facebook</span>
            </button>

            {/* Opción Telegram */}
            <button
              type="button"
              onClick={() => handleOpenSocial('telegram')}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-lg hover:bg-sky-600/20 text-neutral-200 hover:text-sky-300 transition-colors text-left cursor-pointer"
            >
              <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center shrink-0">
                <Send className="w-3 h-3 text-sky-400" />
              </span>
              <span>Telegram</span>
            </button>

            {/* Opción Copiar Enlace */}
            <button
              type="button"
              onClick={handleCopyLink}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors text-left cursor-pointer ${
                isCopied
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                  : 'hover:bg-white/10 text-neutral-200 hover:text-white'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                {isCopied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-neutral-300" />
                )}
              </span>
              <span>{isCopied ? '¡Enlace copiado!' : 'Copiar enlace directo'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
