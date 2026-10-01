'use client';

/* ══════════════════════════════════════════════════════════════════════════
   infoLogia • Строгий экран авторизации (Username + Password)
   ══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { setSession, saveUsers, getUsers, uid } from '@/lib/utils';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

const BRAND = '#1D3597';

export default function AuthPanel({ onAuth }) {
  const [mode,     setMode]     = useState('login');
  const [username, setUsername] = useState('');
  const [pass,     setPass]     = useState('');
  const [err,      setErr]      = useState('');
  const [loading,  setLoading]  = useState(false);

  function submit(e) {
    e.preventDefault();
    setErr('');
    const cleanUser = username.trim();
    if (!cleanUser) {
      setErr('Логинді жазыңыз.');
      return;
    }
    if (!pass) {
      setErr('Құпия сөзді жазыңыз.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const users = getUsers();
      if (mode === 'register') {
        if (users.find(u => (u.username || '').toLowerCase() === cleanUser.toLowerCase())) {
          setErr('Бұл логин тіркелген. Басқа логин таңдаңыз немесе кіріңіз.');
          setLoading(false);
          return;
        }
        if (pass.length < 4) {
          setErr('Құпия сөз кем дегенде 4 символдан тұруы тиіс.');
          setLoading(false);
          return;
        }
        const u = { id: uid(), username: cleanUser, pass };
        saveUsers([...users, u]);
        setSession(u);
        onAuth(u);
      } else {
        const u = users.find(u => (u.username || '').toLowerCase() === cleanUser.toLowerCase() && u.pass === pass);
        if (!u) {
          setErr('Логин немесе құпия сөз қате енгізілді.');
          setLoading(false);
          return;
        }
        setSession(u);
        onAuth(u);
      }
      setLoading(false);
    }, 200);
  }

  const tabStyle = (active) => ({
    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
    cursor: 'pointer', fontSize: '13px', fontWeight: 800, transition: 'all .15s',
    background: active ? '#fff' : 'transparent',
    color: active ? BRAND : '#64748b',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,.08)' : 'none',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '44px 38px',
        width: '420px',
        maxWidth: '100%',
        boxShadow: '0 20px 60px rgba(29, 53, 151, 0.12), 0 0 0 1px rgba(29, 53, 151, 0.06)',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #1D3597 0%, #2b4cc4 100%)',
            color: '#fff', marginBottom: '14px',
            boxShadow: '0 8px 24px rgba(29, 53, 151, 0.28)',
          }}>
            <ShieldCheck size={30} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', color: '#111827' }}>
            info<span style={{ color: BRAND }}>Logia</span>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
            Кураторлардың жұмыс кабинеті
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div style={{
          display: 'flex', background: '#f1f5f9',
          borderRadius: '12px', padding: '4px', marginBottom: '24px',
        }}>
          <button type="button" onClick={() => { setMode('login'); setErr(''); }} style={tabStyle(mode === 'login')}>
            Кіру
          </button>
          <button type="button" onClick={() => { setMode('register'); setErr(''); }} style={tabStyle(mode === 'register')}>
            Тіркелу
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '.06em', marginBottom: '6px' }}>
              ЛОГИН (USERNAME)
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Мыс: curator_aidar"
                style={{
                  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px',
                  padding: '11px 14px 11px 38px', fontSize: '14px', color: '#111827',
                  outline: 'none', background: '#fff', transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = BRAND}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '.06em', marginBottom: '6px' }}>
              ҚҰПИЯ СӨЗ (ПАРОЛЬ)
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px',
                  padding: '11px 14px 11px 38px', fontSize: '14px', color: '#111827',
                  outline: 'none', background: '#fff', transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = BRAND}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '14px', pointerEvents: 'none' }} />
            </div>
          </div>

          {err && (
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fecaca',
              borderRadius: '10px', padding: '10px 14px', fontSize: '12px',
              color: '#dc2626', fontWeight: 600, lineHeight: 1.5,
            }}>
              ⚠️ {err}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#94a3b8' : BRAND,
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '13px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
              boxShadow: '0 4px 14px rgba(29, 53, 151, 0.25)',
              transition: 'background 0.15s',
            }}
          >
            <span>{loading ? 'Тексерілуде...' : mode === 'login' ? 'Кіру' : 'Тіркелу'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
