'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/actions/storytel';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await loginAction(email, password);
    
    setLoading(false);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Geçersiz giriş bilgileri.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-white p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-xl border border-white/5">
        <h1 className="text-3xl font-serif font-bold text-center mb-2">Giriş Yap</h1>
        <p className="text-white/50 text-center mb-8">Storytel hesabınızla devam edin</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm text-center">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">E-posta</label>
            <input 
              type="email" 
              required
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors text-white" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresiniz"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Şifre</label>
            <input 
              type="password" 
              required
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand transition-colors text-white" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifreniz"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand text-white font-semibold rounded-xl py-3 hover:bg-brand-hover transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
