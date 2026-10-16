'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';

const BRAND = '#1D3597';

export default function AuthPanel({ supabase, onAuth, recoveryMode = false, onRecoveryDone }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recoveryMode) {
      setMode('recovery');
      setError('');
      setInfo('');
    }
  }, [recoveryMode]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!supabase) {
      setError('Авторизация әлі бапталмаған. Иесі Supabase жобасын қосуы керек.');
      return;
    }
    if (mode === 'recovery' && password !== confirmPassword) {
      setError('Құпия сөздер сәйкес келмейді.');
      return;
    }
    if ((mode === 'register' || mode === 'recovery') && password.length < 8) {
      setError('Құпия сөз кем дегенде 8 символдан тұруы керек.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'recovery') {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setPassword('');
        setConfirmPassword('');
        setInfo('Құпия сөз өзгертілді.');
        onRecoveryDone?.();
      } else if (mode === 'register') {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (authError) throw authError;
        if (data.session && data.user) onAuth?.(data.user);
        else setInfo('Тіркелуді аяқтау үшін электрондық поштаңызға келген сілтемені ашыңыз.');
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        if (data.user) onAuth?.(data.user);
      }
    } catch (e) {
      const text = e?.message || '';
      if (/invalid login credentials/i.test(text)) setError('Email немесе құпия сөз қате.');
      else if (/already registered/i.test(text)) setError('Бұл email тіркелген. Кіру режимін таңдаңыз.');
      else setError(text || 'Кіру кезінде қате шықты. Қайта көріңіз.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px',
    padding: '11px 14px 11px 40px', fontSize: '14px', color: '#111827',
    outline: 'none', background: '#fff',
  };
  const tabStyle = active => ({
    flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 800, background: active ? '#fff' : 'transparent',
    color: active ? BRAND : '#64748b', boxShadow: active ? '0 2px 8px rgba(0,0,0,.08)' : 'none',
  });
  const title = mode === 'recovery' ? 'Жаңа құпия сөз' : 'Кураторлардың жұмыс кабинеті';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '24px', padding: '40px 38px', width: '420px', maxWidth: '100%', boxShadow: '0 20px 60px rgba(29,53,151,.12), 0 0 0 1px rgba(29,53,151,.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg, #1D3597 0%, #2b4cc4 100%)', color: '#fff', marginBottom: '14px', boxShadow: '0 8px 24px rgba(29,53,151,.28)' }}>
            <ShieldCheck size={30} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-.5px', color: '#111827' }}>info<span style={{ color: BRAND }}>Logia</span></div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>{title}</div>
        </div>

        {!supabase ? (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px', color: '#854d0e', fontSize: '13px', lineHeight: 1.6 }}>
            Cloud авторизация қосылмаған. Сайт иесі Supabase жобасын жасап, <code>NEXT_PUBLIC_SUPABASE_URL</code> және <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> параметрлерін баптауы керек.
          </div>
        ) : (
          <>
              {mode !== 'recovery' && (
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '22px' }}>
                <button type="button" onClick={() => { setMode('login'); setError(''); setInfo(''); }} style={tabStyle(mode === 'login')}>Кіру</button>
                <button type="button" onClick={() => { setMode('register'); setError(''); setInfo(''); }} style={tabStyle(mode === 'register')}>Тіркелу</button>
              </div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {mode !== 'recovery' && <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '.06em', marginBottom: '6px' }}>ЭЛЕКТРОНДЫҚ ПОШТА (EMAIL)</div>
                <div style={{ position: 'relative' }}>
                  <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" style={inputStyle} />
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '13px', top: '13px', pointerEvents: 'none' }} />
                </div>
              </div>}

              {<div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '.06em', marginBottom: '6px' }}>{mode === 'recovery' ? 'ЖАҢА ҚҰПИЯ СӨЗ' : 'ҚҰПИЯ СӨЗ'}</div>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} required minLength={mode === 'login' ? undefined : 8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Кемінде 8 символ" style={{ ...inputStyle, paddingRight: '42px' }} />
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', left: '13px', top: '13px', pointerEvents: 'none' }} />
                  <button type="button" onClick={() => setShowPassword(visible => !visible)} aria-label={showPassword ? 'Құпия сөзді жасыру' : 'Құпия сөзді көрсету'} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: 'none', borderRadius: '6px', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>}

              {mode === 'recovery' && <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '.06em', marginBottom: '6px' }}>ҚҰПИЯ СӨЗДІ ҚАЙТАЛАҢЫЗ</div>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Құпия сөзді қайталаңыз" style={{ ...inputStyle, paddingLeft: '14px', paddingRight: '42px' }} />
                  <button type="button" onClick={() => setShowPassword(visible => !visible)} aria-label={showPassword ? 'Құпия сөзді жасыру' : 'Құпия сөзді көрсету'} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: 'none', borderRadius: '6px', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>}

              {error && <div role="alert" style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#dc2626', fontWeight: 600, lineHeight: 1.5 }}>⚠️ {error}</div>}
              {info && <div role="status" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#166534', fontWeight: 600, lineHeight: 1.5 }}>{info}</div>}

              <button type="submit" disabled={loading} style={{ background: loading ? '#94a3b8' : BRAND, color: '#fff', border: 'none', borderRadius: '12px', padding: '13px', fontSize: '14px', fontWeight: 800, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px', boxShadow: '0 4px 14px rgba(29,53,151,.25)' }}>
                <span>{loading ? 'Күте тұрыңыз...' : mode === 'register' ? 'Аккаунт құру' : mode === 'recovery' ? 'Құпия сөзді сақтау' : 'Кіру'}</span>
                <ArrowRight size={16} />
              </button>
            </form>

          </>
        )}
      </div>
    </div>
  );
}
