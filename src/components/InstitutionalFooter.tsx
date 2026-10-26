import React from 'react';
import {
  ShieldCheck,
  Lock,
  FileText,
  Users,
  Mail,
  Cookie,
  ExternalLink,
  Newspaper,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { LegalDocType } from './LegalModals';

interface InstitutionalFooterProps {
  onOpenLegal: (doc: LegalDocType) => void;
}

export const InstitutionalFooter: React.FC<InstitutionalFooterProps> = ({ onOpenLegal }) => {
  const currentYear = new Date().getFullYear();

  const handleOpenCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('openCookieBanner'));
  };

  return (
    <footer className="w-full bg-[#0a0a0a] text-neutral-300 border-t-4 border-double border-neutral-700 pt-12 pb-24 px-4 sm:px-8 mt-16 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Cabecera del Diario */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-800 pb-8 gap-6">
          <div className="space-y-2">
            <h2 className="font-serif font-black text-3xl sm:text-4xl text-white tracking-tighter uppercase leading-none">
              NOTIPERUX
            </h2>
            <p className="text-xs sm:text-sm font-serif font-bold uppercase tracking-widest text-neutral-400">
              EL DIARIO DE MAYOR CIRCULACIÓN INFORMATIVA DEL PERÚ
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-400 pt-1">
              <MapPin className="w-3.5 h-3.5 text-[#93c5aa]" />
              <span>Redacción Central Huánuco · Corresponsalía Lima, Perú</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            <span className="inline-flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Edición Verificada 24/7</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Periodismo Independiente</span>
            </span>
          </div>
        </div>

        {/* 4 Columnas de Enlaces & Transparencia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs">
          {/* Col 1: Legal y Google AdSense */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-sm text-white uppercase tracking-wider border-b border-neutral-800 pb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#93c5aa]" />
              <span>Legal & Privacidad</span>
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacidad')}
                  className="hover:text-white transition-colors cursor-pointer text-left block"
                >
                  Política de Privacidad (AdSense)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('terminos')}
                  className="hover:text-white transition-colors cursor-pointer text-left block"
                >
                  Términos y Condiciones de Uso
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookiePreferences}
                  className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-1 text-[#93c5aa]"
                >
                  <Cookie className="w-3 h-3" />
                  <span>Configuración de Cookies</span>
                </button>
              </li>
              <li>
                <a
                  href="https://policies.google.com/technologies/partner-sites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors text-neutral-400 inline-flex items-center gap-1"
                >
                  <span>Políticas de Partners de Google</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Quiénes Somos & Editorial */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-sm text-white uppercase tracking-wider border-b border-neutral-800 pb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#93c5aa]" />
              <span>Institucional</span>
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('quienes-somos')}
                  className="hover:text-white transition-colors cursor-pointer text-left block"
                >
                  Quiénes Somos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('quienes-somos')}
                  className="hover:text-white transition-colors cursor-pointer text-left block"
                >
                  Consejo Editorial & Periodistas
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('quienes-somos')}
                  className="hover:text-white transition-colors cursor-pointer text-left block"
                >
                  Principios Éticos y Deontológicos
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('quienes-somos')}
                  className="hover:text-white transition-colors cursor-pointer text-left block"
                >
                  Sostenibilidad y Misión Regional
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contacto & Rectificaciones */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-sm text-white uppercase tracking-wider border-b border-neutral-800 pb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#93c5aa]" />
              <span>Atención al Lector</span>
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('contacto')}
                  className="hover:text-white transition-colors cursor-pointer text-left block font-medium"
                >
                  Contacto & Buzón de Prensa
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenLegal('contacto')}
                  className="hover:text-white transition-colors cursor-pointer text-left block font-medium text-amber-300"
                >
                  Política de Rectificaciones
                </button>
              </li>
              <li className="text-neutral-400 pt-1">
                <span className="block text-[11px] text-neutral-500 uppercase tracking-wider">Correo Editorial & Rectificaciones</span>
                <a href="mailto:javieraldorosaled@gmail.com" className="font-mono text-emerald-400 hover:underline">
                  javieraldorosaled@gmail.com
                </a>
              </li>
              <li className="text-neutral-400">
                <span className="block text-[11px] text-neutral-500 uppercase tracking-wider">Atención al Lector & Publicidad</span>
                <a href="mailto:javieraldorosaled@gmail.com" className="font-mono text-emerald-400 hover:underline">
                  javieraldorosaled@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Fuentes & Divulgación de Transparencia */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-sm text-white uppercase tracking-wider border-b border-neutral-800 pb-1.5 flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5 text-[#93c5aa]" />
              <span>Fuentes Acreditadas</span>
            </h3>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Monitoreo y cita periodística rigurosa de fuentes primarias del Perú y agencias mundiales: RPP Noticias, El Comercio, Andina Agencia Peruana de Noticias, La República, diario oficial El Peruano y corresponsalías locales de Huánuco.
            </p>
            <p className="text-neutral-500 text-[10px] uppercase tracking-wider pt-1">
              Todos los enlaces y derechos patrimoniales corresponden a sus respectivos autores.
            </p>
          </div>
        </div>

        {/* Bloque Informativo sobre Publicidad de Google AdSense */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 space-y-1.5">
          <div className="text-white font-bold flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#93c5aa]" />
            <span>Transparencia en Financiación & Google AdSense</span>
          </div>
          <p className="text-[11px] leading-relaxed text-neutral-400">
            NotiPerúx es un medio informativo de libre acceso. Para mantener nuestras operaciones y remunerar a nuestro equipo editorial sin cobrar muros de pago (paywalls) a los lectores, mostramos anuncios servidos a través de la red publicitaria de Google AdSense. Google utiliza cookies para personalizar la publicidad; usted puede gestionar sus preferencias en cualquier momento desde nuestra{' '}
            <button
              type="button"
              onClick={() => onOpenLegal('privacidad')}
              className="text-[#93c5aa] underline font-semibold hover:text-white cursor-pointer"
            >
              Política de Privacidad
            </button>{' '}
            o en el portal de configuración de anuncios de Google.
          </p>
        </div>

        {/* Copyright y Pie de Página */}
        <div className="pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {currentYear} NotiPerúx Digital · Todos los derechos reservados. Registrado en la República del Perú.</p>
          <div className="flex items-center gap-4 text-neutral-400">
            <button
              type="button"
              onClick={() => onOpenLegal('privacidad')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacidad
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => onOpenLegal('terminos')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Términos
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => onOpenLegal('quienes-somos')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Equipo
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => onOpenLegal('contacto')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contacto
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
