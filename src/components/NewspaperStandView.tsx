import React from 'react';
import { ExternalLink, Newspaper, BookOpen } from 'lucide-react';

interface NewspaperCover {
  id: string;
  name: string;
  headline: string;
  url: string;
  color: string;
  logo: string;
}

const NEWSPAPERS: NewspaperCover[] = [
  {
    id: 'el-comercio',
    name: 'El Comercio',
    headline: 'Perú busca fortalecer lazos comerciales en la región Asia-Pacífico.',
    url: 'https://elcomercio.pe',
    color: '#FFD700',
    logo: 'EC',
  },
  {
    id: 'la-republica',
    name: 'La República',
    headline: 'Nuevas medidas económicas impactan en la canasta básica familiar.',
    url: 'https://larepublica.pe',
    color: '#C00000',
    logo: 'LR',
  },
  {
    id: 'rpp',
    name: 'RPP Noticias',
    headline: 'Selección peruana se prepara para el próximo encuentro de eliminatorias.',
    url: 'https://rpp.pe',
    color: '#0056B3',
    logo: 'RPP',
  },
  {
    id: 'peru21',
    name: 'Perú21',
    headline: 'Debate político se intensifica por reformas en el sistema de justicia.',
    url: 'https://peru21.pe',
    color: '#E30613',
    logo: 'P21',
  },
  {
    id: 'gestion',
    name: 'Gestión',
    headline: 'Bolsa de Valores de Lima muestra tendencia positiva al cierre de semana.',
    url: 'https://gestion.pe',
    color: '#5B2C6F',
    logo: 'G',
  },
  {
    id: 'trome',
    name: 'Trome',
    headline: '¡Emoción total! Conoce los resultados del sorteo más esperado del año.',
    url: 'https://trome.com',
    color: '#FF6600',
    logo: 'T',
  },
];
export const NewspaperStandView: React.FC = () => {
  return (
    <div className="bg-transparent min-h-screen p-2 space-y-10 pb-24 font-serif relative">
      {/* Cabecera Estilo Kiosko de Época */}
      <header className="space-y-4">
        <div className="flex justify-between items-center border-b border-white pb-1 text-[12px] font-black uppercase tracking-widest text-white">
          <span>COLECCIÓN DIGITAL</span>
          <span>NOTIPERUX ARCHIVO</span>
        </div>

        <div className="text-center py-2">
          <h1 className="text-5xl sm:text-8xl font-black tracking-tighter text-white uppercase leading-none">
            EL KIOSKO
          </h1>
          <div className="border-y-double border-y-4 border-white py-1 mt-2 text-[12px] font-black uppercase tracking-[0.3em] text-white">
            LAS PORTADAS QUE HACEN HISTORIA EN EL PERÚ
          </div>
        </div>
      </header>

      {/* Grid de Periódicos - Estilo Portadas Clásicas */}
      <div className="grid grid-cols-1 gap-12">
        {NEWSPAPERS.map((paper) => (
          <a
            key={paper.id}
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group relative bg-[#111] border-2 border-white shadow-none transition-all hover:translate-x-1 hover:translate-y-1 active:scale-[0.98]"
          >
            {/* Masthead (Cabecera del diario) */}
            <div className="border-b-2 border-white p-4 text-center bg-[#000]">
              <div 
                className="text-3xl sm:text-5xl font-black uppercase tracking-tighter mb-1"
                style={{ color: paper.color }}
              >
                {paper.name}
              </div>
              <div className="flex items-center justify-center gap-4 text-[11px] font-bold uppercase tracking-widest border-t border-white/10 pt-2 text-white">
                <span>VOL. CXIV</span>
                <span>•</span>
                <span>PRECIO: S/ 0.00</span>
                <span>•</span>
                <span>NOTIPERUX EXCLUSIVO</span>
              </div>
            </div>

            {/* Contenido de Portada */}
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <div className="inline-block bg-white text-black text-[12px] font-black px-2 py-0.5 uppercase tracking-widest mb-1">
                  TITULAR DEL DÍA
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white leading-[1.1] group-hover:text-gray-300 transition-colors">
                  {paper.headline}
                </h2>
              </div>

              {/* Simulación de columnas de texto */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="col-span-2 space-y-2">
                  <div className="h-1 bg-white w-12" />
                  <p className="text-sm text-white leading-relaxed line-clamp-4 text-justify">
                    En una jornada histórica para el periodismo digital, las principales fuentes de información del país se consolidan en una plataforma única. La inmediatez y la veracidad son los pilares de esta nueva era informativa que hoy presentamos a nuestros lectores más exigentes.
                  </p>
                </div>
                <div className="col-span-1 border-l border-white/10 pl-4 space-y-2">
                  <div className="text-[12px] font-black uppercase text-white">EDITORIAL</div>
                  <p className="text-[12px] text-white leading-snug italic">
                    "La verdad no tiene precio, pero el silencio sí tiene un costo muy alto."
                  </p>
                </div>
              </div>

              {/* Botón de acción estilo "Clasificado" */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center font-bold text-xs text-white">
                    {paper.logo}
                  </div>
                  <span className="text-[12px] font-bold uppercase text-white">Ver edición completa</span>
                </div>
                <div className="px-3 py-1.5 bg-white text-black font-black text-[10px] uppercase tracking-widest group-hover:bg-gray-200 transition-colors flex items-center gap-1.5">
                  <span>LEER DIARIO</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Sello de Autenticidad */}
            <div className="absolute top-2 right-2 rotate-12 opacity-10 group-hover:opacity-20 transition-opacity">
              <Newspaper className="w-20 h-20 text-white" />
            </div>
          </a>
        ))}
      </div>

      {/* Frase Final */}
      <div className="py-10 text-center border-t-2 border-white">
        <p className="text-sm font-bold text-white uppercase tracking-[0.3em]">
          ARCHIVO DIGITAL NOTIPERUX • 2026
        </p>
      </div>
    </div>
  );
};
