import React, { useState, useMemo } from 'react';
import {
  RefreshCw,
  Newspaper,
  RotateCcw,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Clock,
  Flame,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { NewsItem } from '../types';
import { NewsCard } from './NewsCard';
import { ORIGINAL_REPORTS } from '../data/originalArticles';
import { NEWS_CATEGORIES, NewsCategoryDef } from '../data/categories';
import { formatRelativeTime } from '../services/firebase';
import { ShareSiteButton } from './ShareSiteButton';

export interface PeruNewsViewProps {
  news: NewsItem[];
  isLoading?: boolean;
  onSelectNews: (newsId: string) => void;
  onRefresh?: () => void;
  selectedTopicId?: string;
  onSelectTopic?: (topicId: string) => void;
  totalVisits?: number;
  lastUpdated?: string | null;
  onNotify?: (text: string, type?: 'success' | 'error') => void;
}

export interface TopicDef {
  id: string;
  label: string;
  keywords: string[];
}

// Compatibilidad retroactiva exportando los 19 temas oficiales
export const TOPICS: TopicDef[] = NEWS_CATEGORIES.map((cat) => ({
  id: cat.id,
  label: cat.name,
  keywords: cat.keywords,
}));

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function matchesCategory(item: NewsItem, category: NewsCategoryDef): boolean {
  if (category.id === 'todas') return true;

  // Si la noticia ya tiene asignada explícitamente la categoría
  if (item.category) {
    const itemCatNorm = normalizeText(item.category);
    const catNameNorm = normalizeText(category.name);
    const catShortNorm = normalizeText(category.shortName);
    if (itemCatNorm.includes(catNameNorm) || itemCatNorm.includes(catShortNorm)) {
      return true;
    }
  }

  // Clasificación por contenido y palabras clave
  const fullContent = [
    item.title,
    item.summary,
    item.content || '',
    item.category || '',
    item.whyItMatters || '',
    item.context || '',
    ...(item.whatIsKnown || []),
    ...(item.detectedLocations || []),
  ].join(' ');

  const normalized = normalizeText(fullContent);

  return category.keywords.some((keyword) => {
    const normKeyword = normalizeText(keyword);
    return normalized.includes(normKeyword);
  });
}

export const PeruNewsView: React.FC<PeruNewsViewProps> = ({
  news,
  isLoading = false,
  onSelectNews,
  onRefresh,
  selectedTopicId: propSelectedTopicId,
  onSelectTopic,
  lastUpdated,
  onNotify,
}) => {
  const [internalTopicId, setInternalTopicId] = useState<string>('todas');
  const selectedTopicId = propSelectedTopicId ?? internalTopicId;
  const setSelectedTopicId = onSelectTopic ?? setInternalTopicId;

  // Filtrar exclusivamente noticias peruanas, ordenadas cronológicamente
  const allPeruNews = useMemo(() => {
    const livePeru = news.filter((n) => n.section === "peru");
    if (livePeru.length === 0) {
      return ORIGINAL_REPORTS;
    }
    return livePeru.sort((a, b) => {
      const timeA = new Date(a.publishedAt).getTime() || 0;
      const timeB = new Date(b.publishedAt).getTime() || 0;
      return timeB - timeA;
    });
  }, [news]);

  // Categoría seleccionada actualmente
  const currentCategory = useMemo(() => {
    return NEWS_CATEGORIES.find((c) => c.id === selectedTopicId) || NEWS_CATEGORIES[0];
  }, [selectedTopicId]);

  // Filtrado de noticias según el contenido real
  const filteredPeruNews = useMemo(() => {
    if (selectedTopicId === 'todas') return allPeruNews;
    return allPeruNews.filter((item) => matchesCategory(item, currentCategory));
  }, [allPeruNews, selectedTopicId, currentCategory]);

  const isFiltering = selectedTopicId !== 'todas';

  // Las 5 noticias más destacadas para la columna lateral de blog en PC
  const trendingNews = useMemo(() => {
    return allPeruNews.slice(0, 5);
  }, [allPeruNews]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 font-serif bg-transparent">
      {/* Cabecera Estilo Periódico Histórico y Portal Editorial */}
      <header className="space-y-4 relative border-b border-white/20 pb-4">
        <div className="text-center space-y-2 py-2">
          <div className="hidden sm:flex items-center justify-between text-[11px] font-sans font-semibold text-neutral-400 uppercase tracking-widest px-2 pb-1 border-b border-white/10">
            <span>PERIÓDICO DIGITAL INDEPENDIENTE</span>
            <span>EDICIÓN NACIONAL · LIMA - HUÁNUCO - PROVINCIAS</span>
            <span>VERIFICACIÓN EN TIEMPO REAL</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 gap-y-1">
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-none select-none cursor-pointer">
              NOTIPERUX
            </h1>
            <ShareSiteButton onNotify={onNotify} />
          </div>
          <div className="border-y-double border-y-4 border-white py-1.5 text-[12px] sm:text-[14px] font-black uppercase tracking-[0.25em] text-white">
            EL DIARIO DE MAYOR CIRCULACIÓN INFORMATIVA DEL PERÚ
          </div>
        </div>

        {/* Barra de metadatos del diario (Fecha, Estado, Contador, Actualizar) */}
        <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-[12px] font-black uppercase tracking-wider pt-1 text-white gap-2 font-sans">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-black">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              EN VIVO
            </span>
            <span className="text-white/40">•</span>
            <span>
              {new Date()
                .toLocaleDateString('es-PE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
                .toUpperCase()}
            </span>
            {lastUpdated && (
              <>
                <span className="text-white/40 hidden sm:inline">•</span>
                <span className="text-neutral-300 font-bold hidden sm:inline">
                  {formatRelativeTime(lastUpdated).toUpperCase()}
                </span>
              </>
            )}
            <span className="text-white/40 hidden md:inline">•</span>
            <span className="text-neutral-400 text-[10px] hidden md:inline font-mono">
              ({allPeruNews.length} NOTICIAS ACTIVAS · 19 CATEGORÍAS)
            </span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded transition-all disabled:opacity-50 cursor-pointer shrink-0 border border-white/20"
              title="Sincronizar y actualizar despachos de prensa"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-white ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-[11px] font-black tracking-wider">ACTUALIZAR AHORA</span>
            </button>
          )}
        </div>
      </header>

      {/* Barra de categorías horizontal para navegación directa de blog en PC y tablets */}
      <nav aria-label="Categorías de noticias" className="hidden lg:block w-full overflow-hidden border-b border-white/20 pb-3 font-sans">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mr-1">SECCIONES:</span>
          {NEWS_CATEGORIES.map((cat) => {
            const isSelected = selectedTopicId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedTopicId(cat.id)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-wide transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black font-black shadow-sm'
                    : 'text-neutral-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat.shortName}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Indicador si hay filtro activo con botón de restaurar */}
      {isFiltering && (
        <div className="bg-white/10 border border-white/20 rounded-md px-3 py-2 text-xs text-white flex items-center justify-between font-sans">
          <span>
            Categoría: <strong className="text-white">{currentCategory.name}</strong> ({filteredPeruNews.length} artículos)
          </span>
          <button
            type="button"
            onClick={() => setSelectedTopicId('todas')}
            className="text-[11px] font-bold text-[#93c5aa] hover:text-white underline underline-offset-2 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Ver todas las noticias</span>
          </button>
        </div>
      )}

      {/* DISEÑO DUAL: GRID RESPONSIVO (Feed Principal en Móvil / Multi-columna Blog en Desktop) */}
      <div className="w-full lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* Columna Principal de Artículos (8 columnas de 12 en Desktop) */}
        <main className="lg:col-span-8 space-y-10 sm:space-y-14">
          {filteredPeruNews.length > 0 ? (
            <div className="space-y-10 sm:space-y-14">
              {filteredPeruNews.map((item, index) => (
                <React.Fragment key={item.id}>
                  <NewsCard
                    item={item}
                    onReadMore={onSelectNews}
                    variant={index === 0 ? 'hero' : 'standard'}
                  />

                  {/* ESPACIO PUBLICITARIO ADSENSE CADA 4 ARTÍCULOS (Estratégico para cumplir política de AdSense sin sobrecargar) */}
                  {(index === 1 || index === 4 || index === 8) && (
                    <aside
                      aria-label="Anuncio publicitario"
                      className="w-full my-6 p-4 rounded-xl border border-white/15 bg-white/[0.02] text-center font-sans space-y-2"
                    >
                      <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                        <span>PUBLICIDAD RECOMENDADA</span>
                        <span>•</span>
                        <span>GOOGLE ADSENSE</span>
                      </div>
                      {/* Contenedor oficial Google AdSense */}
                      <div className="min-h-[100px] sm:min-h-[120px] flex items-center justify-center bg-black/40 border border-dashed border-white/20 rounded-lg p-3 text-neutral-300">
                        <ins
                          className="adsbygoogle"
                          style={{ display: 'block', width: '100%' }}
                          data-ad-client="ca-pub-3994399165136183"
                          data-ad-slot="responsive-infeed"
                          data-ad-format="auto"
                          data-full-width-responsive="true"
                        />
                        <div className="text-center space-y-1 text-xs text-neutral-400 py-4">
                          <p className="font-semibold text-neutral-300">Espacio de Publicidad NotiPerúx</p>
                          <p className="text-[11px] text-neutral-400">Anuncios relevantes verificados por la red Google AdSense</p>
                        </div>
                      </div>
                    </aside>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : isFiltering ? (
            <div className="bg-black/90 border border-white/30 rounded-xl p-8 text-center space-y-3 font-sans">
              <Newspaper className="w-8 h-8 text-white/40 mx-auto" />
              <h3 className="text-base font-bold text-white">
                No hay despachos inmediatos en la categoría «{currentCategory.name}».
              </h3>
              <p className="text-xs text-white/70 max-w-sm mx-auto">
                {currentCategory.description}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTopicId('todas')}
                  className="px-4 py-2 rounded bg-white text-black text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-neutral-200 transition-all"
                >
                  Ver portada general
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-black border-4 border-double border-white p-12 text-center space-y-4 font-sans">
              <Newspaper className="w-12 h-12 text-white mx-auto animate-pulse opacity-30" />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">IMPRIMIENDO EDICIÓN...</h2>
              <p className="text-sm text-white font-bold uppercase tracking-widest">Sincronizando despachos informativos</p>
            </div>
          )}
        </main>

        {/* BARRA LATERAL (SIDEBAR) EDITORIAL PARA DESKTOP & BLOG (4 columnas de 12 en Desktop) */}
        <aside className="hidden lg:block lg:col-span-4 space-y-8 font-sans">
          {/* 1. MÁS LEÍDAS / TENDENCIAS NACIONALES */}
          <div className="bg-neutral-950 border border-white/20 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/20 pb-3">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-serif">
                LO MÁS LEÍDO DE HOY
              </h3>
            </div>
            <div className="space-y-4">
              {trendingNews.map((item, idx) => (
                <article
                  key={`trend-${item.id}`}
                  onClick={() => onSelectNews(item.id)}
                  className="group flex items-start gap-3 cursor-pointer pb-3 border-b border-white/10 last:border-0 last:pb-0"
                >
                  <span className="text-2xl font-black text-neutral-500 group-hover:text-amber-400 font-serif leading-none pt-0.5">
                    0{idx + 1}
                  </span>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                      {item.category || 'Actualidad'}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-neutral-200 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* 2. ESPACIO PUBLICITARIO ADSENSE SIDEBAR (300x250 / 300x600 Estándar IAB) */}
          <div className="bg-neutral-950 border border-white/20 rounded-xl p-4 text-center space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-white/10 pb-2">
              <span>PUBLICIDAD</span>
              <span>GOOGLE ADSENSE</span>
            </div>
            <div className="min-h-[260px] bg-black/60 border border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center p-4 text-neutral-300">
              <ins
                className="adsbygoogle"
                style={{ display: 'block', width: '300px', height: '250px' }}
                data-ad-client="ca-pub-3994399165136183"
                data-ad-slot="sidebar-rectangle"
              />
              <div className="space-y-1 text-xs text-neutral-400">
                <p className="font-bold text-white">Anuncio AdSense</p>
                <p className="text-[11px] text-neutral-400">ca-pub-3994399165136183</p>
              </div>
            </div>
          </div>

          {/* 3. REPORTES ESPECIALES E INVESTIGACIONES PROPIAS (E-E-A-T AdSense) */}
          <div className="bg-neutral-950 border border-white/20 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/20 pb-3">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-serif">
                INVESTIGACIONES NOTIPERÚX
              </h3>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Informes profundos desarrollados por nuestra mesa de redacción económica, vial y ambiental en Huánuco y Lima.
            </p>
            <div className="space-y-3 pt-1">
              {ORIGINAL_REPORTS.slice(0, 3).map((report) => (
                <div
                  key={`sidebar-report-${report.id}`}
                  onClick={() => onSelectNews(report.id)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-white/10 space-y-1.5"
                >
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">
                    INFORME ESPECIAL · {report.readingTimeMinutes} MIN DE LECTURA
                  </span>
                  <h5 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {report.title}
                  </h5>
                </div>
              ))}
            </div>
          </div>

          {/* 4. COMPROMISO ÉTICO Y EDITORIAL NOTIPERÚX */}
          <div className="p-4 bg-white/[0.03] border border-white/15 rounded-xl text-neutral-400 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-white font-bold text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>TRANSPARENCIA EDITORIAL</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              NotiPerúx se rige por principios de verificación independiente, citando fuentes oficiales y respetando los derechos de autor y las normas del Colegio de Periodistas del Perú.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
