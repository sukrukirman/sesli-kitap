'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

function generateCredentials(username: string) {
  const charMap: Record<string, string> = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u',
  };
  
  let safeUsername = username.trim().toLowerCase();
  safeUsername = safeUsername.replace(/[çğşıöü]/g, match => charMap[match] || match);
  safeUsername = safeUsername.replace(/[^a-z0-9]/g, '');
  
  if (safeUsername.length === 0) safeUsername = 'user';

  const email = `${safeUsername}@storytel.app`;
  const password = `${safeUsername}-Secret-123!`;
  return { email, password, safeUsername };
}

export async function continueWithUsernameAction(formData: FormData) {
  const usernameParam = formData.get('username') as string;
  if (!usernameParam) return { success: false, error: 'Kullanıcı adı gerekli' };

  if (usernameParam.trim().length < 3) {
    return { success: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır' };
  }

  const { email, password } = generateCredentials(usernameParam);
  const supabase = await createClient();
  
  // Önce doğrudan giriş yapmayı deniyoruz
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInError) {
    // Başarıyla giriş yapıldı (Hesap daha önce oluşturulmuş)
    redirect('/');
  }

  // Eğer giriş hatası 'Kullanıcı bulunamadı/Email hatalı' tarzındaysa, Demek ki hesap yok, yeni kayıt açıyoruz:
  if (signInError.message.includes('Invalid login credentials')) {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: usernameParam, // Orijinal ismi Supabase meta verilerinde saklıyoruz
        }
      }
    });

    if (signUpError) {
      return { success: false, error: signUpError.message };
    }
    
    // Kayıt oluşturuldu ve otomatik giriş sağlandı
    redirect('/');
  }

  // Geriye kalan farklı bir bağlantı/sistem hatası varsa göster
  return { success: false, error: signInError.message };
}

export async function logoutAppAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
