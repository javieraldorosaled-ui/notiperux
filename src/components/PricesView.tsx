import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  X,
  Info,
  Star,
} from 'lucide-react';
import {
  PriceItem,
  PriceExplanation,
  PriceTrend,
  InternetPriceGroup,
  InternetPriceSourceStatus,
  InternetPriceObservation,
} from '../types';
import { formatRelativeTime } from '../services/firebase';

function formatLimaDateTime(iso: string | null | undefined): string {
  if (!iso) return 'Pendiente';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Pendiente';
  return d.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function getFreshnessIndicator(
  updatedAtIso: string | null | undefined,
  sources: InternetPriceSourceStatus[]
): {
  dot: string;
  label: string;
  ageText: string;
  toneClass: string;
} {
  // Usar dataAge y dataAgeMinutes ya calculados por el backend cuando estén disponibles
  const validSources = sources.filter(
    (s) => typeof s.dataAgeMinutes === 'number' && s.dataAgeMinutes !== null
  );
  let minutes: number | null = null;
  let ageText = '';

  if (validSources.length > 0) {
    minutes = Math.min(...validSources.map((s) => s.dataAgeMinutes as number));
    const freshest = validSources.find((s) => s.dataAgeMinutes === minutes) || validSources[0];
    ageText = freshest.dataAge || '';
  } else if (updatedAtIso) {
    const parsed = Date.parse(updatedAtIso);
    if (!isNaN(parsed)) {
      minutes = Math.max(0, Math.round((Date.now() - parsed) / 60000));
      ageText = formatRelativeTime(updatedAtIso);
    }
  }

  if (minutes === null) {
    return {
      dot: '⚪',
      label: 'Pendiente de actualización',
      ageText: '',
      toneClass: 'text-[#23361F] bg-[#E6F1DE] border-[#BAD0B5]',
    };
  }

  if (minutes <= 240) {
    return {
      dot: '🟢',
      label: 'Actualizado recientemente',
      ageText,
      toneClass: 'text-[#165338] bg-[#D8EACF] border-[#BAD0B5]',
    };
  }

  if (minutes <= 720) {
    return {
      dot: '🟡',
      label: 'Actualizado hace varias horas',
      ageText,
      toneClass: 'text-[#102610] bg-[#FDEDD4] border-[#BAD0B5]',
    };
  }

  return {
    dot: '🔴',
    label: 'Información antigua',
    ageText,
    toneClass: 'text-[#BF1C10] bg-[#FDD9C5] border-[#BF1C10]/30',
  };
}

function renderObservationHistoryLabel(obs: InternetPriceObservation): string {
  if (obs.previousPrice === null) {
    return obs.changeLabel || 'Primera lectura registrada';
  }
  if (obs.trend === 'down' && obs.changeAmount < 0) {
    return `↓ Bajó S/ ${Math.abs(obs.changeAmount).toFixed(2)} (${obs.changeLabel})`;
  }
  if (obs.trend === 'up' && obs.changeAmount > 0) {
    return `↑ Subió S/ ${Math.abs(obs.changeAmount).toFixed(2)} (${obs.changeLabel})`;
  }
  return '→ Sin cambio';
}

const ONLINE_GROUP_DISPLAY_ORDER: string[] = [
  'pollo_entero_1_kg',
  'huevo_pardo_15_un',
  'huevo_pardo_30_un',
  'arroz_extra_5_kg',
  'arroz_extra_750_g',
  'aceite_vegetal_900_ml',
  'azucar_rubia_1_kg',
  'fideos_spaguetti_950_g',
  'atun_filete_140_g',
  'lenteja_400_g',
  'papa_amarilla_1_kg',
  'cebolla_roja_1_kg',
  'tomate_1_kg',
  'limon_sutil_1_kg',
  'zanahoria_1_kg',
  'platano_seda_1_kg',
  'tilapia_1_kg',
  'cemento_portland_42_5_kg',
  'fierro_corrugado_1_2_9m',
  'ladrillo_king_kong_un',
  'pintura_latex_1_gal',
  'wincha_5_m',
];

function isHuanucoObservation(obs: InternetPriceObservation): boolean {
  return (
    obs.geographicScope === 'HUANUCO' ||
    obs.scope === 'HUANUCO' ||
    obs.isLocalHuanuco === true ||
    obs.sellerId === 'metroios066mio' ||
    obs.sellerId === 'promart_sc8_huanuco'
  );
}

interface PricesViewProps {
  prices: PriceItem[];
  searchQuery: string;
  onSearchChange?: (q: string) => void;
  initialTrendFilter?: PriceTrend | 'all';
  favorites?: string[];
  onToggleFavorite?: (productId: string) => void;
  onSelectExplanation: (exp: PriceExplanation) => void;
  onSelectProduct: (product: PriceItem) => void;
  explanations: PriceExplanation[];
  onOpenReport: () => void;
}

export const PricesView: React.FC<PricesViewProps> = ({
  prices,
  searchQuery,
  onSearchChange,
  initialTrendFilter = 'all',
  favorites = [],
  onToggleFavorite,
  onSelectExplanation,
  onSelectProduct,
  explanations,
  onOpenReport,
}) => {
  const [trendFilter, setTrendFilter] = useState<PriceTrend | 'all'>(initialTrendFilter);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  const categoriesScrollRef = useRef<HTMLDivElement | null>(null);

  const handleScrollCategories = (direction: 'left' | 'right') => {
    const el = categoriesScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === 'left' ? -160 : 160,
      behavior: 'smooth',
    });
  };

  // Sincronizar si cambia searchQuery desde el estado global
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  // Estado para el módulo independiente: Precios de Referencia en Internet
  const [internetGroups, setInternetGroups] = useState<InternetPriceGroup[]>([]);
  const [internetSources, setInternetSources] = useState<InternetPriceSourceStatus[]>([]);
  const [internetUpdatedAt, setInternetUpdatedAt] = useState<string | null>(null);
  const [isLoadingInternet, setIsLoadingInternet] = useState<boolean>(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const loadInternetPrices = async () => {
    setIsLoadingInternet(true);
    try {
      const res = await fetch('/api/internet-prices');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.items)) {
          setInternetGroups(data.items);
        }
        if (Array.isArray(data?.sources)) {
          setInternetSources(data.sources);
        }
        if (data?.updatedAt) {
          setInternetUpdatedAt(data.updatedAt);
        }
      }
    } catch (err) {
      console.warn('Error al cargar precios de referencia en Internet:', err);
    } finally {
      setIsLoadingInternet(false);
    }
  };

  useEffect(() => {
    loadInternetPrices();
  }, []);

  const handleManualSyncInternet = async () => {
    setIsLoadingInternet(true);
    setSyncNotice(null);
    try {
      const res = await fetch('/api/internal/sync-internet-prices', { method: 'POST' });
      const data = await res.json();
      if (Array.isArray(data?.items)) {
        setInternetGroups(data.items);
      }
      if (Array.isArray(data?.sources)) {
        setInternetSources(data.sources);
      }
      if (data?.syncedAt) {
        setInternetUpdatedAt(data.syncedAt);
      }
      if (data?.message) {
        setSyncNotice(data.message);
      }
    } catch {
      setSyncNotice('No se pudo conectar con el servicio de sincronización.');
    } finally {
      setIsLoadingInternet(false);
    }
  };

  const toggleGroupExpand = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const effectiveQuery = localSearch.trim().toLowerCase();

  const filteredInternetGroups = internetGroups
    .filter((g) => {
      if (categoryFilter !== 'all' && g.category !== categoryFilter) {
        return false;
      }
      if (effectiveQuery) {
        const matchBase = g.productBaseName.toLowerCase().includes(effectiveQuery);
        const matchPres = g.presentationLabel.toLowerCase().includes(effectiveQuery);
        const matchObs = g.observations.some(
          (o) =>
            o.productName.toLowerCase().includes(effectiveQuery) ||
            o.storeName.toLowerCase().includes(effectiveQuery) ||
            (o.locationBadge && o.locationBadge.toLowerCase().includes(effectiveQuery))
        );
        if (!matchBase && !matchPres && !matchObs) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aHasHuanuco =
        Boolean(a.hasHuanucoPrice) || a.observations.some((o) => isHuanucoObservation(o) && !o.isExpired);
      const bHasHuanuco =
        Boolean(b.hasHuanucoPrice) || b.observations.some((o) => isHuanucoObservation(o) && !o.isExpired);
      if (aHasHuanuco !== bHasHuanuco) {
        return aHasHuanuco ? -1 : 1;
      }
      const idxA = ONLINE_GROUP_DISPLAY_ORDER.indexOf(a.comparisonGroupKey);
      const idxB = ONLINE_GROUP_DISPLAY_ORDER.indexOf(b.comparisonGroupKey);
      const rankA = idxA === -1 ? 999 : idxA;
      const rankB = idxB === -1 ? 999 : idxB;
      return rankA - rankB;
    });

  const huanucoGroupsCount = filteredInternetGroups.filter(
    (g) => Boolean(g.hasHuanucoPrice) || g.observations.some((o) => isHuanucoObservation(o) && !o.isExpired)
  ).length;

  useEffect(() => {
    setTrendFilter(initialTrendFilter);
  }, [initialTrendFilter]);

  const isRealUpVariation = (p: PriceItem) =>
    p.currentPrice !== null &&
    p.previousPrice !== null &&
    p.previousPrice > 0 &&
    p.currentPrice > p.previousPrice &&
    Math.abs(p.currentPrice - p.previousPrice) > 0.005 &&
    p.changePercentage !== 0 &&
    p.trend === 'up';

  const isRealDownVariation = (p: PriceItem) =>
    p.currentPrice !== null &&
    p.previousPrice !== null &&
    p.previousPrice > 0 &&
    p.currentPrice < p.previousPrice &&
    Math.abs(p.currentPrice - p.previousPrice) > 0.005 &&
    p.changePercentage !== 0 &&
    p.trend === 'down';

  const upCount = prices.filter(isRealUpVariation).length;
  const downCount = prices.filter(isRealDownVariation).length;

  const filteredPrices = prices.filter((item) => {
    if (effectiveQuery) {
      const matchName = item.name.toLowerCase().includes(effectiveQuery);
      const matchBrand = (item.brand || '').toLowerCase().includes(effectiveQuery);
      const matchPres = (item.verifiedPresentation || '').toLowerCase().includes(effectiveQuery);
      const matchMarket = item.storeOrMarket.toLowerCase().includes(effectiveQuery);
      const matchDistrict = item.district.toLowerCase().includes(effectiveQuery);
      if (!matchName && !matchBrand && !matchPres && !matchMarket && !matchDistrict) return false;
    }

    if (trendFilter === 'up' && !isRealUpVariation(item)) {
      return false;
    }
    if (trendFilter === 'down' && !isRealDownVariation(item)) {
      return false;
    }

    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

    return true;
  });

  const renderVerificationBadge = (item: PriceItem) => {
    if (item.currentPrice !== null && item.verificationStatus === 'VERIFICADO') {
      return (
        <span className="text-[14px] sm:text-[15px] font-semibold text-[#165338] bg-[#D8EACF] px-2.5 py-1 rounded-lg border border-[#BAD0B5] inline-flex items-center gap-1.5 leading-snug">
          <span>🟢</span>
          <span>Precio verificado</span>
        </span>
      );
    }

    if (item.currentPrice !== null && item.verificationStatus === 'REPORTADO') {
      return (
        <span className="text-[14px] sm:text-[15px] font-semibold text-[#1E40AF] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-flex items-center gap-1.5 leading-snug">
          <span>🔵</span>
          <span>Precio reportado</span>
        </span>
      );
    }

    if (
      item.currentPrice !== null &&
      (item.verificationStatus === 'REFERENCIAL' || item.trustLevel === 'referential')
    ) {
      return (
        <span className="text-[14px] sm:text-[15px] font-semibold text-[#23361F] bg-[#E6F1DE] px-2.5 py-1 rounded-lg border border-[#BAD0B5] inline-flex items-center gap-1.5 leading-snug">
          <span>⚪</span>
          <span>Precio online de referencia</span>
        </span>
      );
    }

    return (
      <span className="text-[14px] sm:text-[15px] font-semibold text-[#23361F] bg-[#F1E5D3] px-2.5 py-1 rounded-lg border border-[#BAD0B5] inline-flex items-center gap-1.5 leading-snug">
        <span className="w-2 h-2 rounded-full bg-[#23361F] shrink-0" />
        <span>Pendiente de fuente verificable</span>
      </span>
    );
  };

  const globalFreshness = getFreshnessIndicator(internetUpdatedAt, internetSources);

  return (
    <div className="bg-[#F2F8ED] rounded-3xl space-y-4 pb-12 text-[#102610]">
      {/* =====================================================================
          1. ENCABEZADO + 2. BUSCADOR PRINCIPAL + 3. CATEGORÍAS
      ===================================================================== */}
      <div className="space-y-3.5 pt-0.5">
        {/* 1. ENCABEZADO */}
        <div className="space-y-1">
          <h2 className="text-[25px] sm:text-[27px] font-bold tracking-tight text-[#102610] leading-tight uppercase">
            PRECIOS EN HUÁNUCO
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#33472F] leading-snug">
            Consulta y compara precios reales de productos en Huánuco.
          </p>
        </div>

        {/* 2. CATEGORÍAS (con pequeños botones laterales izquierdo y derecho) */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleScrollCategories('left')}
            aria-label="Desplazar categorías a la izquierda"
            title="Desplazar a la izquierda"
            className="w-8 h-9 rounded-xl bg-gradient-to-b from-[#FFFFFF] to-[#E9F3E4] hover:from-[#F4F9F1] hover:to-[#DDEFD7] text-[#165338] border border-[#8FB686] border-b-[2.5px] border-b-[#6F9865] flex items-center justify-center shrink-0 transition-all shadow-[0_1.5px_2px_rgba(16,38,16,0.10)] active:translate-y-[1px] active:border-b-[1px]"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div
            ref={categoriesScrollRef}
            className="flex-1 flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth"
          >
            {[
              { id: 'all', label: 'Todo' },
              { id: 'abarrotes', label: '🥫 Alimentos y abarrotes' },
              { id: 'alimentos', label: '🥩 Carnes y alimentos frescos' },
              { id: 'construccion', label: '🧱 Construcción' },
              { id: 'hogar', label: '🎨 Hogar y mantenimiento' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl text-[14px] sm:text-[15px] whitespace-nowrap transition-all border select-none ${
                  categoryFilter === cat.id
                    ? 'font-bold bg-gradient-to-b from-[#1b6243] to-[#12452e] text-white border-[#0d3623] border-b-[3px] border-b-[#072418] shadow-[0_2px_3px_rgba(16,38,16,0.20)] active:translate-y-[1px] active:border-b-[1px]'
                    : 'font-semibold bg-gradient-to-b from-[#FFFFFF] to-[#EAF2E4] text-[#102610] border-[#8FB686] border-b-[2.5px] border-b-[#6F9865] hover:from-[#F4FAF0] hover:to-[#DDEFD7] shadow-[0_1.5px_2px_rgba(16,38,16,0.08)] active:translate-y-[1px] active:border-b-[1px]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => handleScrollCategories('right')}
            aria-label="Desplazar categorías a la derecha"
            title="Desplazar a la derecha"
            className="w-8 h-9 rounded-xl bg-gradient-to-b from-[#FFFFFF] to-[#E9F3E4] hover:from-[#F4F9F1] hover:to-[#DDEFD7] text-[#165338] border border-[#8FB686] border-b-[2.5px] border-b-[#6F9865] flex items-center justify-center shrink-0 transition-all shadow-[0_1.5px_2px_rgba(16,38,16,0.10)] active:translate-y-[1px] active:border-b-[1px]"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          4. LISTA DE PRECIOS YA IMPLEMENTADA (PRIORIDAD INMEDIATA)
      ===================================================================== */}
      <section className="space-y-4">
        {/* Lista de tarjetas de productos ciudadanos */}
        <div className="space-y-3.5">
          {filteredPrices.length === 0 ? (
            <div className="bg-[#E6F1DE] rounded-3xl p-6 text-center border border-[#BAD0B5] text-[#23361F] space-y-2">
              <p className="text-[17px] font-bold text-[#102610]">
                {trendFilter === 'up' || trendFilter === 'down'
                  ? 'Sin variaciones registradas en Huánuco'
                  : 'No se encontraron productos locales'}
              </p>
              <p className="text-[15px]">
                {trendFilter === 'up' || trendFilter === 'down'
                  ? 'Aún no existen variaciones comparables registradas para este filtro.'
                  : 'Prueba cambiando el texto de búsqueda o reporta un precio visto hoy.'}
              </p>
            </div>
          ) : (
            filteredPrices.map((item) => {
              const hasRealVariation =
                item.currentPrice !== null &&
                item.previousPrice !== null &&
                item.previousPrice > 0 &&
                item.changePercentage !== 0;
              const isUp = item.trend === 'up';
              const isFavorite = favorites.includes(item.id);
              const exp = explanations.find((e) => e.id === item.explanationId);

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectProduct(item)}
                  className="product-card-shell bg-[#FDEDD4] rounded-3xl p-4 sm:p-5 border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.02)] hover:border-[#165338]/50 transition-colors space-y-3.5 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="text-2xl shrink-0 p-2.5 rounded-2xl bg-[#FDF0D4] border border-[#BAD0B5]">
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[18px] sm:text-[20px] font-bold text-[#102610] leading-snug">
                          {item.name}
                        </h4>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          {item.brand && (
                            <span className="inline-flex items-center gap-1 text-[13px] sm:text-[14px] font-bold text-[#102610] bg-[#FDF0D4] px-2 py-0.5 rounded-lg border border-[#8FB686] leading-snug">
                              🏷️ Marca: {item.brand}
                            </span>
                          )}
                          {renderVerificationBadge(item)}
                        </div>
                        {item.verifiedPresentation && (
                          <p className="text-[13px] sm:text-[14px] font-semibold text-[#165338] mt-1 leading-snug">
                            Producto verificado: {item.verifiedPresentation}
                          </p>
                        )}
                        <p className="text-[14px] sm:text-[15px] font-medium text-[#23361F] flex items-center gap-1.5 mt-1.5 flex-wrap leading-snug">
                          <Store className="w-3.5 h-3.5 text-[#165338] shrink-0" />
                          <span>{item.storeOrMarket}</span>
                          <span className="text-[#23361F]">·</span>
                          <span>{item.district}</span>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {onToggleFavorite && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(item.id);
                          }}
                          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          className={`w-[36px] h-[36px] min-w-[36px] min-h-[36px] p-1.5 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 ${
                            isFavorite
                              ? 'bg-[#D8EACF] text-[#165338] border-[#165338]/40 shadow-2xs'
                              : 'bg-[#F2F8ED] text-[#23361F] border-[#BAD0B5] hover:border-[#165338]/50 hover:text-[#165338]'
                          }`}
                        >
                          <Star
                            className={`w-4.5 h-4.5 ${isFavorite ? 'fill-[#165338] text-[#165338]' : ''}`}
                          />
                        </button>
                      )}

                      {hasRealVariation && (
                        <div className="text-right tabular-nums">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[15px] sm:text-[16px] font-bold leading-none ${
                              isUp
                                ? 'bg-[#FDD9C5] text-[#BF1C10] border border-[#BF1C10]/30'
                                : 'bg-[#D8EACF] text-[#165338] border border-[#BAD0B5]'
                            }`}
                          >
                            {isUp ? (
                              <ArrowUpRight className="w-4 h-4 shrink-0 stroke-[2.4px]" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 shrink-0 stroke-[2.4px]" />
                            )}
                            <span>
                              {isUp ? `+${item.changePercentage}%` : `${item.changePercentage}%`}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Precio actual o estado pendiente */}
                  <div className="pt-2.5 border-t border-[#BAD0B5] flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2 tabular-nums">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {item.currentPrice !== null ? (
                        <>
                          {item.previousPrice !== null && item.previousPrice > 0 && (
                            <>
                              <span className="text-[#23361F] bg-[#F1E5D3] px-2 py-0.5 rounded-lg text-[14px] sm:text-[15px] font-medium whitespace-nowrap">
                                Antes:{' '}
                                <span className="line-through">
                                  S/ {item.previousPrice.toFixed(2)}
                                </span>
                              </span>
                              <span className="text-[14px] font-bold text-[#23361F]">→</span>
                            </>
                          )}
                          <span
                            className={`font-black text-[24px] sm:text-[28px] leading-none tracking-tight whitespace-nowrap ${
                              hasRealVariation && isUp ? 'text-[#BF1C10]' : 'text-[#165338]'
                            }`}
                          >
                            S/ {item.currentPrice.toFixed(2)}
                          </span>
                          <span className="text-[15px] sm:text-[16px] font-semibold text-[#23361F]">
                            /{item.unit}
                          </span>
                        </>
                      ) : (
                        <span className="text-[16px] font-medium text-[#23361F]">
                          Sin precio reportado hoy en Huánuco · Pulsa para reportar
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[16px] font-medium text-[#23361F] shrink-0">
                      <Clock className="w-4 h-4 text-[#165338] shrink-0" />
                      <span>
                        {item.currentPrice !== null && item.updatedAt
                          ? formatRelativeTime(item.updatedAt)
                          : 'Pendiente'}
                      </span>
                    </div>
                  </div>

                  {/* Acciones secundarias de tarjeta local */}
                  <div className="pt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                    <span className="text-[16px] sm:text-[17px] text-[#165338] font-bold leading-snug">
                      {item.storePrices && item.storePrices.length > 0
                        ? `Ver precios en ${item.storePrices.length} ${
                            item.storePrices.length === 1 ? 'puesto local' : 'puestos locales'
                          } →`
                        : 'Ver detalle o compartir precio en Huánuco →'}
                    </span>

                    {exp && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectExplanation(exp);
                        }}
                        className="text-[16px] sm:text-[17px] font-semibold text-[#23361F] hover:text-[#165338] underline shrink-0"
                      >
                        Factores de precio
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 5. BLOQUE COMPACTO SECUNDARIO: PRECIOS REPORTADOS EN HUÁNUCO */}
        <div className="bg-[#E6F1DE] rounded-2xl p-3.5 sm:p-4 border border-[#A8C69F] shadow-[0_1px_4px_rgba(16,38,16,0.03)] space-y-2.5">
          <div className="flex items-center justify-between gap-2.5 flex-wrap">
            <div className="min-w-[180px] flex-1">
              <h3 className="text-[15px] sm:text-[16px] font-bold text-[#102610] uppercase tracking-tight leading-snug">
                PRECIOS REPORTADOS EN HUÁNUCO
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#33472F] leading-snug mt-0.5">
                Precios locales compartidos por ciudadanos en mercados y comercios de Huánuco.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenReport}
              className="min-h-[38px] px-3.5 py-1.5 bg-[#165338] hover:bg-[#103E29] text-white text-[14px] font-semibold rounded-xl transition-colors shrink-0 shadow-2xs inline-flex items-center justify-center"
            >
              + Reportar precio
            </button>
          </div>

          {/* FILTROS COMPACTOS: Todos / Subió / Bajó */}
          <div className="grid grid-cols-3 w-full items-center gap-1.5 p-1 bg-[#F7FBF4] rounded-xl border border-[#A8C69F]">
            <button
              type="button"
              onClick={() => setTrendFilter('all')}
              className={`min-h-[38px] px-2 py-1.5 text-[14px] font-semibold rounded-lg transition-all whitespace-nowrap text-center justify-center inline-flex items-center ${
                trendFilter === 'all'
                  ? 'bg-[#165338] text-white shadow-xs'
                  : 'text-[#23361F] hover:bg-[#E6F1DE] hover:text-[#102610]'
              }`}
            >
              Todos ({prices.length})
            </button>
            <button
              type="button"
              onClick={() => setTrendFilter('up')}
              className={`min-h-[38px] px-2 py-1.5 text-[14px] font-semibold rounded-lg transition-all inline-flex items-center justify-center gap-1 whitespace-nowrap ${
                upCount > 0
                  ? trendFilter === 'up'
                    ? 'bg-[#BF1C10] text-white shadow-xs'
                    : 'text-[#BF1C10] bg-[#FDD9C5] hover:bg-[#FDD9C5]/80'
                  : trendFilter === 'up'
                  ? 'bg-[#165338] text-white shadow-xs'
                  : 'text-[#23361F] hover:bg-[#E6F1DE] hover:text-[#102610]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Subió ({upCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setTrendFilter('down')}
              className={`min-h-[38px] px-2 py-1.5 text-[14px] font-semibold rounded-lg transition-all inline-flex items-center justify-center gap-1 whitespace-nowrap ${
                downCount > 0
                  ? trendFilter === 'down'
                    ? 'bg-[#165338] text-white shadow-xs'
                    : 'text-[#165338] bg-[#D8EACF] hover:bg-[#C8DCC3]'
                  : trendFilter === 'down'
                  ? 'bg-[#165338] text-white shadow-xs'
                  : 'text-[#23361F] hover:bg-[#E6F1DE] hover:text-[#102610]'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              <span>Bajó ({downCount})</span>
            </button>
          </div>
          {upCount === 0 && downCount === 0 && trendFilter === 'all' && (
            <p className="text-[13px] font-medium text-[#33472F] text-center">
              Sin variaciones registradas en Huánuco
            </p>
          )}
        </div>
      </section>

      {/* Divisor claro entre ambos sistemas */}
      <div className="py-1">
        <div className="h-px bg-[#BAD0B5]" />
      </div>

      {/* =====================================================================
          BLOQUE 2: REFERENCIAS ONLINE (PRIORIDAD SUCURSAL HUÁNUCO + SECUNDARIA LIMA/NACIONAL)
      ===================================================================== */}
      <section className="space-y-3.5">
        {/* Encabezado de Referencias Online */}
        <div className="bg-[#E6F1DE] rounded-3xl p-4 sm:p-5 border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.02)] space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[15px] sm:text-[16px] font-extrabold text-[#165338] uppercase tracking-wide">
                  🌐 SUPERMERCADOS Y REFERENCIAS ONLINE
                </h3>
                <span className="text-[13px] font-semibold text-[#165338] bg-[#D8EACF] px-2.5 py-0.5 rounded-md border border-[#BAD0B5]">
                  REFERENCIA ONLINE
                </span>
              </div>
              <p className="text-[15px] font-medium text-[#23361F] mt-1 leading-snug">
                Prioridad Sucursal Huánuco y referencia secundaria Lima/Nacional
              </p>
            </div>

            <button
              onClick={handleManualSyncInternet}
              disabled={isLoadingInternet}
              className="px-3 py-2 bg-[#F2F8ED] hover:bg-[#D8EACF] text-[#165338] text-[14px] font-bold rounded-xl border border-[#BAD0B5] inline-flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50"
              title="Consultar sincronización de precios online"
            >
              <RefreshCw
                className={`w-4 h-4 text-[#165338] ${isLoadingInternet ? 'animate-spin' : ''}`}
              />
              <span>Actualizar</span>
            </button>
          </div>

          <div className="text-[15px] text-[#23361F] leading-relaxed bg-[#F2F8ED] p-3.5 rounded-2xl border border-[#BAD0B5] space-y-1.5">
            <p className="font-bold text-[#165338]">
              📍 Prioridad Huánuco ({huanucoGroupsCount}/{filteredInternetGroups.length} productos con stock local):
            </p>
            <p>
              Cuando un producto tiene stock verificado en <strong className="text-[#102610]">Metro Huánuco (Jr. San Martín · Sucursal S066)</strong> o <strong className="text-[#102610]">Promart Huánuco (Real Plaza · Jr. Independencia 1601)</strong>, su precio local verificado se muestra primero. Los catálogos de Lima/Nacional (Plaza Vea, Wong y Vega) se muestran debajo únicamente como <strong className="text-[#102610]">Precio online de referencia</strong>.
            </p>
          </div>

          {/* Indicador visual de antigüedad de datos y estado de fuentes */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-[15px]">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-semibold border ${globalFreshness.toneClass}`}
            >
              <span>{globalFreshness.dot}</span>
              <span>{globalFreshness.label}</span>
              {globalFreshness.ageText && (
                <span className="font-medium">· {globalFreshness.ageText}</span>
              )}
            </span>

            {internetUpdatedAt && (
              <span className="text-[15px] font-medium text-[#23361F] tabular-nums">
                Actualizado: {formatLimaDateTime(internetUpdatedAt)}
              </span>
            )}
          </div>

          {syncNotice && (
            <p className="text-[15px] text-[#165338] font-medium bg-[#D8EACF] px-3 py-2 rounded-xl border border-[#BAD0B5]">
              {syncNotice}
            </p>
          )}
        </div>

        {/* Tarjetas de los 11 productos de Referencia Online */}
        {isLoadingInternet && internetGroups.length === 0 ? (
          <div className="bg-[#E6F1DE] rounded-3xl p-6 text-center border border-[#BAD0B5] text-[16px] font-medium text-[#23361F]">
            Consultando catálogos online de supermercados...
          </div>
        ) : filteredInternetGroups.length === 0 ? (
          <div className="bg-[#E6F1DE] rounded-3xl p-6 text-center border border-[#BAD0B5] text-[16px] font-medium text-[#23361F]">
            No se encontraron referencias online para la búsqueda actual.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredInternetGroups.map((group) => {
              const isExpanded = !!expandedGroups[group.comparisonGroupKey];
              const groupFreshness = getFreshnessIndicator(group.updatedAt, []);

              // Ordenar observaciones: HUANUCO primero, luego LIMA_NACIONAL
              const sortedObs = [...group.observations].sort((a, b) => {
                if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1;
                const aHco = isHuanucoObservation(a);
                const bHco = isHuanucoObservation(b);
                if (aHco !== bHco) return aHco ? -1 : 1;
                return a.price - b.price;
              });

              const huanucoObs = sortedObs.filter(
                (o) => isHuanucoObservation(o) && !o.isExpired && o.availability === 'IN_STOCK'
              );
              const primaryHuanucoObs = huanucoObs.length > 0 ? huanucoObs[0] : null;

              const nationalValidObs = sortedObs.filter(
                (o) => !isHuanucoObservation(o) && !o.isExpired && o.availability === 'IN_STOCK' && o.price > 0
              );

              const natPrices = nationalValidObs.map((o) => o.price).sort((a, b) => a - b);
              const natLowest =
                group.nationalLowestPrice ??
                (natPrices.length > 0 ? Number(natPrices[0].toFixed(2)) : group.lowestPrice);
              const natHighest =
                group.nationalHighestPrice ??
                (natPrices.length > 0
                  ? Number(natPrices[natPrices.length - 1].toFixed(2))
                  : group.highestPrice);
              const natAverage =
                group.nationalAveragePrice ??
                (natPrices.length > 0
                  ? Number(
                      (natPrices.reduce((acc, p) => acc + p, 0) / natPrices.length).toFixed(2)
                    )
                  : group.averagePrice);

              const hasNationalStats = natLowest !== null && natAverage !== null && natHighest !== null;

              return (
                <div
                  key={group.comparisonGroupKey}
                  className="product-card-shell bg-[#FDEDD4] rounded-3xl p-4 sm:p-5 border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.02)] space-y-4"
                >
                  {/* Cabecera del producto online */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="text-2xl p-2.5 rounded-2xl bg-[#FDF0D4] border border-[#BAD0B5] shrink-0">
                        {group.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-[20px] sm:text-[21px] font-bold text-[#102610] uppercase tracking-tight leading-snug">
                            {group.productBaseName} · {group.presentationLabel}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-2 text-[15px] sm:text-[16px] text-[#23361F] font-medium">
                          {primaryHuanucoObs ? (
                            <span className="font-semibold text-[#165338] bg-[#D8EACF] px-2.5 py-0.5 rounded-lg border border-[#BAD0B5] text-[15px] sm:text-[16px]">
                              📍 DISPONIBLE EN HUÁNUCO
                            </span>
                          ) : (
                            <span className="font-semibold text-[#23361F] bg-[#F1E5D3] px-2.5 py-0.5 rounded-lg border border-[#BAD0B5] text-[15px] sm:text-[16px]">
                              🌐 SOLO REFERENCIA LIMA/NACIONAL
                            </span>
                          )}
                          <span>·</span>
                          <span>
                            {group.sourcesCount}{' '}
                            {group.sourcesCount === 1 ? 'tienda consultada' : 'tiendas consultadas'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PRIORIDAD 1: PRECIO VERIFICADO EN SUCURSAL HUÁNUCO (Metro Huánuco S066) */}
                  {primaryHuanucoObs ? (
                    <div className="rounded-2xl bg-[#FDF0D4] border-2 border-[#165338]/35 p-4 space-y-3 tabular-nums shadow-2xs">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 basis-[180px]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[15px] sm:text-[16px] font-semibold text-white bg-[#165338] px-2.5 py-0.5 rounded-lg uppercase tracking-wide">
                              📍 PRECIO EN HUÁNUCO
                            </span>
                            {primaryHuanucoObs.brand && (
                              <span className="inline-flex items-center gap-1 text-[14px] sm:text-[15px] font-bold text-[#102610] bg-[#D8EACF] px-2.5 py-0.5 rounded-lg border border-[#8FB686]">
                                🏷️ Marca: {primaryHuanucoObs.brand.toUpperCase() === 'MAXIMA' ? 'Máxima' : primaryHuanucoObs.brand}
                              </span>
                            )}
                          </div>
                          <span className="text-[16px] sm:text-[17px] font-bold text-[#102610] block mt-2 leading-snug">
                            {primaryHuanucoObs.source === 'promart'
                              ? 'Promart Huánuco · Real Plaza (Jr. Independencia 1601)'
                              : 'Metro Huánuco · Jr. San Martín (Sucursal S066)'}
                          </span>
                          <p className="text-[16px] text-[#23361F] font-semibold mt-1 leading-snug">
                            {primaryHuanucoObs.productName} ({primaryHuanucoObs.brand.toUpperCase() === 'MAXIMA' ? 'Máxima' : primaryHuanucoObs.brand})
                          </p>
                          <p className="text-[15px] sm:text-[16px] text-[#23361F] mt-1 leading-snug">
                            Unidad: <strong className="text-[#102610]">{primaryHuanucoObs.presentation}</strong> · Equivalente:{' '}
                            <strong className="text-[#102610]">{primaryHuanucoObs.normalizedUnitLabel}</strong>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[28px] sm:text-[30px] font-extrabold text-[#165338] leading-none tracking-tight block">
                            S/ {primaryHuanucoObs.price.toFixed(2)}
                          </span>
                          {primaryHuanucoObs.price < primaryHuanucoObs.listPrice && (
                            <span className="text-[16px] sm:text-[17px] font-medium text-[#23361F] bg-[#F1E5D3] px-2 py-0.5 rounded-lg inline-block mt-1.5">
                              Antes{' '}
                              <span className="line-through">
                                S/ {primaryHuanucoObs.listPrice.toFixed(2)}
                              </span>
                            </span>
                          )}
                          <span className="text-[15px] sm:text-[16px] font-bold text-[#165338] block mt-1">
                            {primaryHuanucoObs.normalizedUnitLabel}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-[#BAD0B5] flex items-center justify-between gap-2 flex-wrap text-[16px]">
                        <span className="font-bold text-[#165338]">
                          ● Disponible en Huánuco · Stock verificado ({primaryHuanucoObs.availableQuantity} disp.)
                        </span>
                        <a
                          href={primaryHuanucoObs.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#165338] text-white font-bold hover:bg-[#102610] inline-flex items-center gap-1.5 text-[15px] sm:text-[16px] transition-colors"
                        >
                          <span>Ver en tienda</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-[#F1E5D3] border border-[#BAD0B5] px-4 py-3 text-[16px] text-[#23361F] space-y-1">
                      <span className="font-bold text-[#102610] block leading-snug">
                        ⚪ Precio online de referencia · Sin stock local confirmado hoy en sucursal Huánuco
                      </span>
                      <span className="text-[15px] text-[#23361F] block leading-snug">
                        Los precios inferiores corresponden a catálogos online nacionales y se muestran como referencia (no verificados en tienda física de Huánuco).
                      </span>
                    </div>
                  )}

                  {/* REFERENCIA SECUNDARIA: CATÁLOGOS LIMA/NACIONAL (SUBORDINADA VISUALMENTE) */}
                  {hasNationalStats ? (
                    <div className="rounded-2xl bg-[#F1E5D3] border border-[#BAD0B5] p-3.5 space-y-2.5 tabular-nums">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[14px] font-bold text-[#23361F] uppercase tracking-wide">
                          🌐 REFERENCIA ONLINE LIMA/NACIONAL
                        </span>
                        <span className="text-[14px] font-medium text-[#23361F]">
                          {nationalValidObs.length}{' '}
                          {nationalValidObs.length === 1 ? 'catálogo nacional' : 'catálogos nacionales'} (Secundario)
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="text-center">
                          <span className="text-[13px] font-semibold text-[#23361F] uppercase tracking-tight block">
                            Ref. Lima/Nac. Mín.
                          </span>
                          <span className="text-[16px] font-bold text-[#165338] mt-0.5 block">
                            S/ {natLowest!.toFixed(2)}
                          </span>
                        </div>

                        <div className="border-x border-[#BAD0B5] px-2 text-center">
                          <span className="text-[13px] font-semibold text-[#23361F] uppercase tracking-tight block">
                            Ref. Lima/Nac. Prom.
                          </span>
                          <span className="text-[16px] font-bold text-[#102610] mt-0.5 block">
                            S/ {natAverage!.toFixed(2)}
                          </span>
                        </div>

                        <div className="text-center">
                          <span className="text-[13px] font-semibold text-[#23361F] uppercase tracking-tight block">
                            Ref. Lima/Nac. Máx.
                          </span>
                          <span className="text-[16px] font-bold text-[#23361F] mt-0.5 block">
                            S/ {natHighest!.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-[#F1E5D3] border border-[#BAD0B5] text-[15px] font-medium text-[#23361F] text-center">
                      Sin observaciones en stock disponibles en este momento
                    </div>
                  )}

                  {/* Precio equivalente + Indicador de actualización */}
                  <div className="flex items-center justify-between gap-2.5 flex-wrap text-[16px] tabular-nums">
                    <div>
                      <span className="text-[15px] font-medium text-[#23361F] block">
                        {primaryHuanucoObs
                          ? `🟢 Precio equivalente verificado en Huánuco (${
                              primaryHuanucoObs.source === 'promart' ? 'Promart Real Plaza' : 'Metro S066'
                            })`
                          : '⚪ Precio equivalente (Precio online de referencia)'}
                      </span>
                      {primaryHuanucoObs ? (
                        <strong className="text-[17px] font-extrabold text-[#165338]">
                          {primaryHuanucoObs.normalizedUnitLabel}
                        </strong>
                      ) : group.lowestNormalizedUnitPrice !== null ? (
                        <strong className="text-[16px] font-bold text-[#23361F]">
                          S/ {group.lowestNormalizedUnitPrice.toFixed(2)} /{' '}
                          {group.normalizedUnitName} (Ref. Lima/Nacional)
                        </strong>
                      ) : (
                        <span className="text-[15px] text-[#23361F]">No disponible</span>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="inline-flex items-center gap-1.5 text-[16px] font-semibold text-[#23361F]">
                        <span>{groupFreshness.dot}</span>
                        <span>{groupFreshness.label}</span>
                      </span>
                      <span className="block text-[16px] font-medium text-[#23361F] mt-0.5">
                        Actualizado: {formatLimaDateTime(group.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Botón [ Ver tiendas ] */}
                  <button
                    type="button"
                    onClick={() => toggleGroupExpand(group.comparisonGroupKey)}
                    className="w-full py-3 px-4 rounded-2xl bg-[#FDF0D4] hover:bg-[#D8EACF] text-[#165338] text-[16px] sm:text-[17px] font-bold border border-[#BAD0B5] flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>
                      {isExpanded
                        ? 'Ocultar tiendas'
                        : `Ver tiendas (${sortedObs.length})`}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Lista expandible de tiendas ordenada con HUÁNUCO primero */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-[#BAD0B5] space-y-3">
                      {sortedObs.map((obs) => {
                        const isOffer = obs.price < obs.listPrice || obs.isPromotional;
                        const inStock = obs.availability === 'IN_STOCK';
                        const isHco = isHuanucoObservation(obs);

                        return (
                          <div
                            key={obs.observationId}
                            className={`p-4 rounded-2xl border space-y-3 ${
                              obs.isExpired
                                ? 'bg-[#F1E5D3]/80 border-[#BAD0B5] opacity-75'
                                : isHco
                                ? 'bg-[#FDF0D4] border-2 border-[#165338]/35 shadow-2xs'
                                : 'bg-[#FDF0D4] border-[#BAD0B5]'
                            }`}
                          >
                            {/* Fila superior: Tienda, Alcance Geográfico, Oferta/Regular, Stock y Precio */}
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1 basis-[180px] space-y-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-[15px] sm:text-[16px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                                      isHco
                                        ? 'bg-[#165338] text-white border-[#165338]'
                                        : 'bg-[#F1E5D3] text-[#23361F] border-[#BAD0B5]'
                                    }`}
                                  >
                                    {isHco
                                      ? '🟢 PRECIO VERIFICADO EN HUÁNUCO'
                                      : '⚪ PRECIO ONLINE DE REFERENCIA'}
                                  </span>
                                  <span
                                    className={`text-[17px] sm:text-[18px] font-extrabold ${
                                      isHco ? 'text-[#165338]' : 'text-[#102610]'
                                    }`}
                                  >
                                    {isHco
                                      ? obs.source === 'promart'
                                        ? 'Promart Huánuco · Real Plaza'
                                        : 'Metro Huánuco · Jr. San Martín'
                                      : `${obs.storeName} Online`}
                                  </span>
                                  <span
                                    className={`text-[14px] font-bold px-2 py-0.5 rounded-md border ${
                                      isOffer
                                        ? 'bg-[#D8EACF] text-[#165338] border-[#BAD0B5]'
                                        : 'bg-[#F1E5D3] text-[#23361F] border-[#BAD0B5]'
                                    }`}
                                  >
                                    {isOffer ? 'OFERTA ONLINE' : 'PRECIO REGULAR'}
                                  </span>
                                  <span
                                    className={`text-[15px] font-semibold ${
                                      inStock ? 'text-[#165338]' : 'text-[#23361F]'
                                    }`}
                                  >
                                    {inStock
                                      ? isHco
                                        ? `● Disponible en Huánuco (Stock: ${obs.availableQuantity})`
                                        : '● En stock online (Lima/Nac.)'
                                      : '○ Agotado'}
                                  </span>
                                </div>

                                <p className="text-[16px] font-semibold text-[#102610] leading-snug">
                                  {obs.productName}
                                </p>
                                <p className="text-[15px] sm:text-[16px] text-[#23361F] tabular-nums leading-snug">
                                  Marca: {obs.brand} · Unidad: {obs.presentation} · Equivalente:{' '}
                                  <strong className="text-[#102610]">{obs.normalizedUnitLabel}</strong>
                                </p>
                              </div>

                              <div className="text-right shrink-0 tabular-nums">
                                <span
                                  className={`font-extrabold leading-none tracking-tight block ${
                                    isHco
                                      ? 'text-[28px] sm:text-[30px] text-[#165338]'
                                      : 'text-[24px] sm:text-[26px] text-[#102610]'
                                  }`}
                                >
                                  S/ {obs.price.toFixed(2)}
                                </span>
                                {isOffer && obs.listPrice > obs.price && (
                                  <span className="text-[16px] sm:text-[17px] font-medium text-[#23361F] bg-[#F1E5D3] px-2 py-0.5 rounded-lg inline-block mt-1.5">
                                    Antes{' '}
                                    <span className="line-through">
                                      S/ {obs.listPrice.toFixed(2)}
                                    </span>
                                  </span>
                                )}
                                <span className="text-[15px] font-medium text-[#23361F] block mt-1">
                                  {isHco ? 'Sucursal Huánuco' : 'Ref. Lima/Nacional'}
                                </span>
                              </div>
                            </div>

                            {/* Información de ubicación exacta (locationBadge y locationNote) */}
                            <div className="px-3.5 py-2.5 rounded-xl bg-[#F1E5D3] border border-[#BAD0B5] text-[15px] sm:text-[16px] text-[#23361F] space-y-1">
                              <div className="font-bold text-[#102610] flex items-center gap-1.5 flex-wrap leading-snug">
                                <span>
                                  {isHco
                                    ? obs.source === 'promart'
                                      ? '📍 Promart Huánuco · Real Plaza (Jr. Independencia 1601)'
                                      : '📍 Metro Huánuco · Jr. San Martín (Sucursal S066)'
                                    : obs.source === 'plazavea'
                                    ? '⚪ Precio online de referencia · Catálogo Nacional'
                                    : obs.source === 'wong' || obs.source === 'vega'
                                    ? '⚪ Precio online de referencia · Lima/Nacional'
                                    : '⚪ Precio online de referencia · Sin stock en sucursal Huánuco'}
                                </span>
                                {!isHco && obs.source === 'plazavea' && (
                                  <span className="text-[14px] font-bold text-[#23361F] bg-[#FDEDD4] px-2 py-0.5 rounded border border-[#BAD0B5]">
                                    Cadena con sede física en Huánuco
                                  </span>
                                )}
                              </div>
                              <div className="text-[15px] text-[#23361F] leading-snug">
                                {isHco
                                  ? obs.source === 'promart'
                                    ? 'Precio y stock verificados para retiro en la sede física Promart Huánuco (Jr. Independencia 1601 · C.C. Real Plaza Huánuco, canal regional sc=8).'
                                    : 'Precio y stock verificados para la sucursal Metro Huánuco (Jr. San Martín · Sucursal S066, seller: metroios066mio).'
                                  : obs.source === 'plazavea'
                                  ? 'El catálogo online de alimentos de Plaza Vea no tiene despacho ni retiro habilitado en Huánuco según la verificación VTEX realizada; se muestra como precio online de referencia.'
                                  : obs.source === 'wong'
                                  ? 'Precio online de referencia · Lima/Nacional. Wong no cuenta con supermercado físico en Huánuco.'
                                  : obs.source === 'vega'
                                  ? 'Precio online de referencia · Lima/Nacional. Vega no cuenta con tienda ni sede verificada en Huánuco.'
                                  : obs.locationNote}
                              </div>
                            </div>

                            {/* Historial de cambio, etiqueta de confianza y botón [ Ver en tienda ] */}
                            <div className="flex items-center justify-between gap-2.5 flex-wrap pt-1 text-[16px]">
                              <div className="space-y-1">
                                <span
                                  className={`text-[16px] sm:text-[17px] font-bold block tabular-nums ${
                                    obs.trend === 'up'
                                      ? 'text-[#BF1C10]'
                                      : obs.trend === 'down'
                                      ? 'text-[#165338]'
                                      : 'text-[#23361F]'
                                  }`}
                                >
                                  {renderObservationHistoryLabel(obs)}
                                </span>
                                <span className="text-[16px] font-medium text-[#23361F] block tabular-nums">
                                  {obs.trustLabel} · Consultado:{' '}
                                  {formatLimaDateTime(obs.retrievedAt)}
                                </span>
                              </div>

                              <a
                                href={obs.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2 rounded-xl bg-[#D8EACF] hover:bg-[#C8DCC3] text-[#165338] border border-[#BAD0B5] text-[16px] font-bold inline-flex items-center gap-1.5 transition-colors shrink-0"
                              >
                                <span>Ver en tienda</span>
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        );
                      })}

                      {/* Nota legal/informativa al pie del desglose */}
                      <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-[#F1E5D3] border border-[#BAD0B5] text-[15px] text-[#23361F] leading-snug">
                        <Info className="w-4.5 h-4.5 text-[#165338] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#102610] block">{group.trustLabel}</strong>
                          <span>
                            Los precios de Metro Huánuco (Sucursal S066 · Jr. San Martín) corresponden a disponibilidad regional verificada. Los precios de Plaza Vea, Wong y Vega corresponden a sus catálogos online Lima/Nacional y sirven únicamente como referencia secundaria.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
