'use server';

import { createClient } from '@/utils/supabase/server';

export async function saveListeningHistory(bookId: string, position: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('listening_history')
      .upsert({ 
        user_id: user.id, 
        book_id: bookId, 
        position,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, book_id' });

    if (error) {
      console.error('[DEBUG] Failed to save listening history:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[DEBUG] Server error saving listening history:', err);
    return { success: false, error: err.message };
  }
}

export async function getListeningHistory(bookId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, position: null };
    }

    const { data, error } = await supabase
      .from('listening_history')
      .select('position')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('[DEBUG] Failed to get listening history:', error.message);
      return { success: false, position: null };
    }

    return { success: true, position: data?.position ?? null };
  } catch (err: any) {
      console.error('[DEBUG] Server error getting listening history:', err);
      return { success: false, position: null };
  }
}

export async function getAllListeningHistory() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, history: [] };
    }

    const { data, error } = await supabase
      .from('listening_history')
      .select('book_id, position, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[DEBUG] Failed to get all listening history:', error.message);
      return { success: false, history: [] };
    }

    return { success: true, history: data || [] };
  } catch (err: any) {
      console.error('[DEBUG] Server error getting all listening history:', err);
      return { success: false, history: [] };
  }
}
