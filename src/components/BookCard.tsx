import React, { useState, useEffect } from 'react';
import { Play, Pause, Download, CheckCircle, Trash2, X } from 'lucide-react';
import { Book } from '@/types';

interface BookCardProps {
  book: Book;
  isPlaying: boolean;
  onPlay: () => void;
  isDownloaded: boolean;
  isDownloading: boolean;
  downloadProgress?: number;
  onDownload: () => void;
}

export function BookCard({ book, isPlaying, onPlay, isDownloaded, isDownloading, downloadProgress, onDownload }: BookCardProps) {
  const [listenPercentage, setListenPercentage] = useState<number | null>(null);

  useEffect(() => {
    if (isDownloaded) {
      const savedPercentage = localStorage.getItem(`book-percentage-${book.id}`);
      if (savedPercentage && !isNaN(Number(savedPercentage))) {
        setListenPercentage(Number(savedPercentage));
      }
    }
  }, [isDownloaded, book.id]);

  return (
    <div className="group flex flex-col gap-3 cursor-pointer" onClick={onPlay}>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface shadow-lg">
        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all">
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>
        </div>
        <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className={`rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors ${isDownloading && typeof downloadProgress === 'number' ? 'w-auto px-3 py-1.5 h-auto text-xs font-semibold gap-1.5' : 'w-8 h-8'} ${isDownloaded && !isDownloading ? 'hidden' : ''}`}
            title="İndir"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin flex-shrink-0" />
                {typeof downloadProgress === 'number' && <span>%{downloadProgress}</span>}
                <div className="w-px h-3 bg-white/20 mx-0.5" />
                <X className="w-3.5 h-3.5 text-white/70 hover:text-white" />
              </>
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
          
          {isDownloaded && !isDownloading && (
            <div className="flex flex-col gap-2">
               <div className="w-8 h-8 rounded-full bg-brand/20 backdrop-blur-md flex items-center justify-center text-brand cursor-default" title="İndirildi">
                 <CheckCircle className="w-4 h-4" />
               </div>
               <button
                  onClick={(e) => { e.stopPropagation(); onDownload(); }} 
                  className="w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
                  title="Cihazdan Sil"
               >
                  <Trash2 className="w-4 h-4" />
               </button>
            </div>
          )}
        </div>
        
        {/* Playback Progress Overlay */}
        {isDownloaded && listenPercentage !== null && listenPercentage > 0 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
            <div className="bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-xl border border-white/10 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-brand" />
              %{Math.round(listenPercentage)} Tamamlandı
            </div>
          </div>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-brand transition-colors">{book.title}</h3>
        <p className="text-xs text-white/50 line-clamp-1 mt-0.5">{book.author}</p>
      </div>
    </div>
  );
}
