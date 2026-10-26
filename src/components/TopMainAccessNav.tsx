import React from 'react';
import { TrendingUp, Fuel, Store, Compass, Newspaper } from 'lucide-react';
import { ActiveTab } from '../types';

interface TopMainAccessNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  offersCount?: number;
}

export const TopMainAccessNav: React.FC<TopMainAccessNavProps> = ({
  activeTab,
  onSelectTab,
  offersCount = 0,
}) => {
  const mainButtons: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'precios',
      label: 'Precios Huánuco',
      icon: TrendingUp,
    },
    {
      id: 'combustibles',
      label: 'Combustibles Huánuco',
      icon: Fuel,
    },
    {
      id: 'ofertas',
      label: 'Tiendas Huánuco',
      icon: Store,
      badge: offersCount,
    },
    {
      id: 'descubre',
      label: 'Lugares en Huánuco',
      icon: Compass,
    },
    {
      id: 'noticias',
      label: 'Noticias Huánuco',
      icon: Newspaper,
    },
  ];

  return (
    <nav
      aria-label="Navegación principal de Huánuco"
      className="bg-[#F2F8ED] px-3 py-1"
    >
      {/* Contenedor visual tipo bandeja ("dock") para los 5 botones principales */}
      <div className="max-w-md mx-auto bg-[#D6E6D5] p-1 rounded-xl border border-[#92B889] shadow-[inset_0_2px_4px_rgba(16,38,16,0.10)]">
        <div className="grid grid-cols-2 gap-1.5">
          {mainButtons.map((btn, index) => {
            const Icon = btn.icon;
            const isActive = activeTab === btn.id;
            const isFullWidth = index === 4;

            return (
              <button
                key={btn.id}
                id={`top-main-btn-${btn.id}`}
                type="button"
                onClick={() => onSelectTab(btn.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative w-full min-h-[34px] sm:min-h-[36px] px-2.5 py-1.5 rounded-lg flex items-center ${
                  isFullWidth ? 'col-span-2 justify-center' : 'justify-start'
                } gap-1.5 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C62828] select-none ${
                  isActive
                    ? 'bg-gradient-to-b from-[#1b6243] to-[#12452e] text-white border border-[#0d3b25] border-b-[3px] border-b-[#C62828] shadow-[0_2px_5px_rgba(198,40,40,0.35),inset_0_1px_0_rgba(255,255,255,0.2)] active:translate-y-[1.5px] active:border-b-[1.5px]'
                    : 'bg-gradient-to-b from-[#FFFFFF] via-[#FCFDFC] to-[#EFF5ED] hover:from-[#FFFFFF] hover:to-[#E5EFE2] text-[#0A1A0A] hover:text-black border border-[#FFCDD2] border-b-[3px] border-b-[#E53935] hover:border-b-[#C62828] shadow-[0_2px_3px_rgba(198,40,40,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] active:translate-y-[1.5px] active:border-b-[1.5px]'
                }`}
              >
                {/* Micro-cápsula para el icono para reforzar apariencia de botón físico */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/20 text-[#E2F1DC]'
                      : 'bg-[#EBF4E8] text-[#165338] border border-[#D5E5D1]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 stroke-[2.4px]" />
                </div>

                <span
                  className={`text-[11.5px] min-[360px]:text-[12px] min-[400px]:text-[12.5px] leading-[1.15] tracking-tight break-words ${
                    isActive ? 'font-black text-white' : 'font-extrabold text-[#0B1E0B]'
                  }`}
                >
                  {btn.label}
                </span>

                {btn.badge !== undefined && btn.badge > 0 && (
                  <span
                    className={`ml-auto text-[9.5px] font-black px-1.5 py-0.5 rounded-full leading-none shrink-0 ${
                      isActive
                        ? 'bg-[#FDEDD4] text-[#102610]'
                        : 'bg-[#D8EACF] text-[#165338]'
                    }`}
                  >
                    {btn.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
