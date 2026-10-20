'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import styles from './AuthPanel.module.css';

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

  const title = mode === 'recovery' ? 'Жаңа құпия сөз' : mode === 'register' ? 'Жаңа аккаунт құру' : 'Жұмыс кабинетіне кіру';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <img src="/infologia-wordmark.png" alt="infoLogia" className={styles.logo} />
          <span className={styles.headerLabel}>Кураторлар кабинеті</span>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.intro} aria-labelledby="auth-intro-title">
          <p className={styles.eyebrow}>infoLogia командасы үшін</p>
          <h1 id="auth-intro-title" className={styles.introTitle}>Күнделікті жұмыс.<br /><span>Бәрі бір жерде.</span></h1>
          <p className={styles.introText}>Топтарды басқарыңыз, жұптық жұмыс пен сабақ тапсыру кестесін дайындаңыз.</p>
          <figure className={styles.photoFrame}>
            <img src="/infologia-team.jpg" alt="infoLogia командасы" className={styles.photo} />
            <figcaption className={styles.photoCaption}>Бір команда. Ортақ мақсат.</figcaption>
          </figure>
        </section>

        <section className={styles.formPanel} aria-labelledby="auth-form-title">
          <p className={styles.eyebrow}>Жеке кабинет</p>
          <h2 id="auth-form-title" className={styles.formTitle}>{title}</h2>
          <p className={styles.formDescription}>{mode === 'recovery' ? 'Аккаунтыңыз үшін жаңа құпия сөз енгізіңіз.' : mode === 'register' ? 'Жұмысты бастау үшін деректеріңізді енгізіңіз.' : 'Жұмысты жалғастыру үшін аккаунтыңызға кіріңіз.'}</p>

          {!supabase ? (
            <div className={styles.notice}>
              Cloud авторизация қосылмаған. Сайт иесі Supabase жобасын жасап, <code>NEXT_PUBLIC_SUPABASE_URL</code> және <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> параметрлерін баптауы керек.
            </div>
          ) : (
            <>
              {mode !== 'recovery' && (
                <div className={styles.tabs} aria-label="Аккаунтқа кіру немесе тіркелу">
                  <button type="button" onClick={() => { setMode('login'); setError(''); setInfo(''); }} aria-pressed={mode === 'login'} className={`${styles.tab} ${mode === 'login' ? styles.activeTab : ''}`}>Кіру</button>
                  <button type="button" onClick={() => { setMode('register'); setError(''); setInfo(''); }} aria-pressed={mode === 'register'} className={`${styles.tab} ${mode === 'register' ? styles.activeTab : ''}`}>Тіркелу</button>
                </div>
              )}

              <form onSubmit={submit} className={styles.form}>
                {mode !== 'recovery' && <div>
                  <label htmlFor="auth-email" className={styles.label}>Электрондық пошта</label>
                  <div className={styles.inputWrap}>
                    <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className={styles.input} />
                    <Mail size={17} className={styles.inputIcon} aria-hidden="true" />
                  </div>
                </div>}

                <div>
                  <label htmlFor="auth-password" className={styles.label}>{mode === 'recovery' ? 'Жаңа құпия сөз' : 'Құпия сөз'}</label>
                  <div className={styles.inputWrap}>
                    <input id="auth-password" type={showPassword ? 'text' : 'password'} required minLength={mode === 'login' ? undefined : 8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Кемінде 8 символ" className={`${styles.input} ${styles.passwordInput}`} />
                    <Lock size={17} className={styles.inputIcon} aria-hidden="true" />
                    <button type="button" onClick={() => setShowPassword(visible => !visible)} aria-label={showPassword ? 'Құпия сөзді жасыру' : 'Құпия сөзді көрсету'} aria-pressed={showPassword} className={styles.eyeButton}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {mode === 'recovery' && <div>
                  <label htmlFor="auth-confirm-password" className={styles.label}>Құпия сөзді қайталаңыз</label>
                  <div className={styles.inputWrap}>
                    <input id="auth-confirm-password" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Құпия сөзді қайталаңыз" className={`${styles.input} ${styles.confirmInput}`} />
                    <button type="button" onClick={() => setShowPassword(visible => !visible)} aria-label={showPassword ? 'Құпия сөзді жасыру' : 'Құпия сөзді көрсету'} aria-pressed={showPassword} className={styles.eyeButton}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>}

                {error && <div role="alert" className={styles.error}>⚠️ {error}</div>}
                {info && <div role="status" className={styles.info}>{info}</div>}

                <button type="submit" disabled={loading} className={styles.submit}>
                  <span>{loading ? 'Күте тұрыңыз...' : mode === 'register' ? 'Аккаунт құру' : mode === 'recovery' ? 'Құпия сөзді сақтау' : 'Кіру'}</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </form>

            </>
          )}
        </section>
      </main>
    </div>
  );
}
