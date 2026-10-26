import React, { useEffect, useState } from 'react';
import {
  Clock,
  ShieldCheck,
  Share2,
  Bookmark,
  ExternalLink,
  Volume2,
  ChevronLeft,
  Calendar,
  User,
  Tag,
  CheckCircle,
} from 'lucide-react';
import { NewsItem } from '../types';
import { formatRelativeTime } from '../services/firebase';
import { generateNewsFactSheet } from '../services/newsFactSheet';
import { NewsCard, getCleanPublisherName } from './NewsCard';
import { speechManager, SpeechState } from '../services/speechService';
import { isNewsSaved, toggleSaveNews, recordNewsRead } from '../services/readerProfileStore';

export interface NewsDetailViewProps {
  item: NewsItem;
  allNews?: NewsItem[];
  relatedNews?: NewsItem[];
  onSelectNews: (newsId: string) => void;
  onBack?: () => void;
}

export const NewsDetailView: React.FC<NewsDetailViewProps> = ({
  item,
  allNews = [],
  relatedNews = [],
  onSelectNews,
  onBack,
}) => {
  const [imgLoadStage, setImgLoadStage] = useState<'initial' | 'proxy' | 'fallback'>('initial');
  const [copied, setCopied] = useState(false);
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [isSaved, setIsSaved] = useState<boolean>(() => isNewsSaved(item.id));

  useEffect(() => {
    setIsSaved(isNewsSaved(item.id));
    recordNewsRead(item);
  }, [item.id]);

  const handleToggleSave = () => {
    const nextSaved = toggleSaveNews(item);
    setIsSaved(nextSaved);
  };

  useEffect(() => {
    setImgLoadStage('initial');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [item.id]);

  useEffect(() => {
    return speechManager.subscribe((playingId, state) => {
      if (playingId === item.id) {
        setSpeechState(state);
      } else {
        setSpeechState('idle');
      }
    });
  }, [item.id]);

  const handleSpeechToggle = () => {
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

  let currentImageSrc = categoryFallbackSvg;
  if (!isDirectFallback) {
    if (imgLoadStage === 'initial') {
      currentImageSrc = rawImage;
    } else if (imgLoadStage === 'proxy') {
      currentImageSrc = `/api/news/image-proxy?url=${encodeURIComponent(rawImage)}`;
    } else {
      currentImageSrc = categoryFallbackSvg;
    }
  }

  const handleImageError = () => {
    if (imgLoadStage === 'initial' && !isDirectFallback) {
      setImgLoadStage('proxy');
    } else if (imgLoadStage === 'proxy') {
      setImgLoadStage('fallback');
    }
  };

  const factSheet = generateNewsFactSheet(item);

  const paragraphs =
    item.content && item.content.includes('\n\n')
      ? item.content.split('\n\n').map((p) => p.trim()).filter((p) => p.length > 0)
      : factSheet.summaryParagraphs;

  const relevantPoints = factSheet.whatIsKnown || [];
  const timeLabel = formatRelativeTime(item.publishedAt);
  const fullDateFormatted = new Date(item.publishedAt).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const fullNewsPool: NewsItem[] = allNews && allNews.length > 0 ? allNews : relatedNews;

  const sameSectionNews = fullNewsPool
    .filter((n) => n.id !== item.id && n.section === item.section)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const handleShare = async () => {
    const url = window.location.href;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: factSheet.cleanTitle,
          text: paragraphs[0] || item.summary,
          url,
        });
        return;
      } catch (err: any) {
        if (err && err.name === 'AbortError') return;
      }
    }
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const authorName = (item as any).author || 'Mesa de Redacción NotiPerúx';
  const authorRole = (item as any).authorRole || 'Periodismo de Investigación y Verificación';
  const readingTime = (item as any).readingTimeMinutes || Math.max(3, Math.ceil((item.content || item.summary).split(' ').length / 180));

  return (
    <article className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-24 font-serif relative">
      {/* 0. Migas de pan (Breadcrumbs) - Vital para Google AdSense e indexación SEO */}
      <nav aria-label="Miga de pan" className="font-sans text-xs text-neutral-400 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-semibold"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Inicio</span>
        </button>
        <span>/</span>
        <span className="text-neutral-300 font-semibold">{isPeru ? 'Perú' : 'Mundo'}</span>
        <span>/</span>
        <span className="text-neutral-200 font-bold">{item.category || 'Actualidad'}</span>
      </nav>

      {/* 1. BARRA SUPERIOR EDITORIAL */}
      <header className="border-newspaper-double py-3 flex items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3">
          <span className="bg-white text-black px-3 py-1 text-xs font-black uppercase tracking-wider">
            {isPeru ? 'NACIONAL' : 'INTERNACIONAL'}
          </span>
          <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-wider text-neutral-300">
            {item.category || 'INFORME NOTIPERUX'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 border border-white/40 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleSave}
            className={`px-3 py-1.5 border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              isSaved
                ? 'bg-white text-black border-white'
                : 'border-white text-white hover:bg-white hover:text-black'
            }`}
            title={isSaved ? 'Guardado en Mi Perfil' : 'Guardar para leer después'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-black' : ''}`} />
            <span>{isSaved ? 'GUARDADO' : 'GUARDAR'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 border border-white hover:bg-white hover:text-black transition-colors cursor-pointer"
            title="Compartir noticia"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. TITULAR PRINCIPAL DE GRAN FORMATO */}
      <div className="space-y-4 text-left sm:text-center">
        <div className="inline-block px-3 py-1 bg-white/10 text-white rounded text-[11px] font-sans font-bold uppercase tracking-widest">
          {item.category || 'Cobertura de Actualidad'}
        </div>
        <h1 className="text-3xl sm:text-6xl font-black text-white leading-tight tracking-tight uppercase">
          {factSheet.cleanTitle}
        </h1>
        <p className="text-base sm:text-xl text-neutral-300 font-sans leading-relaxed max-w-4xl mx-auto">
          {item.summary}
        </p>
      </div>

      {/* Ficha de Autor, Fecha y E-E-A-T (Requisito fundamental de Google AdSense) */}
      <div className="flex flex-wrap items-center justify-between py-3 border-y border-white/20 text-xs font-sans text-neutral-300 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white text-black font-black flex items-center justify-center text-xs">
            NP
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>{authorName}</span>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-[11px] text-neutral-400">{authorRole}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{fullDateFormatted}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-white font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{readingTime} min de lectura</span>
          </span>
        </div>
      </div>

      {/* 3. REPRODUCTOR DE VOZ (LECTURA EN AUDIO NATIVO) */}
      <div className="border border-white/30 p-4 sm:p-5 bg-neutral-950 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
        <div className="flex-1 space-y-1 text-center sm:text-left">
          <p className="text-[11px] font-black uppercase text-emerald-400 tracking-[0.25em]">REPORTE DE AUDIO NOTIPERÚX</p>
          <p className="text-xs sm:text-sm font-medium text-white">
            Escucha la narración verbal completa y el análisis contextual de esta noticia.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSpeechToggle}
          className={`btn-audio shrink-0 ${speechState === 'playing' ? 'is-playing' : ''}`}
        >
          <span className="audio-shine"></span>
          <span className="audio-icon">
            {speechState === 'playing' ? (
              <Volume2 className="w-3 h-3 text-[#075a3d] animate-pulse" />
            ) : (
              <svg viewBox="0 0 64 64">
                <path d="M12 25h12l15-12v38L24 39H12z" fill="currentColor" />
              </svg>
            )}
          </span>
          <span className="audio-text"><strong>{speechState === 'playing' ? 'PAUSAR' : 'ESCUCHAR'}</strong></span>
        </button>
      </div>

      {/* ESPACIO PUBLICITARIO ADSENSE SUPERIOR */}
      <aside aria-label="Publicidad" className="w-full font-sans text-center space-y-1">
        <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold block">
          PUBLICIDAD
        </span>
        <div className="min-h-[90px] bg-black/50 border border-dashed border-white/20 rounded p-2 flex items-center justify-center text-xs text-neutral-400">
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%' }}
            data-ad-client="ca-pub-3994399165136183"
            data-ad-slot="article-top-banner"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
          <span className="text-[11px] text-neutral-400">Espacio oficial para anuncio de Google AdSense</span>
        </div>
      </aside>

      {/* 4. IMAGEN PRINCIPAL */}
      <figure className="space-y-2">
        <div className="relative w-full aspect-[16/9] border-2 border-white rounded-xl overflow-hidden bg-neutral-900">
          <img
            src={currentImageSrc}
            alt={factSheet.cleanTitle}
            loading="eager"
            onError={handleImageError}
            className="w-full h-full object-cover"
          />
        </div>
        <figcaption className="flex justify-between items-center text-xs text-neutral-400 font-sans pt-1">
          <span>Fuente fotográfica: {getCleanPublisherName(item.sourceName)}</span>
          <span className="text-[11px]">Archivo verificado</span>
        </figcaption>
      </figure>

      {/* 5. CUERPO DE LA NOTICIA + BARRA LATERAL (BLOG EDITORIAL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-white/20 pt-6">
        {/* Columna Principal de Lectura (8 cols) */}
        <div className="lg:col-span-8 space-y-6 text-neutral-100 text-lg sm:text-xl leading-relaxed text-justify">
          {paragraphs.map((para, idx) => (
            <p
              key={idx}
              className={idx === 0 ? 'first-letter:text-6xl first-letter:font-black first-letter:mr-2.5 first-letter:float-left first-letter:leading-none text-white font-medium' : ''}
            >
              {para}
            </p>
          ))}

          {/* ESPACIO PUBLICITARIO ADSENSE IN-ARTICLE (En medio del artículo) */}
          <aside aria-label="Publicidad en artículo" className="my-8 p-4 bg-neutral-950 border border-white/20 rounded-xl text-center font-sans space-y-1">
            <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold block">
              PUBLICIDAD RECOMENDADA · GOOGLE ADSENSE
            </span>
            <div className="min-h-[140px] bg-black/60 border border-dashed border-white/20 rounded-lg flex items-center justify-center p-3 text-neutral-400 text-xs">
              <ins
                className="adsbygoogle"
                style={{ display: 'block', textAlign: 'center' }}
                data-ad-layout="in-article"
                data-ad-format="fluid"
                data-ad-client="ca-pub-3994399165136183"
                data-ad-slot="article-middle"
              />
              <span className="text-neutral-400">Anuncio Google AdSense (ca-pub-3994399165136183)</span>
            </div>
          </aside>

          {/* Contexto y por qué importa (E-E-A-T AdSense) */}
          {item.whyItMatters && (
            <div className="p-5 bg-white/5 border-l-4 border-emerald-500 rounded-r-xl space-y-2 font-sans not-italic text-left my-6">
              <div className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                ¿POR QUÉ ES RELEVANTE ESTA NOTICIA?
              </div>
              <p className="text-sm text-neutral-200 leading-normal font-medium">
                {item.whyItMatters}
              </p>
            </div>
          )}
        </div>

        {/* Barra Lateral de Lectura (4 cols) */}
        <aside className="lg:col-span-4 space-y-6 font-sans">
          {/* Puntos Clave */}
          {relevantPoints.length > 0 && (
            <div className="bg-neutral-950 border border-white/20 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white border-b border-white/10 pb-2">
                HECHOS COMPROBADOS
              </h3>
              <ul className="space-y-3">
                {relevantPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-neutral-300 leading-snug">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Banner Lateral de AdSense (300x250) */}
          <div className="bg-neutral-950 border border-white/20 rounded-xl p-4 text-center space-y-2">
            <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold block">
              PUBLICIDAD
            </span>
            <div className="min-h-[250px] bg-black/60 border border-dashed border-white/20 rounded flex flex-col items-center justify-center p-2 text-neutral-400 text-xs">
              <ins
                className="adsbygoogle"
                style={{ display: 'inline-block', width: '300px', height: '250px' }}
                data-ad-client="ca-pub-3994399165136183"
                data-ad-slot="article-sidebar"
              />
              <span className="text-neutral-400">Anuncio AdSense (300x250)</span>
            </div>
          </div>

          {/* Ficha Técnica de Cobertura */}
          <div className="bg-neutral-950 border border-white/15 rounded-xl p-4 text-xs space-y-3 text-neutral-300">
            <div className="text-[11px] font-black uppercase text-white tracking-wider border-b border-white/10 pb-1">
              FICHA DE VERIFICACIÓN
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div><strong className="text-neutral-200">Sección:</strong> {isPeru ? 'Perú Nacional' : 'Internacional'}</div>
              <div><strong className="text-neutral-200">Categoría:</strong> {item.category || 'Actualidad'}</div>
              <div><strong className="text-neutral-200">Línea editorial:</strong> NotiPerúx Digital</div>
              <div><strong className="text-neutral-200">Protocolo:</strong> Contrastado con fuentes oficiales</div>
            </div>
          </div>
        </aside>
      </div>

      {/* 6. PIE DE PÁGINA EDITORIAL & NOTICIAS RELACIONADAS */}
      <footer className="pt-12 border-t-2 border-white/20 space-y-8 font-sans">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {item.sourceId === 'notiperux-redaccion' || item.sourceName.includes('NotiPerúx') ? (
              <span className="px-3 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase rounded">
                Investigación Original NotiPerúx
              </span>
            ) : (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded hover:bg-neutral-200 transition-colors"
              >
                <span>Consultar Fuente Original</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-white/30 text-xs font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-colors rounded cursor-pointer"
          >
            ← Volver al Portal de Noticias
          </button>
        </div>

        {/* Más noticias en esta sección */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-white uppercase tracking-wider font-serif">
              MÁS NOTICIAS DESTACADAS DE ESTA EDICIÓN
            </h2>
            <div className="h-px flex-1 bg-white/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sameSectionNews.slice(0, 3).map((n) => (
              <div
                key={n.id}
                onClick={() => onSelectNews(n.id)}
                className="p-4 bg-neutral-950 border border-white/20 rounded-xl cursor-pointer hover:border-white transition-all space-y-2.5"
              >
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  {n.category || 'Actualidad'}
                </span>
                <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug font-serif">
                  {n.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {n.summary}
                </p>
                <div className="text-[10px] text-neutral-400 pt-1 font-mono">
                  {formatRelativeTime(n.publishedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </article>
  );
};
