'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight, Pause, Play, Clock, Download } from 'lucide-react';
import { Book } from '@/types';
import { getBookshelfAction, getBookAudioUrlAction } from '@/app/actions/storytel';
import { Sidebar, MobileNav } from '@/components/Sidebar';
import { BookCard } from '@/components/BookCard';
import { Player } from '@/components/Player';
import { useOfflineAudio } from '@/hooks/useOfflineAudio';

export default function Home() {
  const [bookshelf, setBookshelf] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [fetchingAudioFor, setFetchingAudioFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const { downloadedBooks, offlineBooks, downloading, downloadProgress, downloadBook, cancelDownload, removeBook, importLocalFile } = useOfflineAudio();
  const router = useRouter();

  useEffect(() => {
    const savedBook = localStorage.getItem('lastPlayedBook');
    if (savedBook) {
      try {
        setCurrentBook(JSON.parse(savedBook));
      } catch (e) {}
    }

    async function loadData() {
      try {
        const books = await getBookshelfAction();
        if (!books || books.length === 0) {
          handleOfflineFallback();
          return;
        }
        setBookshelf(books);
        
        // Sync currentBook with fresh data from the API
        setCurrentBook(prev => {
          if (prev) {
             const freshBook = books.find(b => b.id === prev.id);
             if (freshBook) {
                // Return fresh data but keep local audioUrl if we already fetched it
                return { ...freshBook, audioUrl: prev.audioUrl || freshBook.audioUrl }; 
             }
          }
           return prev;
        });
      } catch (error) {
         console.error("Failed to load bookshelf", error);
         handleOfflineFallback();
      } finally {
        setLoading(false);
      }
    }

    function handleOfflineFallback() {
      setIsGuestMode(true);
      const storedBooks = JSON.parse(localStorage.getItem('offlineBookData') || '[]');
      setBookshelf(storedBooks);
      if (storedBooks.length > 0) {
        setActiveTab('library');
      }
    }

    loadData();
  }, [router]);

  useEffect(() => {
    if (currentBook) {
      localStorage.setItem('lastPlayedBook', JSON.stringify(currentBook));
    }
  }, [currentBook]);

  const togglePlay = async (book: Book) => {
    if (currentBook?.id === book.id) {
      setIsPlaying(!isPlaying);
    } else {
      let bookToPlay = book;
      if (!bookToPlay.audioUrl) {
        const offlineBookInfo = offlineBooks.find(b => b.id.toString() === book.id.toString());
        
        if (offlineBookInfo && offlineBookInfo.audioUrl) {
           bookToPlay = { ...book, audioUrl: offlineBookInfo.audioUrl };
        } else {
           setFetchingAudioFor(book.id.toString());
           const url = await getBookAudioUrlAction(book.id.toString());
           setFetchingAudioFor(null);
           if (url) {
             bookToPlay = { ...book, audioUrl: url };
             setBookshelf(prev => prev.map(b => b.id === book.id ? { ...b, audioUrl: url } : b));
           } else {
             alert("Bu kitap için sesli örnek bulunamadı.");
             return;
           }
        }
      }
      setCurrentBook(bookToPlay);
      setIsPlaying(true);
    }
  };

  const handleDownload = async (book: Book) => {
    if (downloading === book.id.toString()) {
      cancelDownload(book.id.toString());
      return;
    }

    const isDownloaded = downloadedBooks.has(book.id.toString());
    
    if (isDownloaded) {
      const offlineBookInfo = offlineBooks.find(b => b.id.toString() === book.id.toString());
      const urlToRemove = book.audioUrl || offlineBookInfo?.audioUrl;
      
      if (urlToRemove) {
        removeBook(book.id.toString(), urlToRemove);
      } else {
        console.warn("Ses URL'i bulunamadığı için kitap kaldırılamadı.");
      }
      return;
    }
    
    let urlToDownload = book.audioUrl;
    if (!urlToDownload) {
      setFetchingAudioFor(book.id.toString());
      urlToDownload = await getBookAudioUrlAction(book.id.toString()) || '';
      setFetchingAudioFor(null);
      
      if (urlToDownload) {
        setBookshelf(prev => prev.map(b => b.id === book.id ? { ...b, audioUrl: urlToDownload } : b));
      } else {
        alert("Bu kitap için indirilebilir ses bulunamadı.");
        return;
      }
    }
    
    if (urlToDownload) {
      downloadBook(book, urlToDownload);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  const featuredBook = bookshelf[0];

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden font-sans">
      
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pb-32 md:pb-24">
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-brand/20 to-background pointer-events-none" />

        <div className="relative z-10 p-6 md:p-10">
          {/* Guest Mode Prompts */}
          {isGuestMode && (activeTab === 'home' || activeTab === 'search') && (
             <div className="flex flex-col items-center justify-center py-20 text-center h-full mt-10">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8">
                  {activeTab === 'home' ? <Play className="w-10 h-10 text-white/20" /> : <Search className="w-10 h-10 text-white/20" />}
                </div>
                <h2 className="text-3xl font-bold mb-4">{activeTab === 'home' ? 'Giriş Yaparak Başlayın' : 'Yeni Kitaplar Keşfedin'}</h2>
                <p className="text-white/50 mb-10 max-w-md mx-auto text-lg leading-relaxed">
                  {activeTab === 'home' 
                    ? 'Storytel kütüphanenize gerçek erişim sağlamak, çevrimiçi kitap dinlemek veya indirmek için hesabınıza giriş yapın.' 
                    : 'Storytel veritabanında arama yapabilmek ve yeni kitaplar keşfedebilmek için giriş yapmalısınız.'}
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="bg-brand text-white px-10 py-3.5 rounded-full font-bold text-lg hover:bg-brand-hover transition-transform hover:scale-105 shadow-xl shadow-brand/20"
                >
                  Hesaba Giriş Yap
                </button>
             </div>
          )}

          {!isGuestMode && activeTab === 'home' && featuredBook && (
            <>
              {/* Hero Section */}
              <section className="mb-12">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">Öne Çıkan</h2>
                <div className="relative rounded-2xl overflow-hidden bg-surface flex flex-col md:flex-row group cursor-pointer" onClick={() => togglePlay(featuredBook)}>
                  <div className="w-full md:w-1/3 aspect-square md:aspect-auto">
                    <img src={featuredBook.coverUrl} alt={featuredBook.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="p-8 md:p-12 flex flex-col justify-center flex-1">
                    <div className="inline-block px-3 py-1 bg-brand/20 text-brand rounded-full text-xs font-semibold mb-4 w-max">
                      {featuredBook.category || 'Klasik'}
                    </div>
                    <h3 className="text-4xl md:text-5xl font-serif font-bold mb-2">{featuredBook.title}</h3>
                    <p className="text-xl text-white/70 mb-6">{featuredBook.author}</p>
                    <p className="text-white/50 line-clamp-3 mb-8 max-w-2xl leading-relaxed">
                      {featuredBook.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        className="w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover transition-transform hover:scale-105"
                        onClick={(e) => { e.stopPropagation(); togglePlay(featuredBook); }}
                        disabled={fetchingAudioFor === featuredBook.id}
                      >
                        {fetchingAudioFor === featuredBook.id ? (
                           <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : currentBook?.id === featuredBook.id && isPlaying ? (
                           <Pause className="w-6 h-6 fill-current" />
                        ) : (
                           <Play className="w-6 h-6 fill-current ml-1" />
                        )}
                      </button>
                      <div className="text-sm text-white/50 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {featuredBook.duration || '0s 00d'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Grid Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Kitaplığınız</h2>
                  <button className="text-sm font-semibold text-white/50 hover:text-white flex items-center gap-1">
                     Tümünü Gör <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {bookshelf.slice(1).map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      isPlaying={currentBook?.id === book.id && isPlaying}
                      onPlay={() => togglePlay(book)}
                      isDownloaded={downloadedBooks.has(book.id.toString())}
                      isDownloading={downloading === book.id.toString() || fetchingAudioFor === book.id}
                      downloadProgress={downloadProgress?.[book.id.toString()]}
                      onDownload={() => handleDownload(book)}
                    />
                  ))}
                </div>
              </section>
            </>
          )}

          {!isGuestMode && activeTab === 'search' && featuredBook && (
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
                {bookshelf.map(book => (
                  <BookCard
                     key={book.id}
                     book={book}
                     isPlaying={currentBook?.id === book.id && isPlaying}
                     onPlay={() => togglePlay(book)}
                     isDownloaded={downloadedBooks.has(book.id.toString())}
                     isDownloading={downloading === book.id.toString() || fetchingAudioFor === book.id}
                     downloadProgress={downloadProgress?.[book.id.toString()]}
                     onDownload={() => handleDownload(book)}
                  />
                ))}
              </div>
            </section>
          )}



          {activeTab === 'library' && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">İndirilen Kitaplar</h2>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4 rotate-180" />
                  Yerel MP3 Yükle
                </button>
                <input 
                  type="file" 
                  accept="audio/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await importLocalFile(file);
                      e.target.value = ''; // reset
                    }
                  }} 
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {offlineBooks.length > 0 ? (
                  offlineBooks.map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      isPlaying={currentBook?.id === book.id && isPlaying}
                      onPlay={() => togglePlay(book)}
                      isDownloaded={true}
                      isDownloading={fetchingAudioFor === book.id}
                      downloadProgress={downloadProgress?.[book.id.toString()]}
                      onDownload={() => handleDownload(book)}
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
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Bottom Player */}
      <Player currentBook={currentBook} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
    
    </div>
  );
}
