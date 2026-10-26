import { NewsItem, NewsKeyFacts } from '../types';

/**
 * Utilidades para decodificar entidades HTML y limpiar etiquetas.
 */
function cleanText(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Limpia el título removiendo sufijos habituales de medios (ej. "- BBC News Mundo", "| RPP")
 */
export function cleanNewsTitle(title: string): string {
  const cleaned = cleanText(title);
  const patterns = [
    /\s+-\s+(?:BBC News Mundo|BBC|RPP Noticias|RPP|El Comercio|La República|Diario Correo|DW|CNN en Español|Andina|Agencia Andina|Gestión|Perú 21)$/i,
    /\s+\|\s+(?:BBC News Mundo|BBC|RPP Noticias|RPP|El Comercio|La República|Diario Correo|DW|CNN en Español|Andina|Agencia Andina|Gestión|Perú 21)$/i,
  ];
  let res = cleaned;
  for (const pat of patterns) {
    res = res.replace(pat, '').trim();
  }
  return res;
}

/**
 * Elimina ruido o frases parásito típicas de RSS / enlaces comerciales.
 */
function stripNoiseText(text: string): string {
  return text
    .replace(/\[\+.*?chars\]/gi, '')
    .replace(/\(Foto:.*?\)/gi, '')
    .replace(/\(Video:.*?\)/gi, '')
    .replace(/Lee también:.*$/gi, '')
    .replace(/Lea también:.*$/gi, '')
    .replace(/MIRA AQU[ÍI]:.*$/gi, '')
    .replace(/Sigue leyendo.*$/gi, '')
    .replace(/The post .* appeared first on .*$/gi, '')
    .replace(/Click here to view original post/gi, '')
    .trim();
}

/**
 * Extrae y sintetiza el contenido natural de la noticia adaptándose a cada enunciado.
 * NO genera relleno artificial, NO inventa opiniones, NO fuerza plantillas fijas.
 */
export function generateNewsFactSheet(item: Partial<NewsItem>): {
  cleanTitle: string;
  summaryParagraphs: string[];
  keyFacts: NewsKeyFacts;
  whatIsKnown: string[];
  whyItMatters?: string;
  context?: string;
  isLimitedInfo: boolean;
  timeLabelFormatted: string;
} {
  const cleanTitle = cleanNewsTitle(item.title || 'Noticia informativa');

  // Obtener texto base disponible
  const rawDesc = stripNoiseText(cleanText(item.summary || ''));
  const rawContent = stripNoiseText(cleanText(item.content || ''));
  const baseText = rawContent.length > rawDesc.length ? rawContent : rawDesc;

  // Fecha legible
  let timeLabelFormatted = 'Fecha reciente';
  if (item.publishedAt) {
    try {
      const d = new Date(item.publishedAt);
      if (!isNaN(d.getTime())) {
        timeLabelFormatted = d.toLocaleDateString('es-PE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        timeLabelFormatted =
          timeLabelFormatted.charAt(0).toUpperCase() + timeLabelFormatted.slice(1);
      }
    } catch {}
  }

  // Desglosar en párrafos naturales basados en la información provista
  let summaryParagraphs: string[] = [];

  if (item.content && item.content.includes('\n\n')) {
    summaryParagraphs = item.content
      .split('\n\n')
      .map((p) => stripNoiseText(cleanText(p)))
      .filter((p) => p.length > 20);
  }

  if (summaryParagraphs.length === 0 && baseText) {
    // Dividir en oraciones lógicas
    const sentences = baseText
      .split(/(?<=[.?!])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    if (sentences.length <= 2) {
      summaryParagraphs = [baseText];
    } else {
      // Agrupar oraciones en bloques legibles de 2 o 3 oraciones
      const chunks: string[] = [];
      for (let i = 0; i < sentences.length; i += 2) {
        const chunk = sentences.slice(i, i + 2).join(' ');
        if (chunk) chunks.push(chunk);
      }
      summaryParagraphs = chunks;
    }
  }

  if (summaryParagraphs.length === 0) {
    summaryParagraphs = [cleanTitle];
  }

  // Extraer puntos específicos SOLO si vienen en el contenido original y aportan datos reales
  const whatIsKnown: string[] = [];
  if (Array.isArray(item.whatIsKnown)) {
    for (const point of item.whatIsKnown) {
      const cleaned = stripNoiseText(cleanText(point));
      if (
        cleaned.length > 20 &&
        !cleaned.includes('dio a conocer los detalles iniciales') &&
        !cleaned.includes('El evento fue clasificado')
      ) {
        whatIsKnown.push(cleaned);
      }
    }
  }

  const isLimited = baseText.length < 80;

  return {
    cleanTitle,
    summaryParagraphs,
    keyFacts: {
      whatHappened: cleanTitle,
    },
    whatIsKnown,
    whyItMatters: undefined,
    context: undefined,
    isLimitedInfo: isLimited,
    timeLabelFormatted,
  };
}

/**
 * Limpia y construye estrictamente el texto correspondiente a UNA noticia para lectura por voz (speechSynthesis),
 * excluyendo menús, fechas, fuentes, metadatos u otras noticias.
 */
export function cleanNewsTextForSpeech(news: { title: string; summary?: string; content?: string }): string {
  const cleanTitle = cleanNewsTitle(news.title || '');
  let bodyText = cleanText(news.content || news.summary || '');
  
  bodyText = bodyText
    .replace(/\[\+.*?chars\]/gi, '')
    .replace(/\(Foto:.*?\)/gi, '')
    .replace(/\(Video:.*?\)/gi, '')
    .replace(/Lee también:.*$/gi, '')
    .replace(/Lea también:.*$/gi, '')
    .trim();

  return `${cleanTitle}. ${bodyText}`;
}
