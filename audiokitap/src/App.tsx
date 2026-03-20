import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Download, CheckCircle, Search, Home, Library, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { books } from './data';
import { Book } from './types';
import { useOfflineAudio } from './hooks/useOfflineAudio';

function BookCard({ book, isPlaying, onPlay, isDownloaded, isDownloading, onDownload }: any) {
  return (
    <div className="group flex flex-col gap-3 cursor-pointer" onClick={onPlay}>
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface shadow-lg">
        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all">
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>
        </div>
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            title={isDownloaded ? "İndirilenlerden Kaldır" : "İndir"}
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            ) : isDownloaded ? (
              <CheckCircle className="w-4 h-4 text-brand" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-brand transition-colors">{book.title}</h3>
        <p className="text-xs text-white/50 line-clamp-1 mt-0.5">{book.author}</p>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
        active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
      }`}
    >
      {React.cloneElement(icon, { className: `w-5 h-5 ${active ? 'text-brand' : ''}` })}
      {label}
    </button>
  );
}

function MobileNavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-brand' : 'text-white/50'}`}>
      {React.cloneElement(icon, { className: 'w-6 h-6' })}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export default function App() {
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [activeTab, setActiveTab] = useState('home');

  const audioRef = useRef<HTMLAudioElement>(null);
  const { downloadedBooks, downloading, downloadBook, removeBook, getAudioSource } = useOfflineAudio();

  useEffect(() => {
    if (currentBook && audioRef.current) {
      const loadAudio = async () => {
        const src = await getAudioSource(currentBook.audioUrl);
        if (audioRef.current) {
          const wasPlaying = isPlaying;
          audioRef.current.src = src;
          audioRef.current.load();
          if (wasPlaying) {
            audioRef.current.play().catch(e => console.error("Playback failed", e));
          }
        }
      };
      loadAudio();
    }
  }, [currentBook]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Playback failed", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
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

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = (book: Book) => {
    if (currentBook?.id === book.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentBook(book);
      setIsPlaying(true);
    }
  };

  const skip = (amount: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += amount;
    }
  };

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden font-sans">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Sidebar */}
      <aside className="w-64 bg-[#050505] border-r border-white/5 flex-col hidden md:flex">
        <div className="p-6">
          <h1 className="text-2xl font-serif font-bold text-brand flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            AudioKitap
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<Home />} label="Ana Sayfa" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={<Search />} label="Keşfet" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
          <NavItem icon={<Library />} label="Kitaplığım" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pb-32 md:pb-24">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-brand/20 to-background pointer-events-none" />

        <div className="relative z-10 p-6 md:p-10">
          {activeTab === 'home' && (
            <>
              {/* Hero Section */}
              <section className="mb-12">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">Öne Çıkan</h2>
                <div className="relative rounded-2xl overflow-hidden bg-surface flex flex-col md:flex-row group cursor-pointer" onClick={() => togglePlay(books[0])}>
                  <div className="w-full md:w-1/3 aspect-square md:aspect-auto">
                    <img src={books[0].coverUrl} alt={books[0].title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="p-8 md:p-12 flex flex-col justify-center flex-1">
                    <div className="inline-block px-3 py-1 bg-brand/20 text-brand rounded-full text-xs font-semibold mb-4 w-max">
                      {books[0].category}
                    </div>
                    <h3 className="text-4xl md:text-5xl font-serif font-bold mb-2">{books[0].title}</h3>
                    <p className="text-xl text-white/70 mb-6">{books[0].author}</p>
                    <p className="text-white/50 line-clamp-3 mb-8 max-w-2xl leading-relaxed">
                      {books[0].description}
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover transition-transform hover:scale-105"
                        onClick={(e) => { e.stopPropagation(); togglePlay(books[0]); }}
                      >
                        {currentBook?.id === books[0].id && isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                      </button>
                      <div className="text-sm text-white/50 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {books[0].duration}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Grid Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Sizin İçin Seçtiklerimiz</h2>
                  <button className="text-sm font-semibold text-white/50 hover:text-white flex items-center gap-1">
                    Tümünü Gör <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {books.slice(1).map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      isPlaying={currentBook?.id === book.id && isPlaying}
                      onPlay={() => togglePlay(book)}
                      isDownloaded={downloadedBooks.has(book.id)}
                      isDownloading={downloading === book.id}
                      onDownload={() => downloadedBooks.has(book.id) ? removeBook(book.id, book.audioUrl) : downloadBook(book.id, book.audioUrl)}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === 'search' && (
            <section>
              <h2 className="text-3xl font-bold mb-8">Keşfet</h2>
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input 
                  type="text" 
                  placeholder="Kitap, yazar veya anlatıcı ara..." 
                  className="w-full bg-surface border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {books.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    isPlaying={currentBook?.id === book.id && isPlaying}
                    onPlay={() => togglePlay(book)}
                    isDownloaded={downloadedBooks.has(book.id)}
                    isDownloading={downloading === book.id}
                    onDownload={() => downloadedBooks.has(book.id) ? removeBook(book.id, book.audioUrl) : downloadBook(book.id, book.audioUrl)}
                  />
                ))}
              </div>
            </section>
          )}

          {activeTab === 'library' && (
            <section>
              <h2 className="text-3xl font-bold mb-8">İndirilen Kitaplar</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {books.filter(b => downloadedBooks.has(b.id)).length > 0 ? (
                  books.filter(b => downloadedBooks.has(b.id)).map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      isPlaying={currentBook?.id === book.id && isPlaying}
                      onPlay={() => togglePlay(book)}
                      isDownloaded={true}
                      isDownloading={false}
                      onDownload={() => removeBook(book.id, book.audioUrl)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 text-white/50">
                    <Download className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">Henüz indirilmiş bir kitabınız bulunmuyor.</p>
                    <p className="text-sm mt-2">Çevrimdışı dinlemek için kitapları indirin.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050505] border-t border-white/5 flex justify-around py-3 z-40 pb-safe">
        <MobileNavItem icon={<Home />} label="Ana Sayfa" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <MobileNavItem icon={<Search />} label="Keşfet" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
        <MobileNavItem icon={<Library />} label="Kitaplığım" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
      </div>

      {/* Bottom Player */}
      <div className={`fixed left-0 right-0 bg-[#141414]/95 backdrop-blur-xl border-t border-white/5 px-4 md:px-6 py-3 flex items-center justify-between transition-transform duration-300 z-50 ${currentBook ? 'translate-y-0' : 'translate-y-[150%]'} bottom-16 md:bottom-0`}>
        {/* Track Info */}
        <div className="flex items-center gap-3 md:gap-4 w-1/3">
          {currentBook && (
            <>
              <img src={currentBook.coverUrl} alt={currentBook.title} className="w-10 h-10 md:w-14 md:h-14 rounded object-cover shadow-lg" referrerPolicy="no-referrer" />
              <div className="hidden sm:block">
                <h4 className="font-semibold text-xs md:text-sm line-clamp-1">{currentBook.title}</h4>
                <p className="text-[10px] md:text-xs text-white/50 line-clamp-1">{currentBook.author}</p>
              </div>
              <button
                onClick={() => downloadedBooks.has(currentBook.id) ? removeBook(currentBook.id, currentBook.audioUrl) : downloadBook(currentBook.id, currentBook.audioUrl)}
                className="ml-1 md:ml-2 text-white/50 hover:text-white transition-colors"
                title={downloadedBooks.has(currentBook.id) ? "İndirilenlerden Kaldır" : "Çevrimdışı Dinlemek İçin İndir"}
              >
                {downloading === currentBook.id ? (
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                ) : downloadedBooks.has(currentBook.id) ? (
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-brand" />
                ) : (
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center w-1/2 md:w-1/3 max-w-md">
          <div className="flex items-center gap-4 md:gap-6 mb-1 md:mb-2">
            <button onClick={() => skip(-15)} className="text-white/50 hover:text-white transition-colors">
              <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" /> : <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-1" />}
            </button>
            <button onClick={() => skip(15)} className="text-white/50 hover:text-white transition-colors">
              <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full text-[10px] md:text-xs text-white/50 font-mono">
            <span>{formatTime(currentTime)}</span>
            <div className="flex-1 relative flex items-center group">
              <input
                type="range"
                min="0"
                max="100"
                value={progress || 0}
                onChange={handleSeek}
                className="w-full z-10"
              />
              <div className="absolute left-0 h-1 bg-brand rounded-full pointer-events-none" style={{ width: `${progress}%` }} />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-end gap-2 w-1/3 hidden md:flex">
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
      </div>
    </div>
  );
}
