import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Fuel,
  Store,
  Newspaper,
  Clock,
  ArrowRight,
  MapPin,
  ExternalLink,
  Star,
  Share2,
} from 'lucide-react';
import {
  PriceItem,
  FuelStation,
  OfferItem,
  PriceExplanation,
  ActiveTab,
  InternetPriceGroup,
  InternetPriceObservation,
  HuanucoNewsItem,
} from '../types';
import { formatRelativeTime } from '../services/firebase';

function isHuanucoObs(obs: InternetPriceObservation): boolean {
  return (
    obs.geographicScope === 'HUANUCO' ||
    obs.scope === 'HUANUCO' ||
    obs.isLocalHuanuco === true ||
    obs.sellerId === 'metroios066mio'
  );
}

function formatShortNewsAge(isoDate: string): string {
  if (!isoDate) return 'reciente';
  const rel = formatRelativeTime(isoDate);
  return rel
    .replace(/^Actualizado\s+/i, '')
    .replace(/^Publicado\s+/i, '')
    .trim();
}

interface HomeViewProps {
  prices: PriceItem[];
  fuels: FuelStation[];
  offers: OfferItem[];
  explanations: PriceExplanation[];
  internetGroups?: InternetPriceGroup[];
  news?: HuanucoNewsItem[];
  searchQuery?: string;
  favorites?: string[];
  onToggleFavorite?: (productId: string) => void;
  onNavigate: (tab: ActiveTab, filter?: string) => void;
  onSelectExplanation: (exp: PriceExplanation) => void;
  onSelectProduct: (product: PriceItem) => void;
  onOpenReport: () => void;
  onShare?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  prices,
  fuels,
  offers,
  internetGroups = [],
  news = [],
  searchQuery = '',
  favorites = [],
  onToggleFavorite,
  onNavigate,
  onSelectProduct,
  onShare,
}) => {
  // Variaciones reales y verificadas exclusivamente en HUÁNUCO
  const LEGACY_INCOMPATIBLE_PREV_PRICES: Record<string, number> = {
    'metro-35350': 16.02,
    'metro-33992': 0.35,
    'metro-33572': 0.7,
    'metro-33987': 0.19,
  };

  interface VerifiedHuanucoVariation {
    id: string;
    name: string;
    brand?: string;
    verifiedPresentation?: string;
    icon: string;
    storeLabel: string;
    unitLabel: string;
    previousPrice: number;
    currentPrice: number;
    changePercentage: number;
    trend: 'up' | 'down';
    sourceProduct?: PriceItem;
  }

  const verifiedLocalVariations: VerifiedHuanucoVariation[] = prices
    .filter(
      (p) =>
        (p.verificationStatus === 'VERIFICADO' || p.verificationStatus === 'REPORTADO') &&
        p.currentPrice !== null &&
        p.previousPrice !== null &&
        p.previousPrice > 0 &&
        Math.abs(p.currentPrice - p.previousPrice) > 0.005 &&
        p.changePercentage !== 0 &&
        (p.trend === 'up' || p.trend === 'down')
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      verifiedPresentation: p.verifiedPresentation,
      icon: p.icon,
      storeLabel: p.storeOrMarket,
      unitLabel: `por ${p.unit}`,
      previousPrice: p.previousPrice as number,
      currentPrice: p.currentPrice as number,
      changePercentage: p.changePercentage,
      trend: p.trend as 'up' | 'down',
      sourceProduct: p,
    }));

  const coveredCatalogGroupKeys = new Set<string>();
  if (verifiedLocalVariations.some((v) => v.id === 'prod-pollo-entero')) {
    coveredCatalogGroupKeys.add('pollo_entero_1_kg');
  }
  if (verifiedLocalVariations.some((v) => v.id === 'prod-huevo-rosado')) {
    coveredCatalogGroupKeys.add('huevo_pardo_30_un');
    coveredCatalogGroupKeys.add('huevo_pardo_15_un');
  }
  if (verifiedLocalVariations.some((v) => v.id === 'prod-arroz-extra')) {
    coveredCatalogGroupKeys.add('arroz_extra_5_kg');
    coveredCatalogGroupKeys.add('arroz_extra_750_g');
  }
  if (verifiedLocalVariations.some((v) => v.id === 'prod-papa-amarilla')) {
    coveredCatalogGroupKeys.add('papa_amarilla_1_kg');
  }
  if (verifiedLocalVariations.some((v) => v.id === 'prod-aceite-vegetal')) {
    coveredCatalogGroupKeys.add('aceite_vegetal_900_ml');
  }

  const verifiedHuanucoOnlineVariations: VerifiedHuanucoVariation[] = internetGroups.flatMap(
    (group) => {
      if (coveredCatalogGroupKeys.has(group.comparisonGroupKey)) return [];
      const hcoObs = group.observations.find(
        (o) => isHuanucoObs(o) && !o.isExpired && o.availability === 'IN_STOCK'
      );
      if (!hcoObs) return [];
      if (hcoObs.previousPrice === null || hcoObs.previousPrice <= 0) return [];
      const legacyBad = LEGACY_INCOMPATIBLE_PREV_PRICES[hcoObs.observationId];
      if (legacyBad !== undefined && Math.abs(hcoObs.previousPrice - legacyBad) < 0.01) {
        return [];
      }
      const diff = Number((hcoObs.price - hcoObs.previousPrice).toFixed(2));
      if (Math.abs(diff) <= 0.005 || hcoObs.changePercentage === 0) return [];
      if (hcoObs.trend !== 'up' && hcoObs.trend !== 'down') return [];

      const cleanBrand =
        hcoObs.brand?.toUpperCase() === 'MAXIMA' ? 'Máxima' : hcoObs.brand || undefined;

      return [
        {
          id: hcoObs.observationId,
          name: cleanBrand
            ? `${group.productBaseName} · Marca ${cleanBrand} (${group.presentationLabel})`
            : `${group.productBaseName} (${group.presentationLabel})`,
          brand: cleanBrand,
          verifiedPresentation: hcoObs.productName,
          icon: group.icon,
          storeLabel: 'Metro Huánuco · Jr. San Martín',
          unitLabel: hcoObs.normalizedUnitLabel,
          previousPrice: hcoObs.previousPrice,
          currentPrice: hcoObs.price,
          changePercentage: hcoObs.changePercentage,
          trend: hcoObs.trend,
        },
      ];
    }
  );

  const allVerifiedVariations = [...verifiedLocalVariations, ...verifiedHuanucoOnlineVariations];
  const upItems = allVerifiedVariations.filter((v) => v.trend === 'up').slice(0, 2);
  const downItems = allVerifiedVariations.filter((v) => v.trend === 'down').slice(0, 2);

  // Combustibles reales (Gasolina Regular y Diésel)
  const availableGas90 = fuels.map((f) => f.gas90).filter((p): p is number => p !== null && p > 0);
  const minGas90 = availableGas90.length ? Math.min(...availableGas90) : null;

  const availableDiesel = fuels.map((f) => f.diesel).filter((p): p is number => p !== null && p > 0);
  const minDiesel = availableDiesel.length ? Math.min(...availableDiesel) : null;

  // 1 sola oferta real disponible
  const activeOffers = offers.filter((o) => !o.isExpired && o.verificationStatus === 'VERIFICADO');
  const featuredOffer = activeOffers.length > 0 ? activeOffers[0] : null;

  // 2 o 3 noticias reales del sistema automático
  const summaryNews = news.slice(0, 3);

  // Última fecha real de actualización
  const backendDates: string[] = [
    ...fuels.map((f) => f.updatedAt || f.lastReportedDate),
    ...offers.map((o) => o.updatedAt),
    ...news.map((n) => n.fetchedAt || n.publishedAt),
  ].filter((d): d is string => typeof d === 'string' && d.length > 0 && !isNaN(new Date(d).getTime()));

  const fallbackProductDates: string[] = prices
    .map((p) => p.updatedAt)
    .filter((d): d is string => typeof d === 'string' && d.length > 0 && !isNaN(new Date(d).getTime()));

  const candidateDates = backendDates.length > 0 ? backendDates : fallbackProductDates;
  const latestDate =
    candidateDates.length > 0
      ? [...candidateDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : null;

  const lastUpdatedDisplay = latestDate
    ? formatRelativeTime(latestDate)
    : 'Datos verificados en Huánuco';

  const cleanQuery = searchQuery.trim().toLowerCase();
  const isFuelSearch =
    cleanQuery.length > 0 &&
    ['gasolina', 'diesel', 'diésel', 'glp', 'grifo', 'combustible', 'primax', 'repsol', 'petroperu'].some(
      (kw) => cleanQuery.includes(kw)
    );
  const matchingProducts =
    cleanQuery.length > 0
      ? prices.filter((p) =>
          `${p.name} ${p.brand || ''} ${p.verifiedPresentation || ''} ${p.category} ${p.storeOrMarket}`
            .toLowerCase()
            .includes(cleanQuery)
        )
      : [];

  return (
    <div className="space-y-5 pb-6">
      {cleanQuery.length > 0 && (
        <section className="bg-[#E6F1DE] rounded-3xl p-4 border border-[#BAD0B5] space-y-3">
          <p className="text-[16px] font-bold text-[#102610]">
            Resultados rápidos para “{searchQuery.trim()}”:
          </p>
          {isFuelSearch && (
            <button
              type="button"
              onClick={() => onNavigate('combustibles')}
              className="w-full p-3.5 rounded-2xl bg-[#FDEDD4] border border-[#BAD0B5] text-left flex items-center justify-between gap-2 text-[16px] font-bold text-[#165338]"
            >
              <span>⛽ Ver combustibles para “{searchQuery.trim()}” en Grifos</span>
              <ArrowRight className="w-5 h-5 shrink-0" />
            </button>
          )}
          {matchingProducts.slice(0, 3).map((prod) => {
            const isFav = favorites.includes(prod.id);
            return (
              <div
                key={prod.id}
                onClick={() => onSelectProduct(prod)}
                className="p-3.5 rounded-2xl bg-[#FDEDD4] border border-[#BAD0B5] flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[17px] font-bold text-[#102610] block leading-snug">
                    {prod.icon} {prod.name}
                  </span>
                  {prod.brand && (
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md text-[13px] font-bold bg-[#D8EACF] text-[#165338] border border-[#9DC095]">
                      🏷️ Marca: {prod.brand}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[20px] font-extrabold text-[#165338] tabular-nums">
                    {prod.currentPrice !== null ? `S/ ${prod.currentPrice.toFixed(2)}` : 'Ver detalle'}
                  </span>
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(prod.id);
                      }}
                      aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      className={`min-w-[40px] min-h-[40px] p-2 rounded-xl border flex items-center justify-center transition-all duration-150 active:scale-95 ${
                        isFav
                          ? 'bg-[#D8EACF] text-[#165338] border-[#165338]/40 shadow-2xs'
                          : 'bg-[#F2F8ED] text-[#23361F] border-[#BAD0B5] hover:border-[#165338]/50 hover:text-[#165338]'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${isFav ? 'fill-[#165338] text-[#165338]' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => onNavigate(isFuelSearch ? 'combustibles' : 'precios', 'all')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#165338] text-white text-[15px] font-bold flex items-center justify-center gap-1.5"
          >
            <span>Buscar en {isFuelSearch ? 'Combustibles' : 'todos los Precios'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      )}

      {/* 3. BLOQUE PRINCIPAL: ¿QUÉ ESTÁ PASANDO HOY? */}
      <section className="relative overflow-hidden rounded-3xl p-5 border border-[#BAD0B5] shadow-sm space-y-3 min-h-[175px] flex flex-col justify-between">
        <img
          src="/images/huanuco_landscape.png"
          alt="Paisaje de Huánuco"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#102610]/90 via-[#102610]/60 to-[#165338]/40" />

        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12.5px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
            <img
              src="/logo.png"
              alt="Huánurebajas"
              className="w-4 h-4 object-contain brightness-110"
              referrerPolicy="no-referrer"
            />
            <span className="leading-none uppercase tracking-wide">HUÁNUREBAJAS</span>
          </div>
          <span className="text-[13px] font-semibold text-[#F2F8ED] flex items-center gap-1">
            <MapPin className="w-4 h-4 text-[#D8EACF]" />
            Huánuco, Perú
          </span>
        </div>

        <div className="relative z-10 pt-1">
          <h2 className="text-[22px] sm:text-[24px] font-black text-white tracking-tight leading-snug drop-shadow-sm uppercase">
            ¿QUÉ ESTÁ PASANDO HOY?
          </h2>
          <p className="text-[16px] sm:text-[17px] text-[#F2F8ED] mt-1.5 leading-relaxed font-medium drop-shadow-xs">
            Precios, combustibles, ofertas y noticias de Huánuco en un solo lugar.
          </p>
        </div>

        <div className="relative z-10 pt-2.5 flex items-center justify-between text-[14px] text-[#E6F1DE] border-t border-white/20 font-medium">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#D8EACF] shrink-0" />
            <span>{lastUpdatedDisplay}</span>
          </div>
        </div>
      </section>

      {/* 4. RESUMEN DE PRECIOS */}
      <section
        id="home-summary-precios"
        className="bg-[#E6F1DE] rounded-3xl p-4 sm:p-5 border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.02)] space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-[#D8EACF] text-[#165338] border border-[#BAD0B5]">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-[19px] sm:text-[20px] font-extrabold text-[#102610] tracking-tight">
                PRECIOS
              </h3>
              <p className="text-[15px] sm:text-[16px] font-medium text-[#23361F]">
                Variaciones reales verificadas en Huánuco
              </p>
            </div>
          </div>
        </div>

        {/* Sub-bloque: QUÉ SUBIÓ HOY */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[16px] sm:text-[17px] font-extrabold text-[#BF1C10] uppercase tracking-wide">
              📈 QUÉ SUBIÓ HOY
            </span>
          </div>

          {upItems.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-[#F2F8ED] border border-[#BAD0B5] text-[16px] font-medium text-[#23361F]">
              No hay aumentos registrados hoy.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upItems.map((item) => {
                const favProductId = item.sourceProduct?.id;
                const isFav = favProductId ? favorites.includes(favProductId) : false;
                return (
                  <div
                    key={item.id}
                    onClick={() =>
                      item.sourceProduct
                        ? onSelectProduct(item.sourceProduct)
                        : onNavigate('precios', 'up')
                    }
                    className="bg-[#FDEDD4] border border-[#BAD0B5] p-3.5 rounded-2xl cursor-pointer hover:border-[#165338]/50 hover:shadow-xs transition-all space-y-2.5"
                  >
                    {/* Fila 1: Icono + Título del producto + Botón Favorito */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-xl p-1.5 rounded-xl bg-[#FDF0D4] border border-[#BAD0B5] shrink-0">
                          {item.icon}
                        </span>
                        <h4 className="text-[16px] sm:text-[17px] font-bold text-[#102610] leading-snug line-clamp-2">
                          {item.name}
                        </h4>
                      </div>

                      {favProductId && onToggleFavorite && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(favProductId);
                          }}
                          aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          className={`min-w-[34px] min-h-[34px] w-[34px] h-[34px] p-1.5 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-150 active:scale-95 ${
                            isFav
                              ? 'bg-[#D8EACF] text-[#165338] border-[#165338]/40 shadow-2xs'
                              : 'bg-[#F2F8ED] text-[#23361F] border-[#BAD0B5] hover:border-[#165338]/50 hover:text-[#165338]'
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${isFav ? 'fill-[#165338] text-[#165338]' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Fila 2: Metadata ordenada (Marca y Tienda) */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#23361F]">
                      {item.brand && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-[#D8EACF] text-[#165338] border border-[#9DC095]">
                          🏷️ {item.brand}
                        </span>
                      )}
                      <span className="font-medium text-[#23361F] truncate">
                        📍 {item.storeLabel}
                      </span>
                    </div>

                    {/* Fila 3: Precios alineados y porcentaje */}
                    <div className="pt-2 border-t border-[#BAD0B5]/70 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-baseline gap-2 tabular-nums">
                        <span className="text-[13px] sm:text-[14px] font-medium text-[#23361F] line-through bg-[#F1E5D3] px-2 py-0.5 rounded-md">
                          S/ {item.previousPrice.toFixed(2)}
                        </span>
                        <span className="text-[20px] sm:text-[22px] font-black text-[#BF1C10] tracking-tight whitespace-nowrap">
                          S/ {item.currentPrice.toFixed(2)}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[14px] sm:text-[15px] font-extrabold text-[#BF1C10] bg-[#FDD9C5] px-2.5 py-1 rounded-xl border border-[#BF1C10]/30 tabular-nums shrink-0">
                        +{Math.abs(item.changePercentage)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sub-bloque: QUÉ BAJÓ HOY */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[16px] sm:text-[17px] font-extrabold text-[#165338] uppercase tracking-wide flex items-center gap-1.5">
              <TrendingDown className="w-4.5 h-4.5 text-[#165338]" />
              <span>QUÉ BAJÓ HOY</span>
            </span>
          </div>

          {downItems.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-[#F2F8ED] border border-[#BAD0B5] text-[16px] font-medium text-[#23361F]">
              No hay reducciones registradas hoy.
            </div>
          ) : (
            <div className="space-y-2.5">
              {downItems.map((item) => {
                const favProductId = item.sourceProduct?.id;
                const isFav = favProductId ? favorites.includes(favProductId) : false;
                return (
                  <div
                    key={item.id}
                    onClick={() =>
                      item.sourceProduct
                        ? onSelectProduct(item.sourceProduct)
                        : onNavigate('precios', 'down')
                    }
                    className="bg-[#FDEDD4] border border-[#BAD0B5] p-3.5 rounded-2xl cursor-pointer hover:border-[#165338]/50 hover:shadow-xs transition-all space-y-2.5"
                  >
                    {/* Fila 1: Icono + Título del producto + Botón Favorito */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-xl p-1.5 rounded-xl bg-[#FDF0D4] border border-[#BAD0B5] shrink-0">
                          {item.icon}
                        </span>
                        <h4 className="text-[16px] sm:text-[17px] font-bold text-[#102610] leading-snug line-clamp-2">
                          {item.name}
                        </h4>
                      </div>

                      {favProductId && onToggleFavorite && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(favProductId);
                          }}
                          aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          className={`min-w-[34px] min-h-[34px] w-[34px] h-[34px] p-1.5 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-150 active:scale-95 ${
                            isFav
                              ? 'bg-[#D8EACF] text-[#165338] border-[#165338]/40 shadow-2xs'
                              : 'bg-[#F2F8ED] text-[#23361F] border-[#BAD0B5] hover:border-[#165338]/50 hover:text-[#165338]'
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${isFav ? 'fill-[#165338] text-[#165338]' : ''}`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Fila 2: Metadata ordenada (Marca y Tienda) */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#23361F]">
                      {item.brand && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-[#D8EACF] text-[#165338] border border-[#9DC095]">
                          🏷️ {item.brand}
                        </span>
                      )}
                      <span className="font-medium text-[#23361F] truncate">
                        📍 {item.storeLabel}
                      </span>
                    </div>

                    {/* Fila 3: Precios alineados y porcentaje */}
                    <div className="pt-2 border-t border-[#BAD0B5]/70 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-baseline gap-2 tabular-nums">
                        <span className="text-[13px] sm:text-[14px] font-medium text-[#23361F] line-through bg-[#F1E5D3] px-2 py-0.5 rounded-md">
                          S/ {item.previousPrice.toFixed(2)}
                        </span>
                        <span className="text-[20px] sm:text-[22px] font-black text-[#165338] tracking-tight whitespace-nowrap">
                          S/ {item.currentPrice.toFixed(2)}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[14px] sm:text-[15px] font-extrabold text-[#165338] bg-[#D8EACF] px-2.5 py-1 rounded-xl border border-[#BAD0B5] tabular-nums shrink-0">
                        −{Math.abs(item.changePercentage)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          id="btn-home-ver-todos-precios"
          type="button"
          onClick={() => onNavigate('precios', 'all')}
          className="w-full min-h-[42px] py-2.5 px-3 rounded-xl bg-gradient-to-b from-[#1b6243] to-[#12452e] hover:from-[#165338] hover:to-[#0f3b27] text-white text-[14px] sm:text-[15px] font-bold flex items-center justify-center gap-2 transition-all border border-[#0d3623] border-b-[3px] border-b-[#072418] shadow-[0_2.5px_4px_rgba(16,38,16,0.20)] active:translate-y-[1.5px] active:border-b-[1px] select-none"
        >
          <span>Ver todos los precios</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* 5. RESUMEN DE COMBUSTIBLES */}
      <section
        id="home-summary-combustibles"
        className="bg-[#E6F1DE] rounded-3xl p-4 sm:p-5 border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.02)] space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-[#D8EACF] text-[#165338] border border-[#BAD0B5]">
              <Fuel className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-[19px] sm:text-[20px] font-extrabold text-[#102610] tracking-tight">
                ⛽ COMBUSTIBLES
              </h3>
              <p className="text-[15px] sm:text-[16px] font-medium text-[#23361F]">
                Precios reales en grifos de Huánuco (por galón)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#FDEDD4] rounded-2xl p-4 border border-[#BAD0B5] flex flex-col justify-between">
            <span className="text-[16px] sm:text-[17px] font-bold text-[#102610] block">
              Gasolina Regular
            </span>
            <span className="text-[26px] sm:text-[28px] font-extrabold text-[#165338] block mt-1.5 tabular-nums leading-none">
              {minGas90 !== null ? `S/ ${minGas90.toFixed(2)}` : 'Sin dato'}
            </span>
            <span className="text-[14px] sm:text-[15px] text-[#23361F] font-medium mt-1.5 block">
              Desde (galón)
            </span>
          </div>

          <div className="bg-[#FDEDD4] rounded-2xl p-4 border border-[#BAD0B5] flex flex-col justify-between">
            <span className="text-[16px] sm:text-[17px] font-bold text-[#102610] block">
              Diésel
            </span>
            <span className="text-[26px] sm:text-[28px] font-extrabold text-[#165338] block mt-1.5 tabular-nums leading-none">
              {minDiesel !== null ? `S/ ${minDiesel.toFixed(2)}` : 'Sin dato'}
            </span>
            <span className="text-[14px] sm:text-[15px] text-[#23361F] font-medium mt-1.5 block">
              Desde (galón)
            </span>
          </div>
        </div>

        <button
          id="btn-home-ver-grifos"
          type="button"
          onClick={() => onNavigate('combustibles')}
          className="w-full min-h-[42px] py-2.5 px-3 rounded-xl bg-gradient-to-b from-[#1b6243] to-[#12452e] hover:from-[#165338] hover:to-[#0f3b27] text-white text-[14px] sm:text-[15px] font-bold flex items-center justify-center gap-2 transition-all border border-[#0d3623] border-b-[3px] border-b-[#072418] shadow-[0_2.5px_4px_rgba(16,38,16,0.20)] active:translate-y-[1.5px] active:border-b-[1px] select-none"
        >
          <span>Ver precios de grifos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* 6. RESUMEN DE TIENDAS CON OFERTAS */}
      <section
        id="home-summary-tiendas"
        className="bg-[#E6F1DE] rounded-3xl p-4 sm:p-5 border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.02)] space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-[#D8EACF] text-[#165338] border border-[#BAD0B5]">
              <Store className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-[19px] sm:text-[20px] font-extrabold text-[#102610] tracking-tight">
                🏪 TIENDAS CON OFERTAS
              </h3>
              <p className="text-[15px] sm:text-[16px] font-medium text-[#23361F]">
                Promociones publicadas por comercios locales
              </p>
            </div>
          </div>
        </div>

        {!featuredOffer ? (
          <div className="p-4 rounded-2xl bg-[#F2F8ED] border border-[#BAD0B5] text-[16px] font-medium text-[#23361F]">
            No hay ofertas activas en este momento.
          </div>
        ) : (
          <div className="bg-[#FDEDD4] border border-[#BAD0B5] p-4 rounded-2xl space-y-3">
            <div className="space-y-1.5 text-[16px] sm:text-[17px]">
              <p className="text-[#23361F] font-medium">
                <strong className="text-[#102610] font-bold">Tienda:</strong> {featuredOffer.store}
              </p>
              <p className="text-[#102610] font-bold text-[18px] sm:text-[19px] leading-snug">
                <span className="text-[#23361F] font-semibold text-[16px] sm:text-[17px]">
                  Producto:{' '}
                </span>
                {featuredOffer.product || featuredOffer.title}
              </p>
            </div>

            <div className="pt-2.5 border-t border-[#BAD0B5] flex flex-wrap items-baseline justify-between gap-3 tabular-nums">
              <div className="space-y-1">
                {featuredOffer.originalPrice > 0 && (
                  <span className="text-[16px] sm:text-[17px] font-medium text-[#23361F] block">
                    Antes:{' '}
                    <span className="line-through bg-[#F1E5D3] px-2 py-0.5 rounded-lg">
                      S/ {featuredOffer.originalPrice.toFixed(2)}
                    </span>
                  </span>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-[17px] font-bold text-[#165338]">Ahora:</span>
                  <span className="text-[28px] sm:text-[30px] font-extrabold text-[#165338] leading-none">
                    S/ {featuredOffer.offerPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {featuredOffer.discountPercentage > 0 && (
                <span className="text-[17px] sm:text-[18px] font-extrabold bg-[#D8EACF] text-[#165338] border border-[#BAD0B5] px-3 py-1 rounded-xl">
                  −{featuredOffer.discountPercentage}%
                </span>
              )}
            </div>

            {featuredOffer.validUntil && (
              <p className="text-[16px] font-medium text-[#23361F] pt-1">
                <strong className="text-[#102610]">Vence:</strong> {featuredOffer.validUntil}
              </p>
            )}
          </div>
        )}

        <button
          id="btn-home-ver-ofertas"
          type="button"
          onClick={() => onNavigate('ofertas')}
          className="w-full min-h-[42px] py-2.5 px-3 rounded-xl bg-gradient-to-b from-[#1b6243] to-[#12452e] hover:from-[#165338] hover:to-[#0f3b27] text-white text-[14px] sm:text-[15px] font-bold flex items-center justify-center gap-2 transition-all border border-[#0d3623] border-b-[3px] border-b-[#072418] shadow-[0_2.5px_4px_rgba(16,38,16,0.20)] active:translate-y-[1.5px] active:border-b-[1px] select-none"
        >
          <span>Ver todas las ofertas</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* 7. RESUMEN DE NOTICIAS */}
      <section
        id="home-summary-noticias"
        className="bg-[#E6F1DE] rounded-3xl p-4 sm:p-5 border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.02)] space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-[#D8EACF] text-[#165338] border border-[#BAD0B5]">
              <Newspaper className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-[19px] sm:text-[20px] font-extrabold text-[#102610] tracking-tight">
                📰 ÚLTIMAS NOTICIAS DE HUÁNUCO
              </h3>
              <p className="text-[15px] sm:text-[16px] font-medium text-[#23361F]">
                Actualidad regional de medios verificados
              </p>
            </div>
          </div>
        </div>

        {summaryNews.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#F2F8ED] border border-[#BAD0B5] text-[16px] font-medium text-[#23361F]">
            No hay noticias nuevas.
          </div>
        ) : (
          <div className="space-y-3">
            {summaryNews.map((item) => (
              <article
                key={item.id}
                className="bg-[#FDEDD4] border border-[#BAD0B5] p-4 rounded-2xl space-y-2.5"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <h4 className="text-[18px] sm:text-[19px] font-bold text-[#102610] group-hover:text-[#165338] leading-snug transition-colors">
                    📰 {item.title}
                  </h4>
                </a>

                <div className="pt-2 border-t border-[#BAD0B5] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[16px] font-medium text-[#23361F]">
                    <strong className="font-semibold text-[#102610]">{item.sourceName}</strong> ·{' '}
                    {formatShortNewsAge(item.publishedAt)}
                  </span>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#165338] hover:bg-[#0f3c28] text-white text-[13px] sm:text-[14px] font-bold shadow-[0_1.5px_3px_rgba(22,83,56,0.25)] transition-all shrink-0"
                  >
                    <span>Leer noticia</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Acciones acopladas abajo al lado de noticias: Ver noticias + Compartir esta página */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            id="btn-home-ver-noticias"
            type="button"
            onClick={() => onNavigate('noticias')}
            className="w-full min-h-[42px] py-2 px-2 rounded-xl bg-gradient-to-b from-[#1b6243] to-[#12452e] hover:from-[#165338] hover:to-[#0f3b27] text-white text-[13px] sm:text-[14px] font-bold flex items-center justify-center gap-1.5 transition-all border border-[#0d3623] border-b-[3px] border-b-[#072418] shadow-[0_2.5px_4px_rgba(16,38,16,0.20)] active:translate-y-[1.5px] active:border-b-[1px] select-none text-center"
          >
            <Newspaper className="w-4 h-4 shrink-0" />
            <span className="truncate">Ver noticias</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
          </button>

          <button
            id="btn-home-share-page"
            type="button"
            onClick={
              onShare ||
              (async () => {
                const shareUrl = 'https://www.notiperux.com';
                if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                  try {
                    await navigator.share({
                      title: 'NotiPerúx',
                      url: shareUrl,
                    });
                    return;
                  } catch (err: any) {
                    if (err && err.name === 'AbortError') return;
                  }
                }
                try {
                  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    await navigator.clipboard.writeText(shareUrl);
                    return;
                  }
                } catch {}
                try {
                  const textArea = document.createElement('textarea');
                  textArea.value = shareUrl;
                  textArea.style.position = 'fixed';
                  textArea.style.opacity = '0';
                  document.body.appendChild(textArea);
                  textArea.focus();
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                } catch {}
              })
            }
            className="w-full min-h-[42px] py-2 px-2 rounded-xl bg-gradient-to-b from-[#FFFFFF] to-[#E3F0DC] hover:from-[#F4FAF0] hover:to-[#D5EACD] text-[#102610] text-[13px] sm:text-[14px] font-bold flex items-center justify-center gap-1.5 transition-all border border-[#8FB686] border-b-[3px] border-b-[#6C9662] shadow-[0_2.5px_4px_rgba(16,38,16,0.12)] active:translate-y-[1.5px] active:border-b-[1px] select-none text-center"
          >
            <Share2 className="w-4 h-4 text-[#165338] shrink-0" />
            <span className="truncate">Compartir esta página</span>
          </button>
        </div>
      </section>
    </div>
  );
};
