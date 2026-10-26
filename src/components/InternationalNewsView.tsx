import React, { useMemo } from 'react';
import { RefreshCw, Newspaper, Globe, Flame, ShieldCheck } from 'lucide-react';
import { NewsItem } from '../types';
import { NewsCard } from './NewsCard';
import { formatRelativeTime } from '../services/firebase';

export interface InternationalNewsViewProps {
  news: NewsItem[];
  isLoading?: boolean;
  onSelectNews: (newsId: string) => void;
  onRefresh?: () => void;
  lastUpdated?: string | null;
}

export const InternationalNewsView: React.FC<InternationalNewsViewProps> = ({
  news,
  isLoading = false,
  onSelectNews,
  onRefresh,
  lastUpdated,
}) => {
  // Filtrar exclusivamente noticias internacionales
  const intlNews = useMemo(() => {
    return news
      .filter((n) => n.section === 'internacional')
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [news]);

  const trendingIntl = useMemo(() => {
    return intlNews.slice(0, 5);
  }, [intlNews]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8 pb-16 font-serif bg-transparent">
      {/* Cabecera Estilo Periódico Internacional */}
      <header className="space-y-4 relative border-b border-white/20 pb-4">
        <div className="text-center space-y-2 py-2">
          <div className="hidden sm:flex items-center justify-between text-[11px] font-sans font-semibold text-neutral-400 uppercase tracking-widest px-2 pb-1 border-b border-white/10">
            <span>COBERTURA GEOPOLÍTICA GLOBAL</span>
            <span>AMÉRICA LATINA · EUROPA · ESTADOS UNIDOS · ASIA</span>
            <span>CABLES DIPLOMÁTICOS VERIFICADOS</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase leading-none select-none cursor-pointer">
            NOTIPERUX MUNDO
          </h1>
          <div className="border-y-double border-y-4 border-white py-1.5 text-[12px] sm:text-[14px] font-black uppercase tracking-[0.25em] text-white">
            CORRESPONSALÍA GLOBAL • LA INFORMACIÓN SIN FRONTERAS
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-[12px] font-black uppercase tracking-wider pt-1 text-white gap-2 font-sans">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-black">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              GLOBAL EN VIVO
            </span>
            <span className="text-white/40">•</span>
            <span>
              {new Date().toLocaleDateString('es-PE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).toUpperCase()}
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
              ({intlNews.length} CABLES INTERNACIONALES)
            </span>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 hover:bg-white/10 active:scale-95 px-2.5 py-1 rounded transition-all disabled:opacity-50 cursor-pointer shrink-0 border border-white/20"
              title="Sincronizar y actualizar con los últimos despachos globales"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-white ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-[11px] font-black tracking-wider">ACTUALIZAR AHORA</span>
            </button>
          )}
        </div>
      </header>

      {/* DISEÑO DUAL: Columna Principal + Sidebar Editorial para Desktop */}
      <div className="w-full lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* Columna Principal (8 cols) */}
        <main className="lg:col-span-8 space-y-10 sm:space-y-14">
          {intlNews.length > 0 ? (
            <section aria-label="Noticias Internacionales" className="space-y-10 sm:space-y-14">
              {intlNews.map((item, index) => (
                <React.Fragment key={item.id}>
                  <NewsCard
                    item={item}
                    onReadMore={onSelectNews}
                    variant={index === 0 ? 'hero' : 'standard'}
                  />

                  {/* Espacio Publicitario AdSense entre cables */}
                  {(index === 1 || index === 4) && (
                    <aside
                      aria-label="Anuncio publicitario"
                      className="w-full my-6 p-4 rounded-xl border border-white/15 bg-white/[0.02] text-center font-sans space-y-2"
                    >
                      <div className="flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest text-neutral-400">
                        <span>PUBLICIDAD RECOMENDADA</span>
                        <span>•</span>
                        <span>GOOGLE ADSENSE</span>
                      </div>
                      <div className="min-h-[100px] flex items-center justify-center bg-black/40 border border-dashed border-white/20 rounded-lg p-3 text-neutral-300">
                        <ins
                          className="adsbygoogle"
                          style={{ display: 'block', width: '100%' }}
                          data-ad-client="ca-pub-3994399165136183"
                          data-ad-slot="responsive-infeed-intl"
                          data-ad-format="auto"
                          data-full-width-responsive="true"
                        />
                        <div className="text-center space-y-1 text-xs text-neutral-400 py-4">
                          <p className="font-semibold text-neutral-300">Espacio de Publicidad NotiPerúx Mundo</p>
                          <p className="text-[11px] text-neutral-400">ca-pub-3994399165136183</p>
                        </div>
                      </div>
                    </aside>
                  )}
                </React.Fragment>
              ))}
            </section>
          ) : (
            <div className="bg-black border-4 border-double border-white p-12 text-center space-y-4 font-sans">
              <Newspaper className="w-12 h-12 text-white mx-auto animate-pulse opacity-30" />
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">RECIBIENDO CABLES...</h2>
              <p className="text-sm text-white font-bold uppercase tracking-widest">Sincronizando con agencias de noticias internacionales</p>
            </div>
          )}
        </main>

        {/* Sidebar Desktop (4 cols) */}
        <aside className="hidden lg:block lg:col-span-4 space-y-8 font-sans">
          {/* Lo Más Leído Internacional */}
          <div className="bg-neutral-950 border border-white/20 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/20 pb-3">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-serif">
                MÁS LEÍDO EN EL MUNDO
              </h3>
            </div>
            <div className="space-y-4">
              {trendingIntl.map((item, idx) => (
                <article
                  key={`intl-trend-${item.id}`}
                  onClick={() => onSelectNews(item.id)}
                  className="group flex items-start gap-3 cursor-pointer pb-3 border-b border-white/10 last:border-0 last:pb-0"
                >
                  <span className="text-2xl font-black text-neutral-500 group-hover:text-amber-400 font-serif leading-none pt-0.5">
                    0{idx + 1}
                  </span>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                      {item.country || 'Internacional'}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-neutral-200 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Banner AdSense Sidebar */}
          <div className="bg-neutral-950 border border-white/20 rounded-xl p-4 text-center space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-neutral-400 border-b border-white/10 pb-2">
              <span>PUBLICIDAD</span>
              <span>GOOGLE ADSENSE</span>
            </div>
            <div className="min-h-[250px] bg-black/60 border border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center p-3 text-neutral-300">
              <ins
                className="adsbygoogle"
                style={{ display: 'block', width: '300px', height: '250px' }}
                data-ad-client="ca-pub-3994399165136183"
                data-ad-slot="sidebar-intl-box"
              />
              <div className="space-y-1 text-xs text-neutral-400">
                <p className="font-bold text-white">Anuncio AdSense</p>
                <p className="text-[11px] text-neutral-400">ca-pub-3994399165136183</p>
              </div>
            </div>
          </div>

          {/* Ficha de Transparencia de Fuentes Globales */}
          <div className="p-4 bg-white/[0.03] border border-white/15 rounded-xl text-neutral-400 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-white font-bold text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>AGENCIAS ASOCIADAS</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Monitoreo continuo de cables internacionales de EFE, AFP, Reuters, BBC Mundo y corresponsalías aliadas en América Latina y Europa.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
