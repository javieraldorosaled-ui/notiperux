import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Firestore } from '@google-cloud/firestore';
import {
  HuanucoNewsItem,
  NewsSourceStatus,
  NewsImageSourceType,
  NewsImageStatusType,
} from '../types';
import {
  isQuotaExceededError,
  isServerFirestoreReady,
  markServerFirestoreQuotaExceeded,
} from './firestoreQuotaGuard';
import { generateNewsFactSheet } from './newsFactSheet';

export const DEFAULT_PERU_NEWS_FALLBACK_IMAGE = '/images/news-fallback-peru.svg';
export const DEFAULT_MUNDO_NEWS_FALLBACK_IMAGE = '/images/news-fallback-mundo.svg';
export const DEFAULT_HUANUCO_NEWS_FALLBACK_IMAGE = '/images/news-fallback-peru.svg';

export interface NewsSourceConfig {
  id: string;
  name: string;
  rssUrl: string;
  wpApiUrl?: string;
  websiteUrl: string;
  enabled: boolean;
  section: 'peru' | 'internacional';
  isLocalHuanucoMedia?: boolean;
}

/**
 * Configuración central de fuentes periodísticas verificadas para Perú e Internacional.
 */
export const NEWS_SOURCES: NewsSourceConfig[] = [
  // --- NOTICIAS PERUANAS ---
  {
    id: 'rpp-noticias-peru',
    name: 'RPP Noticias · Perú',
    rssUrl: 'https://rpp.pe/rss',
    websiteUrl: 'https://rpp.pe',
    enabled: true,
    section: 'peru',
    isLocalHuanucoMedia: false,
  },
  {
    id: 'andina-peru',
    name: 'Agencia Andina · Perú',
    rssUrl: 'https://andina.pe/agencia/rss.aspx',
    websiteUrl: 'https://andina.pe',
    enabled: true,
    section: 'peru',
    isLocalHuanucoMedia: false,
  },
  {
    id: 'elcomercio-peru',
    name: 'El Comercio · Perú',
    rssUrl: 'https://news.google.com/rss/search?q=site:elcomercio.pe+when:3d&hl=es-419&gl=PE&ceid=PE:es-419',
    websiteUrl: 'https://elcomercio.pe',
    enabled: true,
    section: 'peru',
    isLocalHuanucoMedia: false,
  },
  {
    id: 'larepublica-peru',
    name: 'La República · Perú',
    rssUrl: 'https://news.google.com/rss/search?q=site:larepublica.pe+when:3d&hl=es-419&gl=PE&ceid=PE:es-419',
    websiteUrl: 'https://larepublica.pe',
    enabled: true,
    section: 'peru',
    isLocalHuanucoMedia: false,
  },
  {
    id: 'diario-correo-peru',
    name: 'Diario Correo · Perú',
    rssUrl: 'https://news.google.com/rss/search?q=site:diariocorreo.pe+when:3d&hl=es-419&gl=PE&ceid=PE:es-419',
    websiteUrl: 'https://diariocorreo.pe',
    enabled: true,
    section: 'peru',
    isLocalHuanucoMedia: false,
  },
  {
    id: 'google-news-peru',
    name: 'Actualidad Nacional · Perú',
    rssUrl: 'https://news.google.com/rss?hl=es-419&gl=PE&ceid=PE:es-419',
    websiteUrl: 'https://news.google.com',
    enabled: true,
    section: 'peru',
    isLocalHuanucoMedia: false,
  },

  // --- NOTICIAS INTERNACIONALES ---
  {
    id: 'bbc-mundo',
    name: 'BBC News Mundo',
    rssUrl: 'https://feeds.bbci.co.uk/mundo/rss.xml',
    websiteUrl: 'https://www.bbc.com/mundo',
    enabled: true,
    section: 'internacional',
    isLocalHuanucoMedia: false,
  },
  {
    id: 'dw-espanol',
    name: 'DW Español',
    rssUrl: 'https://rss.dw.com/xml/rss-sp-all',
    websiteUrl: 'https://www.dw.com/es',
    enabled: true,
    section: 'internacional',
    isLocalHuanucoMedia: false,
  },
  {
    id: 'cnn-espanol',
    name: 'CNN en Español',
    rssUrl: 'https://news.google.com/rss/search?q=site:cnnespanol.cnn.com+when:3d&hl=es-419&gl=PE&ceid=PE:es-419',
    websiteUrl: 'https://cnnespanol.cnn.com',
    enabled: true,
    section: 'internacional',
    isLocalHuanucoMedia: false,
  },
  {
    id: 'google-news-mundo',
    name: 'Panorama Global · Internacional',
    rssUrl: 'https://news.google.com/rss/headlines/section/topic/WORLD?hl=es-419&gl=PE&ceid=PE:es-419',
    websiteUrl: 'https://news.google.com',
    enabled: true,
    section: 'internacional',
    isLocalHuanucoMedia: false,
  },
];

// Diccionario geográfico inequívoco de provincias, distritos, centros poblados e instituciones de Huánuco
interface HuanucoLocationRule {
  canonicalName: string;
  unambiguousKeywords: string[];
  contextualKeywords?: string[]; // Solo activan si además hay contexto regional de Huánuco o medio local sin conflicto con Lima
}

const HUANUCO_LOCATION_RULES: HuanucoLocationRule[] = [
  {
    canonicalName: 'Amarilis',
    unambiguousKeywords: [
      'amarilis',
      'paucarbamba',
      'llicua',
      'huayopampa',
      'municipalidad de amarilis',
      'distrito de amarilis',
    ],
  },
  {
    canonicalName: 'Pillco Marca',
    unambiguousKeywords: [
      'pillco marca',
      'pillcomarca',
      'cayhuayna',
      'andabamba',
      'marabamba',
      'vicsacocha',
    ],
  },
  {
    canonicalName: 'Tingo María',
    unambiguousKeywords: [
      'tingo maria',
      'rupa rupa',
      'rupa-rupa',
      'supte',
      'castillo grande',
      'bella durmiente',
      'tingales',
      'tingalesa',
      'unas tingo maria',
    ],
  },
  {
    canonicalName: 'Leoncio Prado',
    unambiguousKeywords: [
      'leoncio prado',
      'aucayacu',
      'jose crespo y castillo',
      'luyando',
      'naranjillo',
      'mariano damaso beraun',
      'las palmas',
      'pumahuasi',
      'daniel alomia robles',
      'santo domingo de anda',
      'alto huallaga',
      'monzon',
    ],
  },
  {
    canonicalName: 'Ambo',
    unambiguousKeywords: [
      'provincia de ambo',
      'distrito de ambo',
      'ambo huanuco',
      'tomay kichwa',
      'tomayquichua',
      'huacar',
      'cayna',
      'colpas',
      'conchamarca',
      'san francisco de mosca',
    ],
    contextualKeywords: ['ambo', 'san rafael'],
  },
  {
    canonicalName: 'Pachitea',
    unambiguousKeywords: ['pachitea', 'panao', 'chaglla', 'umari', 'provincia de pachitea'],
    contextualKeywords: ['molino'],
  },
  {
    canonicalName: 'Dos de Mayo',
    unambiguousKeywords: [
      'provincia de dos de mayo',
      'dos de mayo huanuco',
      'la union dos de mayo',
      'ripan',
      'shunqui',
      'pachas',
      'quivilla',
      'chuquis',
    ],
    contextualKeywords: ['dos de mayo', 'la union'],
  },
  {
    canonicalName: 'Lauricocha',
    unambiguousKeywords: [
      'lauricocha',
      'san miguel de cauri',
      'queropalca',
      'rondos',
      'jivia',
    ],
    contextualKeywords: ['jesus', 'baños'],
  },
  {
    canonicalName: 'Yarowilca',
    unambiguousKeywords: [
      'yarowilca',
      'chavinillo',
      'chacabamba',
      'aparicio pomares',
      'chupan',
      'obas',
      'pampamarca',
      'jacas chico',
      'sacapampa',
    ],
  },
  {
    canonicalName: 'Huamalíes',
    unambiguousKeywords: [
      'huamalies',
      'llata',
      'tantamayo',
      'punchao',
      'singa',
      'jacas grande',
      'chavin de pariarca',
      'arancay',
    ],
  },
  {
    canonicalName: 'Puerto Inca',
    unambiguousKeywords: [
      'puerto inca',
      'codo del pozuzo',
      'honoria',
      'tournavista',
      'yuyapichis',
    ],
  },
  {
    canonicalName: 'Marañón',
    unambiguousKeywords: [
      'provincia de marañon',
      'provincia de maranon',
      'huacrachuco',
      'cholon',
      'san buenaventura',
      'la morada',
    ],
  },
  {
    canonicalName: 'Huacaybamba',
    unambiguousKeywords: ['huacaybamba', 'canchabamba', 'pinra'],
  },
  {
    canonicalName: 'Huánuco Cercado',
    unambiguousKeywords: [
      'huanuco cercado',
      'mercado modelo de huanuco',
      'mercado puelles',
      'puelles',
      'las moras',
      'puente calicanto',
      'calicanto',
      'kotosh',
      'laguna vina del rio',
      'vina del rio',
      'chinchao',
      'carpish',
      'acomayo',
      'churubamba',
      'santa maria del valle',
      'quisqui',
      'yarumayo',
      'margos',
      'chaulan',
      'cayran',
      'pillao',
      'heraclio tapia',
    ],
  },
  {
    canonicalName: 'Huánuco',
    unambiguousKeywords: [
      'huanuco',
      'huanuqueno',
      'huanuquena',
      'huanuquenos',
      'huanuquenas',
      'gorehco',
      'gobierno regional de huanuco',
      'municipalidad de huanuco',
      'mphco',
      'unheval',
      'hermilio valdizan',
      'universidad de huanuco',
      'seda huanuco',
      'diresa huanuco',
      'red de salud huanuco',
      'depotad huanuco',
      'hospital hermilio valdizan',
      'alianza universidad',
    ],
  },
];

// Frases de Lima u otras regiones que generan falsos positivos ("Hospital Dos de Mayo", "Complejo Manuel Bonilla de Miraflores")
const FALSE_POSITIVE_PHRASES = [
  'hospital dos de mayo',
  'hospital nacional dos de mayo',
  'plaza dos de mayo',
  'avenida dos de mayo',
  'av dos de mayo',
  'complejo manuel bonilla',
  'complejo deportivo manuel bonilla',
  'miraflores lima',
  'san isidro lima',
  'surco lima',
  'barranco lima',
];

