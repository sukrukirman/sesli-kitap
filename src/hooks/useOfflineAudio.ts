'use client';

import { useState, useEffect } from 'react';
import { Book } from '@/types';

const CACHE_NAME = 'audiobooks-v1';

export function useOfflineAudio() {
  const [downloadedBooks, setDownloadedBooks] = useState<Set<string>>(new Set());
  const [offlineBooks, setOfflineBooks] = useState<Book[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [abortControllers, setAbortControllers] = useState<Record<string, AbortController>>({});

  useEffect(() => {
    checkDownloaded();
  }, []);

  const checkDownloaded = async () => {
    try {
      // Validate cache exists
      const cache = await caches.open(CACHE_NAME);
      
      const storedIds = JSON.parse(localStorage.getItem('downloadedBooks') || '[]');
      setDownloadedBooks(new Set(storedIds));
      
      const storedBooks = JSON.parse(localStorage.getItem('offlineBookData') || '[]');
      setOfflineBooks(storedBooks);
    } catch (error) {
      console.error('Cache check failed', error);
    }
  };

  const downloadBook = async (book: Book, url: string) => {
    const id = book.id.toString();
    
    // Zaten indirilmişse tekrar indirmeyi engelle
    const currentStoredIds = JSON.parse(localStorage.getItem('downloadedBooks') || '[]');
    if (currentStoredIds.includes(id) || downloadedBooks.has(id)) {
      console.log('[OfflineAudio] Kitap zaten indirilmiş, atlanıyor:', book.title);
      return;
    }

    if (downloading === id) return;

    const controller = new AbortController();
    
    setAbortControllers(prev => ({ ...prev, [id]: controller }));
    setDownloading(id);
    setDownloadProgress(prev => ({ ...prev, [id]: 0 }));
    
    try {
      const cache = await caches.open(CACHE_NAME);
      
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (!response.body) {
         throw new Error(`ReadableStream not supported in this browser.`);
      }

      // We need the content length to calculate progress
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          loaded += value.length;
          if (total > 0) {
            const progress = Math.round((loaded / total) * 100);
            setDownloadProgress(prev => ({ ...prev, [id]: progress }));
          }
        }
      }

      const blob = new Blob(chunks as any, { type: response.headers.get('content-type') || 'audio/mpeg' });
      const newResponse = new Response(blob, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
      });

      // Sadece Cache API'ye kaydet (PWA mantığı - OS indirmesi yapılmaz)
      await cache.put(url, newResponse);

      // Save book details to localStorage so we can display the library without network/login
      const currentStoredBooks: Book[] = JSON.parse(localStorage.getItem('offlineBookData') || '[]');
      if (!currentStoredBooks.find(b => b.id.toString() === id)) {
         currentStoredBooks.push(book);
         localStorage.setItem('offlineBookData', JSON.stringify(currentStoredBooks));
         setOfflineBooks(currentStoredBooks);
      }

      const newDownloaded = new Set(downloadedBooks);
      newDownloaded.add(id);
      setDownloadedBooks(newDownloaded);
      localStorage.setItem('downloadedBooks', JSON.stringify(Array.from(newDownloaded)));
    } catch (error: any) {
      if (error.name === 'AbortError') {
         console.log('Download cancelled by user for', book.title);
      } else {
         console.error('Download failed', error);
         alert(`İndirme başarısız oldu: ${error?.message || 'Bilinmeyen hata'}. Lütfen internet bağlantınızı kontrol edin.`);
      }
    } finally {
      setDownloading(prev => prev === id ? null : prev);
      setDownloadProgress(prev => {
         const newProg = { ...prev };
         delete newProg[id];
         return newProg;
      });
      setAbortControllers(prev => {
         const next = { ...prev };
         delete next[id];
         return next;
      });
    }
  };

  const cancelDownload = (id: string) => {
    if (abortControllers[id]) {
      abortControllers[id].abort();
    }
  };

  const removeBook = async (id: string, url: string) => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(url);

      const newDownloaded = new Set(downloadedBooks);
      newDownloaded.delete(id);
      setDownloadedBooks(newDownloaded);
      localStorage.setItem('downloadedBooks', JSON.stringify(Array.from(newDownloaded)));
      
      const currentStoredBooks: Book[] = JSON.parse(localStorage.getItem('offlineBookData') || '[]');
      const filteredBooks = currentStoredBooks.filter(b => b.id.toString() !== id);
      localStorage.setItem('offlineBookData', JSON.stringify(filteredBooks));
      setOfflineBooks(filteredBooks);
    } catch (error) {
      console.error('Remove failed', error);
    }
  };

  const getAudioSource = async (url: string | undefined, bookId?: string): Promise<string> => {
    if(!url) return "";
    try {
      // 1. Check local storage
      let isDownloadedLocally = false;
      if (bookId) {
        const storedIds = JSON.parse(localStorage.getItem('downloadedBooks') || '[]');
        isDownloadedLocally = storedIds.includes(bookId) || downloadedBooks.has(bookId);
      }

      // 2. Check cache
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(url, { ignoreSearch: true });
      
      if (response && (isDownloadedLocally || !bookId)) {
        console.log(`[OfflineAudio] Kitap indirilenlerden/önbellekten oynatılıyor: ${bookId || 'Bilinmeyen ID'}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } else if (isDownloadedLocally && !response) {
        console.warn(`[OfflineAudio] Kitap ${bookId} local storage'da indirilmiş görünüyor ama cache'de bulunamadı!`);
      }
    } catch (error) {
      console.error('Failed to get from cache', error);
    }
    
    console.log(`[OfflineAudio] Kitap ağdan stream ediliyor: ${url}`);
    return url; // Fallback to network
  };

  const importLocalFile = async (file: File) => {
    try {
      const cache = await caches.open(CACHE_NAME);
      
      // Attempt to extract book ID from filename pattern: "Title - Author [ID].mp3"
      const match = file.name.match(/\[(.*?)\]\.mp3$/i);
      const extractedId = match ? match[1] : null;
      
      const id = extractedId || `local-${Date.now()}`;
      // Tam bir URL oluşturmak (bazı tarayıcılar Cache API'sinde mutlak URL bekleyebilir)
      const url = new URL(`/local-audio/${id}`, window.location.origin).toString();
      
      // Content-Length başlığını manuel atamak Response constructor'ında TypeError fırlatabilir.
      // Tarayıcı Blob/File gönderildiğinde bunu otomatik ayarlar.
      const newResponse = new Response(file, {
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'Content-Type': file.type || 'audio/mpeg'
          })
      });
      
      const request = new Request(url);
      await cache.put(request, newResponse);

      const currentStoredBooks: Book[] = JSON.parse(localStorage.getItem('offlineBookData') || '[]');
      
      // Prevent duplicates in library
      if (!currentStoredBooks.find(b => b.id.toString() === id)) {
        // Find existing metadata from current session if possible to enrich, otherwise fake it
        const fakeBook: Book = {
          id,
          title: file.name.replace(/\.[^/.]+$/, "").replace(/ \[(.*?)\]/, ""), // Remove ID tag from title
          author: "Yerel Dosya (" + (extractedId ? "Eşleştirildi" : "Eşleştirilemedi") + ")",
          coverUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=3000&auto=format&fit=crop",
          audioUrl: url,
          description: "Kullanıcı tarafından yerel cihazdan yüklenen ses dosyası.",
          category: "Yerel",
          duration: "Bilinmiyor"
        };
        
        currentStoredBooks.push(fakeBook);
        localStorage.setItem('offlineBookData', JSON.stringify(currentStoredBooks));
        setOfflineBooks(currentStoredBooks);
      } else {
        // It already exists in offline library metadata, just update its audio link to the local caching
        const updatedStored = currentStoredBooks.map(b => b.id.toString() === id ? { ...b, audioUrl: url } : b);
        localStorage.setItem('offlineBookData', JSON.stringify(updatedStored));
        setOfflineBooks(updatedStored);
      }

      const newDownloaded = new Set(downloadedBooks);
      newDownloaded.add(id);
      setDownloadedBooks(newDownloaded);
      localStorage.setItem('downloadedBooks', JSON.stringify(Array.from(newDownloaded)));
      
    } catch (error: any) {
      console.error('Import failed', error);
      const isQuota = error?.name === 'QuotaExceededError' || error?.message?.toLowerCase().includes('quota');
      if (isQuota) {
         alert('Tarayıcınızın veya cihazınızın depolama alanı doldu (Quota Exceeded)! Lütfen büyük dosyaları silin, cihazda yer açın veya Gizli Sekme yerine normal sekme kullanın.');
      } else {
         alert(`Dosya içe aktarılamadı: ${error?.message || 'Bilinmeyen hata'}`);
      }
    }
  };

  return {
    downloadedBooks,
    offlineBooks,
    downloading,
    downloadProgress,
    downloadBook,
    cancelDownload,
    removeBook,
    getAudioSource,
    importLocalFile
  };
}
