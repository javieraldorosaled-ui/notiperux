import React, { useState } from 'react';
import {
  Tag,
  Store,
  MapPin,
  Calendar,
  FileText,
  MessageCircle,
  Plus,
  Eye,
} from 'lucide-react';
import { OfferItem } from '../types';
import { buildWhatsAppPromoUrl } from '../services/realDataStore';
import { CloseModalButton } from './CloseModalButton';

interface OffersViewProps {
  offers: OfferItem[];
  searchQuery: string;
  onOpenReportOffer: () => void;
  onOpenVendorProfile?: () => void;
}

// Vista de referencia visual cuando aún no existen tiendas activas registradas en la base de datos
const DESIGN_PREVIEW_OFFER: OfferItem = {
  id: 'preview-promo-arroz',
  title: 'Arroz Extra 5 kg',
  product: 'Arroz Extra 5 kg',
  unit: 'bolsa 5 kg',
  category: 'abarrotes',
  originalPrice: 24.9,
  offerPrice: 21.9,
  discountPercentage: 12.0,
  store: 'Comercial San Martín',
  storePhotoUrl: '/images/huanuco_landscape.png',
  location: 'Jr. San Martín cdra. 8',
  district: 'Huánuco Cercado',
  googleMapsQuery: 'Jr. San Martín cuadra 8 Huánuco',
  hasWhatsapp: true,
  description:
    'Tienda de abarrotes al por mayor y menor en el centro de Huánuco. Productos frescos y bolsas selladas.',
  conditions: 'Válido para pago en efectivo, Yape o Plin hasta agotar stock diario.',
  schedule: 'Lunes a sábado de 7:30 a. m. a 8:00 p. m.',
  validFrom: '2026-09-01',
  validUntil: '2026-10-30',
  promotionStatus: 'OFERTA_ACTIVA',
  isVerified: true,
  trustLevel: 'verified',
  verificationStatus: 'VERIFICADO',
  isExpired: false,
  source: 'Ejemplo visual de tienda con promoción',
  isDemoData: true,
};

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    const [y, m, d] = dateStr.trim().split('-').map(Number);
    const months = [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];
    return `${d} ${months[(m || 1) - 1]} ${y}`;
  }
  return dateStr;
}

