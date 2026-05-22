'use client';

import { useState } from 'react';

interface Props {
  onLogin: () => void;
  onClose: () => void;
}

export function AdminLogin({ onLogin, onClose }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Incorrect password'); return; }
      localStorage.setItem('cs2-admin-token', data.token);
      onLogin();
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-surface border border-border-dim rounded-sm w-full max-w-xs mx-4 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-sm uppercase tracking-[0.2em] text-white">Admin Login</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xs">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 bg-bg-elevated border border-border-dim rounded-sm text-sm text-white font-body placeholder:text-zinc-600 focus:outline-none focus:border-accent/60"
          />
          {error && (
            <p className="text-xs text-red-400 font-body">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2 bg-accent text-white font-heading text-xs uppercase tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function useAdminSession() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('cs2-admin-token') === 'cs2-admin-session';
}

export function clearAdminSession() {
  localStorage.removeItem('cs2-admin-token');
}
