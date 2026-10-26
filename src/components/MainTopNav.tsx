import React, { useState, useRef, useEffect } from 'react';
import { User, Newspaper, Globe, Flag, ChevronDown, Check, Sparkles } from 'lucide-react';
import { ActiveTab, NewsItem } from '../types';
import { NEWS_CATEGORIES } from '../data/categories';
import { TopNavAudioButton } from './TopNavAudioButton';

interface MainTopNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAccount: () => void;
  onOpenInstall?: () => void;
  isAccountOpen?: boolean;
  selectedTopicId?: string;
  onSelectTopic?: (topicId: string) => void;
  currentSectionNews?: NewsItem[];
  sectionLabel?: string;
}

export const MainTopNav: React.FC<MainTopNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAccount,
  isAccountOpen = false,
  selectedTopicId = 'todas',
  onSelectTopic,
  currentSectionNews = [],
  sectionLabel = 'Perú',
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const isPeruActive = !isAccountOpen && (activeTab === 'peru' || activeTab === 'inicio');
  const isIntlActive = !isAccountOpen && activeTab === 'internacional';
  const isKioskoActive = !isAccountOpen && activeTab === 'kiosko';
  const isPerfilActive = isAccountOpen;

  const currentCategory = NEWS_CATEGORIES.find((t) => t.id === selectedTopicId) || NEWS_CATEGORIES[0];
  const isFiltering = selectedTopicId !== 'todas';

  // Cerrar desplegable al hacer clic o tocar fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <nav
      aria-label="Navegación principal de noticias"
      className="fixed top-0 left-0 w-full z-40 bg-black border-b-2 border-white shadow-xl safe-top font-serif"
    >
      {/* Barra superior de pestañas con soporte dual celular + escritorio */}
      <div className="w-full flex items-stretch bg-black max-w-7xl mx-auto">
        {/* BLOQUE PESTAÑA: 🇵🇪 NOTICIAS DEL PERÚ + BOTÓN FILTRO */}
        <div className="flex-1 min-w-0 flex flex-col justify-start relative select-none">
          {/* Pestaña principal "🇵🇪 NOTICIAS DEL PERÚ" */}
          <button
            type="button"
            onClick={() => onTabChange('peru')}
            className={`w-full ${
              isPeruActive ? 'py-2 sm:py-2.5' : 'py-3.5 sm:py-4 h-full'
            } flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all relative px-1 cursor-pointer ${
              isPeruActive
                ? 'bg-white text-black'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flag className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isPeruActive ? 'text-black' : 'text-white/50'}`} />
            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.02em] text-center leading-tight px-0.5">
              NOTICIAS DEL PERÚ
            </span>
            {isPeruActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20" />}
          </button>

          {/* Botón de Categorías / Filtro con indicador del tema activo */}
          {isPeruActive && (
            <div className="w-full relative pb-1 px-0.5" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen((prev) => !prev);
                }}
                aria-expanded={isDropdownOpen}
                aria-label="Filtrar temas de noticias"
                title="Filtrar por categoría (19 disponibles)"
                className={`mt-[2px] w-full h-[26px] sm:h-7 px-1.5 rounded-sm text-[10px] sm:text-[11px] font-medium flex items-center justify-between border transition-all cursor-pointer select-none ${
                  isFiltering
                    ? 'bg-white text-[#165338] border-[#165338] shadow-xs font-bold'
                    : 'bg-[#F2F8ED] hover:bg-[#EAF2E4] text-[#165338] border-[#165338]/40 hover:border-[#165338]'
                }`}
              >
                <span className="flex items-center gap-1 leading-none truncate">
                  <ChevronDown
                    className={`w-3 h-3 text-[#165338] transition-transform duration-150 shrink-0 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                  <span className="truncate">
                    {isFiltering ? currentCategory.name : '19 Categorías'}
                  </span>
                </span>
                {isFiltering && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#165338] shrink-0 ml-0.5" />
                )}
              </button>

              {/* Menú de categorías desplegable vertical con scroll suave */}
              {isDropdownOpen && (
                <div
                  role="listbox"
                  aria-label="Seleccionar categoría de noticias"
                  className="absolute top-full left-0 right-0 w-full sm:w-72 mt-[2px] bg-white border-2 border-[#165338] shadow-2xl py-1 z-50 text-left divide-y divide-neutral-100 font-sans animate-in fade-in duration-150 rounded-b-md max-h-80 overflow-y-auto"
                >
                  <div className="px-2 py-1 bg-neutral-100 text-[9px] font-bold text-neutral-600 uppercase tracking-widest border-b border-neutral-200">
                    19 Categorías Oficiales
                  </div>
                  {NEWS_CATEGORIES.map((cat, index) => {
                    const isSelected = cat.id === selectedTopicId;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          if (onSelectTopic) onSelectTopic(cat.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 text-[11px] text-left flex items-center justify-between transition-colors cursor-pointer select-none leading-tight ${
                          isSelected
                            ? 'bg-[#E7F2E4] text-[#165338] font-bold'
                            : 'text-neutral-800 hover:bg-[#F2F8ED] hover:text-[#165338] font-medium'
                        }`}
                      >
                        <span className="truncate">
                          {index === 0 ? '★ ' : `${index}. `}{cat.name}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#165338] shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tab 2: NOTICIAS DEL MUNDO */}
        <button
          onClick={() => onTabChange('internacional')}
          className={`flex-1 min-w-0 py-3.5 sm:py-4 flex flex-col items-center justify-center gap-1.5 transition-all relative border-l border-white/20 px-1 cursor-pointer ${
            isIntlActive 
              ? 'bg-white text-black' 
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe className={`w-4 h-4 ${isIntlActive ? 'text-black' : 'text-white/50'}`} />
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.02em] text-center leading-tight px-0.5">NOTICIAS DEL MUNDO</span>
          {isIntlActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20" />}
        </button>

        {/* Tab 3: KIOSKO */}
        <button
          onClick={() => onTabChange('kiosko')}
          className={`flex-1 min-w-0 py-3.5 sm:py-4 flex flex-col items-center justify-center gap-1.5 transition-all relative border-l border-white/20 px-1 cursor-pointer ${
            isKioskoActive 
              ? 'bg-white text-black' 
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Newspaper className={`w-4 h-4 ${isKioskoActive ? 'text-black' : 'text-white/50'}`} />
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.02em] text-center px-0.5">KIOSKO</span>
          {isKioskoActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20" />}
        </button>

        {/* Tab: ESCUCHAR TODAS (Audio lector) */}
        <TopNavAudioButton
          news={currentSectionNews}
          sectionLabel={sectionLabel}
        />

        {/* Tab 4: PERFIL */}
        <button
          onClick={onOpenAccount}
          className={`flex-1 min-w-0 py-3.5 sm:py-4 flex flex-col items-center justify-center gap-1.5 transition-all relative border-l border-white/20 px-1 cursor-pointer ${
            isPerfilActive 
              ? 'bg-white text-black' 
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <User className={`w-4 h-4 ${isPerfilActive ? 'text-black' : 'text-white/50'}`} />
          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.02em] text-center px-0.5">PERFIL</span>
          {isPerfilActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20" />}
        </button>
      </div>
    </nav>
  );
};
