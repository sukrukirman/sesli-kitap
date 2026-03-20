'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Download, CheckCircle, Moon, X, Clock } from 'lucide-react';
import { Book } from '@/types';
import { useOfflineAudio } from '@/hooks/useOfflineAudio';

interface PlayerProps {
  currentBook: Book | null;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
}

export function Player({ currentBook, isPlaying, setIsPlaying }: PlayerProps) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null); // Remaining seconds
  const [isTimerMenuOpen, setIsTimerMenuOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const { downloadedBooks, downloading, downloadProgress, downloadBook, cancelDownload, removeBook, getAudioSource } = useOfflineAudio();

  useEffect(() => {
    if (currentBook && currentBook.audioUrl && audioRef.current) {
      const loadAudio = async () => {
        const src = await getAudioSource(currentBook.audioUrl!);
        if (audioRef.current) {
          audioRef.current.src = src;
          lastSavedTimeRef.current = 0; // reset active saver
          audioRef.current.load();
          if (isPlaying) {
             const playPromise = audioRef.current.play();
             if (playPromise !== undefined) {
                playPromise.catch(e => {
                   console.error("Playback failed during initial load", e);
                   setIsPlaying(false);
                });
             }
          }
        }
      };
      loadAudio();
    }
  }, [currentBook]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && currentBook) {
        // Only try to play if a source is already loaded to prevent throwing an error which forces isPlaying to false.
        if (audioRef.current.src && audioRef.current.src !== window.location.href) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
               playPromise.catch(e => {
                 console.error("Playback failed", e);
                 setIsPlaying(false);
               });
            }
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && sleepTimer !== null && sleepTimer > 0) {
      interval = setInterval(() => {
        setSleepTimer(prev => {
          if (prev === null || prev <= 0) return prev;
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, sleepTimer]);

  useEffect(() => {
    if (sleepTimer === 0) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setSleepTimer(null);
    }
  }, [sleepTimer, setIsPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current && currentBook) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      setProgress((time / audioRef.current.duration) * 100);
      
      // Save progress to localStorage every ~1 second to remember where user left off
      if (Math.abs(time - lastSavedTimeRef.current) > 1) {
        localStorage.setItem(`book-progress-${currentBook.id}`, time.toString());
        localStorage.setItem(`book-percentage-${currentBook.id}`, ((time / audioRef.current.duration) * 100).toString());
        localStorage.setItem(`book-progress-timestamp-${currentBook.id}`, Date.now().toString());
        lastSavedTimeRef.current = time;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && currentBook) {
      setDuration(audioRef.current.duration);
      
      // Restore previous progress
      // Restore previous progress
      const savedTimeStr = localStorage.getItem(`book-progress-${currentBook.id}`);
      
      let timeToRestore = 0;
      const localProgress = savedTimeStr ? Number(savedTimeStr) : 0;

      const apiProgress = currentBook.bookmarkPos ? currentBook.bookmarkPos / 1000000 : 0; // microseconds to seconds

      console.log('[DEBUG] Player restore logic variables:', {
        apiPosRaw: currentBook.bookmarkPos,
        apiProgress,
        localProgress,
        savedTimeStr,
      });

      if (!isNaN(localProgress) && localProgress >= apiProgress) {
          // Local storage is further along or tied
          timeToRestore = localProgress;
      } else if (apiProgress > localProgress) {
          // API is further along
          timeToRestore = apiProgress;
      } else {
          timeToRestore = !isNaN(localProgress) ? localProgress : 0;
      }

      if (timeToRestore > 0 && timeToRestore < audioRef.current.duration) {
         audioRef.current.currentTime = timeToRestore;
         setCurrentTime(timeToRestore);
         setProgress((timeToRestore / audioRef.current.duration) * 100);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (Number(e.target.value) / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      setProgress(Number(e.target.value));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    setIsSpeedMenuOpen(false);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0) return `${m} dk`;
    return `${s} sn`;
  };

  const skip = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += amount;
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      
      <div className={`fixed left-0 right-0 bg-[#141414]/95 backdrop-blur-xl border-t border-white/5 px-4 md:px-6 py-3 flex items-center justify-between transition-transform duration-300 z-50 ${currentBook ? 'translate-y-0' : 'translate-y-[150%]'} bottom-16 md:bottom-0`}>
        {/* Track Info */}
        <div className="flex items-center gap-3 md:gap-4 w-1/4 min-w-[150px]">
          {currentBook && (
            <>
              <img src={currentBook.coverUrl} alt={currentBook.title} className="w-10 h-10 md:w-14 md:h-14 rounded object-cover shadow-lg" referrerPolicy="no-referrer" />
              <div className="hidden sm:block">
                <h4 className="font-semibold text-xs md:text-sm line-clamp-1">{currentBook.title}</h4>
                <p className="text-[10px] md:text-xs text-white/50 line-clamp-1">{currentBook.author}</p>
              </div>
              {currentBook.audioUrl && (
                <button
                  onClick={() => {
                    if (downloading === currentBook.id.toString()) {
                      cancelDownload(currentBook.id.toString());
                    } else if (downloadedBooks.has(currentBook.id.toString())) {
                      removeBook(currentBook.id.toString(), currentBook.audioUrl!);
                    } else {
                      downloadBook(currentBook, currentBook.audioUrl!);
                    }
                  }}
                  className={`ml-1 md:ml-2 text-white/50 hover:text-white transition-colors flex items-center ${downloading === currentBook.id.toString() && typeof downloadProgress?.[currentBook.id.toString()] === 'number' ? 'gap-1 bg-white/10 px-2 py-1 rounded-full text-xs' : ''}`}
                  title={downloading === currentBook.id.toString() ? "İndirmeyi İptal Et" : downloadedBooks.has(currentBook.id.toString()) ? "İndirilenlerden Kaldır" : "Çevrimdışı Dinlemek İçin İndir"}
                >
                  {downloading === currentBook.id.toString() ? (
                    <>
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-brand border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      {typeof downloadProgress?.[currentBook.id.toString()] === 'number' && <span className="text-white">%{downloadProgress[currentBook.id.toString()]}</span>}
                      {downloading === currentBook.id.toString() && typeof downloadProgress?.[currentBook.id.toString()] === 'number' && (
                         <>
                           <div className="w-px h-3 bg-white/20 mx-0.5" />
                           <X className="w-3.5 h-3.5 text-white/70 hover:text-white" />
                         </>
                      )}
                    </>
                  ) : downloadedBooks.has(currentBook.id.toString()) ? (
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-brand" />
                  ) : (
                    <Download className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center flex-1 max-w-3xl px-2 md:px-8">
          <div className="flex items-center gap-4 md:gap-7 mb-1 md:mb-2">
            <button onClick={() => skip(-30)} className="text-white/50 hover:text-white transition-colors relative group">
              <SkipBack className="w-5 h-5 md:w-6 md:h-6" />
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">30</span>
            </button>
            <button
               onClick={() => setIsPlaying(!isPlaying)}
               className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            >
              {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-1" />}
            </button>
            <button onClick={() => skip(30)} className="text-white/50 hover:text-white transition-colors relative group">
              <SkipForward className="w-5 h-5 md:w-6 md:h-6" />
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">30</span>
            </button>
          </div>
          <div className="flex items-center gap-3 w-full text-xs text-white/50 font-mono mt-1">
            <span className="w-12 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1 relative flex items-center group h-6 cursor-pointer">
              <input
                type="range"
                min="0"
                max="100"
                value={progress || 0}
                onChange={handleSeek}
                className="w-full z-10 opacity-0 cursor-pointer h-full"
              />
              <div className="absolute left-0 right-0 h-1.5 bg-white/10 rounded-full pointer-events-none group-hover:h-2.5 transition-all" />
              <div className="absolute left-0 h-1.5 bg-brand rounded-full pointer-events-none group-hover:h-2.5 transition-all" style={{ width: `${progress}%` }} />
              <div 
                className="absolute w-3 h-3 bg-white rounded-full shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20" 
                style={{ left: `calc(${progress}% - 6px)` }}
               />
            </div>
            <span className="w-12 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume, Speed & Sleep Timer */}
        <div className="flex items-center justify-end gap-5 w-1/4 hidden md:flex">
          {/* Playback Speed */}
          <div className="relative">
             <button
               onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
               className={`text-xs font-bold px-2 py-1 rounded transition-colors ${playbackRate !== 1 ? 'bg-brand/20 text-brand' : 'text-white/50 hover:text-white'}`}
               title="Çalma Hızı"
             >
               {playbackRate}x
             </button>
             
             {isSpeedMenuOpen && (
               <div className="absolute bottom-full right-0 mb-4 w-32 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-bottom-2">
                 <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Hız</span>
                 </div>
                 <div className="flex flex-col">
                   {[0.75, 1, 1.25, 1.5, 2].map(rate => (
                     <button
                       key={rate}
                       onClick={() => handleSpeedChange(rate)}
                       className={`px-4 py-2 text-sm text-left hover:bg-white/5 transition-colors flex items-center justify-between ${playbackRate === rate ? 'text-brand font-semibold' : 'text-white/70'}`}
                     >
                       {rate}x
                       {playbackRate === rate && <CheckCircle className="w-3 h-3" />}
                     </button>
                   ))}
                 </div>
               </div>
             )}
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-white/50" />
            <div className="w-24 relative flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full z-10"
              />
              <div className="absolute left-0 h-1 bg-white rounded-full pointer-events-none" style={{ width: `${volume * 100}%` }} />
            </div>
          </div>
          
          {/* Sleep Timer */}
          <div className="relative">
             <button 
               onClick={() => setIsTimerMenuOpen(!isTimerMenuOpen)}
               className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${sleepTimer ? 'bg-brand/20 text-brand' : 'text-white/50 hover:text-white'}`}
               title="Uyku Zamanlayıcısı"
             >
               <Moon className="w-4 h-4 md:w-5 md:h-5" />
               {sleepTimer && <span className="text-xs font-semibold w-8 text-center">{formatTimer(sleepTimer)}</span>}
             </button>
             
             {isTimerMenuOpen && (
               <div className="absolute bottom-full right-0 mb-4 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-bottom-2">
                 <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Zamanlayıcı</span>
                    {sleepTimer && (
                       <button onClick={() => { setSleepTimer(null); setIsTimerMenuOpen(false); }} className="text-white/50 hover:text-red-400">
                          <X className="w-3.5 h-3.5" />
                       </button>
                    )}
                 </div>
                 <div className="flex flex-col">
                   {[5, 10, 15, 20, 30].map(mins => (
                     <button
                       key={mins}
                       onClick={() => { setSleepTimer(mins * 60); setIsTimerMenuOpen(false); }}
                       className={`px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors flex items-center justify-between ${sleepTimer && sleepTimer > (mins - 1) * 60 && sleepTimer <= mins * 60 ? 'text-brand font-semibold' : 'text-white/70'}`}
                     >
                       {mins} Dakika
                       {sleepTimer && sleepTimer > (mins - 1) * 60 && sleepTimer <= mins * 60 && <CheckCircle className="w-3 h-3" />}
                     </button>
                   ))}
                   <button
                     onClick={() => { setSleepTimer(60 * 60); setIsTimerMenuOpen(false); }}
                     className={`px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors flex items-center justify-between ${sleepTimer && sleepTimer > 30 * 60 ? 'text-brand font-semibold' : 'text-white/70'}`}
                   >
                     1 Saat
                     {sleepTimer && sleepTimer > 30 * 60 && <CheckCircle className="w-3 h-3" />}
                   </button>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </>
  );
}
