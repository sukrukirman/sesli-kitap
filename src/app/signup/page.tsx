'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signupAppAction } from '@/app/actions/auth';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (formData: FormData) => {
    setLoading(true);
    setError('');

    const result = await signupAppAction(formData);
    
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-white p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-xl border border-white/5">
        <h1 className="text-3xl font-serif font-bold text-center mb-2">Kayıt Ol</h1>
        <p className="text-white/50 text-center mb-8">Uygulamamıza katılarak dinleme geçmişinizi saklayın</p>
        
        <form action={handleSignup} className="space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">E-posta</label>
            <input 
              name="email"
              type="email" 
              required
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors text-white" 
              placeholder="E-posta adresiniz"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Şifre</label>
            <input 
              name="password"
              type="password" 
              required
              minLength={6}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors text-white" 
              placeholder="Şifreniz (En az 6 karakter)"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand text-white font-semibold rounded-xl py-3 hover:bg-brand-hover transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-white/60">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="text-brand hover:underline">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
