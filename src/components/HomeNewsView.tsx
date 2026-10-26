import React, { useEffect } from 'react';
import { Newspaper, Sparkles, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';
import { NewsItem, ActiveTab } from '../types';
import { NewsCard } from './NewsCard';

export interface HomeNewsViewProps {
  news: NewsItem[];
  isLoading?: boolean;
  onSelectNews: (newsId: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onRefresh?: () => void;
}

export const HomeNewsView: React.FC<HomeNewsViewProps> = ({
  news,
  isLoading = false,
  onSelectNews,
  onNavigateTab,
  onRefresh,
}) => {


  // Ordenar cronológicamente (más recientes primero)
  const sortedNews = [...news].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // 1. Todas las noticias son grandes ahora
  const allNews = sortedNews;

  // Conteo por sección
  const peruCount = news.filter((n) => n.section === 'peru').length;
  const intlCount = news.filter((n) => n.section === 'internacional').length;

  return (
    <div className="w-full px-2 py-4 sm:py-6 space-y-10 pb-28 font-serif">
      {/* Cabecera Editorial Principal de la Portada */}
      <div className="flex items-center justify-between gap-3 border-b border-white pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📰</span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              PORTADA DE NOTICIAS
            </h1>
          </div>
          <p className="text-[13px] sm:text-[15px] text-white font-medium mt-0.5">
            Lo más relevante del Perú y el mundo en tiempo real
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Actualizar noticias"
            title="Actualizar noticias"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-black hover:bg-white/10 text-white border border-white/20 shadow-none transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        )}
      </div>

      {/* Acceso Rápido a las 2 Grandes Secciones */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('peru')}
          className="group p-3.5 sm:p-4 rounded-none bg-black border border-white hover:bg-white/5 transition-all text-left cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <span className="text-xs font-black text-white uppercase tracking-wider block">
              🇵🇪 PERÚ
            </span>
            <span className="text-[12px] text-white/70 font-medium">
              {peruCount > 0 ? `${peruCount} noticias` : 'Actualidad nacional'}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('internacional')}
          className="group p-3.5 sm:p-4 rounded-none bg-black border border-white hover:bg-white/5 transition-all text-left cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-0.5">
            <span className="text-xs font-black text-white uppercase tracking-wider block">
              🌎 INTERNACIONAL
            </span>
            <span className="text-[12px] text-white/70 font-medium">
              {intlCount > 0 ? `${intlCount} noticias` : 'Panorama global'}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* LISTADO DE NOTICIAS TODAS GRANDES */}
      {allNews.length > 0 ? (
        <section aria-label="Todas las noticias" className="space-y-12 sm:space-y-16">
          {allNews.map((item, index) => (
            <React.Fragment key={item.id}>
              <NewsCard
                item={item}
                onReadMore={onSelectNews}
                variant="hero"
              />
            </React.Fragment>
          ))}
        </section>
      ) : (
        <div className="bg-black rounded-none p-8 border border-white text-center space-y-3">
          <Newspaper className="w-10 h-10 text-white mx-auto animate-pulse" />
          <h2 className="text-base font-black text-white uppercase tracking-tighter">Cargando noticias de hoy...</h2>
          <p className="text-[12px] text-white">Obteniendo las últimas publicaciones verificadas de Perú y el mundo.</p>
        </div>
      )}

      {/* Accesos al pie para profundizar */}
      <div className="pt-10 border-t border-white flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('peru')}
          className="flex-1 py-3 px-4 rounded-none bg-black hover:bg-white/5 text-white font-black text-xs sm:text-sm text-center border-2 border-white transition-colors cursor-pointer uppercase tracking-widest"
        >
          Ver noticias de Perú →
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('internacional')}
          className="flex-1 py-3 px-4 rounded-none bg-black hover:bg-white/5 text-white font-black text-xs sm:text-sm text-center border-2 border-white transition-colors cursor-pointer uppercase tracking-widest"
        >
          Ver Internacional →
        </button>
      </div>
    </div>
  );
};
