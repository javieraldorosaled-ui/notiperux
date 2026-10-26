import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X, Settings2 } from 'lucide-react';
import { LegalDocType } from './LegalModals';

const STORAGE_KEY = 'notiperux_cookie_consent_choice';

export interface CookieBannerProps {
  onOpenLegal: (doc: LegalDocType) => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenLegal }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [adCookiesAllowed, setAdCookiesAllowed] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedChoice = localStorage.getItem(STORAGE_KEY);
      if (!savedChoice) {
        // Mostrar con un leve retraso de 800ms para no entorpecer el primer render
        const t = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  // Escuchar evento para abrir manualmente la configuración desde el Footer
  useEffect(() => {
    const handleReopen = () => {
      setIsVisible(true);
      setShowPreferences(true);
    };
    window.addEventListener('openCookieBanner', handleReopen);
    return () => window.removeEventListener('openCookieBanner', handleReopen);
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice: 'all', timestamp: Date.now() }));
    } catch {}
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice: 'necessary_only', timestamp: Date.now() }));
    } catch {}
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          choice: adCookiesAllowed ? 'all' : 'necessary_only',
          timestamp: Date.now(),
        })
      );
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de Cookies y Privacidad"
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-5 bg-[#0d0d0d]/95 backdrop-blur-md border-t-2 border-neutral-700 shadow-2xl text-neutral-200"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Texto explicativo */}
        <div className="space-y-1.5 flex-1 pr-2">
          <div className="flex items-center gap-2">
            <Cookie className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-serif">
              Aviso de Privacidad, Cookies y Google AdSense
            </h3>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Utilizamos tecnologías de almacenamiento técnico esencial (preferencias de voz y lectura sin conexión) y cookies de terceros (incluyendo Google AdSense) para financiar nuestra cobertura periodística independiente mediante publicidad relevante. Puedes aceptar todas las cookies, configurar tus preferencias o consultar nuestra{' '}
            <button
              type="button"
              onClick={() => onOpenLegal('privacidad')}
              className="text-[#93c5aa] underline font-bold hover:text-white cursor-pointer"
            >
              Política de Privacidad y Cookies
            </button>
            .
          </p>

          {showPreferences && (
            <div className="pt-3 pb-1 border-t border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center justify-between bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
                <div>
                  <span className="font-bold text-white block">Cookies Técnicas & Almacenamiento Local (Esenciales)</span>
                  <span className="text-neutral-400 text-[11px]">
                    Necesarias para recordar el reproductor de audio, noticias guardadas y funcionamiento de la web.
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
                  Siempre Activas
                </span>
              </div>

              <div className="flex items-center justify-between bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
                <div>
                  <span className="font-bold text-white block">Cookies Publicitarias de Terceros (Google AdSense)</span>
                  <span className="text-neutral-400 text-[11px]">
                    Permiten a Google y sus socios mostrar anuncios adaptados a sus intereses de navegación.
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adCookiesAllowed}
                    onChange={(e) => setAdCookiesAllowed(e.target.checked)}
                    className="w-4 h-4 accent-[#165338] cursor-pointer"
                  />
                  <span className="text-[11px] font-semibold text-white">
                    {adCookiesAllowed ? 'Permitido' : 'Desactivado'}
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-end">
          {showPreferences ? (
            <button
              type="button"
              onClick={handleSaveCustom}
              className="px-4 py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Guardar Preferencias
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 font-semibold text-xs hover:text-white hover:bg-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Preferencias</span>
              </button>
              <button
                type="button"
                onClick={handleAcceptNecessary}
                className="px-3 py-2 rounded-lg bg-neutral-800 text-neutral-300 font-semibold text-xs hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Solo necesarias
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
              >
                Aceptar todas
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
