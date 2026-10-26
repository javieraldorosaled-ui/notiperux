import React, { useState } from 'react';
import {
  X,
  Store,
  MapPin,
  Clock,
  ExternalLink,
  Navigation,
  Bell,
  Star,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Check,
  TrendingUp,
  TrendingDown,
  ChevronRight
} from 'lucide-react';
import { CloseModalButton } from './CloseModalButton';
import {
  PriceItem,
  PriceExplanation,
  TrustLevel,
  StorePrice,
  InternetPriceGroup,
  InternetPriceObservation,
} from '../types';
import { formatRelativeTime } from '../services/firebase';

function isHuanucoObs(obs: InternetPriceObservation): boolean {
  return (
    obs.geographicScope === 'HUANUCO' ||
    obs.scope === 'HUANUCO' ||
    obs.isLocalHuanuco === true ||
    obs.sellerId === 'metroios066mio' ||
    obs.sellerId === 'promart_sc8_huanuco'
  );
}

interface ProductDetailModalProps {
  product: PriceItem | null;
  internetGroups?: InternetPriceGroup[];
  onClose: () => void;
  onSelectExplanation?: (exp: PriceExplanation) => void;
  explanation?: PriceExplanation;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
  onSetPriceAlert: (productId: string, productName: string, targetPrice: number) => void;
  onSubmitPriceDiscrepancy: (productId: string, agrees: boolean, newPrice?: number, storeName?: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  internetGroups = [],
  onClose,
  onSelectExplanation,
  explanation,
  isFavorite,
  onToggleFavorite,
  onSetPriceAlert,
  onSubmitPriceDiscrepancy,
}) => {
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [targetAlertPrice, setTargetAlertPrice] = useState<string>('');
  const [alertSavedSuccess, setAlertSavedSuccess] = useState(false);

  // Discrepancy feedback state
  const [discrepancyState, setDiscrepancyState] = useState<'idle' | 'agreed' | 'reporting' | 'submitted'>('idle');
  const [differentPrice, setDifferentPrice] = useState<string>('');
  const [differentStore, setDifferentStore] = useState<string>('');

  if (!product) return null;

  const isUp = product.trend === 'up';
  const hasRealVariation =
    product.currentPrice !== null &&
    product.previousPrice !== null &&
    (product.trend === 'up' || product.trend === 'down');

  const renderProductBadge = () => {
    if (product.currentPrice === null || product.verificationStatus === 'PENDIENTE') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#23361F] bg-[#F1E5D3] px-2.5 py-1 rounded-full border border-[#BAD0B5]">
          <span className="w-2 h-2 rounded-full bg-[#23361F]" />
          PENDIENTE DE VERIFICACIÓN
        </span>
      );
    }

    if (product.verificationStatus === 'VERIFICADO') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#165338] bg-[#D8EACF] px-2.5 py-1 rounded-full border border-[#BAD0B5]">
          <span>🟢</span>
          <span>Precio verificado</span>
        </span>
      );
    }

    if (product.verificationStatus === 'REPORTADO') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#1E40AF] bg-blue-50/90 px-2.5 py-1 rounded-full border border-blue-200/60">
          <span>🔵</span>
          <span>Precio reportado</span>
        </span>
      );
    }

    if (product.verificationStatus === 'REFERENCIAL' || product.trustLevel === 'referential') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#23361F] bg-[#E6F1DE] px-2.5 py-1 rounded-full border border-[#BAD0B5]">
          <span>⚪</span>
          <span>Precio online de referencia</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#23361F] bg-[#F1E5D3] px-2.5 py-1 rounded-full border border-[#BAD0B5]">
        <span className="w-2 h-2 rounded-full bg-[#23361F]" />
        <span>Pendiente de verificación</span>
      </span>
    );
  };

  const renderStoreTrustBadge = (trust?: TrustLevel, price?: number | null) => {
    if (price === null || price === undefined || trust === 'pending' || !trust) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#23361F] bg-[#F1E5D3] px-2.5 py-0.5 rounded-full border border-[#BAD0B5]">
          <span className="w-2 h-2 rounded-full bg-[#23361F]" />
          <span>Pendiente</span>
        </span>
      );
    }
    if (trust === 'verified') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#165338] bg-[#D8EACF] px-2.5 py-0.5 rounded-full border border-[#BAD0B5]">
          <span>🟢</span>
          <span>Precio verificado</span>
        </span>
      );
    }
    if (trust === 'reported') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#1E40AF] bg-blue-50/90 px-2.5 py-0.5 rounded-full border border-blue-200/60">
          <span>🔵</span>
          <span>Precio reportado</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#23361F] bg-[#E6F1DE] px-2.5 py-0.5 rounded-full border border-[#BAD0B5]">
        <span>⚪</span>
        <span>Precio online de referencia</span>
      </span>
    );
  };

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetAlertPrice);
    if (!isNaN(val) && val > 0) {
      onSetPriceAlert(product.id, product.name, val);
      setAlertSavedSuccess(true);
      setTimeout(() => {
        setShowAlertDialog(false);
        setAlertSavedSuccess(false);
      }, 1500);
    }
  };

  const handleAgreeFeedback = () => {
    onSubmitPriceDiscrepancy(product.id, true);
    setDiscrepancyState('agreed');
  };

  const handleSubmitDiscrepancy = (e: React.FormEvent) => {
    e.preventDefault();
    const priceVal = parseFloat(differentPrice);
    onSubmitPriceDiscrepancy(product.id, false, isNaN(priceVal) ? undefined : priceVal, differentStore || undefined);
    setDiscrepancyState('submitted');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#102610]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="product-card-shell w-full max-w-md bg-[#F2F8ED] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#BAD0B5] max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile drag handle indicator */}
        <div className="w-10 h-1.5 bg-[#BAD0B5] rounded-full mx-auto mb-3 sm:hidden" />

        {/* Modal Top Header */}
        <div className="flex items-start justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2.5 rounded-2xl bg-[#FDEDD4] border border-[#BAD0B5] shrink-0">
              {product.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[20px] sm:text-[21px] font-bold text-[#102610] leading-snug">
                  {product.name}
                </h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(product.id);
                  }}
                  aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  className={`min-w-[40px] min-h-[40px] p-2 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-150 active:scale-95 ${
                    isFavorite
                      ? 'text-[#165338] bg-[#D8EACF] border-[#165338]/40 shadow-2xs'
                      : 'text-[#23361F] bg-[#F2F8ED] border-[#BAD0B5] hover:border-[#165338]/50 hover:text-[#165338]'
                  }`}
                >
                  <Star className={`w-5 h-5 ${isFavorite ? 'fill-[#165338]' : ''}`} />
                </button>
              </div>
              <p className="text-[16px] font-medium text-[#23361F] mt-0.5">
                Por {product.unit} · {product.district}
              </p>
              {product.brand && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-[14px] font-bold text-[#102610] bg-[#FDEDD4] px-2.5 py-0.5 rounded-lg border border-[#8FB686]">
                    🏷️ Marca: {product.brand}
                  </span>
                </div>
              )}
              {product.verifiedPresentation && (
                <p className="text-[14px] font-semibold text-[#165338] mt-1 leading-snug">
                  Empaque verificado: {product.verifiedPresentation}
                </p>
              )}
            </div>
          </div>

          <CloseModalButton onClose={onClose} ariaLabel="Cerrar detalle del producto" />
        </div>

        {/* Trust Badge & Time */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#BAD0B5]">
          {renderProductBadge()}
          <span className="text-[16px] font-medium text-[#23361F] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#165338]" />
            {formatRelativeTime(product.updatedAt)}
          </span>
        </div>

        {/* Main Price Card */}
        <div className="my-4 p-4 rounded-2xl bg-[#FDEDD4] border border-[#BAD0B5] flex flex-wrap items-center justify-between gap-3">
          <div>
            {product.currentPrice !== null && product.previousPrice !== null && (
              <span className="text-[16px] sm:text-[17px] font-medium text-[#23361F] block mb-1">
                Precio anterior:{' '}
                <span className="line-through bg-[#F1E5D3] px-2 py-0.5 rounded-lg">
                  S/ {product.previousPrice.toFixed(2)}
                </span>
              </span>
            )}
            {product.currentPrice !== null ? (
              <div className={`text-[28px] sm:text-[30px] font-extrabold leading-none tracking-tight mt-0.5 ${isUp ? 'text-[#BF1C10]' : 'text-[#165338]'}`}>
                {`S/ ${product.currentPrice.toFixed(2)}`}
                <span className="text-[16px] sm:text-[17px] text-[#23361F] font-semibold ml-1.5">/{product.unit}</span>
              </div>
            ) : (
              <div className="text-[16px] font-bold text-[#23361F] mt-0.5 leading-snug">
                Sin precio reportado hoy · Sé el primero en reportar
              </div>
            )}
          </div>

          {hasRealVariation && (
            <div className="text-right shrink-0">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[18px] sm:text-[19px] font-bold leading-none ${
                  isUp
                    ? 'bg-[#FDD9C5] text-[#BF1C10] border border-[#BF1C10]/30'
                    : 'bg-[#D8EACF] text-[#165338] border border-[#BAD0B5]'
                }`}
              >
                {isUp ? (
                  <TrendingUp className="w-4.5 h-4.5 stroke-[2.5px]" />
                ) : (
                  <TrendingDown className="w-4.5 h-4.5 stroke-[2.5px]" />
                )}
                <span>{isUp ? `+${product.changePercentage}%` : `${product.changePercentage}%`}</span>
              </span>
              <span className="text-[14px] font-medium text-[#23361F] block mt-1.5">
                Variación en Huánuco
              </span>
            </div>
          )}
        </div>

        {/* SECTION 13: PRECIOS POR ESTABLECIMIENTO */}
        <div className="space-y-3 my-4">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <h4 className="text-[16px] font-extrabold text-[#102610] uppercase tracking-wide flex items-center gap-1.5">
              <Store className="w-4.5 h-4.5 text-[#165338]" />
              <span>Precios por establecimiento</span>
            </h4>
            <span className="text-[14px] font-medium text-[#23361F]">Varía según puesto o tienda</span>
          </div>

          <p className="text-[15px] text-[#23361F] leading-relaxed">
            No existe un único precio para toda la ciudad. Consulta los precios registrados en diferentes puntos de Huánuco:
          </p>

          <div className="space-y-2.5">
            {product.storePrices && product.storePrices.length > 0 ? (
              product.storePrices.map((sp: StorePrice) => (
                <div
                  key={sp.id}
                  className="p-3.5 bg-[#FDEDD4] rounded-2xl border border-[#BAD0B5] shadow-2xs space-y-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1 basis-[170px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {sp.trustLevel === 'referential' || sp.verificationStatus === 'REFERENCIAL' ? (
                          <span className="text-[13px] font-extrabold bg-[#E6F1DE] text-[#23361F] border border-[#BAD0B5] px-2 py-0.5 rounded-md uppercase">
                            ⚪ REFERENCIA ONLINE
                          </span>
                        ) : (
                          <span className="text-[13px] font-extrabold bg-[#165338] text-white px-2 py-0.5 rounded-md uppercase">
                            📍 HUÁNUCO
                          </span>
                        )}
                        <span className="text-[17px] font-bold text-[#102610]">{sp.storeName}</span>
                        {renderStoreTrustBadge(sp.trustLevel, sp.price)}
                      </div>
                      <p className="text-[16px] font-medium text-[#23361F] flex items-center gap-1.5 mt-1.5 leading-snug">
                        <MapPin className="w-4 h-4 text-[#165338] shrink-0" />
                        <span>{sp.address} ({sp.district})</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[26px] sm:text-[28px] font-extrabold text-[#165338] leading-none block">
                        {sp.price !== null ? `S/ ${sp.price.toFixed(2)}` : 'Sin precio reportado hoy'}
                      </span>
                      <span className="text-[15px] font-medium text-[#23361F] block mt-1">{formatRelativeTime(sp.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Google Maps Actions for this store */}
                  <div className="pt-2.5 border-t border-[#BAD0B5]/60 flex flex-wrap items-center justify-end gap-2 text-[15px]">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        sp.googleMapsQuery || `${sp.storeName} ${sp.district} Huanuco`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-[#F1E5D3] hover:bg-[#FDF0D4] text-[#102610] font-semibold rounded-xl border border-[#BAD0B5] flex items-center gap-1.5 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-[#165338]" />
                      <span>Ver en Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#23361F]" />
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        sp.googleMapsQuery || `${sp.storeName} ${sp.district} Huanuco`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-[#D8EACF] hover:bg-[#C8DCC3] text-[#165338] font-bold rounded-xl border border-[#BAD0B5] flex items-center gap-1.5 transition-colors"
                    >
                      <Navigation className="w-4 h-4 text-[#165338]" />
                      <span>Cómo llegar</span>
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-[#E6F1DE] rounded-2xl border border-[#BAD0B5] text-center text-[15px] text-[#23361F] font-medium">
                No hay establecimientos locales con precio reportado para este producto todavía.
              </div>
            )}
          </div>
        </div>

        {/* COMPARATIVA EN SUPERMERCADO: PRIORIDAD METRO HUÁNUCO S066 + REFERENCIA LIMA/NACIONAL */}
        {(() => {
          const normName = product.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          const matchedGroups = internetGroups.filter((g) => {
            const gBase = g.productBaseName
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '');
            const firstWord = gBase.split(' ')[0];
            return firstWord && normName.includes(firstWord);
          });
          if (matchedGroups.length === 0) return null;
          const primaryGroup = matchedGroups[0];
          const hcoObs = primaryGroup.observations.find(
            (o) => isHuanucoObs(o) && !o.isExpired && o.availability === 'IN_STOCK'
          );
          const natObs = primaryGroup.observations.filter(
            (o) => !isHuanucoObs(o) && !o.isExpired && o.availability === 'IN_STOCK'
          );

          return (
            <div className="my-4 space-y-2.5 text-[15px]">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <h4 className="text-[16px] font-extrabold text-[#102610] uppercase tracking-wide">
                  Supermercado Huánuco y Referencias Online
                </h4>
                <span className="text-[14px] font-medium text-[#23361F]">{primaryGroup.presentationLabel}</span>
              </div>

              {hcoObs ? (
                <div className="p-3.5 rounded-2xl bg-[#FDEDD4] border border-[#BAD0B5] space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2.5">
                    <div className="min-w-0 flex-1 basis-[170px]">
                      <span className="inline-block text-[14px] font-semibold bg-[#165338] text-white px-2.5 py-0.5 rounded-lg uppercase">
                        🟢 PRECIO VERIFICADO EN HUÁNUCO
                      </span>
                      <p className="text-[16px] font-extrabold text-[#102610] mt-1.5 leading-snug">
                        {hcoObs.source === 'promart'
                          ? 'Promart Huánuco · Real Plaza (Jr. Independencia 1601)'
                          : 'Metro Huánuco · Jr. San Martín (Sucursal S066)'}
                      </p>
                      <p className="text-[15px] text-[#23361F] mt-0.5 leading-snug">
                        {hcoObs.productName} ({hcoObs.brand}) · {hcoObs.presentation}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[26px] sm:text-[28px] font-extrabold text-[#165338] leading-none block">
                        S/ {hcoObs.price.toFixed(2)}
                      </span>
                      <span className="text-[14px] font-bold text-[#165338] block mt-1">
                        {hcoObs.normalizedUnitLabel}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#BAD0B5] flex flex-wrap items-center justify-between gap-2 text-[15px]">
                    <span className="font-bold text-[#165338]">
                      ● Disponible en Huánuco (Stock: {hcoObs.availableQuantity})
                    </span>
                    <a
                      href={hcoObs.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-[#165338] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Ver en tienda</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#F1E5D3] border border-[#BAD0B5] text-[15px] text-[#23361F]">
                  <strong>📍 Sin stock online confirmado hoy en Metro Huánuco (Sucursal S066).</strong>
                </div>
              )}

              {natObs.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-[#E6F1DE] border border-[#BAD0B5] space-y-2">
                  <span className="text-[14px] font-bold text-[#23361F] uppercase tracking-wide block">
                    🌐 REFERENCIA ONLINE LIMA/NACIONAL (Secundario)
                  </span>
                  <div className="space-y-1.5">
                    {natObs.map((obs) => (
                      <div
                        key={obs.observationId}
                        className="flex items-center justify-between gap-2 text-[15px] text-[#23361F] pt-1.5 border-t border-[#BAD0B5]/60 first:border-t-0 first:pt-0"
                      >
                        <div className="min-w-0 leading-snug">
                          <strong className="text-[#102610]">{obs.storeName} Online:</strong>{' '}
                          <span>
                            {obs.source === 'plazavea'
                              ? 'Catálogo Online Nacional (con sede física en Huánuco)'
                              : 'Referencia Online · Lima/Nacional'}
                          </span>
                        </div>
                        <span className="font-bold text-[#165338] shrink-0 text-[16px]">
                          S/ {obs.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* SECTION 22: DETECTAR PRECIOS DIFERENTES */}
        <div className="my-4 p-4 rounded-2xl bg-[#E6F1DE] border border-[#BAD0B5] space-y-3 text-[15px]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#102610] flex items-center gap-1.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#165338] shrink-0" />
              {product.currentPrice !== null
                ? '¿Este precio coincide con lo que viste?'
                : '¿Viste este producto en el mercado hoy?'}
            </span>
          </div>

          {discrepancyState === 'idle' && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {product.currentPrice !== null && (
                <button
                  onClick={handleAgreeFeedback}
                  className="flex-1 basis-[140px] py-2.5 px-3 bg-[#D8EACF] hover:bg-[#C8DCC3] text-[#165338] font-bold rounded-xl border border-[#BAD0B5] flex items-center justify-center gap-1.5 transition-colors shadow-2xs text-[14px] sm:text-[15px]"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Sí, estaba a este precio</span>
                </button>
              )}
              <button
                onClick={() => setDiscrepancyState('reporting')}
                className="flex-1 basis-[140px] py-2.5 px-3 bg-[#F2F8ED] hover:bg-[#D8EACF] text-[#102610] font-bold rounded-xl border border-[#BAD0B5] flex items-center justify-center gap-1.5 transition-colors shadow-2xs text-[14px] sm:text-[15px]"
              >
                <X className="w-4 h-4 shrink-0" />
                <span>
                  {product.currentPrice !== null ? 'No, estaba a otro precio' : 'Reportar precio visto'}
                </span>
              </button>
            </div>
          )}

          {discrepancyState === 'agreed' && (
            <div className="p-3 bg-[#D8EACF] rounded-xl text-[#165338] font-semibold text-[15px] text-center border border-[#BAD0B5]">
              ✓ ¡Gracias! Tu confirmación ayuda a validar la vigencia de este precio.
            </div>
          )}

          {discrepancyState === 'reporting' && (
            <form onSubmit={handleSubmitDiscrepancy} className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[14px] font-bold text-[#23361F] block mb-1">
                    Precio que viste (S/)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    placeholder="0.00"
                    value={differentPrice}
                    onChange={(e) => setDifferentPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F8ED] border border-[#BAD0B5] rounded-xl text-[16px] font-bold text-[#102610]"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-bold text-[#23361F] block mb-1">
                    Puesto o tienda
                  </label>
                  <input
                    type="text"
                    placeholder="Puesto / Tienda"
                    value={differentStore}
                    onChange={(e) => setDifferentStore(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F2F8ED] border border-[#BAD0B5] rounded-xl text-[16px] text-[#102610]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#165338] text-white font-bold rounded-xl text-[15px]"
                >
                  Enviar actualización
                </button>
                <button
                  type="button"
                  onClick={() => setDiscrepancyState('idle')}
                  className="py-2.5 px-3.5 bg-[#D8EACF] text-[#102610] border border-[#BAD0B5] rounded-xl text-[15px] font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {discrepancyState === 'submitted' && (
            <div className="p-3 bg-[#D8EACF] border border-[#BAD0B5] rounded-xl text-[#165338] font-semibold text-[15px] text-center">
              ✓ Reporte recibido. Se agregará como precio reportado por la comunidad.
            </div>
          )}
        </div>

        {/* SECTION 24: ALERTA "AVÍSAME SI BAJA DE..." */}
        <div className="my-3.5 pt-2">
          {!showAlertDialog ? (
            <button
              onClick={() => setShowAlertDialog(true)}
              className="w-full py-3 px-4 bg-[#D8EACF] hover:bg-[#C8DCC3] text-[#102610] border border-[#BAD0B5] font-bold text-[15px] sm:text-[16px] rounded-xl flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <Bell className="w-4.5 h-4.5 text-[#165338]" />
                <span>Avísame si este precio baja...</span>
              </span>
              <span className="text-[15px] text-[#165338] font-extrabold">Configurar →</span>
            </button>
          ) : (
            <form onSubmit={handleSaveAlert} className="p-3.5 bg-[#D8EACF] rounded-2xl border border-[#BAD0B5] space-y-2.5 text-[15px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#102610] flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-[#165338]" />
                  Alerta de precio para {product.name}
                </span>
                <CloseModalButton
                  size="compact"
                  onClose={() => setShowAlertDialog(false)}
                  ariaLabel="Cerrar diálogo de alerta"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[14px] font-medium text-[#23361F] block mb-1">
                    Avísame si baja de:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[16px] text-[#23361F] font-bold">S/</span>
                    <input
                      type="number"
                      step="0.50"
                      required
                      placeholder={
                        product.currentPrice !== null
                          ? (product.currentPrice * 0.9).toFixed(2)
                          : '10.00'
                      }
                      value={targetAlertPrice}
                      onChange={(e) => setTargetAlertPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-[#F2F8ED] border border-[#BAD0B5] rounded-xl text-[16px] font-bold text-[#102610]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-6 px-4 py-2 bg-[#165338] text-white font-bold text-[15px] rounded-xl hover:bg-[#102610] transition-colors"
                >
                  Guardar
                </button>
              </div>
              {alertSavedSuccess && (
                <p className="text-[15px] text-[#165338] font-semibold">
                  ✓ Alerta programada con éxito en tu dispositivo.
                </p>
              )}
            </form>
          )}
        </div>

        {/* Explanation connection if exists */}
        {explanation && onSelectExplanation && (
          <div className="my-3.5">
            <button
              onClick={() => {
                onClose();
                onSelectExplanation(explanation);
              }}
              className="w-full py-3 px-4 bg-[#E6F1DE] hover:bg-[#D8EACF] text-[#102610] text-[16px] sm:text-[17px] font-bold rounded-xl border border-[#BAD0B5] flex items-center justify-between transition-colors shadow-2xs"
            >
              <span className="flex items-center gap-2 text-[#102610]">
                <HelpCircle className="w-4.5 h-4.5 text-[#165338]" />
                <span>¿Por qué cambió este precio?</span>
              </span>
              <span className="text-[#165338] text-[15px] font-bold flex items-center gap-0.5">
                <span>Leer explicación</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#BAD0B5]">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#D8EACF] hover:bg-[#C8DCC3] text-[#102610] border border-[#BAD0B5] font-bold text-[16px] rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
