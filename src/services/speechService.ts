import { NewsItem } from '../types';
import { generateNewsFactSheet, cleanNewsTitle } from './newsFactSheet';

export type SpeechState = 'idle' | 'playing' | 'paused';

// CONFIGURACIÓN CENTRALIZADA DE GÉNERO DE VOZ
export const VOICE_GENDER = 'male';
export const DEFAULT_SPEECH_RATE = 0.90;
export const DEFAULT_SPEECH_PITCH = 0.80; // Tono grave masculino natural (~115 - 130 Hz)

/**
 * Normaliza y fonetiza texto para síntesis de voz humana en español.
 * Convierte abreviaturas numéricas, monedas, siglas y símbolos en palabras completas.
 */
function prepareTextForHumanProsody(input: string): string {
  if (!input) return '';

  let text = input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(amp|lt|gt|quot|apos|nbsp|#039);/g, ' ')
    .replace(/[\uE000-\uF8FF]/g, '')
    .replace(/https?:\/\/\S+/gi, '');

  text = text
    .replace(/\bS\/\.?\s*(\d+(?:[.,]\d+)?)/gi, '$1 soles')
    .replace(/\bS\/\.?/gi, ' soles ')
    .replace(/\bUSD\s*\$?(\d+)/gi, '$1 dólares')
    .replace(/\bN[°º]\.?\s*/gi, ' número ')
    .replace(/\bNro\.?\s*/gi, ' número ')
    .replace(/%/g, ' por ciento ')
    .replace(/\bkm\/h\b/gi, ' kilómetros por hora ')
    .replace(/\bkm2\b/gi, ' kilómetros cuadrados ')
    .replace(/\bkm²\b/gi, ' kilómetros cuadrados ')
    .replace(/\bkm\b/gi, ' kilómetros ')
    .replace(/\bha\b/gi, ' hectáreas ')
    .replace(/\bm2\b/gi, ' metros cuadrados ')
    .replace(/\bm²\b/gi, ' metros cuadrados ')
    .replace(/\bDr\.\s/g, ' Doctor ')
    .replace(/\bDra\.\s/g, ' Doctora ')
    .replace(/\bEE\.?UU\.?/gi, ' Estados Unidos ')
    .replace(/\bGob\.pe\b/gi, ' Gob Perú ')
    .replace(/\bMINAM\b/g, ' Minam ')
    .replace(/\bMIDAGRI\b/g, ' Midagri ')
    .replace(/\bAPCI\b/g, ' Apci ')
    .replace(/\bAPEC\b/g, ' Apec ');

  text = text
    .replace(/[—–-]/g, ', ')
    .replace(/["'«»“”]/g, '')
    .replace(/[()\[\]]/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Verifica si una voz del sistema es explícitamente masculina.
 */
export function isMaleVoice(voice: SpeechSynthesisVoice | null | undefined): boolean {
  if (!voice || !voice.name) return false;
  const name = voice.name.toLowerCase();

  // Rechazar voces femeninas conocidas
  if (
    /-x-s[f|g|h|i|a|b|c|d|e]/i.test(name) ||
    /_sf/i.test(name) ||
    /spanish female/i.test(name) ||
    name.includes('monica') ||
    name.includes('mónica') ||
    name.includes('paulina') ||
    name.includes('sabina') ||
    name.includes('elvira') ||
    name.includes('marta') ||
    name.includes('dalia') ||
    name.includes('siri') ||
    name.includes('helena') ||
    name.includes('soledad') ||
    name.includes('victoria') ||
    name.includes('lucia') ||
    name.includes('lucía') ||
    name.includes('hilda') ||
    name.includes('mia') ||
    name.includes('zira') ||
    name.includes('female') ||
    name.includes('femenin') ||
    name.includes('mujer')
  ) {
    return false;
  }

  // Confirmar indicadores masculinos
  if (
    /-x-s[m|n|o|p|q|r]/i.test(name) ||
    /_sm/i.test(name) ||
    /spanish male/i.test(name) ||
    name.includes('jorge') ||
    name.includes('carlos') ||
    name.includes('alvaro') ||
    name.includes('álvaro') ||
    name.includes('pablo') ||
    name.includes('juan') ||
    name.includes('miguel') ||
    name.includes('diego') ||
    name.includes('mateo') ||
    name.includes('alonso') ||
    name.includes('julio') ||
    name.includes('rodrigo') ||
    name.includes('gonzalo') ||
    name.includes('raul') ||
    name.includes('raúl') ||
    name.includes('enrique') ||
    name.includes('dario') ||
    name.includes('darío') ||
    name.includes('manuel') ||
    name.includes('esteban') ||
    name.includes('tomas') ||
    name.includes('tomás') ||
    name.includes('andres') ||
    name.includes('andrés') ||
    name.includes('felipe') ||
    name.includes('male') ||
    name.includes('masculin') ||
    name.includes('varón') ||
    name.includes('varon') ||
    name.includes('puck') ||
    name.includes('charon') ||
    name.includes('fenrir') ||
    name.includes('george') ||
    name.includes('david')
  ) {
    return true;
  }

  return false;
}

/**
 * SELECCIÓN CENTRALIZADA DE VOZ MASCULINA EN ESPAÑOL Y CALIBRACIÓN DE TONO GRAVE.
 */
export function getMaleSpanishVoice(voices: SpeechSynthesisVoice[]): {
  voice: SpeechSynthesisVoice | null;
  pitch: number;
} {
  if (!voices || voices.length === 0) {
    return { voice: null, pitch: DEFAULT_SPEECH_PITCH };
  }

  const spanishVoices = voices.filter(
    (v) => /^es/i.test(v.lang) || /spanish|español/i.test(v.name)
  );

  const pool = spanishVoices.length > 0 ? spanishVoices : voices;

  // 1. Prioridad: Voz con confirmación masculina explícita
  const confirmedMaleVoices = pool.filter((v) => isMaleVoice(v));
  if (confirmedMaleVoices.length > 0) {
    const scoreMaleVoice = (v: SpeechSynthesisVoice): number => {
      let score = 0;
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      const name = (v.name || '').toLowerCase();

      if (lang === 'es-pe') score += 1000;
      else if (lang === 'es-mx' || lang === 'es-co' || lang === 'es-ar') score += 800;
      else if (lang === 'es-us') score += 700;
      else if (lang === 'es-es') score += 600;
      else score += 500;

      if (name.includes('google') || name.includes('natural') || name.includes('neural')) {
        score += 100;
      }
      return score;
    };

    const sorted = [...confirmedMaleVoices].sort((a, b) => scoreMaleVoice(b) - scoreMaleVoice(a));
    return { voice: sorted[0], pitch: 0.90 };
  }

  // 2. Si el sistema provee nombres genéricos (ej. "Google español"), usar esa voz en español
  // e Imponer modificador de tono grave (pitch = 0.78) que transforma la resonancia en voz masculina
  const esPeVoice = pool.find((v) => (v.lang || '').toLowerCase().includes('es-pe'));
  const esVoice = pool.find((v) => /^es/i.test(v.lang));
  const fallbackVoice = esPeVoice || esVoice || pool[0];

  return {
    voice: fallbackVoice || null,
    pitch: 0.78, // Tono grave masculino natural (~115 Hz)
  };
}

export interface PlaylistState {
  isPlaylistMode: boolean;
  currentIndex: number;
  totalItems: number;
  currentItem: NewsItem | null;
  sectionLabel: string;
}

export type SpeechListener = (
  newsId: string | null,
  state: SpeechState,
  playlist: PlaylistState
) => void;

/**
 * Estructura la noticia en una secuencia de frases para reproducción continua.
 */
function buildNewsSpeechQueue(
  newsItem: NewsItem,
  options?: { prefixText?: string }
): { text: string; pauseAfterMs: number }[] {
  const queue: { text: string; pauseAfterMs: number }[] = [];

  if (options?.prefixText) {
    queue.push({ text: options.prefixText, pauseAfterMs: 320 });
  }

  const rawTitle = cleanNewsTitle(newsItem.title || '');
  const titleText = prepareTextForHumanProsody(rawTitle);

  if (titleText) {
    const formattedTitle = /[.!?]$/.test(titleText) ? titleText : `${titleText}.`;
    queue.push({ text: formattedTitle, pauseAfterMs: 400 });
  }

  const factSheet = generateNewsFactSheet(newsItem);
  const rawParagraphs: string[] = [];

  if (newsItem.summary) {
    rawParagraphs.push(newsItem.summary);
  }

  if (newsItem.content && newsItem.content.includes('\n\n')) {
    const splitContent = newsItem.content.split('\n\n');
    rawParagraphs.push(...splitContent);
  } else if (factSheet.summaryParagraphs && factSheet.summaryParagraphs.length > 0) {
    rawParagraphs.push(...factSheet.summaryParagraphs);
  }

  if (newsItem.whatIsKnown && newsItem.whatIsKnown.length > 0) {
    rawParagraphs.push(...newsItem.whatIsKnown);
  }

  const normalizedTitleKey = titleText.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const rawPara of rawParagraphs) {
    const cleanedPara = prepareTextForHumanProsody(rawPara);
    if (!cleanedPara) continue;

    const normalizedParaKey = cleanedPara.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedParaKey === normalizedTitleKey) continue;

    const sentences = cleanedPara
      .split(/(?<=[.!?])\s+(?=[A-Z0-9¿¡])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const formattedSentence = /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
      const pauseAfterMs = i === sentences.length - 1 ? 280 : 180;

      if (queue.length === 0 || queue[queue.length - 1].text !== formattedSentence) {
        queue.push({ text: formattedSentence, pauseAfterMs });
      }
    }
  }

  return queue;
}

class SpeechManager {
  private currentNewsId: string | null = null;
  private state: SpeechState = 'idle';

  // Soporte de reproducción continua de lista ("de canto a canto")
  private isPlaylistMode: boolean = false;
  private playlistItems: NewsItem[] = [];
  private playlistIndex: number = 0;
  private playlistSectionLabel: string = '';

  private listeners: SpeechListener[] = [];
  private currentAudio: HTMLAudioElement | null = null;
  private audioUrlCache = new Map<string, string>();
  private pauseTimer: any = null;
  private queue: { text: string; pauseAfterMs: number }[] = [];
  private currentIndex: number = 0;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoices();
        };
      }
    }
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        this.cachedVoices = window.speechSynthesis.getVoices();
      } catch {
        this.cachedVoices = [];
      }
    }
  }

  public subscribe(listener: SpeechListener) {
    this.listeners.push(listener);
    listener(this.currentNewsId, this.state, this.getPlaylistState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getPlaylistState(): PlaylistState {
    return {
      isPlaylistMode: this.isPlaylistMode,
      currentIndex: this.playlistIndex,
      totalItems: this.playlistItems.length,
      currentItem: this.playlistItems[this.playlistIndex] || null,
      sectionLabel: this.playlistSectionLabel,
    };
  }

  private notify() {
    const plState = this.getPlaylistState();
    for (const l of this.listeners) {
      try {
        l(this.currentNewsId, this.state, plState);
      } catch (err) {
        console.warn('Speech listener notify err:', err);
      }
    }
  }

  public getState(newsId?: string): SpeechState {
    if (!newsId) return this.state;
    if (this.currentNewsId === newsId) {
      return this.state;
    }
    return 'idle';
  }

  public getCurrentPlayingId(): string | null {
    return this.currentNewsId;
  }

  /**
   * Pausa la narración activa
   */
  public pause(newsId?: string) {
    if (newsId && this.currentNewsId && this.currentNewsId !== newsId) {
      return;
    }
    if (this.state === 'playing') {
      this.state = 'paused';
      if (this.pauseTimer) {
        clearTimeout(this.pauseTimer);
        this.pauseTimer = null;
      }
      if (this.currentAudio) {
        try {
          this.currentAudio.pause();
        } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      this.notify();
    }
  }

  /**
   * Reanuda la narración
   */
  public resume(newsId?: string) {
    if (newsId && this.currentNewsId && this.currentNewsId !== newsId) {
      return;
    }
    if (this.state === 'paused') {
      this.state = 'playing';
      this.notify();
      if (this.currentAudio) {
        this.currentAudio.play().catch(() => {
          this.speakCurrentQueueItem();
        });
      } else {
        this.speakCurrentQueueItem();
      }
    }
  }

  /**
   * Detiene de forma absoluta cualquier síntesis activa y resetea el reproductor
   */
  public stop(newsId?: string) {
    if (!newsId || this.currentNewsId === newsId || this.isPlaylistMode) {
      if (this.pauseTimer) {
        clearTimeout(this.pauseTimer);
        this.pauseTimer = null;
      }
      if (this.currentAudio) {
        try {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        } catch {}
        this.currentAudio = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }

      this.currentNewsId = null;
      this.state = 'idle';
      this.queue = [];
      this.currentIndex = 0;
      this.isPlaylistMode = false;
      this.playlistItems = [];
      this.playlistIndex = 0;
      this.playlistSectionLabel = '';
      this.notify();
    }
  }

  /**
   * Reproduce audio neuronal humano de estudio vía API de Gemini TTS ('Charon' - voz masculina profesional)
   */
  private async playNeuralAudio(
    text: string,
    cacheKey: string,
    onEnded: () => void
  ): Promise<boolean> {
    try {
      let audioUrl = this.audioUrlCache.get(cacheKey);

      if (!audioUrl) {
        const res = await fetch('/api/speech/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: 'Charon' }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.audioUrl === 'string') {
            const newUrl: string = data.audioUrl;
            audioUrl = newUrl;
            this.audioUrlCache.set(cacheKey, newUrl);
          }
        }
      }

      if (!audioUrl || this.state !== 'playing') {
        return false;
      }

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.onended = () => {
        if (this.state === 'playing') {
          onEnded();
        }
      };

      audio.onerror = () => {
        this.currentAudio = null;
        onEnded();
      };

      await audio.play();
      return true;
    } catch (err) {
      console.warn('[SpeechService] Audio neural fallback:', err);
      return false;
    }
  }

  /**
   * Pre-descarga en segundo plano el audio de la siguiente noticia para transición instantánea
   */
  private async preloadAudio(text: string, cacheKey: string) {
    if (this.audioUrlCache.has(cacheKey)) return;
    try {
      const res = await fetch('/api/speech/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'Charon' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.audioUrl) {
          this.audioUrlCache.set(cacheKey, data.audioUrl);
        }
      }
    } catch {}
  }

  /**
   * Inicia la reproducción continua de toda la lista de noticias de la sección ("de canto a canto").
   */
  public playAll(items: NewsItem[], sectionLabel: string = 'Perú') {
    if (!items || items.length === 0) return;

    this.stop();
    this.isPlaylistMode = true;
    this.playlistItems = [...items];
    this.playlistIndex = 0;
    this.playlistSectionLabel = sectionLabel;
    this.state = 'playing';

    const firstItem = this.playlistItems[0];
    this.currentNewsId = firstItem.id;
    this.notify();

    this.speakPlaylistItem(0);
  }

  /**
   * Alterna entre reproducir, pausar y reanudar todas las noticias en conjunto.
   */
  public togglePlayAll(items: NewsItem[], sectionLabel: string = 'Perú') {
    if (this.isPlaylistMode) {
      if (this.state === 'playing') {
        this.pause();
      } else if (this.state === 'paused') {
        this.resume();
      } else {
        this.playAll(items, sectionLabel);
      }
    } else {
      this.playAll(items, sectionLabel);
    }
  }

  private async speakPlaylistItem(index: number) {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
      } catch {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    if (index >= this.playlistItems.length || !this.isPlaylistMode || this.state !== 'playing') {
      this.stop();
      return;
    }

    this.playlistIndex = index;
    const currentItem = this.playlistItems[index];
    this.currentNewsId = currentItem.id;
    this.notify();

    const prefix = `Noticia ${index + 1} de ${this.playlistItems.length}:`;
    const cleanTitle = cleanNewsTitle(currentItem.title || '');
    const summary = currentItem.summary || (currentItem.content ? currentItem.content.slice(0, 400) : '');
    const fullText = prepareTextForHumanProsody(`${prefix} ${cleanTitle}. ${summary}`);

    // Pre-cargar audio de la siguiente noticia
    if (index + 1 < this.playlistItems.length) {
      const nextItem = this.playlistItems[index + 1];
      const nextPrefix = `Noticia ${index + 2} de ${this.playlistItems.length}:`;
      const nextTitle = cleanNewsTitle(nextItem.title || '');
      const nextSummary = nextItem.summary || (nextItem.content ? nextItem.content.slice(0, 400) : '');
      const nextText = prepareTextForHumanProsody(`${nextPrefix} ${nextTitle}. ${nextSummary}`);
      this.preloadAudio(nextText, `playlist-${nextItem.id}`);
    }

    // Reproducir con voz humana real masculina (Gemini Neural TTS Charon)
    const played = await this.playNeuralAudio(fullText, `playlist-${currentItem.id}`, () => {
      if (this.isPlaylistMode && this.state === 'playing') {
        if (this.playlistIndex + 1 < this.playlistItems.length) {
          this.pauseTimer = setTimeout(() => {
            this.speakPlaylistItem(this.playlistIndex + 1);
          }, 400);
        } else {
          this.stop();
        }
      }
    });

    if (!played && this.state === 'playing') {
      // Fallback local en caso de desconexión
      this.queue = buildNewsSpeechQueue(currentItem, { prefixText: prefix });
      this.currentIndex = 0;
      this.speakCurrentQueueItem();
    }
  }

  /**
   * Salta inmediatamente a la siguiente noticia de la lista.
   */
  public nextNews(items?: NewsItem[], sectionLabel: string = 'Perú') {
    if (!this.isPlaylistMode) {
      if (items && items.length > 0) {
        this.playAll(items, sectionLabel);
      }
      return;
    }
    if (this.playlistItems.length === 0) return;

    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    if (this.playlistIndex + 1 < this.playlistItems.length) {
      this.state = 'playing';
      this.speakPlaylistItem(this.playlistIndex + 1);
    } else {
      this.state = 'playing';
      this.speakPlaylistItem(0);
    }
  }

  /**
   * Retrocede inmediatamente a la noticia anterior de la lista.
   */
  public prevNews(items?: NewsItem[], sectionLabel: string = 'Perú') {
    if (!this.isPlaylistMode) {
      if (items && items.length > 0) {
        this.playAll(items, sectionLabel);
      }
      return;
    }
    if (this.playlistItems.length === 0) return;

    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    if (this.playlistIndex > 0) {
      this.state = 'playing';
      this.speakPlaylistItem(this.playlistIndex - 1);
    } else {
      this.state = 'playing';
      this.speakPlaylistItem(0);
    }
  }

  /**
   * Alterna entre reproducir y detener una noticia individual.
   */
  public async togglePlay(newsItem: NewsItem) {
    if (this.currentNewsId === newsItem.id && !this.isPlaylistMode) {
      if (this.state === 'playing') {
        this.pause();
        return;
      }
      if (this.state === 'paused') {
        this.resume();
        return;
      }
    }

    // Detener cualquier lista o reproducción previa
    this.stop();
    this.isPlaylistMode = false;
    this.currentNewsId = newsItem.id;
    this.state = 'playing';
    this.notify();

    const cleanTitle = cleanNewsTitle(newsItem.title || '');
    const summary = newsItem.summary || (newsItem.content ? newsItem.content.slice(0, 450) : '');
    const fullText = prepareTextForHumanProsody(`${cleanTitle}. ${summary}`);

    const played = await this.playNeuralAudio(fullText, `single-${newsItem.id}`, () => {
      this.stop();
    });

    if (!played && this.state === 'playing') {
      this.queue = buildNewsSpeechQueue(newsItem);
      if (this.queue.length === 0) {
        this.stop();
        return;
      }
      this.currentIndex = 0;
      this.speakCurrentQueueItem();
    }
  }

  private speakCurrentQueueItem() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;

    if (this.state !== 'playing') {
      return;
    }

    // Si terminamos las frases del item actual
    if (this.currentIndex >= this.queue.length) {
      if (this.isPlaylistMode) {
        if (this.playlistIndex + 1 < this.playlistItems.length) {
          this.pauseTimer = setTimeout(() => {
            if (this.state === 'playing' && this.isPlaylistMode) {
              this.speakPlaylistItem(this.playlistIndex + 1);
            }
          }, 650);
          return;
        } else {
          this.stop();
          return;
        }
      } else {
        this.stop();
        return;
      }
    }

    if (this.cachedVoices.length === 0) {
      try {
        this.cachedVoices = synth.getVoices();
      } catch {}
    }

    const voices = this.cachedVoices.length > 0 ? this.cachedVoices : synth.getVoices();
    const voiceSelection = getMaleSpanishVoice(voices);

    const item = this.queue[this.currentIndex];
    const utterance = new SpeechSynthesisUtterance(item.text);

    if (voiceSelection.voice) {
      utterance.voice = voiceSelection.voice;
      utterance.lang = voiceSelection.voice.lang || 'es-PE';
    } else {
      utterance.lang = 'es-PE';
    }

    utterance.rate = DEFAULT_SPEECH_RATE;
    utterance.pitch = voiceSelection.pitch;

    utterance.onend = () => {
      if (this.state !== 'playing') return;
      this.currentIndex++;
      this.pauseTimer = setTimeout(() => {
        this.speakCurrentQueueItem();
      }, item.pauseAfterMs);
    };

    utterance.onerror = () => {
      if (this.state !== 'playing') return;
      this.currentIndex++;
      this.speakCurrentQueueItem();
    };

    try {
      synth.speak(utterance);
    } catch {
      this.currentIndex++;
      this.speakCurrentQueueItem();
    }
  }

  /**
   * Pre-carga y pre-genera en segundo plano el audio de las principales noticias
   * para que al presionar Reproducir suene instantáneamente sin retraso de red.
   */
  public preloadTopNews(items: NewsItem[]) {
    if (!items || items.length === 0) return;
    const topItems = items.slice(0, 4);
    for (let idx = 0; idx < topItems.length; idx++) {
      const item = topItems[idx];
      const cleanTitle = cleanNewsTitle(item.title || '');
      const summary = item.summary || (item.content ? item.content.slice(0, 450) : '');
      const fullText = prepareTextForHumanProsody(`${cleanTitle}. ${summary}`);
      this.preloadAudio(fullText, `single-${item.id}`);

      const prefix = `Noticia ${idx + 1} de ${items.length}:`;
      const playlistText = prepareTextForHumanProsody(`${prefix} ${cleanTitle}. ${summary}`);
      this.preloadAudio(playlistText, `playlist-${item.id}`);
    }
  }
}

export const speechManager = new SpeechManager();
