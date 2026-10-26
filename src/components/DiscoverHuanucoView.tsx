import React, { useState, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Landmark,
  Utensils,
  CheckCircle2,
  ExternalLink,
  Eye,
  Clock,
  Sparkles,
} from 'lucide-react';
import { DiscoverCategory, DiscoverPlace } from '../types';
import {
  getDailyDiscoverSelection,
  buildDiscoverGoogleMapsUrl,
} from '../data/discoverHuanucoData';
import { CloseModalButton } from './CloseModalButton';

interface DiscoverHuanucoViewProps {
  searchQuery?: string;
}

export const DiscoverHuanucoView: React.FC<DiscoverHuanucoViewProps> = ({
  searchQuery = '',
}) => {
  const [activeCategory, setActiveCategory] = useState<DiscoverCategory>('turisticos');
  const [selectedPlace, setSelectedPlace] = useState<DiscoverPlace | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const { recommendedToday, moreToDiscover, dateKey } = useMemo(
    () => getDailyDiscoverSelection(activeCategory),
    [activeCategory]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesSearch = (place: DiscoverPlace): boolean => {
    if (!normalizedQuery) return true;
    const haystack = `${place.name} ${place.location} ${place.district} ${place.province} ${place.shortDescription} ${place.whatItOffers}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  };

  const filteredRecommended = recommendedToday.filter(matchesSearch);
  const filteredMore = moreToDiscover.filter(matchesSearch);

  const hasReliablePhoto = (place: DiscoverPlace): boolean => {
    return Boolean(place.photoUrl && !failedImages[place.id]);
  };

  const renderPlaceCard = (place: DiscoverPlace, isFeatured: boolean) => {
    const mapsUrl = buildDiscoverGoogleMapsUrl(place);
    const showPhoto = hasReliablePhoto(place);

    return (
      <article
        key={place.id}
        className={`bg-black border-2 border-white p-4 space-y-4 transition-all ${
          isFeatured ? 'border-4' : ''
        }`}
      >
        {/* Fotografía real */}
        {showPhoto && (
          <div className="relative w-full h-48 sm:h-64 overflow-hidden border border-white/20">
            <img
              src={place.photoUrl}
              alt={place.name}
              loading="lazy"
              onError={() => setFailedImages((prev) => ({ ...prev, [place.id]: true }))}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            {place.photoAttribution && (
              <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm px-3 py-1.5 border-t border-white/10">
                <span className="text-[10px] font-bold text-white uppercase tracking-widest truncate">
                  FOTO: {place.photoAttribution}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-black text-white uppercase tracking-widest">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{place.updateStatus}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter leading-none">
            {place.name}
          </h3>

          <div className="flex items-start gap-1.5 text-[12px] text-white/80 font-bold uppercase tracking-wider italic">
            <MapPin className="w-3.5 h-3.5 mt-0.5" />
            <span>
              {place.location} · {place.district}
            </span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-white leading-relaxed italic border-l-2 border-white/20 pl-3">
          {place.shortDescription}
        </p>

        <div className="bg-white/5 p-4 border border-white/10 space-y-2">
          <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-white border-b border-white/20 pb-1">
            CRÓNICA LOCAL / SERVICIO
          </span>
          <p className="text-[13px] text-white leading-snug font-medium">
            {place.whatItOffers}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSelectedPlace(place)}
            className="py-2 px-3 bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver lugar</span>
          </button>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 border border-white text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>
          )}
        </div>
      </article>
    );
  };

  return (
    <div id="section-descubre-huanuco" className="w-full px-2 py-4 sm:py-6 space-y-10 pb-28 font-serif">
      <header className="space-y-4 border-b border-white pb-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none">
            DESCUBRE HUÁNUCO
          </h2>
          <div className="flex items-center gap-2 text-[11px] font-black text-white uppercase tracking-widest">
            <Clock className="w-4 h-4" />
            <span>Rotación 24h</span>
          </div>
        </div>
        <p className="text-base sm:text-lg text-white leading-relaxed italic opacity-90">
          Explorando rincones históricos y gastronómicos de la Ciudad de los Caballeros del León.
        </p>

        <div role="tablist" className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'turisticos'}
            onClick={() => setActiveCategory('turisticos')}
            className={`py-4 border-2 font-black uppercase tracking-widest text-xs sm:text-[13px] transition-all ${
              activeCategory === 'turisticos'
                ? 'bg-white text-black border-white'
                : 'bg-black text-white border-white hover:bg-white/5'
            }`}
          >
            <Landmark className="w-4 h-4 inline-block mr-2" />
            Turismo
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'comer'}
            onClick={() => setActiveCategory('comer')}
            className={`py-4 border-2 font-black uppercase tracking-widest text-xs sm:text-[13px] transition-all ${
              activeCategory === 'comer'
                ? 'bg-white text-black border-white'
                : 'bg-black text-white border-white hover:bg-white/5'
            }`}
          >
            <Utensils className="w-4 h-4 inline-block mr-2" />
            Gastronomía
          </button>
        </div>
      </header>

      {filteredRecommended.length === 0 && filteredMore.length === 0 ? (
        <div className="p-12 border-4 border-double border-white text-center">
          <p className="text-xl font-black text-white uppercase tracking-widest italic">
            Sin resultados verificados.
          </p>
        </div>
      ) : (
        <div className="space-y-12 sm:space-y-16">
          {filteredRecommended.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-xs font-black bg-white text-black px-3 py-1 uppercase tracking-[0.2em]">
                  RECOMENDADO
                </h3>
                <div className="h-px flex-1 bg-white/20" />
              </div>
              <div className="space-y-8">
                {filteredRecommended.map((place) => renderPlaceCard(place, true))}
              </div>
            </section>
          )}

          {filteredMore.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                  MÁS LUGARES
                </h3>
                <div className="h-px flex-1 bg-white/20" />
              </div>
              <div className="space-y-8">
                {filteredMore.map((place) => renderPlaceCard(place, false))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* MODAL DETALLE */}
      {selectedPlace && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedPlace(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-black border-t-2 sm:border-2 border-white p-6 space-y-6 font-serif"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                  {selectedPlace.categoryLabel}
                </span>
                <h3 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tighter">
                  {selectedPlace.name}
                </h3>
              </div>
              <CloseModalButton onClose={() => setSelectedPlace(null)} />
            </div>

            {hasReliablePhoto(selectedPlace) && (
              <div className="border-4 border-double border-white overflow-hidden">
                <img src={selectedPlace.photoUrl} alt={selectedPlace.name} className="w-full aspect-video object-cover" />
              </div>
            )}

            <div className="space-y-6 text-white">
              <div className="bg-white/5 p-4 border border-white/10 italic">
                <p className="text-lg sm:text-xl leading-relaxed">{selectedPlace.shortDescription}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-white/20 pt-6">
                <div className="space-y-2">
                  <span className="text-[12px] font-black uppercase tracking-widest block text-white/50">UBICACIÓN</span>
                  <p className="text-base font-bold">📍 {selectedPlace.location}</p>
                  <p className="text-sm opacity-80">{selectedPlace.district}, {selectedPlace.province}</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[12px] font-black uppercase tracking-widest block text-white/50">DESTACADOS</span>
                  <p className="text-base font-medium">{selectedPlace.whatItOffers}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t-2 border-white flex flex-col sm:flex-row gap-4">
              {buildDiscoverGoogleMapsUrl(selectedPlace) && (
                <a
                  href={buildDiscoverGoogleMapsUrl(selectedPlace) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-4 bg-white text-black font-black uppercase tracking-widest text-sm text-center hover:bg-gray-200"
                >
                  Abrir Google Maps
                </a>
              )}
              <button
                onClick={() => setSelectedPlace(null)}
                className="flex-1 py-4 border-2 border-white text-white font-black uppercase tracking-widest text-sm hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
