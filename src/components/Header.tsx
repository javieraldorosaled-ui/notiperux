import React from 'react';
import { MapPin, Download, WifiOff, User } from 'lucide-react';

interface HeaderProps {
  onOpenInstall: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenAccount?: () => void;
  onGoHome?: () => void;
  canInstallPrompt: boolean;
  isStandalone?: boolean;
  isOnline: boolean;
  favoritesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenInstall,
  onOpenAccount,
  onGoHome,
  isStandalone = false,
  isOnline,
  favoritesCount = 0,
}) => {
  return (
    <header className="bg-[#F2F8ED]/95">
      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="bg-[#FDEDD4] border-b border-[#BAD0B5] px-4 py-1 flex items-center justify-center gap-2 text-xs text-[#102610] font-medium">
          <WifiOff className="w-3.5 h-3.5 text-[#56654F]" />
          <span>Modo sin conexión · Datos guardados</span>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-md mx-auto px-3.5 py-2 flex items-center justify-between gap-2">
        {/* Brand & Location */}
        <div
          onClick={onGoHome}
          role={onGoHome ? 'button' : undefined}
          tabIndex={onGoHome ? 0 : undefined}
          onKeyDown={(e) => {
            if (onGoHome && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onGoHome();
            }
          }}
          className={`flex items-center gap-2 min-w-0 shrink-0 ${
            onGoHome ? 'cursor-pointer active:opacity-80' : ''
          }`}
        >
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="NotiPerúx"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="font-extrabold text-[16px] sm:text-[17px] tracking-tight text-[#102610] leading-tight">
              NotiPerúx
            </h1>
            <div className="flex items-center gap-1 text-[11px] text-[#56654F] font-medium">
              <MapPin className="w-3 h-3 text-[#165338] shrink-0" />
              <span>Huánuco, Perú</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Account & Install */}
        <div className="flex items-center gap-1.5 min-w-0">
          {onOpenAccount && (
            <button
              onClick={onOpenAccount}
              className="relative p-2 text-[#56654F] hover:text-[#102610] bg-gradient-to-b from-[#FFFFFF] to-[#EAF2E4] hover:bg-[#D8EACF] rounded-full border border-[#BAD0B5] border-b-[2.5px] border-b-[#86A87C] shadow-[0_2px_3px_rgba(16,38,16,0.12)] transition-all active:translate-y-[1px] active:border-b-[1px] shrink-0"
              aria-label="Mi Cuenta"
              title="Mi Cuenta y Preferencias"
            >
              <User className="w-4 h-4" />
              {favoritesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#165338] text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-2xs">
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          {!isStandalone && (
            <button
              id="btn-install-app"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (
                  e.nativeEvent &&
                  typeof e.nativeEvent.stopImmediatePropagation === 'function'
                ) {
                  e.nativeEvent.stopImmediatePropagation();
                }
                onOpenInstall(e);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-b from-[#1b6243] to-[#12452e] hover:bg-[#102610] active:translate-y-[1.5px] active:border-b-[1px] transition-all text-white text-[11px] sm:text-xs font-semibold rounded-2xl border border-[#0e3926] border-b-[3px] border-b-[#072418] shadow-[0_2px_4px_rgba(16,38,16,0.22)] text-left leading-tight max-w-[165px] sm:max-w-[190px]"
              aria-label="Instalar esta página en móvil como una aplicación"
            >
              <Download className="w-3.5 h-3.5 text-[#D8EACF] shrink-0" />
              <span>Instalar esta página en móvil como una aplicación</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
