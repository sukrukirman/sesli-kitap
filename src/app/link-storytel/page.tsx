'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { linkStorytelAction } from '@/app/actions/storytel';

export default function LinkStorytelPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLink = async (formData: FormData) => {
    setLoading(true);
    setError('');

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await linkStorytelAction(email, password);
    
    setLoading(false);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Bağlantı başarısız oldu.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-white p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-xl border border-white/5">
        <h1 className="text-3xl font-serif font-bold text-center mb-2">Storytel'i Bağla</h1>
        <p className="text-white/50 text-center mb-8">Uygulamayı kullanmak için Storytel hesabınızı bağlayın</p>
        
        <form action={handleLink} className="space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Storytel E-posta</label>
            <input 
              name="email"
              type="email" 
              required
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors text-white" 
              placeholder="e-posta adresiniz"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Storytel Şifre</label>
            <input 
              name="password"
              type="password" 
              required
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors text-white" 
              placeholder="şifreniz"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand text-white font-semibold rounded-xl py-3 hover:bg-brand-hover transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'Bağlanıyor...' : 'Bağla'}
          </button>
        </form>
        <div className="mt-4 text-center">
            <button 
              type="button" 
              onClick={() => router.push('/')}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              Şimdilik Atla
            </button>
        </div>
      </div>
    </div>
  );
}