// Portales de avisos de empleo, diccionarios o redes sociales que no son medios periodísticos
const EXCLUDED_SOURCE_NAMES = [
  'computrabajo',
  'bumeran',
  'indeed',
  'jooble',
  'bebee',
  'scotiabank',
  'linkedin',
  'facebook',
  'tiktok',
  'youtube',
  'instagram',
  'x.com',
  'twitter',
  'tesauros',
];

const NON_NEWS_CATEGORY_EXCLUSIONS = new Set([
  'columna',
  'opinion',
  'editorial',
  'horoscopo',
  'farandula internacional',
]);

function normalizeForMatch(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  const namedEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&lsquo;': '‘',
    '&rsquo;': '’',
    '&ldquo;': '“',
    '&rdquo;': '”',
    '&hellip;': '…',
    '&ntilde;': 'ñ',
    '&Ntilde;': 'Ñ',
    '&aacute;': 'á',
    '&eacute;': 'é',
    '&iacute;': 'í',
    '&oacute;': 'ó',
    '&uacute;': 'ú',
    '&Aacute;': 'Á',
    '&Eacute;': 'É',
    '&Iacute;': 'Í',
    '&Oacute;': 'Ó',
    '&Uacute;': 'Ú',
    '&uuml;': 'ü',
    '&Uuml;': 'Ü',
    '&iquest;': '¿',
    '&iexcl;': '¡',
  };

  let out = input;
  // Ejecutar 2 pasadas para decodificar entidades doblemente escapadas (&amp;lt; -> &lt; -> <)
  for (let pass = 0; pass < 2; pass++) {
    out = out.replace(
      /&(amp|lt|gt|quot|apos|nbsp|ndash|mdash|lsquo|rsquo|ldquo|rdquo|hellip|ntilde|Ntilde|aacute|eacute|iacute|oacute|uacute|Aacute|Eacute|Iacute|Oacute|Uacute|uuml|Uuml|iquest|iexcl|#039);/g,
      (match) => namedEntities[match] ?? match
    );

    out = out.replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return !isNaN(code) ? String.fromCodePoint(code) : '';
    });

    out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return !isNaN(code) ? String.fromCodePoint(code) : '';
    });
  }

  // Eliminar caracteres del área de uso privado Unicode (ej. viñetas \uF000-\uF8FF de fuentes Wingdings)
  out = out.replace(/[\uE000-\uF8FF]/g, '');

  return out;
}

export function cleanRssSummaryText(rawHtml: string, titleToCompare?: string, sourceName?: string): string {
  if (!rawHtml) return '';

  // 1. Decodificar primero entidades HTML para que las etiquetas escapadas (&lt;a href=...&gt;) puedan limpiarse
  let text = decodeHtmlEntities(rawHtml);

  // 2. Eliminar bloques HTML de WordPress "The post ... first appeared on ..."
  text = text.replace(/<p>\s*The post[\s\S]*?<\/p>/gi, ' ');
  text = text.replace(/<a[^>]*>(Seguir leyendo|Leer más|Continue reading|Ver más)[^<]*<\/a>/gi, ' ');

  // 3. Eliminar cualquier etiqueta HTML completa o truncada al final
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/<[a-zA-Z][^>]*$/g, ' ');

  // 4. Limpiar contadores de redes sociales de plugins WordPress ("0 Facebook 0 Twitter 0 Linkedin...")
  text = text.replace(
    /^(\s*\d+\s*(Facebook|Twitter|Linkedin|Pinterest|Whatsapp|Telegram)\s*)+/i,
    ''
  );

  // 5. Limpiar "The post ... first appeared on ..." o "La entrada ... se publicó primero en ..." en texto plano si quedó
  text = text.replace(/The post .*? first appeared on .*$/i, '');
  text = text.replace(/La entrada .*? se public[óo] primero en .*$/i, '');
  text = text.replace(/\s+/g, ' ').trim();

  // 6. En Google News RSS, la descripción suele ser simplemente "<Título>  <Fuente>"
  if (titleToCompare) {
    const normSum = normalizeForMatch(text);
    const normTitle = normalizeForMatch(titleToCompare);
    const normSource = sourceName ? normalizeForMatch(sourceName) : '';
    if (
      normSum === normTitle ||
      normSum === `${normTitle} ${normSource}`.trim() ||
      (normTitle.length > 18 && normSum.startsWith(normTitle) && normSum.length - normTitle.length < 35)
    ) {
      return '';
    }
  }

  if (text.length > 260) {
    text = text.slice(0, 257).replace(/\s+\S*$/, '') + '…';
  }

  return text;
}



function extractTagValue(itemXml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = itemXml.match(regex);
  if (!match || !match[1]) return '';
  let content = match[1].trim();
  const cdataMatch = content.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i);
  if (cdataMatch) {
    content = cdataMatch[1].trim();
  }
  return content;
}

function extractAllCategories(itemXml: string): string[] {
  const matches = itemXml.match(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi) || [];
  return matches
    .map((m) => {
      let inner = m.replace(/<\/?category(?:\s[^>]*)?>/gi, '').trim();
      const cdata = inner.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i);
      if (cdata) inner = cdata[1].trim();
      return decodeHtmlEntities(inner).trim();
    })
    .filter(Boolean);
}

export interface ResolvedNewsImageMetadata {
  imageUrl: string;
  imageUrlOriginal: string | null;
  imageUrlResolved: string | null;
  imageSource: NewsImageSourceType;
  imageStatus: NewsImageStatusType;
  imageFallbackUsed: boolean;
}

function isUsableNewsImageUrl(rawUrl?: string | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('huanuco-news-fallback') ||
    lower.includes('s.w.org/images/core/emoji') ||
    lower.includes('1x1') ||
    lower.includes('spacer.gif') ||
    lower.includes('blank.gif') ||
    lower.includes('gravatar.com') ||
    lower.includes('logo_p3.png') ||
    lower.includes('logo-scaled.png') ||
    lower.includes('logo-gorehco') ||
    lower.includes('flowpaper-logo') ||
    lower.includes('/wp-content/plugins/') ||
    lower.includes('escudo_text_gobpe') ||
    lower.includes('bicentenario') ||
    lower.includes('media/stock/600x400') ||
    lower.includes('favicon') ||
    lower.includes('/assets/escudo') ||
    lower.includes('default-share') ||
    lower.includes('lh3.googleusercontent.com/j6_cofbogxhri9im864nl_ligxvsqp2aupskei7z0cnnf')
  ) {
    return false;
  }
  return true;
}

/**
 * Normaliza una URL de imagen:
 * - Convierte rutas relativas o rutas internas de storage (regionhuanuco.gob.pe) en absolutas
 * - Normaliza a protocolo HTTPS
 * - Limpia entidades HTML y caracteres inválidos
 * - Verifica que no sea un logo genérico o imagen inválida
 */
