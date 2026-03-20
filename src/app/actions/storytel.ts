'use server';

import { cookies } from 'next/headers';
import Storytel from 'storytel-api';
import { Book as UITypeBook } from '@/types';

const STORYTEL_COOKIE_NAME = 'storytel_token';

// Map specific fields securely
function mapStorytelBookToUI(b: any): UITypeBook {
  const rawData = b.metadata?.book || b.book || {};
  let coverUrl = rawData.largeCover || rawData.cover || `https://www.storytel.com/images/150x150/${b.id}.jpg`;
  
  // Storytel API sometimes returns relative paths for covers
  if (coverUrl.startsWith('/')) {
     coverUrl = `https://www.storytel.com${coverUrl}`;
  }


  console.log('[DEBUG] Book raw data:', JSON.stringify(b.metadata?.abookMark));
  return {
    id: b.id?.toString() || '',
    title: b.title || 'Unknown',
    author: Array.isArray(b.authors) ? b.authors.map((a: any) => a.name).join(', ') : 'Unknown',
    coverUrl: coverUrl,
    duration: '',
    description: b.description || '',
    category: '',
    audioUrl: '', // This will require specific fetching per book
    bookmarkTimestamp: rawData.lastBookmarkTimeStamp || 0,
    bookmarkPos: b.metadata?.abookMark?.pos || b.abookMark?.pos || 0,
  };
}

export async function loginAction(email: string, pass: string) {
  try {
    console.log('[DEBUG] Attempting login for:', email);
    const storytel = new Storytel();
    const user = await storytel.signIn(email, pass);
    
    const tokenInfo = user.getSingleSignToken();
    console.log('[DEBUG] Login successful, tokenInfo:', tokenInfo ? 'exists' : 'null/undefined');
    
    if(!tokenInfo) {
       console.error('[DEBUG] Token string is missing after successful signIn');
       return { success: false, error: 'Token missing from response' };
    }

    const cookieStore = await cookies();
    cookieStore.set(STORYTEL_COOKIE_NAME, tokenInfo as string, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    console.log('[DEBUG] Cookie set successfully');

    return { success: true };
  } catch (error: any) {
    console.error('[DEBUG] Login action failed:', error);
    return { success: false, error: error.message || 'Login failed' };
  }
}

export async function getBookshelfAction(): Promise<UITypeBook[]> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(STORYTEL_COOKIE_NAME)?.value;
    
    console.log('[DEBUG] getBookshelfAction called. Token exists in cookies?', !!token);
    if (!token) return [];

    const storytel = new Storytel();
    const user = await storytel.signInUsingSingleSignToken(token);
    console.log('[DEBUG] Logged in using token successfully.');
    
    const bookshelf = await user.getBookshelf();
    console.log(`[DEBUG] Bookshelf retrieved. Count: ${bookshelf?.length}`);
    if (bookshelf && bookshelf.length > 0) {
      console.log(`[DEBUG] First book raw data:\n`, JSON.stringify(bookshelf[0], null, 2));
    }
    
    return bookshelf.map((b) => mapStorytelBookToUI(b));
  } catch (error) {
    console.error('[DEBUG] Fetching bookshelf failed:', error);
    return [];
  }
}

export async function getBookAudioUrlAction(bookId: string): Promise<string | null> {
  // Return the path to our local proxy API route. 
  // This bypasses CORS on the client, hides the token, and enables Cache API blob fetching.
  return `/api/audio/${bookId}`;
}
