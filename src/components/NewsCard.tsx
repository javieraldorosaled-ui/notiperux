import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Globe, Volume2 } from 'lucide-react';
import { NewsItem } from '../types';
import { formatRelativeTime } from '../services/firebase';
import { cleanNewsTitle } from '../services/newsFactSheet';
import { speechManager, SpeechState } from '../services/speechService';

export interface NewsCardProps {
  item: NewsItem;
  onReadMore: (newsId: string) => void;
  variant?: 'hero' | 'featured' | 'standard';
  className?: string;
}

export function getCleanPublisherName(sourceName: string): string {
  if (!sourceName) return 'PRENSA';
  if (/notiperux/i.test(sourceName)) return 'NOTIPERÚX INVESTIGACIÓN';
  const raw = sourceName.split('·')[0].split('-')[0].trim();
  if (/^rpp/i.test(raw)) return 'RPP';
  if (/andina/i.test(raw)) return 'ANDINA';
  if (/comercio/i.test(raw)) return 'EL COMERCIO';
  if (/rep[uú]blica/i.test(raw)) return 'LA REPÚBLICA';
  if (/correo/i.test(raw)) return 'CORREO';
  if (/bbc/i.test(raw)) return 'BBC';
  if (/cnn/i.test(raw)) return 'CNN';
  if (/dw\b/i.test(raw)) return 'DW';
  return raw.replace(/\s*(noticias|news|digital|nacional)\b/gi, '').trim().toUpperCase() || raw.toUpperCase();
}

