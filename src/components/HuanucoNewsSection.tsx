import React, { useState } from 'react';
import {
  Newspaper,
  MapPin,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Scale,
  ShieldCheck,
  HeartPulse,
  TrendingUp,
  CloudRain,
  Navigation,
  Landmark,
  Building2,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { HuanucoNewsItem, NewsSourceStatus } from '../types';
import { formatRelativeTime } from '../services/firebase';

interface HuanucoNewsSectionProps {
  news: HuanucoNewsItem[];
  sources?: NewsSourceStatus[];
  updatedAt?: string | null;
  isLoading?: boolean;
  searchQuery?: string;
  onRefresh?: () => Promise<void> | void;
  onOpenAccount?: () => void;
  favoritesCount?: number;
  onGoHome?: () => void;
}

const DEFAULT_NEWS_FALLBACK_IMAGE = '/images/huanuco-news-fallback.svg';

export const HuanucoNewsSection: React.FC<HuanucoNewsSectionProps> = ({
  news,
  sources = [],
  updatedAt,
  isLoading = false,
  searchQuery = '',
  onRefresh,
}) => {
  const [selectedZone, setSelectedZone] = useState<'ALL' | 'CAPITAL' | 'SELVA' | 'PROVINCIAS'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expanded, setExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [proxiedImages, setProxiedImages] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [showSourcesInfo, setShowSourcesInfo] = useState(false);

  const [showZoneMenu, setShowZoneMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  const handleManualRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredNews = news.filter((item) => {
    if (normalizedQuery) {
      const hay = `${item.title} ${item.summary} ${item.primaryLocation} ${item.sourceName} ${item.category}`.toLowerCase();
      if (!hay.includes(normalizedQuery)) return false;
    }

    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }

    if (selectedZone === 'ALL') return true;
    const locs = (item.detectedLocations || [item.primaryLocation || '']).map((l) => (l || '').toLowerCase());
    if (selectedZone === 'CAPITAL') {
      return locs.some((l) =>
        ['huánuco', 'huanuco', 'huánuco cercado', 'amarilis', 'pillco marca'].includes(l)
      );
    }
    if (selectedZone === 'SELVA') {
      return locs.some((l) =>
        ['tingo maría', 'tingo maria', 'leoncio prado', 'puerto inca', 'marañón', 'maranon'].includes(
          l
        )
      );
    }
    if (selectedZone === 'PROVINCIAS') {
      return locs.some((l) =>
        [
          'ambo',
          'pachitea',
          'dos de mayo',
          'lauricocha',
          'yarowilca',
          'huamalíes',
          'huamalies',
          'huacaybamba',
          'marañón',
          'puerto inca',
        ].includes(l)
      );
    }
    return true;
  });

  const visibleCount = expanded ? 40 : 15;
  const displayedNews = filteredNews.slice(0, visibleCount);
  const activeSourcesCount = sources.filter((s) => s.fetchStatus === 'OK').length;

  const availableCategories: string[] = Array.from(new Set(news.map((n) => n.category).filter((c): c is string => Boolean(c))));

  const formatPublishedDate = (iso: string) => {
    if (!iso) return 'Reciente';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'Reciente';
    const rel = formatRelativeTime(iso).replace(/^Actualizado\s+/i, '');
    return rel ? `Hace ${rel.replace(/^hace\s+/i, '')}` : 'Hace unos minutos';
  };

  const zoneOptions = [
    { id: 'ALL' as const, label: 'Toda la región', shortLabel: 'Huánuco (Región)' },
    { id: 'CAPITAL' as const, label: 'Huánuco · Amarilis · Pillco', shortLabel: 'Huánuco · Capital' },
    { id: 'SELVA' as const, label: 'Tingo María · Selva', shortLabel: 'Tingo María · Selva' },
    { id: 'PROVINCIAS' as const, label: 'Provincias Altoandinas', shortLabel: 'Altoandinas' },
  ];

  const currentZoneObj = zoneOptions.find((z) => z.id === selectedZone) || zoneOptions[0];

  const hasUsableRealImage = (item: HuanucoNewsItem): boolean => {
    const candidateUrl = (item.imageUrlResolved || item.imageUrl || '').trim();
    if (!candidateUrl) return false;
    if (item.imageFallbackUsed === true) return false;
    if (failedImages[item.id]) return false;
    if (
      candidateUrl === DEFAULT_NEWS_FALLBACK_IMAGE ||
      candidateUrl.includes('huanuco-news-fallback') ||
      candidateUrl.includes('flowpaper-logo')
    ) {
      return false;
    }
    return true;
  };

  const getDisplayImageSrc = (item: HuanucoNewsItem): string => {
    const raw = (item.imageUrlResolved || item.imageUrl || '').trim();
    if (proxiedImages[item.id] && /^https?:\/\//i.test(raw)) {
      return `/api/news/image-proxy?url=${encodeURIComponent(raw)}`;
    }
    return raw;
  };

  const handleImageError = (itemId: string) => {
    if (!proxiedImages[itemId]) {
      setProxiedImages((prev) => ({ ...prev, [itemId]: true }));
      return;
    }
    setFailedImages((prev) => (prev[itemId] ? prev : { ...prev, [itemId]: true }));
  };

  const renderCategoryFallbackVisual = (
    item: HuanucoNewsItem,
    variantIndex: number
  ) => {
    const cat = (item.category || 'Actualidad Regional').toLowerCase();
    const idSeed = item.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const toneVariant = (variantIndex + idSeed) % 3;

    let PrimaryIcon = Newspaper;
    let SecondaryIcon = FileText;
    let shortTag = 'Nota regional';

    if (cat.includes('seguridad') || cat.includes('justicia')) {
      PrimaryIcon = variantIndex % 2 === 0 ? Scale : ShieldCheck;
      SecondaryIcon = ShieldCheck;
      shortTag = 'Justicia y orden';
    } else if (cat.includes('salud') || cat.includes('servicio')) {
      PrimaryIcon = HeartPulse;
      SecondaryIcon = Building2;
      shortTag = 'Salud y bienestar';
    } else if (cat.includes('econom') || cat.includes('mercado')) {
      PrimaryIcon = TrendingUp;
      SecondaryIcon = Landmark;
      shortTag = 'Economía local';
    } else if (cat.includes('vía') || cat.includes('via') || cat.includes('transporte') || cat.includes('clima')) {
      PrimaryIcon = variantIndex % 2 === 0 ? Navigation : CloudRain;
      SecondaryIcon = CloudRain;
      shortTag = 'Vías y clima';
    } else if (cat.includes('gestión') || cat.includes('gestion')) {
      PrimaryIcon = variantIndex % 2 === 0 ? Landmark : Building2;
      SecondaryIcon = FileText;
      shortTag = 'Gestión pública';
    }

    return (
      <div className="relative w-full h-[200px] sm:h-[240px] bg-white/5 flex flex-col items-center justify-center p-6 overflow-hidden select-none border-b border-white/20">
        <div className="pointer-events-none absolute -right-8 -bottom-8 w-40 h-40 rounded-full border-2 border-white/10 flex items-center justify-center opacity-20">
          <SecondaryIcon className="w-20 h-20 stroke-[1.4]" />
        </div>
        <div className="w-16 h-16 rounded-none border border-white flex items-center justify-center mb-3">
          <PrimaryIcon className="w-8 h-8 stroke-[2] text-white" />
        </div>
        <span className="text-[15px] font-black tracking-widest uppercase text-white text-center">
          {item.category || 'Actualidad Regional'}
        </span>
        <span className="text-[13px] font-medium opacity-80 mt-1 text-white text-center italic">
          {item.sourceName} · {shortTag}
        </span>
      </div>
    );
  };

  const renderLargeNewsItem = (item: HuanucoNewsItem, idx: number) => {
    const hasImage = hasUsableRealImage(item);
    return (
      <article
        key={item.id}
        className="group relative bg-black border-4 border-double border-white shadow-none overflow-hidden transition-all duration-500 font-serif"
      >
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
          {/* Imagen / Fallback */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-[#111] overflow-hidden flex items-center justify-center border-b-4 border-double border-white">
            {hasImage ? (
              <img
                src={getDisplayImageSrc(item)}
                alt={item.title}
                loading="lazy"
                onError={() => handleImageError(item.id)}
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
              />
            ) : (
              renderCategoryFallbackVisual(item, idx)
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1.5 text-[11px] text-white font-black uppercase tracking-[0.2em] flex justify-between">
              <span>{item.sourceName}</span>
              <span>HUÁNUCO DIGITAL</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-4 text-[12px] font-black uppercase tracking-widest text-white">
              <span className="bg-white text-black px-2 py-0.5">{item.category}</span>
              <div className="h-px flex-1 bg-white/20" />
              <span>{formatPublishedDate(item.publishedAt)}</span>
            </div>

            <h3 className="text-[28px] sm:text-[42px] font-black text-white leading-[0.95] tracking-tighter group-hover:text-gray-300 transition-colors">
              {item.title}
            </h3>

            {item.summary && (
              <p className="text-base sm:text-xl text-white leading-relaxed text-justify italic opacity-90 line-clamp-3 first-letter:text-4xl first-letter:font-black first-letter:mr-1 first-letter:float-left">
                {item.summary}
              </p>
            )}

            <div className="pt-4 border-t-2 border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] font-black text-white uppercase tracking-widest">
                <MapPin className="w-4 h-4" />
                <span>{item.primaryLocation || 'Región Huánuco'}</span>
              </div>
              
              <div className="flex items-center gap-1 px-3 py-1 bg-white text-black text-[11px] font-black uppercase tracking-widest">
                <span>IR A LA WEB</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </a>
      </article>
    );
  };

  const renderCompactFiltersBar = () => (
    <div className="bg-white/5 rounded-none p-4 border border-white space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[14px] font-black text-white uppercase tracking-widest">
          Filtrar por ubicación o tema
        </span>
        {(selectedZone !== 'ALL' || selectedCategory !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSelectedZone('ALL');
              setSelectedCategory('ALL');
              setShowZoneMenu(false);
              setShowCategoryMenu(false);
            }}
            className="text-[12px] font-black text-white underline uppercase tracking-widest hover:text-gray-300"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setShowZoneMenu((prev) => !prev);
            setShowCategoryMenu(false);
          }}
          className={`px-4 py-3 border text-[13px] font-black uppercase tracking-widest flex items-center justify-between gap-2 transition-colors ${
            selectedZone !== 'ALL' || showZoneMenu
              ? 'bg-white text-black border-white'
              : 'bg-black text-white border-white hover:bg-white/10'
          }`}
        >
          <span className="truncate">
            {selectedZone === 'ALL' ? 'Ubicación' : currentZoneObj.shortLabel}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showZoneMenu ? 'rotate-180' : ''}`} />
        </button>

        <button
          type="button"
          onClick={() => {
            setShowCategoryMenu((prev) => !prev);
            setShowZoneMenu(false);
          }}
          className={`px-4 py-3 border text-[13px] font-black uppercase tracking-widest flex items-center justify-between gap-2 transition-colors ${
            selectedCategory !== 'ALL' || showCategoryMenu
              ? 'bg-white text-black border-white'
              : 'bg-black text-white border-white hover:bg-white/10'
          }`}
        >
          <span className="truncate">
            {selectedCategory === 'ALL' ? 'Temas' : selectedCategory}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryMenu ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showZoneMenu && (
        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/20">
          {zoneOptions.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedZone(tab.id);
                setShowZoneMenu(false);
              }}
              className={`p-3 text-[12px] font-black uppercase tracking-widest text-left border ${
                selectedZone === tab.id ? 'bg-white text-black border-white' : 'bg-black text-white border-white/40 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {showCategoryMenu && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/20">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setShowCategoryMenu(false);
            }}
            className={`px-3 py-2 text-[11px] font-black uppercase tracking-widest border ${
              selectedCategory === 'ALL' ? 'bg-white text-black border-white' : 'bg-black text-white border-white/40 hover:bg-white/5'
            }`}
          >
            Todos ({news.length})
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setShowCategoryMenu(false);
              }}
              className={`px-3 py-2 text-[11px] font-black uppercase tracking-widest border ${
                selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-black text-white border-white/40 hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div id="section-ultimas-noticias-huanuco" className="w-full px-2 py-4 sm:py-6 space-y-8 pb-28 font-serif">
      <header className="space-y-4 border-b border-white pb-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none">
            REGIÓN HUÁNUCO
          </h2>
          {onRefresh && (
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              className="p-2 border-2 border-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-[13px] font-black text-white uppercase tracking-widest">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-white rounded-full" />
            {updatedAt ? formatRelativeTime(updatedAt) : 'Actualizado hoy'}
          </span>
          <span>•</span>
          <span>{activeSourcesCount || sources.length} Medios Conectados</span>
        </div>
      </header>

      {renderCompactFiltersBar()}

      {isLoading && news.length === 0 ? (
        <div className="p-12 border-4 border-double border-white text-center space-y-4">
          <RefreshCw className="w-12 h-12 text-white mx-auto animate-spin" />
          <p className="text-xl font-black text-white uppercase tracking-widest">Sincronizando Medios Regionales...</p>
        </div>
      ) : displayedNews.length === 0 ? (
        <div className="p-12 border-4 border-double border-white text-center space-y-4">
          <p className="text-lg font-black text-white uppercase tracking-widest italic">No se encontraron noticias con estos criterios.</p>
        </div>
      ) : (
        <div className="space-y-12 sm:space-y-20">
          {displayedNews.map((item, index) => (
            <React.Fragment key={item.id}>
              {renderLargeNewsItem(item, index)}
            </React.Fragment>
          ))}
        </div>
      )}

      {filteredNews.length > visibleCount && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full py-4 border-4 border-double border-white bg-black hover:bg-white hover:text-black text-white text-xl font-black uppercase tracking-widest transition-all"
        >
          {expanded ? 'Ver menos noticias' : `Cargar más crónicas (${filteredNews.length - visibleCount})`}
        </button>
      )}
    </div>
  );
};
