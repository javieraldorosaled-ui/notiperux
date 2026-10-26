import React from 'react';
import {
  User as UserIcon,
  CheckCircle2,
  Download,
  Volume2,
  Globe2,
  Sparkles,
  ShieldCheck,
  Lock,
  FileText,
  Users,
  Mail,
  Cookie,
  ExternalLink,
  MapPin,
  Building2,
  Scale,
  Award,
  Radio,
} from 'lucide-react';
import { CloseModalButton } from './CloseModalButton';
import { LegalDocType } from './LegalModals';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNews?: (id: string) => void;
  onOpenInstall?: () => void;
  onOpenLegal?: (doc: LegalDocType) => void;
  favorites?: unknown;
  onToggleFavorite?: unknown;
  prices?: unknown;
  fuels?: unknown;
  offers?: unknown;
  reports?: unknown;
  visitorStats?: {
    totalVisits: number;
    todayVisits: number;
    installedApps?: number;
    registeredUsers?: number;
    lastVisitAt?: string;
  };
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onOpenInstall,
  onOpenLegal,
  visitorStats,
}) => {
  if (!isOpen) return null;

  const handleOpenCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('openCookieBanner'));
  };

  const handleOpenDoc = (doc: LegalDocType) => {
    if (onOpenLegal) {
      onClose();
      onOpenLegal(doc);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Perfil del lector y datos institucionales"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-black border-2 border-white text-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Estilo Prensa */}
        <div className="bg-black border-b-2 border-white px-4 sm:px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <UserIcon className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white leading-tight">
                PERFIL DEL LECTOR · NOTIPERÚX
              </h2>
              <p className="text-[10px] text-neutral-400 font-serif">
                Transparencia Editorial · E-E-A-T Verificado
              </p>
            </div>
          </div>
          <CloseModalButton onClose={onClose} ariaLabel="Cerrar perfil" />
        </div>

        {/* Contenido Principal con Scroll Suave */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* 1. Tarjeta de Lector Libre e Independiente */}
          <div className="border border-white/20 bg-neutral-950 p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>ACCESO LIBRE Y GRATUITO</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Sin Registro Requerido</span>
              </span>
            </div>

            <div className="flex items-center gap-3.5 pt-1">
              <div className="w-14 h-14 rounded-full border-2 border-white bg-neutral-900 flex items-center justify-center shrink-0">
                <UserIcon className="w-7 h-7 text-white" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-base font-black text-white truncate uppercase font-serif">
                  Lector NotiPerúx
                </p>
                <p className="text-xs text-neutral-400">
                  Acceso sin registro ni muros de pago (paywalls)
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/10 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Portal Abierto y Verificado</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed pt-1">
              En NotiPerúx disfrutas de información periodística verificada del Perú y del mundo, con reproductor de voz integrado y actualización continua en tiempo real.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2.5 bg-neutral-900 border border-white/10 flex items-center gap-2 text-neutral-200 font-semibold">
                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Lectura por voz</span>
              </div>
              <div className="p-2.5 bg-neutral-900 border border-white/10 flex items-center gap-2 text-neutral-200 font-semibold">
                <Globe2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Nacional e Intl.</span>
              </div>
            </div>
          </div>

          {/* 2. Cabecera Institucional del Diario (Solicitada expresamente) */}
          <div className="border-2 border-white bg-black p-4 sm:p-5 space-y-3">
            <div className="border-b border-white/20 pb-3">
              <h3 className="text-xl sm:text-2xl font-black font-serif uppercase tracking-tight text-white leading-tight">
                NOTIPERUX
              </h3>
              <p className="text-xs font-serif font-bold uppercase tracking-wider text-emerald-400">
                EL DIARIO DE MAYOR CIRCULACIÓN INFORMATIVA DEL PERÚ
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Redacción Central Huánuco · Corresponsalía Lima, Perú</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-white/20 text-neutral-200 font-bold uppercase">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edición Verificada 24/7</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 border border-white/20 text-neutral-200 font-bold uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Periodismo Independiente</span>
              </span>
            </div>
          </div>

          {/* 3. Transparencia en Financiación & Google AdSense */}
          <div className="border border-emerald-500/40 bg-neutral-950 p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Transparencia en Financiación & Google AdSense</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed text-justify">
              NotiPerúx es un medio informativo de libre acceso. Para mantener nuestras operaciones y remunerar a nuestro equipo editorial sin cobrar muros de pago (paywalls) a los lectores, mostramos anuncios servidos a través de la red publicitaria de Google AdSense. Google utiliza cookies para personalizar la publicidad; usted puede gestionar sus preferencias en cualquier momento desde nuestra Política de Privacidad o en el portal de configuración de anuncios de Google.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px]">
              <button
                type="button"
                onClick={() => handleOpenDoc('privacidad')}
                className="text-emerald-400 hover:text-emerald-300 underline font-bold cursor-pointer"
              >
                Ver Política de Privacidad (AdSense) →
              </button>
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white inline-flex items-center gap-1 text-[11px]"
              >
                <span>Políticas de Partners de Google</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 4. Fuentes Acreditadas */}
          <div className="border border-white/20 bg-neutral-950 p-4 sm:p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-white text-xs font-black uppercase tracking-wider">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Fuentes Acreditadas</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed text-justify">
              Monitoreo y cita periodística rigurosa de fuentes primarias del Perú y agencias mundiales: RPP Noticias, El Comercio, Andina Agencia Peruana de Noticias, La República, diario oficial El Peruano y corresponsalías locales de Huánuco.
            </p>
            <p className="text-[11px] text-neutral-400 italic">
              Todos los enlaces y derechos patrimoniales corresponden a sus respectivos autores.
            </p>
          </div>

          {/* 5. 3 Columnas: Legal, Institucional y Atención al Lector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Columna A: Legal & Privacidad */}
            <div className="border border-white/20 bg-neutral-950 p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-white border-b border-white/10 pb-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Legal & Privacidad</span>
              </div>
              <ul className="space-y-2 text-xs text-neutral-300">
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenDoc('privacidad')}
                    className="hover:text-emerald-400 text-left block transition-colors cursor-pointer"
                  >
                    • Política de Privacidad (AdSense)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenDoc('terminos')}
                    className="hover:text-emerald-400 text-left block transition-colors cursor-pointer"
                  >
                    • Términos y Condiciones de Uso
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleOpenCookiePreferences}
                    className="hover:text-emerald-400 text-left flex items-center gap-1 transition-colors cursor-pointer text-emerald-400/90"
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
                    className="hover:text-white text-neutral-400 inline-flex items-center gap-1 text-[11px]"
                  >
                    <span>Políticas de Partners</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna B: Institucional */}
            <div className="border border-white/20 bg-neutral-950 p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-white border-b border-white/10 pb-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Institucional</span>
              </div>
              <ul className="space-y-2 text-xs text-neutral-300">
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenDoc('quienes-somos')}
                    className="hover:text-emerald-400 text-left block transition-colors cursor-pointer"
                  >
                    • Quiénes Somos
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenDoc('quienes-somos')}
                    className="hover:text-emerald-400 text-left block transition-colors cursor-pointer"
                  >
                    • Consejo Editorial & Periodistas
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenDoc('quienes-somos')}
                    className="hover:text-emerald-400 text-left block transition-colors cursor-pointer"
                  >
                    • Principios Éticos y Deontológicos
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenDoc('quienes-somos')}
                    className="hover:text-emerald-400 text-left block transition-colors cursor-pointer text-[11px]"
                  >
                    • Sostenibilidad y Misión Regional
                  </button>
                </li>
              </ul>
            </div>

            {/* Columna C: Atención al Lector */}
            <div className="border border-white/20 bg-neutral-950 p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-white border-b border-white/10 pb-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Atención al Lector</span>
              </div>
              <ul className="space-y-2 text-xs text-neutral-300">
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenDoc('contacto')}
                    className="hover:text-emerald-400 text-left block transition-colors cursor-pointer"
                  >
                    • Contacto & Buzón de Prensa
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenDoc('contacto')}
                    className="hover:text-emerald-400 text-left block transition-colors cursor-pointer"
                  >
                    • Política de Rectificaciones
                  </button>
                </li>
                <li className="pt-1 border-t border-white/10">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Correo Editorial & Mesa de Partes:</span>
                  <a
                    href="mailto:javieraldorosaled@gmail.com"
                    className="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] block break-all"
                  >
                    javieraldorosaled@gmail.com
                  </a>
                </li>
                <li className="pt-0.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Atención al Lector & Publicidad:</span>
                  <a
                    href="mailto:javieraldorosaled@gmail.com"
                    className="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] block break-all"
                  >
                    javieraldorosaled@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* 6. Opción de Instalación de la Aplicación */}
          {onOpenInstall && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInstall();
              }}
              className="w-full py-3 px-4 bg-white hover:bg-neutral-200 active:bg-neutral-300 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md select-none"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Instalar NotiPerúx en este dispositivo</span>
            </button>
          )}

          {/* 7. Panel Oficial de Audiencia y Visitas en Tiempo Real */}
          <div className="pt-4 border-t border-white/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AUDIENCIA Y LECTURAS EN VIVO
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">Firebase Firestore</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-neutral-900 border border-white/20">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Total Lecturas
                </div>
                <div className="text-xl font-black text-white font-mono mt-0.5">
                  {(visitorStats?.totalVisits || 0).toLocaleString('es-PE')}
                </div>
                <div className="text-[9px] text-neutral-500 mt-0.5">Visitas acumuladas</div>
              </div>

              <div className="p-3 bg-neutral-900 border border-white/20">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Lecturas Hoy
                </div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                  {(visitorStats?.todayVisits || 0).toLocaleString('es-PE')}
                </div>
                <div className="text-[9px] text-neutral-500 mt-0.5">Visitas del día</div>
              </div>

              <div className="p-3 bg-neutral-900 border border-white/20">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  App Instalada
                </div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                  {(visitorStats?.installedApps || 0).toLocaleString('es-PE')}
                </div>
                <div className="text-[9px] text-neutral-500 mt-0.5">Celulares con app</div>
              </div>

              <div className="p-3 bg-neutral-900 border border-white/20">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Lectores Activos
                </div>
                <div className="text-xl font-black text-white font-mono mt-0.5">
                  {(visitorStats?.registeredUsers || 0).toLocaleString('es-PE')}
                </div>
                <div className="text-[9px] text-neutral-500 mt-0.5">Comunidad lectora</div>
              </div>
            </div>

            <p className="text-[10px] text-neutral-400 text-center">
              Datos 100% reales sincronizados en tiempo real con Firebase Firestore.
            </p>
          </div>

          {/* 8. Footer Copyright & Enlaces directos */}
          <div className="pt-4 border-t border-white/20 text-center space-y-2">
            <p className="text-[11px] text-neutral-400">
              © 2026 NotiPerúx Digital · Todos los derechos reservados. Registrado en la República del Perú.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-400">
              <button
                type="button"
                onClick={() => handleOpenDoc('privacidad')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Privacidad
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleOpenDoc('terminos')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Términos
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleOpenDoc('quienes-somos')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Equipo
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleOpenDoc('contacto')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Contacto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
