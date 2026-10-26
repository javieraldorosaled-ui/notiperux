// Vercel Serverless Function: GET & POST /api/news-v2
import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

interface RssItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  imageUrl: string;
  sourceId: string;
  sourceName: string;
  sourceDomain: string;
  publishedAt: string;
  fetchedAt: string;
  category: string;
  section: 'peru' | 'internacional';
  country: string;
  isFeatured: boolean;
  detectedLocations: string[];
  primaryLocation: string;
  isVerifiedHuanuco: boolean;
  keyFacts?: { whatHappened: string };
  whatIsKnown?: string[];
  isLimitedInfo?: boolean;
}

function cleanHtml(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function extractImageUrl(itemXml: string): string {
  // 1. media:content o media:thumbnail
  const mediaMatch = itemXml.match(/url=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp|avif)[^"']*)["']/i);
  if (mediaMatch && mediaMatch[1]) return mediaMatch[1];

  // 2. enclosure
  const encMatch = itemXml.match(/<enclosure[^>]+url=["'](https?:\/\/[^"']+)["']/i);
  if (encMatch && encMatch[1]) return encMatch[1];

  // 3. img src en description
  const imgMatch = itemXml.match(/src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp|avif)[^"']*)["']/i);
  if (imgMatch && imgMatch[1]) return imgMatch[1];

  return '/images/news-fallback-peru.svg';
}

function classifyCategory(title: string, summary: string): string {
  const text = `${title} ${summary}`.toLowerCase();
  if (/politica|congreso|presidente|gobierno|ministr|pcm|ley|eleccion|fiscalia|judicial/.test(text)) {
    return 'Política y Poder';
  }
  if (/futbol|gol|partido|copa|seleccion|universitario|alianza|cristal|liga|deporte|champions/.test(text)) {
    return 'Deportes y Fútbol';
  }
  if (/economia|inflacion|dolar|bcr|sueldo|inversion|banco|comercio|mercado|precio/.test(text)) {
    return 'Economía y Finanzas';
  }
  if (/policia|asalto|crimen|sicariato|detenido|balacera|captura|robo|droga|huanuco/.test(text)) {
    return 'Seguridad Ciudadana';
  }
  if (/transporte|carretera|bus|choque|peaje|vial|accidente|vuelo|pasajeros/.test(text)) {
    return 'Transporte y Vialidad';
  }
  if (/salud|hospital|minsa|medico|dengue|vacuna|enfermedad/.test(text)) {
    return 'Salud y Bienestar';
  }
  if (/colegio|escolar|universidad|educacion|pronabec|profesores/.test(text)) {
    return 'Educación y Futuro';
  }
  if (/clima|lluvia|huaico|rio|sismo|temblor|inundacion|ambiente|senamhi/.test(text)) {
    return 'Clima y Medio Ambiente';
  }
  return 'Actualidad Nacional';
}

async function fetchRssFeed(url: string, sourceName: string, sourceId: string, section: 'peru' | 'internacional', timeoutMs = 4000): Promise<RssItem[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotiperuXBot/1.0; +https://notiperux.com)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(timer);

    if (!res.ok) return [];
    const xml = await res.text();
    const rawItems = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

    const nowIso = new Date().toISOString();

    return rawItems.slice(0, 20).map((it, idx) => {
      const titleRaw = (it.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '').trim();
      const linkRaw = (it.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').trim();
      const descRaw = (it.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '').trim();
      const pubDateRaw = (it.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || '').trim();

      const title = cleanHtml(titleRaw);
      const summary = cleanHtml(descRaw) || title;
      const cleanLink = cleanHtml(linkRaw);
      const imageUrl = extractImageUrl(it);

      let publishedAt = nowIso;
      if (pubDateRaw) {
        const parsed = new Date(pubDateRaw);
        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed.toISOString();
        }
      }

      const id = `rss-${sourceId}-${idx}-${Buffer.from(title.slice(0, 30)).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;

      return {
        id,
        title,
        summary,
        content: summary,
        url: cleanLink || 'https://notiperux.com',
        imageUrl,
        sourceId,
        sourceName,
        sourceDomain: url.includes('google') ? 'notiperux.com' : new URL(url).hostname,
        publishedAt,
        fetchedAt: nowIso,
        category: classifyCategory(title, summary),
        section,
        country: section === 'peru' ? 'Perú' : 'Internacional',
        isFeatured: idx === 0,
        detectedLocations: section === 'peru' ? ['Perú'] : [],
        primaryLocation: section === 'peru' ? 'Perú' : 'Internacional',
        isVerifiedHuanuco: false,
        keyFacts: { whatHappened: title },
        whatIsKnown: [summary],
        isLimitedInfo: false,
      };
    });
  } catch {
    return [];
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Fuentes en vivo de Perú e Internacional
    const [googleNewsPeru, andinaNews, bbcNews] = await Promise.all([
      fetchRssFeed('https://news.google.com/rss?hl=es-419&gl=PE&ceid=PE:es-419', 'Google News Perú', 'google-news-peru', 'peru', 3500),
      fetchRssFeed('https://andina.pe/agencia/rss.aspx', 'Agencia Andina', 'andina-peru', 'peru', 3500),
      fetchRssFeed('https://feeds.bbci.co.uk/mundo/rss.xml', 'BBC News Mundo', 'bbc-mundo', 'internacional', 3500),
    ]);

    const liveItems = [...googleNewsPeru, ...andinaNews, ...bbcNews];

    if (liveItems.length > 0) {
      liveItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      return res.status(200).json({
        status: 'OK',
        updatedAt: new Date().toISOString(),
        count: liveItems.length,
        sources: [
          { id: 'google-news-peru', name: 'Google News Perú', fetchStatus: 'OK' },
          { id: 'andina-peru', name: 'Agencia Andina', fetchStatus: 'OK' },
          { id: 'bbc-mundo', name: 'BBC News Mundo', fetchStatus: 'OK' },
        ],
        items: liveItems,
      });
    }

    // Fallback al archivo local si no se pudo descargar en tiempo real
    const fallbackPath = path.join(process.cwd(), 'public', 'data', 'news-huanuco.json');
    if (fs.existsSync(fallbackPath)) {
      const fallbackContent = fs.readFileSync(fallbackPath, 'utf-8');
      const parsed = JSON.parse(fallbackContent);
      return res.status(200).json({
        ...parsed,
        status: 'OK_FALLBACK',
      });
    }

    return res.status(200).json({
      status: 'EMPTY',
      updatedAt: new Date().toISOString(),
      count: 0,
      sources: [],
      items: [],
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'ERROR',
      updatedAt: null,
      count: 0,
      sources: [],
      items: [],
      message: err?.message || 'Error en endpoint de noticias',
    });
  }
}
