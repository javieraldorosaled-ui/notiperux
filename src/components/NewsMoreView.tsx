import React, { useState } from 'react';
import {
  ShieldCheck,
  Globe,
  Smartphone,
  Share2,
  HelpCircle,
  ChevronDown,
  User,
} from 'lucide-react';

export interface NewsMoreViewProps {
  onOpenAccount: () => void;
  onOpenInstall: () => void;
  isStandalone: boolean;
}

export const NewsMoreView: React.FC<NewsMoreViewProps> = ({
  onOpenAccount,
  onOpenInstall,
  isStandalone,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = window.location.origin;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Noticias Perú e Internacional',
          text: 'Plataforma moderna de noticias verificadas de Perú y el mundo.',
          url: shareUrl,
        });
        return;
      } catch (err: any) {
        if (err && err.name === 'AbortError') return;
      }
    }
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const faqs = [
    {
      q: '¿Cómo funciona la recopilación de noticias?',
      a: 'Nuestra plataforma monitorea de manera automática feeds oficiales y canales autorizados de agencias de noticias y medios peruanos e internacionales de alta reputación (como RPP, Agencia Andina, El Comercio, La República, Diario Correo y portadas oficiales de actualidad), actualizándose periódicamente en tiempo real.',
    },
    {
      q: '¿Cómo se garantiza el respeto a los derechos de autor?',
      a: 'La plataforma publica resúmenes informativos y metadatos verificados, identificando siempre de forma transparente la fuente original y el enlace correspondiente a la publicación primaria.',
    },
    {
      q: '¿Puedo instalar la aplicación en mi teléfono celular?',
      a: 'Sí. Esta plataforma cuenta con tecnología PWA (Progressive Web App). Puedes instalarla directamente en tu pantalla de inicio en Android o iPhone sin necesidad de tiendas de aplicaciones.',
    },
  ];

  return (
    <div className="w-full px-2 py-4 sm:py-6 space-y-8 pb-28 font-serif">
      {/* Cabecera de la sección Más */}
      <div className="border-b border-white pb-3.5">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
          MÁS OPCIONES E INFORMACIÓN
        </h1>
        <p className="text-[13px] sm:text-[15px] text-white font-medium mt-0.5">
          Configuración, fuentes periodísticas y herramientas de la plataforma
        </p>
      </div>

      {/* Accesos Rápidos Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Perfil */}
        <button
          type="button"
          onClick={onOpenAccount}
          className="p-5 rounded-none bg-black border border-white hover:bg-white/5 transition-all text-left flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-none bg-white text-black">
              <User className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-widest">Mi Perfil y Cuenta</p>
              <p className="text-[12px] text-white/70 font-medium">Preferencias personales</p>
            </div>
          </div>
          <span className="text-xs font-black text-white uppercase tracking-widest">Abrir →</span>
        </button>

        {/* Instalar App */}
        <button
          type="button"
          onClick={onOpenInstall}
          className="p-5 rounded-none bg-black border border-white hover:bg-white/5 transition-all text-left flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-none bg-white text-black">
              <Smartphone className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-widest">Instalar Aplicación</p>
              <p className="text-[12px] text-white/70 font-medium lowercase">
                {isStandalone ? 'Instalada como App' : 'Acceso directo en inicio'}
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-white uppercase tracking-widest">
            {isStandalone ? 'Listo' : 'Instalar →'}
          </span>
        </button>

        {/* Compartir */}
        <button
          type="button"
          onClick={handleShare}
          className="p-5 rounded-none bg-black border border-white hover:bg-white/5 transition-all text-left flex items-center justify-between cursor-pointer sm:col-span-2"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-none bg-white text-black">
              <Share2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-sm font-black text-white uppercase tracking-widest">Compartir Noticias</p>
              <p className="text-[12px] text-white/70 font-medium lowercase">
                {copied ? '¡Enlace copiado!' : 'Recomienda esta plataforma a familiares y amigos'}
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-white uppercase tracking-widest">
            {copied ? 'Copiado' : 'Compartir →'}
          </span>
        </button>
      </div>

      {/* Sección: Fuentes y Verificación */}
      <section className="bg-black rounded-none border border-white p-6 space-y-6">
        <div className="flex items-center gap-3 text-lg font-black text-white uppercase tracking-tighter">
          <ShieldCheck className="w-6 h-6 text-white" />
          <h2>Fuentes Verificadas</h2>
        </div>

        <p className="text-[14px] sm:text-[15px] text-white leading-relaxed italic border-l-4 border-white pl-4">
          Nuestra cobertura se nutre de medios verificados y reconocidos que operan con estándares periodísticos profesionales:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-none bg-white/5 border border-white/20 space-y-2">
            <p className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-widest">
              <span className="text-lg">🇵🇪</span> Cobertura Nacional
            </p>
            <p className="text-[13px] text-white/80 leading-snug">
              RPP Noticias, Agencia Andina, El Comercio, La República, Diario Correo y portadas oficiales de actualidad.
            </p>
          </div>

          <div className="p-4 rounded-none bg-white/5 border border-white/20 space-y-2">
            <p className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-widest">
              <span className="text-lg">🌎</span> Cobertura Internacional
            </p>
            <p className="text-[13px] text-white/80 leading-snug">
              BBC News Mundo, CNN en Español, Deutsche Welle (DW) y corresponsalías de actualidad global.
            </p>
          </div>
        </div>
      </section>

      {/* Sección: Preguntas Frecuentes (FAQ) */}
      <section className="bg-black rounded-none border border-white p-6 space-y-5">
        <div className="flex items-center gap-3 text-lg font-black text-white uppercase tracking-tighter mb-2">
          <HelpCircle className="w-6 h-6 text-white" />
          <h2>Preguntas Frecuentes</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="rounded-none border border-white/20 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-4 text-left font-black text-xs sm:text-sm text-white bg-black hover:bg-white/5 flex items-center justify-between gap-4 cursor-pointer uppercase tracking-widest"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-4 pt-2 text-[13px] sm:text-[14px] text-white/90 bg-white/5 leading-relaxed border-t border-white/10 italic">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Información del Sistema */}
      <div className="text-center text-[12px] text-white/50 space-y-1 pt-6 font-serif">
        <p className="font-black uppercase tracking-widest">Plataforma de Noticias · NotiperuX</p>
        <p className="uppercase">Edición Digital 2.0 · Actualización en Tiempo Real</p>
      </div>
    </div>
  );
};