export function normalizeAndValidateNewsImageUrl(
  candidate?: string | null,
  baseUrl: string = 'https://www.regionhuanuco.gob.pe'
): string | null {
  if (!candidate || typeof candidate !== 'string') return null;
  let cleaned = decodeHtmlEntities(candidate)
    .replace(/\\\//g, '/')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    !cleaned ||
    cleaned === DEFAULT_HUANUCO_NEWS_FALLBACK_IMAGE ||
    cleaned === DEFAULT_PERU_NEWS_FALLBACK_IMAGE ||
    cleaned === DEFAULT_MUNDO_NEWS_FALLBACK_IMAGE ||
    cleaned.includes('news-fallback') ||
    cleaned.includes('huanuco-news-fallback') ||
    cleaned.includes('news.google.com/images/') ||
    cleaned.startsWith('/images/') ||
    cleaned.startsWith('data:') ||
    cleaned.startsWith('javascript:')
  ) {
    return null;
  }

  // Rutas relativas del API de gestionportales.regionhuanuco.gob.pe (ej. "notas-prensa/..." o "public/notas-prensa/...")
  if (
    cleaned.startsWith('notas-prensa/') ||
    cleaned.startsWith('public/notas-prensa/') ||
    cleaned.startsWith('storage/notas-prensa/')
  ) {
    const storageRel = cleaned
      .replace(/^public\//, '')
      .replace(/^storage\//, '')
      .replace(/^\/+/, '');
    cleaned = `https://gestionportales.regionhuanuco.gob.pe/storage/${storageRel}`;
  } else if (cleaned.startsWith('//')) {
    cleaned = `https:${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned, baseUrl);
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }
    if (parsed.protocol !== 'https:') {
      return null;
    }
    // Codificar espacios si existieran en el pathname
    parsed.pathname = parsed.pathname.replace(/\s/g, '%20');
    const finalHref = parsed.href;
    return isUsableNewsImageUrl(finalHref) ? finalHref : null;
  } catch {
    return null;
  }
}

function resolveAbsoluteImageUrl(candidate: string, baseUrl: string): string | null {
  return normalizeAndValidateNewsImageUrl(candidate, baseUrl);
}

function extractImageFromItemXmlWithSource(
  itemXml: string,
  baseUrl: string
): { original: string; resolved: string; source: NewsImageSourceType } | null {
  const mediaMatch = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
  if (mediaMatch && mediaMatch[1]) {
    const orig = decodeHtmlEntities(mediaMatch[1]).trim();
    const resolved = normalizeAndValidateNewsImageUrl(orig, baseUrl);
    if (resolved) return { original: orig, resolved, source: 'rss-media' };
  }

  const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosureMatch && enclosureMatch[1]) {
    const orig = decodeHtmlEntities(enclosureMatch[1]).trim();
    const resolved = normalizeAndValidateNewsImageUrl(orig, baseUrl);
    if (resolved) return { original: orig, resolved, source: 'rss-media' };
  }

  const thumbMatch = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (thumbMatch && thumbMatch[1]) {
    let orig = decodeHtmlEntities(thumbMatch[1]).trim();
    if (orig.includes('ichef.bbci.co.uk/ace/ws/240/')) {
      orig = orig.replace('/ws/240/', '/ws/800/');
    }
    const resolved = normalizeAndValidateNewsImageUrl(orig, baseUrl);
    if (resolved) return { original: orig, resolved, source: 'rss-media' };
  }

  const imgMatches = [...itemXml.matchAll(/<img[^>]+(?:data-src|src)=["']([^"']+)["']/gi)];
  for (const m of imgMatches) {
    if (m[1]) {
      const orig = decodeHtmlEntities(m[1]).trim();
      const resolved = normalizeAndValidateNewsImageUrl(orig, baseUrl);
      if (resolved) {
        return { original: orig, resolved, source: 'content-associated' };
      }
    }
  }

  return null;
}

function extractMetaImageContent(
  html: string,
  metaKeys: string[],
  baseUrl: string
): { original: string; resolved: string } | null {
  const metaTags = html.match(/<meta\s+[^>]*>/gi) || [];
  for (const key of metaKeys) {
    const lowerKey = key.toLowerCase();
    for (const tag of metaTags) {
      const propMatch = tag.match(/(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i);
      if (!propMatch || propMatch[1].trim().toLowerCase() !== lowerKey) continue;
      const contentMatch = tag.match(/content\s*=\s*["']([^"']+)["']/i);
      if (contentMatch && contentMatch[1]) {
        const orig = decodeHtmlEntities(contentMatch[1]).trim();
        const resolved = normalizeAndValidateNewsImageUrl(orig, baseUrl);
        if (resolved) return { original: orig, resolved };
      }
    }
  }
  return null;
}

/**
 * Extrae imagen desde bloques JSON-LD / schema.org (<script type="application/ld+json">)
 */
function extractJsonLdImageFromHtml(
  html: string,
  baseUrl: string
): { original: string; resolved: string } | null {
  const scriptMatches = [
    ...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ];

  const extractCandidateFromNode = (node: unknown): string | null => {
    if (!node) return null;
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) {
      for (const item of node) {
        const found = extractCandidateFromNode(item);
        if (found) return found;
      }
      return null;
    }
    if (typeof node === 'object') {
      const rec = node as Record<string, unknown>;
      // Evitar logos de organización (Organization / ImageObject de logo)
      const typeVal = String(rec['@type'] || '').toLowerCase();
      if (typeVal === 'organization' || typeVal === 'brand') return null;

      if (typeof rec.url === 'string' && (!typeVal || typeVal.includes('image'))) {
        return rec.url;
      }
      if (typeof rec.contentUrl === 'string') {
        return rec.contentUrl;
      }
      if (rec.image) {
        const imgFound = extractCandidateFromNode(rec.image);
        if (imgFound) return imgFound;
      }
      if (rec.thumbnailUrl) {
        const thumbFound = extractCandidateFromNode(rec.thumbnailUrl);
        if (thumbFound) return thumbFound;
      }
      if (Array.isArray(rec['@graph'])) {
        const graphFound = extractCandidateFromNode(rec['@graph']);
        if (graphFound) return graphFound;
      }
    }
    return null;
  };

  for (const match of scriptMatches) {
    const rawJson = match[1]?.trim();
    if (!rawJson) continue;
    try {
      const parsed = JSON.parse(rawJson);
      const candidate = extractCandidateFromNode(parsed);
      if (candidate) {
        const resolved = normalizeAndValidateNewsImageUrl(candidate, baseUrl);
        if (resolved) {
          return { original: candidate, resolved };
        }
      }
    } catch {
      // Si el JSON-LD tiene formato inválido, intentar rescate por expresión regular de "image": "..."
      const fallbackRegex = rawJson.match(/"(?:image|thumbnailUrl)"\s*:\s*"(https?:[^"]+)"/i);
      if (fallbackRegex && fallbackRegex[1]) {
        const orig = fallbackRegex[1].replace(/\\\//g, '/');
        const resolved = normalizeAndValidateNewsImageUrl(orig, baseUrl);
        if (resolved) {
          return { original: orig, resolved };
        }
      }
    }
  }
  return null;
}

function extractMainContentImageFromHtml(
  html: string,
  baseUrl: string
): { original: string; resolved: string; source: 'html-main' | 'content-associated' } | null {
  // d. Imagen principal del HTML (carrousel de gob.pe, wp-post-image, featured image, article figure img)
  const priorityPatterns = [
    /<img[^>]+class=["'][^"']*(?:feed-cover-img|shadow-feed-img|wp-post-image|featured-image|post-thumbnail)[^"']*["'][^>]+(?:data-src|src)=["']([^"']+)["']/i,
    /<img[^>]+(?:data-src|src)=["']([^"']+)["'][^>]+class=["'][^"']*(?:feed-cover-img|shadow-feed-img|wp-post-image|featured-image|post-thumbnail)[^"']*["']/i,
    /<figure[^>]*class=["'][^"']*carrousel[^"']*["'][\s\S]*?<img[^>]+(?:data-src|src)=["']([^"']+)["']/i,
    /<article[\s\S]*?<img[^>]+(?:data-src|src)=["']([^"']+)["']/i,
    /<main[\s\S]*?<img[^>]+(?:data-src|src)=["'](https?:\/\/cdn\.www\.gob\.pe\/uploads\/document\/file\/[^"']+)["']/i,
    /<img[^>]+(?:data-src|src)=["'](https?:\/\/[^"']+(?:\/wp-content\/uploads\/|\/uploads\/images\/|\/uploads\/document\/file\/|\/storage\/notas-prensa\/)[^"']+\.(?:jpg|jpeg|png|webp|jfif))["']/i,
  ];

  for (const regex of priorityPatterns) {
    const match = html.match(regex);
    if (match && match[1]) {
      const orig = decodeHtmlEntities(match[1]).trim();
      const resolved = normalizeAndValidateNewsImageUrl(orig, baseUrl);
      if (resolved) return { original: orig, resolved, source: 'html-main' };
    }
  }

  // e. Imágenes asociadas al contenido de la noticia
  const allImgs = [...html.matchAll(/<img[^>]+(?:data-src|src|data-lazy-src)=["']([^"']+)["'][^>]*>/gi)];
  for (const match of allImgs) {
    const tag = match[0].toLowerCase();
    const src = match[1];
    if (
      tag.includes('logo') ||
      tag.includes('escudo') ||
      tag.includes('avatar') ||
      tag.includes('icon') ||
      tag.includes('emoji') ||
      tag.includes('bicentenario')
    ) {
      continue;
    }
    const orig = decodeHtmlEntities(src).trim();
    const resolved = normalizeAndValidateNewsImageUrl(orig, baseUrl);
    if (
      resolved &&
      (/\.(jpg|jpeg|png|webp|jfif)(\?|$)/i.test(resolved) ||
        resolved.includes('/uploads/') ||
        resolved.includes('/storage/'))
    ) {
      return { original: orig, resolved, source: 'content-associated' };
    }
  }

  return null;
}

/**
 * Extrae de forma estructurada la imagen desde la página individual de la noticia en este orden exacto:
 * a. og:image
 * b. twitter:image
 * c. JSON-LD / schema.org
 * d. imagen principal del HTML
 * e. imágenes asociadas al contenido de la noticia
 */
export async function extractStructuredImageFromArticlePage(
  articleUrl: string
): Promise<{
  original: string;
  resolved: string;
  source: NewsImageSourceType;
  finalArticleUrl?: string;
} | null> {
  if (!articleUrl || !/^https?:\/\//i.test(articleUrl)) return null;

  // Caso especial: URL de SPA de regionhuanuco.gob.pe/noticias/:id -> consultar su API de detalle directamente
  const goreDetalleMatch = articleUrl.match(/regionhuanuco\.gob\.pe\/noticias\/(\d+)/i);
  if (goreDetalleMatch && goreDetalleMatch[1]) {
    const noticiaId = goreDetalleMatch[1];
    try {
      const apiRes = await fetch(
        `https://gestionportales.regionhuanuco.gob.pe/api/noticias/${noticiaId}?domain=https://www.regionhuanuco.gob.pe`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (apiRes.ok) {
        const data = await apiRes.json();
        const detail = Array.isArray(data?.detallenot) ? data.detallenot[0] : data?.detallenot || data;
        const rawCandidate = detail?.img1 || detail?.raw_img1 || detail?.img2 || detail?.img3;
        if (rawCandidate) {
          const resolved = normalizeAndValidateNewsImageUrl(
            rawCandidate,
            'https://gestionportales.regionhuanuco.gob.pe'
          );
          if (resolved) {
            return {
              original: String(rawCandidate),
              resolved,
              source: 'article-page',
              finalArticleUrl: articleUrl,
            };
          }
        }
      }
    } catch {
      // Continuar con extracción HTML estándar si aplica
    }
  }

  try {
    const res = await fetch(articleUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-PE,es;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(5500),
    });

    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return null;
    }

    const finalUrl = res.url || articleUrl;
    const html = (await res.text()).slice(0, 220000);

    // a. og:image
    const ogImg = extractMetaImageContent(
      html,
      ['og:image', 'og:image:secure_url', 'og:image:url'],
      finalUrl
    );
    if (ogImg) {
      return {
        original: ogImg.original,
        resolved: ogImg.resolved,
        source: 'og:image',
        finalArticleUrl: finalUrl,
      };
    }

    // b. twitter:image
    const twitterImg = extractMetaImageContent(
      html,
      ['twitter:image', 'twitter:image:src'],
      finalUrl
    );
    if (twitterImg) {
      return {
        original: twitterImg.original,
        resolved: twitterImg.resolved,
        source: 'twitter:image',
        finalArticleUrl: finalUrl,
      };
    }

    // c. JSON-LD / schema.org
    const jsonLdImg = extractJsonLdImageFromHtml(html, finalUrl);
    if (jsonLdImg) {
      return {
        original: jsonLdImg.original,
        resolved: jsonLdImg.resolved,
        source: 'json-ld',
        finalArticleUrl: finalUrl,
      };
    }

    // d. imagen principal del HTML & e. imágenes asociadas al contenido
    const contentImg = extractMainContentImageFromHtml(html, finalUrl);
    if (contentImg) {
      return {
        original: contentImg.original,
        resolved: contentImg.resolved,
        source: contentImg.source,
        finalArticleUrl: finalUrl,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function classifyNewsCategory(title: string, summary: string, rawCategories: string[]): string {
  const combined = normalizeForMatch(`${title} ${summary} ${rawCategories.join(' ')}`);

  if (
    /\b(precio|precios|mercado|mercados|canasta|alimentos|comerciantes|agricultores|papa|cafe|cacao|agro|feria|economia|procompite|inversion|presupuesto|exportaciones|productores|ventas)\b/.test(
      combined
    )
  ) {
    return 'Economía y Mercados';
  }

  if (
    /\b(carretera|transporte|via|vias|asfaltado|puente|transito|accidente|bloqueo|lluvias|clima|senamhi|huaico|deslizamiento|rio huallaga|aeropuerto|friaje|fenomeno el nino)\b/.test(
      combined
    )
  ) {
    return 'Vías, Transporte y Clima';
  }

  if (
    /\b(educacion|colegio|institucion educativa|instituciones educativas|unheval|universidad|estudiantes|escolares|docentes|clases|dre huanuco|ugel|beca)\b/.test(
      combined
    )
  ) {
    return 'Educación';
  }

  if (
    /\b(salud|hospital|oncologico|diresa|essalud|dengue|centro de salud|pacientes|medicos|medicamentos|agua|seda huanuco)\b/.test(
      combined
    )
  ) {
    return 'Salud y Servicios';
  }

  if (
    /\b(policia|policial|detienen|detenido|droga|fiscalia|seguridad|serenazgo|operativo|justicia|penal|corte de huanuco|corte superior|prision)\b/.test(
      combined
    )
  ) {
    return 'Seguridad y Justicia';
  }

  if (
    /\b(gorehco|gobierno regional|municipalidad|alcalde|gobernador|obras|proyecto|distrito|provincia)\b/.test(
      combined
    )
  ) {
    return 'Gestión Regional';
  }

  return 'Actualidad Regional';
}

export function verifyAndClassifyHuanucoNews(params: {
  title: string;
  summary: string;
  url: string;
  rawCategories: string[];
  isLocalHuanucoMedia: boolean;
}): {
  isRelevantHuanuco: boolean;
  detectedLocations: string[];
  primaryLocation: string;
  category: string;
} {
  const { title, summary, url, rawCategories, isLocalHuanucoMedia } = params;

  const normCats = rawCategories.map((c) => normalizeForMatch(c));
  if (normCats.some((c) => NON_NEWS_CATEGORY_EXCLUSIONS.has(c))) {
    return {
      isRelevantHuanuco: false,
      detectedLocations: [],
      primaryLocation: 'Huánuco',
      category: 'Actualidad Regional',
    };
  }

  if (
    url.includes('/columna/') ||
    url.includes('/opinion/') ||
    url.includes('/normas-legales/') ||
    url.includes('/informes-publicaciones/') ||
    /^(exp\.?\s*reclamo|resoluci[óo]n\s+(de\s+consejo|directoral|rectoral|ejecutiva|gerencial|de\s+alcald[íi]a))\b/i.test(
      title.trim()
    )
  ) {
    return {
      isRelevantHuanuco: false,
      detectedLocations: [],
      primaryLocation: 'Huánuco',
      category: 'Actualidad Regional',
    };
  }

  // Excluir el dominio del medio para que "tudiariohuanuco.pe" no fuerce match en notas nacionales
  let urlPathOnly = url;
  try {
    urlPathOnly = new URL(url).pathname;
  } catch {
    urlPathOnly = url;
  }

  const combinedText = ` ${normalizeForMatch(`${title} ${summary} ${rawCategories.join(' ')} ${urlPathOnly}`)} `;

  // Limpiar frases conocidas de Lima ("Hospital Dos de Mayo", "Complejo Manuel Bonilla de Miraflores") antes de evaluar ubicaciones
  let sanitizedTextForGeo = combinedText;
  for (const fp of FALSE_POSITIVE_PHRASES) {
    const normFp = normalizeForMatch(fp);
    sanitizedTextForGeo = sanitizedTextForGeo.replace(new RegExp(`\\b${normFp}\\b`, 'g'), ' ');
  }

  const detectedLocations: string[] = [];

  for (const rule of HUANUCO_LOCATION_RULES) {
    const matchedUnambiguous = rule.unambiguousKeywords.some((kw) => {
      const normKw = normalizeForMatch(kw);
      return sanitizedTextForGeo.includes(` ${normKw} `);
    });
    if (matchedUnambiguous && !detectedLocations.includes(rule.canonicalName)) {
      detectedLocations.push(rule.canonicalName);
    }
  }

  // Segundo pase para keywords contextuales (ej. "Dos de Mayo", "Ambo", "San Rafael", "Jesús", "Baños")
  // solo si ya se detectó Huánuco o alguna otra provincia huanuqueña
  if (detectedLocations.length > 0) {
    for (const rule of HUANUCO_LOCATION_RULES) {
      if (!rule.contextualKeywords || detectedLocations.includes(rule.canonicalName)) continue;
      const matchedCtx = rule.contextualKeywords.some((kw) => {
        const normKw = normalizeForMatch(kw);
        return sanitizedTextForGeo.includes(` ${normKw} `);
      });
      if (matchedCtx) {
        detectedLocations.push(rule.canonicalName);
      }
    }
  }

  const isRelevantHuanuco = detectedLocations.length > 0;

  // Preferir mostrar primero el distrito o provincia específica antes que el genérico "Huánuco"
  const specificLocation =
    detectedLocations.find((loc) => loc !== 'Huánuco') || detectedLocations[0] || 'Huánuco';
  const category = classifyNewsCategory(title, summary, rawCategories);

  return {
    isRelevantHuanuco,
    detectedLocations: detectedLocations.length > 0 ? detectedLocations : ['Huánuco'],
    primaryLocation: specificLocation,
    category,
  };
}

function buildDeterministicNewsId(url: string, title: string): string {
  const cleanBasis = (url || title).trim().toLowerCase();
  const hash = crypto.createHash('sha256').update(cleanBasis).digest('hex').slice(0, 18);
  return `news-${hash}`;
}

function buildTitleFingerprint(title: string): string {
  const stopWords = new Set([
    'de',
    'la',
    'el',
    'en',
    'y',
    'a',
    'los',
    'las',
    'del',
    'por',
    'para',
    'con',
    'un',
    'una',
    'al',
    'se',
    'su',
    'mas',
    'huanuco',
  ]);
  const tokens = normalizeForMatch(title)
    .split(' ')
    .filter((w) => w.length > 2 && !stopWords.has(w));
  return tokens.slice(0, 7).join(' ');
}

function areTitlesNearDuplicate(titleA: string, titleB: string): boolean {
  const fpA = buildTitleFingerprint(titleA);
  const fpB = buildTitleFingerprint(titleB);
  if (!fpA || !fpB) return false;
  if (fpA === fpB) return true;

  const setA = new Set(fpA.split(' '));
  const setB = new Set(fpB.split(' '));
  if (setA.size < 3 || setB.size < 3) return false;

  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union > 0 && intersection / union >= 0.72;
}

function areTitlesRelatedForPublisherMatch(titleA: string, titleB: string): boolean {
  if (areTitlesNearDuplicate(titleA, titleB)) return true;
  const stopWords = new Set([
    'de',
    'la',
    'el',
    'en',
    'y',
    'a',
    'los',
    'las',
    'del',
    'por',
    'para',
    'con',
    'un',
    'una',
    'al',
    'se',
    'su',
    'mas',
    'huanuco',
    'suma',
    'registra',
    'logra',
    'abre',
    'realiza',
    'inicia',
  ]);
  const tokensA = normalizeForMatch(titleA)
    .split(' ')
    .filter((w) => w.length > 2 && !stopWords.has(w));
  const tokensB = normalizeForMatch(titleB)
    .split(' ')
    .filter((w) => w.length > 2 && !stopWords.has(w));
  if (tokensA.length < 2 || tokensB.length < 2) return false;
  const setB = new Set(tokensB);
  let shared = 0;
  for (const t of new Set(tokensA)) {
    if (setB.has(t)) shared++;
  }
  const minLen = Math.min(new Set(tokensA).size, setB.size);
  return shared >= 3 || (minLen > 0 && shared / minLen >= 0.6);
}

async function fetchWordPressFeaturedImagesMap(wpApiUrl?: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!wpApiUrl) return map;

  try {
    const res = await fetch(wpApiUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json,text/plain,*/*',
        'Accept-Language': 'es-PE,es;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return map;
    const posts = await res.json();
    if (!Array.isArray(posts)) return map;

    for (const post of posts) {
      const link = typeof post?.link === 'string' ? post.link.trim() : '';
      const mediaUrl =
        post?._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
        post?.yoast_head_json?.og_image?.[0]?.url ||
        post?.jetpack_featured_media_url;
      const resolved = normalizeAndValidateNewsImageUrl(mediaUrl, link || 'https://inforegion.pe');
      if (link && resolved) {
        map.set(link.replace(/\/$/, '').toLowerCase(), resolved);
      }
    }
  } catch {
    // Silenciar si el endpoint secundario de imagen no responde
  }

  return map;
}

async function resolveImageViaPublisherWpSearch(
  sourceOriginOrName: string,
  articleTitle: string
): Promise<{
  original: string;
  resolved: string;
  source: NewsImageSourceType;
  articleUrl?: string;
} | null> {
  const lower = (sourceOriginOrName || '').toLowerCase();
  let wpBase: string | null = null;
  if (lower.includes('inforegion')) wpBase = 'https://inforegion.pe';
  else if (lower.includes('pagina3') || lower.includes('página3')) wpBase = 'https://pagina3.pe';
  else if (lower.includes('tudiariohuanuco') || lower.includes('tu diario'))
    wpBase = 'https://tudiariohuanuco.pe';
  else if (lower.includes('ahora.com.pe') || lower.includes('diario ahora'))
    wpBase = 'https://ahora.com.pe';
  else if (lower.includes('elbuho') || lower.includes('el búho')) wpBase = 'https://elbuho.pe';

  if (!wpBase) return null;

  try {
    const ignoredVerbs = new Set([
      'suma',
      'registra',
      'refuerza',
      'logra',
      'abre',
      'impulsan',
      'fortalece',
      'equipa',
      'coordina',
      'coordinan',
      'para',
      'ante',
      'tras',
      'sobre',
      'contra',
      'mediante',
      'desde',
      'hasta',
      'entre',
      'como',
      'por',
      'con',
      'los',
      'las',
      'del',
      'una',
    ]);
    const cleanWords = articleTitle
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter((w) => w.length >= 3 && !ignoredVerbs.has(normalizeForMatch(w)));

    const query = cleanWords.slice(0, 5).join(' ');
    if (!query) return null;

    const apiUrl = `${wpBase}/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&_embed&per_page=5`;
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8500),
    });
    if (!res.ok) return null;
    const posts = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) return null;

    for (const post of posts) {
      const candidateTitle = decodeHtmlEntities(
        typeof post?.title?.rendered === 'string' ? post.title.rendered : ''
      )
        .replace(/<[^>]+>/g, ' ')
        .trim();
      if (!candidateTitle || !areTitlesRelatedForPublisherMatch(candidateTitle, articleTitle)) {
        continue;
      }
      const postLink = typeof post?.link === 'string' ? post.link.trim() : wpBase;
      const yoastOg = post?.yoast_head_json?.og_image?.[0]?.url;
      const wpFeatured =
        post?._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
        post?.jetpack_featured_media_url;

      const rawCandidate = yoastOg || wpFeatured;
      if (typeof rawCandidate === 'string') {
        const resolved = normalizeAndValidateNewsImageUrl(rawCandidate, postLink);
        if (resolved) {
          return {
            original: rawCandidate,
            resolved,
            source: yoastOg ? 'og:image' : 'portal-api',
            articleUrl: postLink,
          };
        }
      }

      if (postLink && postLink.startsWith('http')) {
        const scraped = await extractStructuredImageFromArticlePage(postLink);
        if (scraped) {
          return {
            ...scraped,
            articleUrl: postLink,
          };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resuelve la URL real de una nota de gob.pe y extrae su imagen principal (og:image / twitter:image / JSON-LD / HTML)
 */
async function resolveGobPeArticleAndImage(articleTitle: string): Promise<{
  original: string;
  resolved: string;
  source: NewsImageSourceType;
  articleUrl?: string;
  summary?: string;
} | null> {
  if (!articleTitle) return null;
  try {
    const searchUrl = `https://www.gob.pe/busquedas.json?term=${encodeURIComponent(articleTitle)}&contenido[]=noticias`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data?.data?.attributes?.results;
    if (!Array.isArray(results) || results.length === 0) return null;

    for (const entry of results.slice(0, 4)) {
      const candidateTitle = decodeHtmlEntities(String(entry?.name_with_parent || '')).trim();
      if (!candidateTitle || !areTitlesRelatedForPublisherMatch(candidateTitle, articleTitle)) {
        continue;
      }
      const hrefMatch = String(entry?.url || '').match(/href=["']([^"']+)["']/i);
      if (!hrefMatch || !hrefMatch[1]) continue;

      const realArticleUrl = new URL(hrefMatch[1], 'https://www.gob.pe').href;
      const cleanSummary = cleanRssSummaryText(String(entry?.content || ''), articleTitle, 'gob.pe');

      if (entry?.image_url) {
        const directResolved = normalizeAndValidateNewsImageUrl(
          String(entry.image_url),
          realArticleUrl
        );
        if (directResolved) {
          return {
            original: String(entry.image_url),
            resolved: directResolved,
            source: 'portal-api',
            articleUrl: realArticleUrl,
            summary: cleanSummary || undefined,
          };
        }
      }

      const pageExtracted = await extractStructuredImageFromArticlePage(realArticleUrl);
      if (pageExtracted) {
        return {
          original: pageExtracted.original,
          resolved: pageExtracted.resolved,
          source: pageExtracted.source,
          articleUrl: pageExtracted.finalArticleUrl || realArticleUrl,
          summary: cleanSummary || undefined,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

let cachedDiarioCorreoLinks: Array<{ title: string; url: string }> | null = null;
let cachedDiarioCorreoLinksAt = 0;

async function getDiarioCorreoHuanucoIndex(): Promise<Array<{ title: string; url: string }>> {
  if (cachedDiarioCorreoLinks && Date.now() - cachedDiarioCorreoLinksAt < 10 * 60 * 1000) {
    return cachedDiarioCorreoLinks;
  }
  try {
    const res = await fetch('https://diariocorreo.pe/edicion/huanuco/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return cachedDiarioCorreoLinks || [];
    const html = await res.text();
    const list: Array<{ title: string; url: string }> = [];
    const seen = new Set<string>();

    const anchorMatches = [
      ...html.matchAll(
        /<a[^>]+href=["'](\/edicion\/huanuco\/[^"']+-noticia\/?)["'][^>]*>([\s\S]*?)<\/a>/gi
      ),
    ];
    for (const m of anchorMatches) {
      const pathPart = m[1];
      const text = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ' '))
        .replace(/\s+/g, ' ')
        .trim();
      if (!pathPart || !text || text.length < 18) continue;
      const fullUrl = new URL(pathPart, 'https://diariocorreo.pe').href;
      if (seen.has(fullUrl)) continue;
      seen.add(fullUrl);
      list.push({ title: text, url: fullUrl });
    }

    cachedDiarioCorreoLinks = list;
    cachedDiarioCorreoLinksAt = Date.now();
    return list;
  } catch {
    return cachedDiarioCorreoLinks || [];
  }
}

async function resolveDiarioCorreoArticleAndImage(articleTitle: string): Promise<{
  original: string;
  resolved: string;
  source: NewsImageSourceType;
  articleUrl?: string;
} | null> {
  const index = await getDiarioCorreoHuanucoIndex();
  for (const item of index) {
    if (areTitlesRelatedForPublisherMatch(item.title, articleTitle)) {
      const extracted = await extractStructuredImageFromArticlePage(item.url);
      if (extracted) {
        return {
          ...extracted,
          articleUrl: item.url,
        };
      }
    }
  }
  return null;
}

/**
 * Fuente oficial Gobierno Regional Huánuco (regionhuanuco.gob.pe + gob.pe/institucion/regionhuanuco/noticias)
 */
async function fetchRegionHuanucoGobNews(source: NewsSourceConfig): Promise<{
  status: NewsSourceStatus;
  items: HuanucoNewsItem[];
}> {
  const fetchedAt = new Date().toISOString();
  const acceptedItems: HuanucoNewsItem[] = [];
  let totalRawFound = 0;

  try {
    // 1. Consultar API oficial del portal regionhuanuco.gob.pe (gestionportales.regionhuanuco.gob.pe)
    try {
      const portalRes = await fetch(
        'https://gestionportales.regionhuanuco.gob.pe/api/noticiasini?domain=https://www.regionhuanuco.gob.pe',
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(7000),
        }
      );

      if (portalRes.ok) {
        const portalJson = await portalRes.json();
        const rawList = Array.isArray(portalJson?.listanoticias)
          ? portalJson.listanoticias
          : Array.isArray(portalJson?.data)
          ? portalJson.data
          : [];

        totalRawFound += rawList.length;

        for (const entry of rawList) {
          const idNoticia = entry?.idnoticias;
          const rawTitle = decodeHtmlEntities(String(entry?.titulo || ''))
            .replace(/\s+/g, ' ')
            .trim();
          if (!idNoticia || !rawTitle) continue;

          // Formatear título en mayúsculas sostenidas a formato oración legible si viene todo en mayúsculas
          const formattedTitle =
            rawTitle === rawTitle.toUpperCase() && rawTitle.length > 20
              ? rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1).toLowerCase()
              : rawTitle;

          const articleUrl = `https://www.regionhuanuco.gob.pe/noticias/${idNoticia}`;
          const rawFecha = String(entry?.fecha || '').trim();
          let publishedDate = rawFecha ? new Date(rawFecha.replace(' ', 'T') + '-05:00') : new Date();
          if (isNaN(publishedDate.getTime())) {
            publishedDate = new Date();
          }

          const ageDays = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
          if (ageDays > 30) continue;

          const summary = cleanRssSummaryText(
            String(entry?.contenido || ''),
            formattedTitle,
            'regionhuanuco.gob.pe'
          );

          const check = verifyAndClassifyHuanucoNews({
            title: formattedTitle,
            summary,
            url: articleUrl,
            rawCategories: ['Gestión Regional'],
            isLocalHuanucoMedia: true,
          });

          const rawImgCandidate = entry?.img1 || entry?.raw_img1 || null;
          let resolvedImg = normalizeAndValidateNewsImageUrl(
            rawImgCandidate,
            'https://gestionportales.regionhuanuco.gob.pe'
          );
          let imgSource: NewsImageSourceType = resolvedImg ? 'portal-api' : 'category-fallback';
          let imgOrig: string | null = rawImgCandidate ? String(rawImgCandidate) : null;

          if (!resolvedImg) {
            const detailImg = await extractStructuredImageFromArticlePage(articleUrl);
            if (detailImg) {
              resolvedImg = detailImg.resolved;
              imgOrig = detailImg.original;
              imgSource = detailImg.source;
            }
          }

          const hasValidImg = Boolean(resolvedImg && isUsableNewsImageUrl(resolvedImg));

          acceptedItems.push({
            id: buildDeterministicNewsId(articleUrl, formattedTitle),
            title: formattedTitle,
            summary:
              summary ||
              `Nota oficial publicada por el Gobierno Regional Huánuco (regionhuanuco.gob.pe).`,
            content: summary || `Nota oficial publicada por el Gobierno Regional Huánuco (regionhuanuco.gob.pe).`,
            url: articleUrl,
            imageUrl: hasValidImg ? resolvedImg! : DEFAULT_PERU_NEWS_FALLBACK_IMAGE,
            imageUrlOriginal: imgOrig,
            imageUrlResolved: hasValidImg ? resolvedImg! : null,
            imageSource: hasValidImg ? imgSource : 'category-fallback',
            imageStatus: hasValidImg ? 'VERIFIED_REMOTE' : 'FALLBACK_CATEGORY',
            imageFallbackUsed: !hasValidImg,
            sourceId: source.id,
            sourceName: 'regionhuanuco.gob.pe',
            sourceDomain: 'regionhuanuco.gob.pe',
            publishedAt: publishedDate.toISOString(),
            fetchedAt,
            category: check.category,
            section: 'peru',
            country: 'Perú',
            isFeatured: false,
            detectedLocations:
              check.detectedLocations.length > 0 ? check.detectedLocations : ['Huánuco'],
            primaryLocation: check.primaryLocation || 'Huánuco',
            isVerifiedHuanuco: true,
          });
        }
      }
    } catch {
      // Continuar con gob.pe/institucion/regionhuanuco/noticias
    }

    // 2. Consultar listado institucional en gob.pe/institucion/regionhuanuco/noticias
    const gobRes = await fetch(source.rssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (gobRes.ok) {
      const html = await gobRes.text();
      const cardBlocks =
        html.match(/<li[^>]+class=["'][^"']*scrollable__item[^"']*["'][\s\S]*?<\/li>/gi) || [];
      totalRawFound += cardBlocks.length;

      for (const block of cardBlocks.slice(0, 8)) {
        const linkMatch = block.match(
          /href=["'](\/institucion\/regionhuanuco\/noticias\/[^"']+)["']/i
        );
        const titleMatch = block.match(/<h3[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h3>/i);
        if (!linkMatch || !titleMatch) continue;

        const articleUrl = new URL(linkMatch[1], 'https://www.gob.pe').href;
        const rawTitle = decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, ' '))
          .replace(/\s+/g, ' ')
          .trim();
        if (!rawTitle) continue;

        const figImgMatch = block.match(/<figure[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
        const descMatch = block.match(/id=["'][^"']*-description["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
        const timeMatch = block.match(/<time[^>]+datetime=["']([^"']+)["']/i);

        let publishedDate = timeMatch?.[1]
          ? new Date(timeMatch[1].trim().replace(' ', 'T') + '-05:00')
          : new Date();
        if (isNaN(publishedDate.getTime())) {
          publishedDate = new Date();
        }
        const ageDays = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays > 30) continue;

        const summary = cleanRssSummaryText(
          descMatch?.[1] || '',
          rawTitle,
          'regionhuanuco.gob.pe'
        );

        // Intentar primero extracción estructurada de la página individual (og:image -> twitter:image -> JSON-LD -> HTML)
        let imgOrig: string | null = figImgMatch?.[1] ? decodeHtmlEntities(figImgMatch[1]).trim() : null;
        let resolvedImg: string | null = normalizeAndValidateNewsImageUrl(imgOrig, articleUrl);
        let imgSource: NewsImageSourceType = resolvedImg ? 'html-main' : 'category-fallback';

        const structured = await extractStructuredImageFromArticlePage(articleUrl);
        if (structured) {
          imgOrig = structured.original;
          resolvedImg = structured.resolved;
          imgSource = structured.source;
        }

        const hasValidImg = Boolean(resolvedImg && isUsableNewsImageUrl(resolvedImg));
        const check = verifyAndClassifyHuanucoNews({
          title: rawTitle,
          summary,
          url: articleUrl,
          rawCategories: ['Gestión Regional'],
          isLocalHuanucoMedia: true,
        });

        acceptedItems.push({
          id: buildDeterministicNewsId(articleUrl, rawTitle),
          title: rawTitle,
          summary:
            summary ||
            `Nota oficial del Gobierno Regional Huánuco publicada en gob.pe.`,
          content: summary || `Nota oficial del Gobierno Regional Huánuco publicada en gob.pe.`,
          url: articleUrl,
          imageUrl: hasValidImg ? resolvedImg! : DEFAULT_PERU_NEWS_FALLBACK_IMAGE,
          imageUrlOriginal: imgOrig,
          imageUrlResolved: hasValidImg ? resolvedImg! : null,
          imageSource: hasValidImg ? imgSource : 'category-fallback',
          imageStatus: hasValidImg ? 'VERIFIED_REMOTE' : 'FALLBACK_CATEGORY',
          imageFallbackUsed: !hasValidImg,
          sourceId: source.id,
          sourceName: 'regionhuanuco.gob.pe',
          sourceDomain: 'regionhuanuco.gob.pe',
          publishedAt: publishedDate.toISOString(),
          fetchedAt,
          category: check.category,
          section: 'peru',
          country: 'Perú',
          isFeatured: false,
          detectedLocations:
            check.detectedLocations.length > 0 ? check.detectedLocations : ['Huánuco'],
          primaryLocation: check.primaryLocation || 'Huánuco',
          isVerifiedHuanuco: true,
        });
      }
    }

    return {
      status: {
        id: source.id,
        name: source.name,
        rssUrl: source.rssUrl,
        websiteUrl: source.websiteUrl,
        enabled: source.enabled,
        lastFetchedAt: fetchedAt,
        fetchStatus: acceptedItems.length > 0 ? 'OK' : 'ERROR',
        itemsFound: totalRawFound,
        huanucoItemsAccepted: acceptedItems.length,
        lastError: acceptedItems.length > 0 ? null : 'Sin ítems recientes en portal regional',
      },
      items: acceptedItems,
    };
  } catch (err) {
    return {
      status: {
        id: source.id,
        name: source.name,
        rssUrl: source.rssUrl,
        websiteUrl: source.websiteUrl,
        enabled: source.enabled,
        lastFetchedAt: fetchedAt,
        fetchStatus: 'ERROR',
        itemsFound: totalRawFound,
        huanucoItemsAccepted: acceptedItems.length,
        lastError: err instanceof Error ? err.message : 'Error consultando regionhuanuco.gob.pe',
      },
      items: acceptedItems,
    };
  }
}

async function fetchNewsFromSingleSource(source: NewsSourceConfig): Promise<{
  status: NewsSourceStatus;
  items: HuanucoNewsItem[];
}> {
  if (source.id === 'regionhuanuco-gob') {
    return fetchRegionHuanucoGobNews(source);
  }

  const fetchedAt = new Date().toISOString();

  try {
    const [rssResponse, wpImagesMap] = await Promise.all([
      fetch(source.rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; HuanucoPreciosHoy/1.0)',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(9000),
      }),
      fetchWordPressFeaturedImagesMap(source.wpApiUrl),
    ]);

    if (!rssResponse.ok) {
      throw new Error(`HTTP ${rssResponse.status}`);
    }

    const xml = await rssResponse.text();
    const rawItemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

    const acceptedItems: HuanucoNewsItem[] = [];
    let deepFetchCount = 0;

    for (const itemXml of rawItemBlocks) {
      if (acceptedItems.length >= 25) break;
      let rawTitle = decodeHtmlEntities(extractTagValue(itemXml, 'title')).replace(/\s+/g, ' ').trim();
      let rawLink = decodeHtmlEntities(extractTagValue(itemXml, 'link')).trim();
      const rawPubDate = extractTagValue(itemXml, 'pubDate').trim();
      const rawDescription = extractTagValue(itemXml, 'description');
      const rawContentEncoded = extractTagValue(itemXml, 'content:encoded');
      const rawSourceTag = decodeHtmlEntities(extractTagValue(itemXml, 'source')).trim();
      const rawCategories = extractAllCategories(itemXml);

      if (!rawTitle || !rawLink) continue;

      let resolvedSourceName = source.name;
      if (rawSourceTag) {
        resolvedSourceName = rawSourceTag;
      }
      if (!source.isLocalHuanucoMedia && rawTitle.includes(' - ')) {
        const lastDashIdx = rawTitle.lastIndexOf(' - ');
        const trailingSource = rawTitle.slice(lastDashIdx + 3).trim();
        const cleanMainTitle = rawTitle.slice(0, lastDashIdx).trim();
        if (trailingSource && trailingSource.length < 45 && cleanMainTitle.length > 15) {
          if (!rawSourceTag) {
            resolvedSourceName = trailingSource;
          }
          rawTitle = cleanMainTitle;
        }
      }

      const lowerSource = resolvedSourceName.toLowerCase();
      if (EXCLUDED_SOURCE_NAMES.some((ex) => lowerSource.includes(ex))) {
        continue;
      }

      let summary = cleanRssSummaryText(
        rawDescription || rawContentEncoded,
        rawTitle,
        resolvedSourceName
      );

      let publishedDate = rawPubDate ? new Date(rawPubDate) : new Date();
      if (isNaN(publishedDate.getTime())) {
        publishedDate = new Date();
      }
      const ageDays = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > 21) {
        continue;
      }

      const targetSection: 'peru' | 'internacional' = source.section || 'peru';
      const isPeru = targetSection === 'peru';

      let isVerifiedHuanuco = false;
      let primaryLocation = isPeru ? 'Perú' : 'Internacional';
      let detectedLocations: string[] = [];
      let category = isPeru ? 'Nacional' : 'Internacional';

      if (source.isLocalHuanucoMedia) {
        const check = verifyAndClassifyHuanucoNews({
          title: rawTitle,
          summary,
          url: rawLink,
          rawCategories,
          isLocalHuanucoMedia: source.isLocalHuanucoMedia,
        });
        if (!check.isRelevantHuanuco) {
          continue;
        }
        isVerifiedHuanuco = true;
        primaryLocation = check.primaryLocation;
        detectedLocations = check.detectedLocations;
        category = check.category;
      }

      let imageUrlOriginal: string | null = null;
      let imageUrlResolved: string | null = null;
      let imageSource: NewsImageSourceType = 'category-fallback';

      // Paso 1: Si el API del medio (yoast og:image / wp:featuredmedia) o el RSS ya provee la imagen principal
      if (wpImagesMap.size > 0) {
        const normalizedLink = rawLink.replace(/\/$/, '').toLowerCase();
        const wpMapped = wpImagesMap.get(normalizedLink) || null;
        if (wpMapped) {
          imageUrlOriginal = wpMapped;
          imageUrlResolved = wpMapped;
          imageSource = 'og:image';
        }
      }

      if (!imageUrlResolved) {
        const xmlImg = extractImageFromItemXmlWithSource(itemXml, source.websiteUrl);
        if (xmlImg) {
          imageUrlOriginal = xmlImg.original;
          imageUrlResolved = xmlImg.resolved;
          imageSource = xmlImg.source;
        }
      }

      // Paso 2: Extracción estructurada de la página individual (a. og:image -> b. twitter:image -> c. JSON-LD -> d. HTML principal -> e. contenido)
      if (!imageUrlResolved && deepFetchCount < 10 && !rawLink.includes('news.google.com/rss/articles/')) {
        deepFetchCount++;
        const pageImage = await extractStructuredImageFromArticlePage(rawLink);
        if (pageImage) {
          imageUrlOriginal = pageImage.original;
          imageUrlResolved = pageImage.resolved;
          imageSource = pageImage.source;
        }
      }

      // Paso 3: Si proviene de gob.pe o regionhuanuco.gob.pe (ej. vía Google News), resolver su página individual en gob.pe y extraer og:image / twitter:image / JSON-LD / HTML
      if (
        !imageUrlResolved &&
        deepFetchCount < 10 &&
        (lowerSource.includes('gob.pe') || rawLink.includes('gob.pe'))
      ) {
        deepFetchCount++;
        const gobResolved = await resolveGobPeArticleAndImage(rawTitle);
        if (gobResolved) {
          imageUrlOriginal = gobResolved.original;
          imageUrlResolved = gobResolved.resolved;
          imageSource = gobResolved.source;
          if (gobResolved.articleUrl && rawLink.includes('news.google.com')) {
            rawLink = gobResolved.articleUrl;
          }
          if (!summary && gobResolved.summary) {
            summary = gobResolved.summary;
          }
        }
      }

      // Paso 4: Si proviene de Diario Correo (correo-huanuco-rss o Google News), resolver página individual en diariocorreo.pe y extraer og:image
      if (
        !imageUrlResolved &&
        deepFetchCount < 10 &&
        (lowerSource.includes('correo') || source.id === 'correo-huanuco-rss')
      ) {
        deepFetchCount++;
        const correoResolved = await resolveDiarioCorreoArticleAndImage(rawTitle);
        if (correoResolved) {
          imageUrlOriginal = correoResolved.original;
          imageUrlResolved = correoResolved.resolved;
          imageSource = correoResolved.source;
          if (correoResolved.articleUrl && rawLink.includes('news.google.com')) {
            rawLink = correoResolved.articleUrl;
          }
        }
      }

      // Paso 5: Si pertenece a un medio con API WordPress (inforegion.pe, pagina3.pe, tudiariohuanuco.pe, ahora.com.pe, elbuho.pe), resolver imagen real
      if (!imageUrlResolved && deepFetchCount < 10) {
        const wpSearchImg = await resolveImageViaPublisherWpSearch(resolvedSourceName, rawTitle);
        if (wpSearchImg) {
          deepFetchCount++;
          imageUrlOriginal = wpSearchImg.original;
          imageUrlResolved = wpSearchImg.resolved;
          imageSource = wpSearchImg.source;
          if (wpSearchImg.articleUrl && rawLink.includes('news.google.com')) {
            rawLink = wpSearchImg.articleUrl;
          }
        }
      }

      const hasValidImage = Boolean(imageUrlResolved && isUsableNewsImageUrl(imageUrlResolved));
      const defaultFallback = isPeru
        ? DEFAULT_PERU_NEWS_FALLBACK_IMAGE
        : DEFAULT_MUNDO_NEWS_FALLBACK_IMAGE;
      const finalImageUrl = hasValidImage ? imageUrlResolved! : defaultFallback;

      let sourceDomain = '';
      try {
        sourceDomain = new URL(rawLink).hostname.replace(/^www\./, '');
      } catch {
        try {
          sourceDomain = new URL(source.websiteUrl).hostname.replace(/^www\./, '');
        } catch {
          sourceDomain = '';
        }
      }

      const factSheet = generateNewsFactSheet({
        title: rawTitle,
        summary,
        content: summary,
        publishedAt: publishedDate.toISOString(),
        sourceName: resolvedSourceName,
        section: targetSection,
        country: isPeru ? 'Perú' : 'Internacional',
        primaryLocation,
        detectedLocations,
        category,
      });

      acceptedItems.push({
        id: buildDeterministicNewsId(rawLink, rawTitle),
        title: rawTitle,
        summary:
          factSheet.summaryParagraphs[0] ||
          summary ||
          `Información verificada sobre ${primaryLocation} publicada por ${resolvedSourceName}.`,
        content: factSheet.summaryParagraphs.join('\n\n'),
        keyFacts: factSheet.keyFacts,
        whatIsKnown: factSheet.whatIsKnown,
        whyItMatters: factSheet.whyItMatters,
        context: factSheet.context,
        isLimitedInfo: factSheet.isLimitedInfo,
        url: rawLink,
        imageUrl: finalImageUrl,
        imageUrlOriginal,
        imageUrlResolved: hasValidImage ? imageUrlResolved : null,
        imageSource: hasValidImage ? imageSource : 'category-fallback',
        imageStatus: hasValidImage ? 'VERIFIED_REMOTE' : 'FALLBACK_CATEGORY',
        imageFallbackUsed: !hasValidImage,
        sourceId: source.id,
        sourceName: resolvedSourceName,
        sourceDomain,
        publishedAt: publishedDate.toISOString(),
        fetchedAt,
        category,
        section: targetSection,
        country: isPeru ? 'Perú' : 'Internacional',
        isFeatured: false,
        detectedLocations,
        primaryLocation,
        isVerifiedHuanuco,
      });
    }

    return {
      status: {
        id: source.id,
        name: source.name,
        rssUrl: source.rssUrl,
        websiteUrl: source.websiteUrl,
        enabled: source.enabled,
        lastFetchedAt: fetchedAt,
        fetchStatus: 'OK',
        itemsFound: rawItemBlocks.length,
        huanucoItemsAccepted: acceptedItems.length,
        lastError: null,
      },
      items: acceptedItems,
    };
  } catch (err) {
    return {
      status: {
        id: source.id,
        name: source.name,
        rssUrl: source.rssUrl,
        websiteUrl: source.websiteUrl,
        enabled: source.enabled,
        lastFetchedAt: fetchedAt,
        fetchStatus: 'ERROR',
        itemsFound: 0,
        huanucoItemsAccepted: 0,
        lastError: err instanceof Error ? err.message : 'Error de conexión con fuente RSS',
      },
      items: [],
    };
  }
}

function hasRealJournalisticImage(imageUrl?: string | null): boolean {
  return Boolean(
    imageUrl &&
      imageUrl !== DEFAULT_HUANUCO_NEWS_FALLBACK_IMAGE &&
      isUsableNewsImageUrl(imageUrl)
  );
}

/**
 * Enriquecer ítems existentes en caché que aún no tengan imagen real (ej. gob.pe, inforegion.pe, diariocorreo.pe)
 */
async function enrichMissingImageForExistingItem(item: HuanucoNewsItem): Promise<HuanucoNewsItem> {
  const existingResolved = normalizeAndValidateNewsImageUrl(item.imageUrl, item.url);
  if (existingResolved) {
    return {
      ...item,
      imageUrl: existingResolved,
      imageUrlOriginal: item.imageUrlOriginal || item.imageUrl || existingResolved,
      imageUrlResolved: existingResolved,
      imageSource: item.imageSource || 'article-page',
      imageStatus: 'VERIFIED_REMOTE',
      imageFallbackUsed: false,
    };
  }

  const lowerSource = (item.sourceName || '').toLowerCase();

  if (lowerSource.includes('gob.pe') || item.url.includes('gob.pe')) {
    const gobRes = await resolveGobPeArticleAndImage(item.title);
    if (gobRes) {
      return {
        ...item,
        url:
          gobRes.articleUrl && item.url.includes('news.google.com')
            ? gobRes.articleUrl
            : item.url,
        summary:
          item.summary.startsWith('Información verificada sobre') && gobRes.summary
            ? gobRes.summary
            : item.summary,
        imageUrl: gobRes.resolved,
        imageUrlOriginal: gobRes.original,
        imageUrlResolved: gobRes.resolved,
        imageSource: gobRes.source,
        imageStatus: 'VERIFIED_REMOTE',
        imageFallbackUsed: false,
      };
    }
  }

  if (lowerSource.includes('correo') || item.sourceId === 'correo-huanuco-rss') {
    const correoRes = await resolveDiarioCorreoArticleAndImage(item.title);
    if (correoRes) {
      return {
        ...item,
        url:
          correoRes.articleUrl && item.url.includes('news.google.com')
            ? correoRes.articleUrl
            : item.url,
        imageUrl: correoRes.resolved,
        imageUrlOriginal: correoRes.original,
        imageUrlResolved: correoRes.resolved,
        imageSource: correoRes.source,
        imageStatus: 'VERIFIED_REMOTE',
        imageFallbackUsed: false,
      };
    }
  }

  const wpRes = await resolveImageViaPublisherWpSearch(item.sourceName, item.title);
  if (wpRes) {
    return {
      ...item,
      url:
        wpRes.articleUrl && item.url.includes('news.google.com')
          ? wpRes.articleUrl
          : item.url,
      imageUrl: wpRes.resolved,
      imageUrlOriginal: wpRes.original,
      imageUrlResolved: wpRes.resolved,
      imageSource: wpRes.source,
      imageStatus: 'VERIFIED_REMOTE',
      imageFallbackUsed: false,
    };
  }

  if (!item.url.includes('news.google.com/rss/articles/')) {
    const directRes = await extractStructuredImageFromArticlePage(item.url);
    if (directRes) {
      return {
        ...item,
        imageUrl: directRes.resolved,
        imageUrlOriginal: directRes.original,
        imageUrlResolved: directRes.resolved,
        imageSource: directRes.source,
        imageStatus: 'VERIFIED_REMOTE',
        imageFallbackUsed: false,
      };
    }
  }

  return {
    ...item,
    imageUrl: DEFAULT_HUANUCO_NEWS_FALLBACK_IMAGE,
    imageUrlOriginal: item.imageUrlOriginal ?? null,
    imageUrlResolved: null,
    imageSource: 'category-fallback',
    imageStatus: 'FALLBACK_CATEGORY',
    imageFallbackUsed: true,
  };
}

export function deduplicateAndSortNews(items: HuanucoNewsItem[]): HuanucoNewsItem[] {
  const sortedCandidates = [...items].sort((a, b) => {
    const aHasImg = hasRealJournalisticImage(a.imageUrl) ? 1 : 0;
    const bHasImg = hasRealJournalisticImage(b.imageUrl) ? 1 : 0;
    if (aHasImg !== bHasImg) return bHasImg - aHasImg;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const uniqueByUrl = new Map<string, HuanucoNewsItem>();
  const acceptedList: HuanucoNewsItem[] = [];

  for (const rawItem of sortedCandidates) {
    const normalizedImg = normalizeAndValidateNewsImageUrl(rawItem.imageUrl, rawItem.url);
    const hasImg = Boolean(normalizedImg);
    const item: HuanucoNewsItem = {
      ...rawItem,
      imageUrl: hasImg ? normalizedImg! : DEFAULT_HUANUCO_NEWS_FALLBACK_IMAGE,
      imageUrlOriginal: rawItem.imageUrlOriginal ?? (hasImg ? rawItem.imageUrl : null),
      imageUrlResolved: hasImg ? normalizedImg! : null,
      imageSource: hasImg ? rawItem.imageSource || 'article-page' : 'category-fallback',
      imageStatus: hasImg ? 'VERIFIED_REMOTE' : 'FALLBACK_CATEGORY',
      imageFallbackUsed: !hasImg,
    };
    const cleanUrl = item.url.replace(/\/$/, '').toLowerCase();
    if (uniqueByUrl.has(cleanUrl)) continue;

    const isDupTitle = acceptedList.some((existing) =>
      areTitlesNearDuplicate(existing.title, item.title)
    );
    if (isDupTitle) continue;

    uniqueByUrl.set(cleanUrl, item);
    acceptedList.push(item);
  }

  acceptedList.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const peruItems = acceptedList.filter((it) => it.section === 'peru');
  const intlItems = acceptedList.filter((it) => it.section === 'internacional');

  // Asegurar una selección equilibrada de alta calidad de ambas secciones
  const topPeru = peruItems.slice(0, 45);
  const topIntl = intlItems.slice(0, 45);

  const combined = [...topPeru, ...topIntl];
  combined.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return combined;
}

const LOCAL_NEWS_CACHE_FILE = path.join(process.cwd(), 'data', 'news-huanuco.json');

interface PersistedNewsState {
  updatedAt: string | null;
  sources: NewsSourceStatus[];
  items: HuanucoNewsItem[];
}

let memoryNewsState: PersistedNewsState = {
  updatedAt: null,
  sources: [],
  items: [],
};

export function loadNewsFromLocalBackup(): PersistedNewsState {
  if (memoryNewsState.items.length > 0) {
    return memoryNewsState;
  }
  try {
    if (fs.existsSync(LOCAL_NEWS_CACHE_FILE)) {
      const raw = fs.readFileSync(LOCAL_NEWS_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as PersistedNewsState;
      if (parsed && Array.isArray(parsed.items)) {
        parsed.items = parsed.items.map((it) => {
          const itemSection: 'peru' | 'internacional' = it.section || (
            it.sourceId?.includes('bbc') || it.sourceId?.includes('cnn') || it.sourceId?.includes('dw') || it.sourceId?.includes('mundo') || it.sourceName?.toLowerCase().includes('mundo') || it.sourceName?.toLowerCase().includes('bbc')
              ? 'internacional'
              : 'peru'
          );
          const defaultFallback = itemSection === 'internacional'
            ? DEFAULT_MUNDO_NEWS_FALLBACK_IMAGE
            : DEFAULT_PERU_NEWS_FALLBACK_IMAGE;
          const rawImg = it.imageUrl || '';
          const isFallback = !rawImg || rawImg.includes('news-fallback') || rawImg.includes('huanuco-news-fallback') || rawImg.includes('news.google.com/images/');
          const validImg = isFallback ? null : normalizeAndValidateNewsImageUrl(rawImg, it.url);

          const factSheet = generateNewsFactSheet({
            title: it.title,
            summary: it.summary,
            content: it.content,
            publishedAt: it.publishedAt,
            sourceName: it.sourceName,
            section: itemSection,
            country: it.country,
            primaryLocation: it.primaryLocation,
            detectedLocations: it.detectedLocations,
            category: it.category,
          });

          return {
            ...it,
            section: itemSection,
            country: it.country || (itemSection === 'peru' ? 'Perú' : 'Internacional'),
            summary: it.summary || factSheet.summaryParagraphs[0],
            content: it.content || factSheet.summaryParagraphs.join('\n\n'),
            keyFacts: it.keyFacts || factSheet.keyFacts,
            whatIsKnown: it.whatIsKnown || factSheet.whatIsKnown,
            whyItMatters: it.whyItMatters || factSheet.whyItMatters,
            context: it.context || factSheet.context,
            isLimitedInfo: it.isLimitedInfo ?? factSheet.isLimitedInfo,
            imageUrl: validImg || defaultFallback,
            imageUrlOriginal: it.imageUrlOriginal ?? (validImg ? it.imageUrl : null),
            imageUrlResolved: validImg || null,
            imageSource: validImg ? it.imageSource || 'article-page' : 'category-fallback',
            imageStatus: validImg ? 'VERIFIED_REMOTE' : 'FALLBACK_CATEGORY',
            imageFallbackUsed: !validImg,
          };
        });
        memoryNewsState = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[NewsService] Aviso al leer caché local de noticias:', err);
  }
  return memoryNewsState;
}

export function saveNewsToLocalBackup(state: PersistedNewsState): void {
  memoryNewsState = state;
  try {
    const dir = path.dirname(LOCAL_NEWS_CACHE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_NEWS_CACHE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[NewsService] Aviso al guardar respaldo local de noticias:', err);
  }
}

export async function loadNewsFromFirestore(
  serverFirestore: Firestore | null
): Promise<PersistedNewsState> {
  const localState = loadNewsFromLocalBackup();

  if (!isServerFirestoreReady(serverFirestore) || !serverFirestore) {
    return localState.items.length > 0 ? localState : { updatedAt: null, sources: [], items: [] };
  }

  try {
    const [newsSnap, sourcesSnap] = await Promise.all([
      serverFirestore.collection('news').orderBy('publishedAt', 'desc').limit(120).get(),
      serverFirestore.collection('newsSources').get(),
    ]);

    const firestoreItems: HuanucoNewsItem[] = [];
    newsSnap.forEach((doc) => {
      const data = doc.data() as HuanucoNewsItem;
      if (data && data.title && data.url) {
        const itemSection: 'peru' | 'internacional' = data.section || (
          data.sourceId?.includes('bbc') || data.sourceId?.includes('cnn') || data.sourceId?.includes('dw') || data.sourceId?.includes('mundo') || data.sourceName?.toLowerCase().includes('mundo') || data.sourceName?.toLowerCase().includes('bbc')
            ? 'internacional'
            : 'peru'
        );
        const defaultFallback = itemSection === 'internacional'
          ? DEFAULT_MUNDO_NEWS_FALLBACK_IMAGE
          : DEFAULT_PERU_NEWS_FALLBACK_IMAGE;
        const rawImg = data.imageUrl || '';
        const isFallback = !rawImg || rawImg.includes('news-fallback') || rawImg.includes('huanuco-news-fallback') || rawImg.includes('news.google.com/images/');
        const validImg = isFallback ? null : normalizeAndValidateNewsImageUrl(rawImg, data.url);

        const factSheet = generateNewsFactSheet({
          title: data.title,
          summary: data.summary,
          content: data.content,
          publishedAt: data.publishedAt,
          sourceName: data.sourceName,
          section: itemSection,
          country: data.country,
          primaryLocation: data.primaryLocation,
          detectedLocations: data.detectedLocations,
          category: data.category,
        });

        firestoreItems.push({
          ...data,
          id: doc.id,
          section: itemSection,
          country: data.country || (itemSection === 'peru' ? 'Perú' : 'Internacional'),
          summary: data.summary || factSheet.summaryParagraphs[0],
          content: data.content || factSheet.summaryParagraphs.join('\n\n'),
          keyFacts: data.keyFacts || factSheet.keyFacts,
          whatIsKnown: data.whatIsKnown || factSheet.whatIsKnown,
          whyItMatters: data.whyItMatters || factSheet.whyItMatters,
          context: data.context || factSheet.context,
          isLimitedInfo: data.isLimitedInfo ?? factSheet.isLimitedInfo,
          imageUrl: validImg || defaultFallback,
          imageUrlOriginal: data.imageUrlOriginal ?? (validImg ? data.imageUrl : null),
          imageUrlResolved: validImg || null,
          imageSource: validImg ? data.imageSource || 'article-page' : 'category-fallback',
          imageStatus: validImg ? 'VERIFIED_REMOTE' : 'FALLBACK_CATEGORY',
          imageFallbackUsed: !validImg,
        });
      }
    });

    const sources: NewsSourceStatus[] = [];
    let firestoreLatestSync = '';
    sourcesSnap.forEach((doc) => {
      const data = doc.data() as NewsSourceStatus;
      if (data && data.id) {
        sources.push(data);
        if (
          data.lastFetchedAt &&
          (!firestoreLatestSync || data.lastFetchedAt > firestoreLatestSync)
        ) {
          firestoreLatestSync = data.lastFetchedAt;
        }
      }
    });

    // Combinar respaldo local fresco con ítems de Firestore y priorizar lo más reciente
    const combinedAll = [...localState.items, ...firestoreItems];
    const deduplicated = deduplicateAndSortNews(combinedAll);

    if (deduplicated.length > 0) {
      const state: PersistedNewsState = {
        updatedAt:
          firestoreLatestSync ||
          localState.updatedAt ||
          deduplicated[0]?.fetchedAt ||
          new Date().toISOString(),
        sources: sources.length > 0 ? sources : localState.sources,
        items: deduplicated,
      };
      memoryNewsState = state;
      return state;
    }
  } catch (err) {
    if (isQuotaExceededError(err)) {
      markServerFirestoreQuotaExceeded(err);
    }
  }

  return localState.items.length > 0 ? localState : { updatedAt: null, sources: [], items: [] };
}

export async function syncHuanucoNews(
  serverFirestore: Firestore | null
): Promise<{
  syncedAt: string;
  sources: NewsSourceStatus[];
  items: HuanucoNewsItem[];
  newItemsCount: number;
}> {
  const enabledSources = NEWS_SOURCES.filter((s) => s.enabled);
  const results = await Promise.all(enabledSources.map((src) => fetchNewsFromSingleSource(src)));

  const sourcesStatus = results.map((r) => r.status);
  const allFetchedItems = results.flatMap((r) => r.items);

  const existingState = await loadNewsFromFirestore(serverFirestore);
  const filteredExistingItems = (existingState.items || []).filter((item) => {
    const lowerSrc = (item.sourceName || '').toLowerCase();
    if (EXCLUDED_SOURCE_NAMES.some((ex) => lowerSrc.includes(ex))) return false;
    const ageDays = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (isNaN(ageDays) || ageDays > 21) return false;
    return true;
  });

  // Enriquecer ítems previos que no tenían imagen real resuelta
  const existingValidItems = await Promise.all(
    filteredExistingItems.map((it) => enrichMissingImageForExistingItem(it))
  );

  const mergedPool = [...allFetchedItems, ...existingValidItems];
  const deduplicatedItems = deduplicateAndSortNews(mergedPool);
  const syncedAt = new Date().toISOString();

  const nextState: PersistedNewsState = {
    updatedAt: syncedAt,
    sources: sourcesStatus,
    items: deduplicatedItems,
  };

  saveNewsToLocalBackup(nextState);

  if (isServerFirestoreReady(serverFirestore) && serverFirestore && deduplicatedItems.length > 0) {
    try {
      const existingDocsSnap = await serverFirestore.collection('news').get();
      const batch = serverFirestore.batch();

      for (const srcStatus of sourcesStatus) {
        const srcRef = serverFirestore.collection('newsSources').doc(srcStatus.id);
        batch.set(srcRef, JSON.parse(JSON.stringify(srcStatus)), { merge: true });
      }

      const validIds = new Set(deduplicatedItems.map((n) => n.id));
      existingDocsSnap.forEach((docSnap) => {
        if (!validIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });

      for (const newsItem of deduplicatedItems) {
        const docRef = serverFirestore.collection('news').doc(newsItem.id);
        batch.set(docRef, JSON.parse(JSON.stringify(newsItem)), { merge: true });
      }

      await batch.commit();
    } catch (err) {
      if (isQuotaExceededError(err)) {
        markServerFirestoreQuotaExceeded(err);
      }
    }
  }

  return {
    syncedAt,
    sources: sourcesStatus,
    items: deduplicatedItems,
    newItemsCount: allFetchedItems.length,
  };
}
