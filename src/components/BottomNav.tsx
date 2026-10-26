import React from 'react';
import { User } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAccount?: () => void;
  isAccountOpen?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAccount,
  isAccountOpen = false,
}) => {
  const isPeruActive = !isAccountOpen && (activeTab === 'peru' || activeTab === 'inicio');
  const isIntlActive = !isAccountOpen && activeTab === 'internacional';
  const isPerfilActive = isAccountOpen;

  return (
    <nav
      aria-label="Navegación principal de noticias"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#F2F8ED]/98 backdrop-blur-md border-t border-[#A8C3A0] shadow-[0_-2px_10px_rgba(16,38,16,0.06)] safe-bottom"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 gap-1.5 px-2 py-1.5 items-stretch">
        {/* 1. NOTICIAS PERUANAS */}
        <button
          id="nav-tab-peru"
          type="button"
          onClick={() => onTabChange('peru')}
          aria-label="Noticias Peruanas"
          aria-current={isPeruActive ? 'page' : undefined}
          className={`group relative flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl border transition-all duration-150 focus:outline-none select-none min-w-0 cursor-pointer ${
            isPeruActive
              ? 'bg-gradient-to-b from-[#E6F3DF] to-[#CBE5BC] border-[#6D9C6E] border-b-[3px] border-b-[#165338] text-[#102610] shadow-[0_1.5px_2px_rgba(22,83,56,0.18)]'
              : 'bg-white hover:bg-[#F2F8ED] border-[#BAD5B6] text-[#2F442C] hover:text-[#102610]'
          }`}
        >
          <span className="text-xl sm:text-2xl leading-none select-none filter drop-shadow-2xs transition-transform group-hover:scale-105">
            🇵🇪
          </span>
          <span
            className={`mt-0.5 text-xs sm:text-[13px] leading-tight truncate w-full text-center ${
              isPeruActive
                ? 'font-extrabold text-[#102610]'
                : 'font-bold text-[#3B5437]'
            }`}
          >
            Perú
          </span>
        </button>

        {/* 2. NOTICIAS INTERNACIONALES */}
        <button
          id="nav-tab-internacional"
          type="button"
          onClick={() => onTabChange('internacional')}
          aria-label="Noticias Internacionales"
          aria-current={isIntlActive ? 'page' : undefined}
          className={`group relative flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl border transition-all duration-150 focus:outline-none select-none min-w-0 cursor-pointer ${
            isIntlActive
              ? 'bg-gradient-to-b from-[#E6F3DF] to-[#CBE5BC] border-[#6D9C6E] border-b-[3px] border-b-[#165338] text-[#102610] shadow-[0_1.5px_2px_rgba(22,83,56,0.18)]'
              : 'bg-white hover:bg-[#F2F8ED] border-[#BAD5B6] text-[#2F442C] hover:text-[#102610]'
          }`}
        >
          <span className="text-xl sm:text-2xl leading-none select-none filter drop-shadow-2xs transition-transform group-hover:scale-105">
            🌎
          </span>
          <span
            className={`mt-0.5 text-xs sm:text-[13px] leading-tight truncate w-full text-center ${
              isIntlActive
                ? 'font-extrabold text-[#102610]'
                : 'font-bold text-[#3B5437]'
            }`}
          >
            Internacional
          </span>
        </button>

        {/* 3. PERFIL */}
        <button
          id="nav-tab-perfil"
          type="button"
          onClick={onOpenAccount}
          aria-label="Perfil y Cuenta"
          aria-current={isPerfilActive ? 'page' : undefined}
          className={`group relative flex flex-col items-center justify-center min-h-[46px] py-1 px-1 rounded-xl border transition-all duration-150 focus:outline-none select-none min-w-0 cursor-pointer ${
            isPerfilActive
              ? 'bg-gradient-to-b from-[#E6F3DF] to-[#CBE5BC] border-[#6D9C6E] border-b-[3px] border-b-[#165338] text-[#102610] shadow-[0_1.5px_2px_rgba(22,83,56,0.18)]'
              : 'bg-white hover:bg-[#F2F8ED] border-[#BAD5B6] text-[#2F442C] hover:text-[#102610]'
          }`}
        >
          <div className="flex items-center justify-center">
            <User
              className={`w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] transition-all ${
                isPerfilActive
                  ? 'text-[#165338] stroke-[2.5px] scale-105'
                  : 'text-[#486344] stroke-[2px]'
              }`}
            />
          </div>
          <span
            className={`mt-0.5 text-xs sm:text-[13px] leading-tight truncate w-full text-center ${
              isPerfilActive
                ? 'font-extrabold text-[#102610]'
                : 'font-bold text-[#3B5437]'
            }`}
          >
            Perfil
          </span>
        </button>
      </div>
    </nav>
  );
};
