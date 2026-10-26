import React, { useState, useEffect } from 'react';
import { Headphones, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { NewsItem } from '../types';
import { speechManager, SpeechState, PlaylistState } from '../services/speechService';

export interface TopNavAudioButtonProps {
  news: NewsItem[];
  sectionLabel: string;
}

export const TopNavAudioButton: React.FC<TopNavAudioButtonProps> = ({
  news,
  sectionLabel,
}) => {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [playlist, setPlaylist] = useState<PlaylistState>(() => speechManager.getPlaylistState());

  useEffect(() => {
    return speechManager.subscribe((_id, state, pl) => {
      setSpeechState(state);
      setPlaylist(pl);
    });
  }, []);

  if (!news || news.length === 0) {
    return null;
  }

  const isPlayingThisPlaylist = playlist.isPlaylistMode && speechState === 'playing';
  const isPausedThisPlaylist = playlist.isPlaylistMode && speechState === 'paused';
  const isActive = isPlayingThisPlaylist || isPausedThisPlaylist;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    speechManager.togglePlayAll(news, sectionLabel);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    speechManager.prevNews(news, sectionLabel);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    speechManager.nextNews(news, sectionLabel);
  };

  const currentIdx = playlist.isPlaylistMode ? playlist.currentIndex + 1 : 1;
  const totalCount = playlist.isPlaylistMode ? playlist.totalItems : news.length;

  return (
    <div
      className={`flex-1 min-w-0 py-2 sm:py-3 flex flex-col items-center justify-center gap-1 transition-all relative border-l border-white/20 px-1 select-none ${
        isActive
          ? 'bg-gradient-to-b from-emerald-950 via-neutral-900 to-black text-white ring-1 ring-emerald-500/50 shadow-[inset_0_2px_4px_rgba(16,185,129,0.3)]'
          : 'text-white/80 hover:text-white hover:bg-white/5'
      }`}
    >
      {/* Fila de controles: [ Anterior ] [ Play/Pausa Central ] [ Siguiente ] */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {/* Botoncito Anterior */}
        <button
          type="button"
          onClick={handlePrev}
          title="Noticia anterior"
          aria-label="Noticia anterior"
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
        >
          <SkipBack className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
        </button>

        {/* Botón Central Play / Pausa */}
        <button
          type="button"
          onClick={handleToggle}
          title={
            isPlayingThisPlaylist
              ? 'Pausar reproducción continua'
              : isPausedThisPlaylist
              ? 'Reanudar reproducción continua'
              : `Escuchar todas las noticias de ${sectionLabel}`
          }
          aria-label={
            isPlayingThisPlaylist
              ? 'Pausar reproducción'
              : 'Iniciar reproducción de todas las noticias'
          }
          className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs ${
            isPlayingThisPlaylist
              ? 'bg-emerald-500 text-black hover:bg-emerald-400'
              : isPausedThisPlaylist
              ? 'bg-amber-400 text-black hover:bg-amber-300'
              : 'bg-white text-black hover:bg-neutral-200'
          }`}
        >
          {isPlayingThisPlaylist ? (
            <Pause className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
          ) : isPausedThisPlaylist ? (
            <Play className="w-3.5 h-3.5 fill-current stroke-[2.5] translate-x-0.5" />
          ) : (
            <Headphones className="w-3.5 h-3.5 stroke-[2.4]" />
          )}
        </button>

        {/* Botoncito Siguiente */}
        <button
          type="button"
          onClick={handleNext}
          title="Siguiente noticia"
          aria-label="Siguiente noticia"
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer"
        >
          <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
        </button>
      </div>

      {/* Etiqueta de texto 100% legible */}
      <button
        type="button"
        onClick={handleToggle}
        className="text-[7.5px] sm:text-[9.5px] font-black uppercase tracking-[0.02em] text-center leading-tight px-0.5 cursor-pointer hover:underline truncate max-w-full"
      >
        {isPlayingThisPlaylist
          ? `NOTICIA ${currentIdx}/${totalCount}`
          : isPausedThisPlaylist
          ? `PAUSA (${currentIdx}/${totalCount})`
          : 'ESCUCHAR TODAS'}
      </button>

      {/* Indicador inferior animado cuando está activo */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-400 animate-pulse" />
      )}
    </div>
  );
};