export const NewsCard: React.FC<NewsCardProps> = ({
  item,
  onReadMore,
  variant = 'standard',
  className = '',
}) => {
  const [imgLoadStage, setImgLoadStage] = useState<'initial' | 'proxy' | 'fallback'>('initial');
  const [speechState, setSpeechState] = useState<SpeechState>('idle');

  useEffect(() => {
    return speechManager.subscribe((playingId, state) => {
      if (playingId === item.id) {
        setSpeechState(state);
      } else {
        setSpeechState('idle');
      }
    });
  }, [item.id]);

  const handleSpeechToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    speechManager.togglePlay(item);
  };

  const isPeru = item.section === 'peru';
  const categoryFallbackSvg = isPeru
    ? '/images/news-fallback-peru.svg'
    : '/images/news-fallback-mundo.svg';

  const rawImage = (item.imageUrlResolved || item.imageUrl || '').trim();
  const isDirectFallback =
    !rawImage ||
    rawImage.includes('news-fallback') ||
    rawImage.includes('huanuco-news-fallback') ||
    rawImage.startsWith('/images/');

  let displayImage = categoryFallbackSvg;
  if (!isDirectFallback) {
    if (imgLoadStage === 'initial') {
      displayImage = rawImage;
    } else if (imgLoadStage === 'proxy') {
      displayImage = `/api/news/image-proxy?url=${encodeURIComponent(rawImage)}`;
    } else {
      displayImage = categoryFallbackSvg;
    }
  }

  const handleImageError = () => {
    if (imgLoadStage === 'initial' && !isDirectFallback) {
      setImgLoadStage('proxy');
    } else if (imgLoadStage === 'proxy') {
      setImgLoadStage('fallback');
    }
  };

  const titleClean = cleanNewsTitle(item.title);
  const timeLabel = formatRelativeTime(item.publishedAt);
  const timeClean = timeLabel.replace(/^Actualizado\s+/i, '');
  const exactHour = (() => {
    try {
      const d = new Date(item.publishedAt);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return null;
    }
  })();
  const isOriginal = (item as any).isOriginalReport === true;

  // Renderizador del Botón Glossy 3D IR A LA WEB (Lleva a la página original)
  const renderGlossyLeerMasButton = () => (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="btn-leer-mas shrink-0"
      title="Ir a la web original de la noticia"
    >
      <span className="shine"></span>
      <span className="btn-icon">
        <svg viewBox="0 0 64 64">
          <path d="M12 24l12 12 12-12M24 14v22" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M10 44h28" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
      </span>
      <span className="btn-text">IR A LA WEB</span>
      <span className="btn-arrow">
        <svg viewBox="0 0 32 32">
          <path
            d="M11 7l9 9-9 9"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </a>
  );

  // Renderizador de Botones de AUDIO (ESCUCHAR + PAUSAR)
  const renderAudioButtons = () => (
    <div className="flex items-center gap-1.5">
      {/* Botón Escuchar/Reanudar */}
      <button
        type="button"
        onClick={handleSpeechToggle}
        className={`btn-audio shrink-0 ${
          speechState === 'playing' ? 'is-playing' : ''
        }`}
        title={speechState === 'paused' ? 'Reanudar' : 'Escuchar noticia'}
      >
        <span className="audio-shine"></span>
        <span className="audio-icon">
          {speechState === 'playing' ? (
            <Volume2 className="w-3 h-3 text-white animate-pulse" />
          ) : (
            <svg viewBox="0 0 64 64">
              <path d="M12 25h12l15-12v38L24 39H12z" fill="currentColor" />
              <path
                d="M46 23c5 5 5 13 0 18M51 17c9 9 9 21 0 30"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          )}
        </span>
        <span className="audio-text">
          <strong>{speechState === 'playing' ? 'ESCUCHANDO' : speechState === 'paused' ? 'REANUDAR' : 'ESCUCHAR'}</strong>
        </span>
      </button>

      {/* Botón Pausa (sutil) */}
      {speechState === 'playing' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            speechManager.pause(item.id);
          }}
          className="btn-audio shrink-0 bg-neutral-800 !border-neutral-600 !text-neutral-300"
          title="Pausar audio"
        >
          <span className="audio-icon">
            <svg viewBox="0 0 32 32" className="w-3 h-3">
              <rect x="8" y="6" width="6" height="20" fill="currentColor" />
              <rect x="18" y="6" width="6" height="20" fill="currentColor" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );

  // 1. VARIANTE HERO: Noticia Principal destacada - Estilo Portada de Periódico Máximo
  if (variant === 'hero') {
    return (
      <article
        className={`group relative bg-[#000000] border-newspaper-thick shadow-none overflow-hidden transition-all duration-500 font-serif ${className}`}
      >
        {/* 1. JERARQUÍA: Imagen principal - Estilo "Foto de Prensa de Archivo" */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-[#111] overflow-hidden flex items-center justify-center border-b-4 border-double border-white cursor-pointer block"
        >
          <img
            src={displayImage}
            alt={titleClean}
            loading="eager"
            onError={handleImageError}
            className="w-full h-full object-cover transition-all duration-700"
          />
          
          <div className="absolute bottom-0 left-0 bg-black/75 backdrop-blur-xs px-2.5 py-1 text-[11px] text-white font-black uppercase tracking-[0.15em] border-t border-r border-white/20">
            <span>FOTO DE PRENSA: {getCleanPublisherName(item.sourceName)}</span>
          </div>
        </a>

        <div className="p-3 sm:p-6 space-y-4">
          {/* Metadata bar: Estado en vivo, Fuente, Tiempo transcurrido y Hora */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-[12px] font-black uppercase tracking-wider text-neutral-300 border-b border-white/20 pb-2.5">
            {isOriginal ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xs">
                ★ INVESTIGACIÓN NOTIPERÚX
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                DESPACHO EN VIVO
              </span>
            )}
            <span className="text-white font-black">{getCleanPublisherName(item.sourceName)}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{timeClean}</span>
            {exactHour && (
              <>
                <span className="opacity-40">•</span>
                <span className="text-neutral-400">{exactHour}</span>
              </>
            )}
            {item.category && (
              <>
                <span className="opacity-40">•</span>
                <span className="text-neutral-300 font-bold">{item.category}</span>
              </>
            )}
          </div>

          {/* 2. JERARQUÍA: Titular Periodístico Destacado - Letras Grandes e Impactantes */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[34px] sm:text-[52px] font-black text-white leading-[0.9] tracking-tighter cursor-pointer hover:text-gray-300 transition-colors block"
          >
            {titleClean}
          </a>

          {/* 4. JERARQUÍA: Resumen en columnas simuladas con separador vertical */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-8 pt-4">
            <div className="sm:col-span-8 relative">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg sm:text-2xl text-white leading-relaxed text-justify italic cursor-pointer first-letter:text-6xl first-letter:font-black first-letter:mr-2 first-letter:float-left first-letter:leading-[0.8] first-letter:mt-2 block"
              >
                {item.summary}
              </a>
            </div>
            <div className="hidden sm:block sm:col-span-4 border-l border-white/20 pl-6 space-y-4">
              <div className="text-[13px] font-black text-white uppercase tracking-widest border-b border-white pb-1">
                Contexto Local
              </div>
              <p className="text-[14px] leading-relaxed text-white font-medium">
                Santiago de Huánuco y el resto del país reciben esta noticia con gran expectativa. Nuestra redacción amplía los detalles en la edición impresa de mañana.
              </p>
              <div className="bg-white text-black p-3 text-[12px] font-bold uppercase leading-tight">
                "La información es la base de la libertad ciudadana"
              </div>
            </div>
          </div>

          {/* 5. JERARQUÍA: Botones */}
          <div className="pt-6 border-t-4 border-double border-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              {renderGlossyLeerMasButton()}
              {renderAudioButtons()}
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[12px] font-black text-white uppercase tracking-widest">
              <span>VOL. № {item.id.substring(0, 4)}</span>
              <span>•</span>
              <span>FOLIO {item.id.substring(4, 7)}</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // 2. VARIANTE FEATURED: Noticia secundaria - Estilo Columna de Opinión
  if (variant === 'featured') {
    return (
      <article
        className={`group bg-[#000000] border-newspaper shadow-none overflow-hidden flex flex-col transition-all duration-300 font-serif ${className}`}
      >
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-full aspect-[4/3] bg-[#111] border-b border-white overflow-hidden cursor-pointer block"
        >
          <img
            src={displayImage}
            alt={titleClean}
            loading="lazy"
            onError={handleImageError}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          />
        </a>

        <div className="p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-neutral-400">
            {isOriginal && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded-xs">
                INVESTIGACIÓN
              </span>
            )}
            <span className="text-white font-bold">{getCleanPublisherName(item.sourceName)}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{timeClean}</span>
            {exactHour && <span className="text-neutral-500">• {exactHour}</span>}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[22px] font-black text-white leading-[1] cursor-pointer hover:underline decoration-2 block"
          >
            {titleClean}
          </a>
          
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white leading-snug line-clamp-3 italic border-l-2 border-white/10 pl-3 block"
          >
            {item.summary}
          </a>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            {renderGlossyLeerMasButton()}
          </div>
        </div>
      </article>
    );
  }

  // 3. VARIANTE STANDARD: Tarjeta editorial compacta - Estilo Clasificado de Prensa
  return (
    <article
      className={`group bg-[#000000] border-newspaper p-2 flex gap-3 items-center transition-all duration-300 hover:bg-[#111] font-serif ${className}`}
    >
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative w-28 h-28 sm:w-40 sm:h-40 bg-[#111] border border-white shrink-0 overflow-hidden cursor-pointer shadow-none block"
      >
        <img
          src={displayImage}
          alt={titleClean}
          loading="lazy"
          onError={handleImageError}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
        />
      </a>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-neutral-400">
          {isOriginal && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded-xs">
              INVESTIGACIÓN
            </span>
          )}
          <span className="text-white font-bold">{getCleanPublisherName(item.sourceName)}</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">{timeClean}</span>
          {exactHour && <span className="text-neutral-500">• {exactHour}</span>}
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[20px] sm:text-[22px] font-black text-white leading-[0.95] cursor-pointer hover:text-gray-300 block"
        >
          {titleClean}
        </a>

        <div className="flex items-center gap-3 pt-2">
          {renderGlossyLeerMasButton()}
          {renderAudioButtons()}
        </div>
      </div>
    </article>
  );
};
