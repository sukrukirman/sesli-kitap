import { useState, useEffect } from 'react';

const CACHE_NAME = 'audiobooks-v1';

export function useOfflineAudio() {
  const [downloadedBooks, setDownloadedBooks] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    checkDownloaded();
  }, []);

  const checkDownloaded = async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const downloadedUrls = keys.map(request => request.url);
      
      const storedIds = JSON.parse(localStorage.getItem('downloadedBooks') || '[]');
      setDownloadedBooks(new Set(storedIds));
    } catch (error) {
      console.error('Cache check failed', error);
    }
  };

  const downloadBook = async (id: string, url: string) => {
    setDownloading(id);
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.add(url);

      const newDownloaded = new Set(downloadedBooks);
      newDownloaded.add(id);
      setDownloadedBooks(newDownloaded);
      localStorage.setItem('downloadedBooks', JSON.stringify(Array.from(newDownloaded)));
    } catch (error) {
      console.error('Download failed', error);
      alert('İndirme başarısız oldu. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setDownloading(null);
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
    } catch (error) {
      console.error('Remove failed', error);
    }
  };

  const getAudioSource = async (url: string): Promise<string> => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(url);
      if (response) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.error('Failed to get from cache', error);
    }
    return url; // Fallback to network
  };

  return {
    downloadedBooks,
    downloading,
    downloadBook,
    removeBook,
    getAudioSource
  };
}