function buildLocationMapsUrl(offer: OfferItem): string {
  if (offer.googleMapsUrl && offer.googleMapsUrl.trim().startsWith('http')) {
    return offer.googleMapsUrl.trim();
  }
  const query =
    offer.googleMapsQuery || `${offer.store} ${offer.location} ${offer.district || 'Huánuco'}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildProtectedWhatsAppHref(offer: OfferItem): string {
  const productLabel = (offer.product || offer.title || 'su producto').trim();
  const directWaUrl = buildWhatsAppPromoUrl(offer.whatsapp, productLabel);
  if (directWaUrl) {
    return directWaUrl;
  }
  return `/api/offers/${encodeURIComponent(offer.id)}/whatsapp?product=${encodeURIComponent(
    productLabel
  )}`;
}

export const OffersView: React.FC<OffersViewProps> = ({
  offers,
  searchQuery,
  onOpenReportOffer,
  onOpenVendorProfile,
}) => {
  const [selectedDescriptionOffer, setSelectedDescriptionOffer] = useState<OfferItem | null>(null);
  const [showSampleWhenEmpty, setShowSampleWhenEmpty] = useState<boolean>(true);

  // Filtrar promociones vencidas: una promoción vencida NO debe aparecer como activa
  const activeRealOffers = offers.filter(
    (o) => !o.isExpired && o.promotionStatus !== 'PROMOCION_VENCIDA'
  );

  const displayOffers: OfferItem[] =
    activeRealOffers.length > 0
      ? activeRealOffers
      : showSampleWhenEmpty
      ? [DESIGN_PREVIEW_OFFER]
      : [];

  const filteredOffers = displayOffers.filter((offer) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      offer.title.toLowerCase().includes(q) ||
      (offer.product || '').toLowerCase().includes(q) ||
      offer.store.toLowerCase().includes(q) ||
      offer.location.toLowerCase().includes(q) ||
      offer.district.toLowerCase().includes(q)
    );
  });

  const handlePublishClick = () => {
    if (onOpenVendorProfile) {
      onOpenVendorProfile();
    } else {
      onOpenReportOffer();
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Encabezado ordenado: COMERCIOS LOCALES · HUÁNUCO / Tiendas con promoción / Botón */}
      <div className="bg-[#E6F1DE]/70 border border-[#BAD0B5] rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#165338] uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5 text-[#165338] shrink-0" />
            <span>COMERCIOS LOCALES · HUÁNUCO</span>
          </div>

          {activeRealOffers.length === 0 && (
            <button
              onClick={() => setShowSampleWhenEmpty(!showSampleWhenEmpty)}
              className="text-[11px] font-bold text-[#165338] hover:underline shrink-0 flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              <span>{showSampleWhenEmpty ? 'Ocultar ejemplo' : 'Ver ejemplo'}</span>
            </button>
          )}
        </div>

        <div className="space-y-0.5">
          <h2 className="text-lg font-black text-[#102610] leading-tight">
            Tiendas con promoción
          </h2>
          <p className="text-xs text-[#56654F] leading-relaxed">
            Ofertas directas, claras y rápidas de consultar en Huánuco.
          </p>
        </div>

        <button
          onClick={handlePublishClick}
          className="w-full py-2.5 px-3.5 bg-[#165338] hover:bg-[#102610] active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>PUBLICAR MI TIENDA Y PROMOCIÓN</span>
        </button>
      </div>

      {/* Lista de tarjetas públicas de Tiendas con promoción */}
      <div className="space-y-4">
        {filteredOffers.length === 0 ? (
          <div className="bg-[#E6F1DE] rounded-3xl p-7 text-center border border-[#BAD0B5] text-[#56654F] space-y-2.5">
            <p className="text-sm font-bold text-[#102610]">
              No hay promociones activas en este momento
            </p>
            <p className="text-xs text-[#102610] max-w-xs mx-auto leading-relaxed">
              ¿Tienes una tienda en Huánuco?{' '}
              <strong className="text-[#165338]">
                Registra tu tienda local
              </strong>{' '}
              y publica tus promociones para llegar a más clientes.
            </p>
            <div className="pt-1 flex items-center justify-center">
              <button
                onClick={handlePublishClick}
                className="px-4 py-2.5 bg-[#165338] text-white text-xs font-bold rounded-xl"
              >
                PUBLICAR MI TIENDA Y PROMOCIÓN
              </button>
            </div>
          </div>
        ) : (
          filteredOffers.map((offer) => {
            const storePhotoUrl = offer.storePhotoUrl || offer.imageUrl;
            const productLabel = offer.product || offer.title;
            const whatsappHref = buildProtectedWhatsAppHref(offer);
            const locationHref = buildLocationMapsUrl(offer);
            const isUpcoming = offer.promotionStatus === 'PROXIMAMENTE';

            return (
              <article
                key={offer.id}
                className="product-card-shell bg-[#FDEDD4] rounded-3xl p-4 border border-[#BAD0B5] shadow-[0_1px_3px_rgba(16,38,16,0.03)] space-y-3 transition-all"
              >
                {/* 1. CABECERA DE LA TIENDA: Foto de tienda + Nombre de tienda + Dirección resumida y Distrito */}
                <div className="bg-[#F1E5D3] rounded-2xl p-3 border border-[#BAD0B5] flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#FDF0D4] border border-[#BAD0B5] shrink-0 flex items-center justify-center">
                    {storePhotoUrl ? (
                      <img
                        src={storePhotoUrl}
                        alt={`Tienda ${offer.store}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#165338] p-1 text-center">
                        <Store className="w-6 h-6 stroke-[1.8px]" />
                        <span className="text-[9px] font-bold mt-0.5 leading-none">TIENDA</span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-black text-[#102610] leading-snug truncate">
                      {offer.store}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-[#56654F] mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#165338] shrink-0" />
                      <span className="truncate">
                        {offer.location}
                        {offer.district && !offer.location.includes(offer.district)
                          ? ` · ${offer.district}`
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. ZONA DE PROMOCIÓN */}
                <div className="bg-[#FDF0D4] rounded-2xl p-4 border border-[#BAD0B5] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#D8EACF] text-[#165338] border border-[#BAD0B5] shadow-2xs">
                      <span>{isUpcoming ? '🟢 Próximamente' : '🟢 OFERTA'}</span>
                    </span>

                    {offer.validUntil && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#56654F]">
                        <Calendar className="w-3 h-3 text-[#56654F]" />
                        <span>Vence: {formatDisplayDate(offer.validUntil)}</span>
                      </span>
                    )}
                  </div>

                  {/* Producto en promoción (+ miniatura de producto si existe) */}
                  <div className="flex items-center gap-2.5 pt-0.5">
                    {offer.productPhotoUrl && (
                      <img
                        src={offer.productPhotoUrl}
                        alt={productLabel}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-xl object-cover border border-[#BAD0B5] shrink-0 bg-[#F2F8ED]"
                      />
                    )}
                    <h4 className="text-base sm:text-[17px] font-black text-[#102610] leading-snug">
                      {productLabel}
                    </h4>
                  </div>

                  {/* Precio anterior → Precio promocional y Ahorro */}
                  <div className="flex items-baseline justify-between gap-2 pt-0.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {offer.originalPrice > 0 && (
                        <>
                          <span className="text-sm font-semibold text-[#56654F] bg-[#F1E5D3] px-1.5 py-0.5 rounded line-through">
                            S/ {offer.originalPrice.toFixed(2)}
                          </span>
                          <span className="text-sm font-black text-[#56654F]">→</span>
                        </>
                      )}
                      <span className="text-2xl font-black text-[#165338] tracking-tight">
                        S/ {offer.offerPrice.toFixed(2)}
                      </span>
                    </div>

                    {offer.originalPrice > offer.offerPrice && (
                      <span className="text-[11px] font-bold text-[#165338] bg-[#D8EACF] px-2 py-0.5 rounded-lg border border-[#BAD0B5]">
                        Ahorras S/ {(offer.originalPrice - offer.offerPrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. ACCIONES PÚBLICAS: WhatsApp | Ver ubicación | Ver descripción */}
                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-2 bg-[#165338] hover:bg-[#102610] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-[11px] shadow-2xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">WhatsApp</span>
                  </a>

                  <a
                    href={locationHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-2 bg-[#F1E5D3] hover:bg-[#FDF0D4] text-[#102610] font-bold rounded-xl border border-[#BAD0B5] flex items-center justify-center gap-1 text-[11px] transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#165338] shrink-0" />
                    <span className="truncate">Ver ubicación</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setSelectedDescriptionOffer(offer)}
                    className="py-2.5 px-2 bg-[#F1E5D3] hover:bg-[#FDF0D4] text-[#102610] font-bold rounded-xl border border-[#BAD0B5] flex items-center justify-center gap-1 text-[11px] transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#165338] shrink-0" />
                    <span className="truncate">Ver descripción</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* 13. MODAL PEQUEÑO "VER DESCRIPCIÓN":
          Muestra solamente:
          - Descripción de la tienda
          - Información breve de la promoción
          - Condiciones, si existen
          - Horario, si existe */}
      {selectedDescriptionOffer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#102610]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm bg-[#F2F8ED] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-[#BAD0B5] space-y-3.5"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-10 h-1.5 bg-[#BAD0B5] rounded-full mx-auto sm:hidden" />

            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#165338] block">
                  Descripción de la tienda
                </span>
                <h3 className="text-base font-black text-[#102610] leading-snug">
                  {selectedDescriptionOffer.store}
                </h3>
                <p className="text-xs text-[#56654F]">
                  📍 {selectedDescriptionOffer.location} · {selectedDescriptionOffer.district}
                </p>
              </div>
              <CloseModalButton
                onClose={() => setSelectedDescriptionOffer(null)}
                ariaLabel="Cerrar descripción de la tienda"
              />
            </div>

            {/* Descripción de la tienda */}
            <div className="bg-[#E6F1DE] rounded-2xl p-3.5 border border-[#BAD0B5] text-xs text-[#102610] leading-relaxed">
              {selectedDescriptionOffer.description &&
              selectedDescriptionOffer.description.trim().length > 0
                ? selectedDescriptionOffer.description
                : `Comercio local ubicado en ${selectedDescriptionOffer.location}, ${selectedDescriptionOffer.district}.`}
            </div>

            {/* Información breve de la promoción */}
            <div className="bg-[#FDEDD4] rounded-2xl p-3.5 border border-[#BAD0B5] space-y-1">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#D8EACF] text-[#165338] border border-[#BAD0B5]">
                  🟢 OFERTA
                </span>
                {selectedDescriptionOffer.validUntil && (
                  <span className="text-[11px] font-semibold text-[#56654F]">
                    Vence: {formatDisplayDate(selectedDescriptionOffer.validUntil)}
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-[#102610] pt-0.5">
                {selectedDescriptionOffer.product || selectedDescriptionOffer.title}
              </div>
              <div className="flex items-baseline gap-2">
                {selectedDescriptionOffer.originalPrice > 0 && (
                  <>
                    <span className="text-xs font-semibold text-[#56654F] bg-[#F1E5D3] px-1.5 py-0.5 rounded line-through">
                      S/ {selectedDescriptionOffer.originalPrice.toFixed(2)}
                    </span>
                    <span className="text-xs font-black text-[#56654F]">→</span>
                  </>
                )}
                <span className="text-lg font-black text-[#165338]">
                  S/ {selectedDescriptionOffer.offerPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Condiciones y Horario, si existen */}
            {(selectedDescriptionOffer.conditions || selectedDescriptionOffer.schedule) && (
              <div className="space-y-1.5 text-xs text-[#56654F] px-1">
                {selectedDescriptionOffer.conditions && (
                  <p>
                    <strong className="text-[#102610]">Condiciones:</strong>{' '}
                    {selectedDescriptionOffer.conditions}
                  </p>
                )}
                {selectedDescriptionOffer.schedule && (
                  <p>
                    <strong className="text-[#102610]">Horario:</strong>{' '}
                    {selectedDescriptionOffer.schedule}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedDescriptionOffer(null)}
              className="w-full py-2.5 bg-[#D8EACF] hover:bg-[#C8DCC3] text-[#102610] font-bold text-xs rounded-xl border border-[#BAD0B5] transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
