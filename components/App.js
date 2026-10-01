'use client';

/* ══════════════════════════════════════════════════════════════════════════
   infoLogia • Куратор сайты
   Split-Screen SPA with Strict Auth Guard & Strict User-Scoped Data Isolation:
   1. «Жұптық жұмыс» (Pairs Carousel Generator with template.svg)
   2. «Сабақ тапсыру» (Exam Schedule with template2.svg)
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Trash2, Download, Copy, LogOut, Sparkles, Users, Clock, Check, User
} from 'lucide-react';
import AuthPanel     from './AuthPanel';
import Poster        from './Poster';
import ExamScheduler from './ExamScheduler';
import {
  uid, makeSchedule, makeGenderedSchedule,
  parseStudents, normalizeText,
  loadUserGroups, saveUserGroups, getSession, clearSession,
  pairsToTSV,
} from '@/lib/utils';
import {
  fillSvgTemplate, downloadSvgAsPng, RAW_SVG_TEMPLATE
} from '@/lib/svgTemplate';

/* ── Constants ──────────────────────────────────────────────── */
const BRAND     = '#1D3597';
const MAX_WEEKS = 16; // 1 to 16 weeks compact switcher

/* ── Realistic 28-Student Demo Dataset ──────────────────────── */
const DEMO_STUDENTS_TEXT = `Болатұлы Нұрдәулет 87754615707
Еркинжан Каусар 87086898257
Асқарұлы Дамир 87019998877
Серікбай Аружан 87771234567
Мұратұлы Әлихан 87023456789
Жолдасбек Диана 87059876543
Кеңес Азамат 87471112233
Омарова Салтанат 87712223344
Тұрсынбек Бауыржан 87073334455
Нұрланқызы Аяулым 87084445566
Бақытжан Ерасыл 87785556677
Амангелді Мадина 87016667788
Ибрагим Санжар 87027778899
Қайратқызы Адина 87058889900
Дәулетұлы Арман 87479990011
Сейітқали Жансая 87710001122
Бекболат Елдар 87071113355
Маратқызы Іңкәр 87082224466
Жұмабек Бексұлтан 87783335577
Әділхан Дана 87014446688
Сәбитұлы Нұрислам 87025557799
Қасымбек Анель 87056668800
Темірлан Айбек 87477779911
Өмірзақ Айдана 87718880022
Рамазанұлы Дінмұхаммед 87079991133
Шәкәрім Толғанай 87080002244
Хамит Мирас 87781113355
Есенгелді Балнұр 87012224466`;

/* ══════════════════════════════════════════════════════════════
   UI Primitives
   ══════════════════════════════════════════════════════════════ */
function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, fullWidth = false, sx = {} }) {
  const vars = {
    primary: { bg: BRAND,         fg: '#fff',     border: 'none' },
    ghost:   { bg: '#fff',        fg: '#374151', border: '1.5px solid #e5e7eb' },
    danger:  { bg: 'transparent', fg: '#dc2626', border: '1.5px solid #fecaca' },
    success: { bg: '#059669',     fg: '#fff',     border: 'none' },
  }[variant] || {};

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: size === 'sm' ? '6px 12px' : '9px 16px',
        fontSize: size === 'sm' ? '12px' : '13px',
        fontWeight: 700, borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
        border: vars.border || 'none',
        background: vars.bg, color: vars.fg,
        opacity: disabled ? .45 : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'all .15s',
        ...sx,
      }}
    >{children}</button>
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', letterSpacing: '.07em', marginBottom: '5px' }}>
      {children}
    </div>
  );
}

function StyledInput({ value, onChange, onBlur, placeholder, type = 'text' }) {
  const [f, setF] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onFocus={() => setF(true)}
      onBlur={e => { setF(false); onBlur?.(e); }}
      placeholder={placeholder}
      style={{
        width: '100%', border: `1.5px solid ${f ? BRAND : '#e5e7eb'}`,
        borderRadius: '8px', padding: '8px 11px', fontSize: '13px',
        color: '#111827', background: '#fff', outline: 'none', transition: 'border-color .15s',
      }}
    />
  );
}

function Toast({ msg, onHide }) {
  useEffect(() => { const t = setTimeout(onHide, 2800); return () => clearTimeout(t); }, [onHide]);
  return (
    <>
      <style>{`@keyframes _fup{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
        background: '#111827', color: '#fff', padding: '11px 18px',
        borderRadius: '10px', fontSize: '13px', fontWeight: 600,
        boxShadow: '0 8px 28px rgba(0,0,0,.18)',
        display: 'flex', alignItems: 'center', gap: '8px',
        animation: '_fup .25s ease',
      }}>
        <span style={{ color: '#4ade80' }}>✓</span>{msg}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN APP COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function App() {
  /* ── Strict Auth Guard State ────────────────────────────── */
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  /* ── Tab Switcher State ('hub' | 'pairs' | 'exam') ──────────────── */
  const [activeTab, setActiveTab] = useState('hub');
  const [showStudentList, setShowStudentList] = useState(false);

  /* ── Group State (Strictly isolated per username) ───────── */
  const [groups,       setGroups]       = useState([]);
  const [activeGid,    setActiveGid]    = useState(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newName,      setNewName]      = useState('');
  const [newSubject,   setNewSubject]   = useState('');

  /* ── Student Data & Text State ──────────────────────────── */
  const [rawText,  setRawText]  = useState('');
  const [students, setStudents] = useState([]);

  /* ── Algorithm Settings (Pairs) ─────────────────────────── */
  const [divType,  setDivType]  = useState('mixed');
  const [weekIdx,  setWeekIdx]  = useState(0);
  const [schedule, setSchedule] = useState([]);

  /* ── SVG Template Content (Pairs) ───────────────────────── */
  const [svgTemplate, setSvgTemplate] = useState(RAW_SVG_TEMPLATE);

  /* ── Save Feedback Animation ────────────────────────────── */
  const [savedAnim, setSavedAnim] = useState(false);

  /* ── UI Feedback ────────────────────────────────────────── */
  const [toast, setToast] = useState('');

  const notify = useCallback((msg) => {
    setToast(msg); setTimeout(() => setToast(''), 2800);
  }, []);

  /* ── Load SVG Template from public/template.svg ─────────── */
  useEffect(() => {
    fetch('/template.svg')
      .then(r => r.text())
      .then(text => {
        if (text && text.includes('<svg')) {
          setSvgTemplate(text);
        }
      })
      .catch(err => {
        console.warn('Using embedded SVG template fallback:', err);
      });
  }, []);

  /* ── 1. Strict User Isolation: Load on Mount ────────────── */
  useEffect(() => {
    const sess = getSession();
    if (sess && sess.username) {
      setUser(sess);
      const userGroups = loadUserGroups(sess.username);
      if (userGroups && Array.isArray(userGroups.groups) && userGroups.groups.length > 0) {
        setGroups(userGroups.groups);
        const targetGid = userGroups.activeGid || userGroups.groups[0]?.id;
        setActiveGid(targetGid);
        setWeekIdx(userGroups.weekIdx || 0);
        setDivType(userGroups.divType || 'mixed');
        const g = userGroups.groups.find(x => x.id === targetGid);
        if (g) {
          setRawText(g.rawText || '');
          setStudents(g.students || []);
        }
      } else {
        // Absolutely clean state for this user (no foreign data)
        setGroups([]);
        setActiveGid(null);
        setRawText('');
        setStudents([]);
        setSchedule([]);
        setWeekIdx(0);
      }
    } else {
      setUser(null);
      setGroups([]);
      setActiveGid(null);
      setRawText('');
      setStudents([]);
      setSchedule([]);
      setWeekIdx(0);
    }
    setAuthLoaded(true);
  }, []);

  /* ── 2. Persist State Scoped to Current Username ────────── */
  useEffect(() => {
    if (!authLoaded || !user?.username) return;
    saveUserGroups(user.username, {
      groups,
      activeGid,
      weekIdx,
      divType,
    });
  }, [user, groups, activeGid, weekIdx, divType, authLoaded]);

  /* ── Rebuild Schedule when Students or Division Mode Changes */
  useEffect(() => {
    if (students.length < 2) {
      if (students.length === 1) {
        setSchedule([[[students[0]]]]);
      } else {
        setSchedule([]);
      }
      return;
    }
    const raw = divType === 'gendered' ? makeGenderedSchedule(students) : makeSchedule(students);
    const capped = raw.slice(0, MAX_WEEKS);
    setSchedule(capped);
    setWeekIdx(prev => Math.min(prev, Math.max(0, capped.length - 1)));
  }, [students, divType]);

  /* ── Derived Variables (Pairs) ──────────────────────────── */
  const activeGroup  = groups.find(g => g.id === activeGid) || null;
  const safeWeek     = Math.min(weekIdx, Math.max(0, schedule.length - 1));
  const currentPairs = schedule[safeWeek] || [];
  const totalWeeks   = schedule.length;

  const weekText    = `${safeWeek + 1}-апта`;
  const subjectText = activeGroup?.subject || activeGroup?.name || 'Жұптық жұмыс';

  /* ── Real-Time Dynamic SVG Generation (Pairs) ───────────── */
  const filledSvg = useMemo(() => {
    return fillSvgTemplate(svgTemplate, {
      weekText,
      subjectText,
      pairs: currentPairs,
    });
  }, [svgTemplate, weekText, subjectText, currentPairs]);

  /* ══ DEMO ONBOARDING ACTION (Scoped only to active group) ══ */
  function insertDemoData() {
    let targetGid = activeGid;
    if (!targetGid || !groups.find(g => g.id === targetGid)) {
      const demoGroup = {
        id: uid(),
        name: 'Инфо-45',
        subject: 'Информатика',
        rawText: DEMO_STUDENTS_TEXT,
        students: [],
      };
      targetGid = demoGroup.id;
      setGroups(prev => [demoGroup, ...prev.filter(g => g.id !== demoGroup.id)]);
      setActiveGid(targetGid);
    }
    setRawText(DEMO_STUDENTS_TEXT);
    const parsed = parseStudents(DEMO_STUDENTS_TEXT);
    setStudents(parsed);
    setWeekIdx(0);
    setGroups(prev => prev.map(g => g.id === targetGid ? { ...g, rawText: DEMO_STUDENTS_TEXT, students: parsed } : g));
    notify('✨ 28 оқушының демо-үлгісі сәтті қойылды!');
  }

  /* ══ GROUP ACTIONS ══════════════════════════════════════════ */
  function createGroup() {
    if (!newName.trim()) return;
    const g = {
      id: uid(),
      name: newName.trim(),
      subject: newSubject.trim(),
      rawText: '',
      students: [],
    };
    const nextGroups = [...groups, g];
    setGroups(nextGroups);
    setActiveGid(g.id);
    setNewName('');
    setNewSubject('');
    setShowNewGroup(false);
    setRawText('');
    setStudents([]);
    setWeekIdx(0);
    if (user?.username) {
      saveUserGroups(user.username, { groups: nextGroups, activeGid: g.id, weekIdx: 0, divType });
    }
    notify(`"${g.name}" тобы сәтті жасалды`);
  }

  function deleteGroup(gid) {
    if (!confirm('Топты жою керек пе?')) return;
    const next = groups.filter(g => g.id !== gid);
    setGroups(next);
    const ng = next[0] || null;
    setActiveGid(ng?.id || null);
    setRawText(ng?.rawText || '');
    setStudents(ng?.students || []);
    setWeekIdx(0);
    if (user?.username) {
      saveUserGroups(user.username, { groups: next, activeGid: ng?.id || null, weekIdx: 0, divType });
    }
  }

  function selectGroup(gid) {
    const g = groups.find(g => g.id === gid);
    if (!g) return;
    setActiveGid(gid);
    setRawText(g.rawText || '');
    setStudents(g.students || []);
    setWeekIdx(0);
  }

  /* ══ SAVE CURRENT GROUP SETTINGS (Prompt Requirement 3) ════ */
  function handleSaveCurrentGroup() {
    if (!activeGid) {
      notify('Алдымен топты таңдаңыз немесе құрыңыз');
      return;
    }
    const updated = groups.map(g => {
      if (g.id === activeGid) {
        return {
          ...g,
          rawText,
          students,
        };
      }
      return g;
    });
    setGroups(updated);
    if (user?.username) {
      saveUserGroups(user.username, {
        groups: updated,
        activeGid,
        weekIdx,
        divType,
      });
    }
    setSavedAnim(true);
    setTimeout(() => setSavedAnim(false), 2000);
    notify('Топ параметрлері сәтті сақталды ✓');
  }

  function handleSaveExamGroup(examSettings) {
    if (!activeGid) {
      notify('Алдымен топты таңдаңыз немесе құрыңыз');
      return;
    }
    const updated = groups.map(g => {
      if (g.id === activeGid) {
        return {
          ...g,
          rawText,
          students,
          examSettings: {
            ...(g.examSettings || {}),
            ...examSettings,
          },
        };
      }
      return g;
    });
    setGroups(updated);
    if (user?.username) {
      saveUserGroups(user.username, {
        groups: updated,
        activeGid,
        weekIdx,
        divType,
      });
    }
    setSavedAnim(true);
    setTimeout(() => setSavedAnim(false), 2000);
    notify('«Сабақ тапсыру» баптаулары сақталды ✓');
  }

  /* ══ STUDENT INPUT & PARSER ACTIONS ═════════════════════════ */
  function applyText(text, options = {}) {
    const parsed = parseStudents(text, options);
    setStudents(parsed);
    setWeekIdx(0);
    if (activeGid) {
      setGroups(prev => prev.map(g => g.id === activeGid ? { ...g, rawText: text, students: parsed } : g));
    }
  }

  function handleBlur(options = {}) {
    if (!rawText.trim()) return;
    const norm = normalizeText(rawText, options);
    if (norm !== rawText) {
      setRawText(norm);
      applyText(norm, options);
    }
  }

  function toggleGender(id) {
    setStudents(prev => {
      const next = prev.map(s => s.id === id
        ? { ...s, gender: s.gender === 'm' ? 'f' : s.gender === 'f' ? 'u' : 'm' }
        : s);
      if (activeGid) {
        setGroups(gs => gs.map(g => g.id === activeGid ? { ...g, students: next } : g));
      }
      return next;
    });
  }

  /* ══ EXPORT ACTIONS (Pairs) ═════════════════════════════════ */
  async function downloadPNG() {
    try {
      const fileName = `жұптық_${activeGroup?.name || 'топ'}_${safeWeek + 1}апта.png`;
      await downloadSvgAsPng(filledSvg, fileName);
      notify('PNG сурет сәтті жүктелді (2x/3x)!');
    } catch (e) {
      console.error(e);
      notify('Қате: ' + (e?.message || e));
    }
  }

  function copyTSV() {
    if (!currentPairs.length) {
      notify('Көшіретін жұптар жоқ');
      return;
    }
    // Strict TSV: {Имя1}\t{Телефон1}\t{Имя2}\t{Телефон2}
    // For odd lone student: {Имя}\t{Телефон}\t\t
    navigator.clipboard.writeText(pairsToTSV(currentPairs))
      .then(() => notify('Excel / Google Таблица үшін көшірілді! (Ctrl+V → 4 бағана)'))
      .catch(() => notify('Көшіру қатесі орын алды'));
  }

  function copyWhatsApp() {
    if (!currentPairs.length) {
      notify('Көшіретін жұптар жоқ');
      return;
    }
    const cleanWeek = (weekText || `${safeWeek + 1}-АПТА`).toUpperCase();
    const groupTitle = activeGroup?.name ? activeGroup.name : 'Топ';
    const subjTitle = activeGroup?.subject ? activeGroup.subject : 'Жұптық жұмыс';

    let text = `📢 ${cleanWeek} • ЖҰПТЫҚ ЖҰМЫС (${subjTitle})\n👥 Топ: ${groupTitle}\n\n`;

    let count = 1;
    currentPairs.forEach((pair) => {
      if (!pair || pair.length === 0) return;
      if (pair.length === 1) {
        text += `${count}. ${pair[0].name}\n`;
      } else {
        text += `${count}. ${pair[0].name} — ${pair[1].name}\n`;
      }
      count++;
    });

    navigator.clipboard.writeText(text.trim())
      .then(() => notify('WhatsApp мәтіні көшірілді! ✓'))
      .catch(() => notify('Көшіру қатесі орын алды'));
  }

  /* ══ AUTH HANDLERS (Strict Isolation) ═══════════════════════ */
  function handleAuth(u) {
    setUser(u);
    setActiveTab('hub');
    if (u && u.username) {
      const userGroups = loadUserGroups(u.username);
      if (userGroups && Array.isArray(userGroups.groups) && userGroups.groups.length > 0) {
        setGroups(userGroups.groups);
        const targetGid = userGroups.activeGid || userGroups.groups[0]?.id;
        setActiveGid(targetGid);
        setWeekIdx(userGroups.weekIdx || 0);
        setDivType(userGroups.divType || 'mixed');
        const g = userGroups.groups.find(x => x.id === targetGid);
        if (g) {
          setRawText(g.rawText || '');
          setStudents(g.students || []);
        }
      } else {
        // Absolutely clean state for a new curator (Prompt requirement 1)
        setGroups([]);
        setActiveGid(null);
        setRawText('');
        setStudents([]);
        setSchedule([]);
        setWeekIdx(0);
        setDivType('mixed');
      }
      notify(`Қош келдіңіз, ${u.username}!`);
    }
  }

  function logout() {
    clearSession();
    setUser(null);
    // Completely clear all app state upon logout (Prompt requirement 1)
    setGroups([]);
    setActiveGid(null);
    setRawText('');
    setStudents([]);
    setSchedule([]);
    setWeekIdx(0);
    setDivType('mixed');
    setNewName('');
    setNewSubject('');
    setShowNewGroup(false);
    notify('Шықтыңыз');
  }

  /* ══════════════════════════════════════════════════════════════
     STRICT AUTH GUARD: IF NOT LOGGED IN, RENDER ONLY AUTH FORM
     ══════════════════════════════════════════════════════════════ */
  if (authLoaded && !user) {
    return (
      <>
        <AuthPanel onAuth={handleAuth} />
        {toast && <Toast msg={toast} onHide={() => setToast('')} />}
      </>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     AUTHENTICATED WORKSPACE
     ══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

      {/* ══ TOP BAR: LOGO, TWO TABS, USERNAME & LOGOUT ONLY ═════ */}
      <header style={{
        height: '56px', background: '#fff',
        borderBottom: '1.5px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', flexShrink: 0, zIndex: 10,
      }}>
        {/* Brand & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => setActiveTab('hub')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
            title="Басты мәзірге өту"
          >
            <span style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px', color: '#111827' }}>
              info<span style={{ color: BRAND }}>Logia</span>
            </span>
            <span style={{
              fontSize: '11px', fontWeight: 800, color: BRAND,
              background: '#eef1fb', padding: '2px 8px', borderRadius: '6px',
              marginLeft: '4px'
            }}>
              Куратор сайты
            </span>
          </div>
          <div style={{ width: '1px', height: '18px', background: '#e5e7eb' }} />

          {/* Navigation Controls: If in workspace, show «← Басты мәзірге» and 2 Tabs */}
          {activeTab !== 'hub' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('hub')}
                style={{
                  padding: '6px 12px', borderRadius: '8px',
                  border: '1.5px solid #e2e8f0', background: '#ffffff',
                  fontSize: '12px', fontWeight: 700, color: '#475569',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
              >
                ← Басты мәзірге
              </button>

              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', gap: '3px' }}>
                <button
                  onClick={() => setActiveTab('pairs')}
                  style={{
                    padding: '6px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 700, transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: activeTab === 'pairs' ? '#fff' : 'transparent',
                    color: activeTab === 'pairs' ? BRAND : '#6b7280',
                    boxShadow: activeTab === 'pairs' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <Users size={14} /> Жұптық жұмыс
                </button>
                <button
                  onClick={() => setActiveTab('exam')}
                  style={{
                    padding: '6px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 700, transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: activeTab === 'exam' ? '#fff' : 'transparent',
                    color: activeTab === 'exam' ? '#E52E2E' : '#6b7280',
                    boxShadow: activeTab === 'exam' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <Clock size={14} /> Сабақ тапсыру
                </button>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              Басты мәзір • Модуль таңдау
            </span>
          )}
        </div>

        {/* User Auth Info & Logout Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              padding: '5px 12px', borderRadius: '8px'
            }}>
              <User size={13} color={BRAND} />
              <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 700 }}>
                {user.username}
              </span>
            </div>
          )}
          <Btn variant="ghost" size="sm" onClick={logout}>
            <LogOut size={13} />Шығу
          </Btn>
        </div>
      </header>

      {/* ══ WORKSPACE CONTENT: HUB vs TAB 1 vs TAB 2 ════════════ */}
      {activeTab === 'hub' ? (
        /* ════ HUB / DASHBOARD SCREEN ═══════════════════════════ */
        <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
          <div style={{ width: '100%', maxWidth: '980px', display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Header Hero */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#eef1fb', border: '1px solid #c7d5f8',
                borderRadius: '999px', padding: '5px 16px',
                fontSize: '12.5px', fontWeight: 800, color: BRAND
              }}>
                <Sparkles size={14} /> infoLogia • Куратордың жеке кабинеті
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                Жұмыс жасау үшін қажетті модульді таңдаңыз
              </h1>
              <p style={{ fontSize: '15px', color: '#64748b', margin: 0, maxWidth: '640px' }}>
                Қош келдіңіз, <strong style={{ color: '#1e293b' }}>{user?.username}</strong>! Барлық топтар мен деректер логиніңізге сәйкес сақталады.
              </p>
            </div>

            {/* Two Large Interactive Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              
              {/* Card 1: ЖҰПТЫҚ ЖҰМЫС (Blue #1D3597) */}
              <div
                onClick={() => setActiveTab('pairs')}
                style={{
                  background: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '32px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '24px',
                  cursor: 'pointer',
                  transition: 'all .2s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = BRAND;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 14px 34px rgba(29, 53, 151, 0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.04)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px',
                      background: '#eef1fb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: BRAND
                    }}>
                      <Users size={26} />
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, color: BRAND,
                      background: '#eef1fb', padding: '4px 10px', borderRadius: '6px'
                    }}>
                      16 АПТАЛЫҚ КАРУСЕЛЬ
                    </span>
                  </div>

                  <div>
                    <h2 style={{ fontSize: '21px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
                      ЖҰПТЫҚ ЖҰМЫС
                    </h2>
                    <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                      Сыныпты 16 аптаға қайталанбайтын жұптарға бөлу, карусель алгоритмі және дайын Canva SVG/PNG постері.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <Check size={16} color={BRAND} /> 16 апталық автоматты карусель алгоритмі
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <Check size={16} color={BRAND} /> Ұл-қыз және аралас бөлу режимдері
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <Check size={16} color={BRAND} /> Тақ (29-шы) оқушыны автоматты теңестіру
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <Check size={16} color={BRAND} /> PNG постер және WhatsApp мәтінін көшіру
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: BRAND,
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(29, 53, 151, 0.25)',
                    transition: 'all .15s',
                  }}
                >
                  Генераторға кіру →
                </button>
              </div>

              {/* Card 2: САБАҚ ТАПСЫРУ (Red #E52E2E) */}
              <div
                onClick={() => setActiveTab('exam')}
                style={{
                  background: '#ffffff',
                  border: '2px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '32px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '24px',
                  cursor: 'pointer',
                  transition: 'all .2s ease',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#E52E2E';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 14px 34px rgba(229, 46, 46, 0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.04)';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '14px',
                      background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#E52E2E'
                    }}>
                      <Clock size={26} />
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, color: '#E52E2E',
                      background: '#fef2f2', padding: '4px 10px', borderRadius: '6px'
                    }}>
                      16 СЛОТТЫҚ КЕСТЕ
                    </span>
                  </div>

                  <div>
                    <h2 style={{ fontSize: '21px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
                      САБАҚ ТАПСЫРУ
                    </h2>
                    <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                      16 слотты сабақ және емтихан тапсыру кестесі, қос даталар мен уақыт аралықтарын автоматты реттеу және template2.svg постері.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <Check size={16} color="#E52E2E" /> 16 слоттық құрылым (әрқайсысында 2 оқушы)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <Check size={16} color="#E52E2E" /> Бір күнде қатарынан немесе екі күнге бөлу
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <Check size={16} color="#E52E2E" /> 10, 15, 20 минуттық автоматты уақыт есебі
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <Check size={16} color="#E52E2E" /> PNG сурет және WhatsApp кестесін көшіру
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '13px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#E52E2E',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(229, 46, 46, 0.25)',
                    transition: 'all .15s',
                  }}
                >
                  Кесте құруға өту →
                </button>
              </div>

            </div>

          </div>
        </div>
      ) : activeTab === 'pairs' ? (
        /* ════ TAB 1: «ЖҰПТЫҚ ЖҰМЫС» PAIRS GENERATOR ═══════════ */
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ════ LEFT PANEL: Settings & Student List ═══════════ */}
          <aside style={{
            width: '360px', flexShrink: 0,
            background: '#fff', borderRight: '1.5px solid #e5e7eb',
            overflowY: 'auto', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '18px',
          }}>

            {/* 1 · Save Button (Prominent with visual confirmation) */}
            <section>
              <button
                type="button"
                onClick={handleSaveCurrentGroup}
                style={{
                  width: '100%',
                  background: savedAnim ? '#059669' : BRAND,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '11px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all .2s ease',
                  boxShadow: savedAnim ? '0 4px 14px rgba(5,150,105,0.3)' : '0 4px 14px rgba(29,53,151,0.2)',
                }}
              >
                {savedAnim ? (
                  <>
                    <Check size={16} /> Сақталды ✓
                  </>
                ) : (
                  '💾 Өзгерістерді сақтау'
                )}
              </button>
            </section>

            {/* 2 · Group Selector */}
            <section>
              <FieldLabel>ТАҢДАЛҒАН ТОП</FieldLabel>
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={activeGid || ''}
                  onChange={e => e.target.value && selectGroup(e.target.value)}
                  style={{
                    flex: 1, border: '1.5px solid #e5e7eb', borderRadius: '8px',
                    padding: '8px 10px', fontSize: '13px', color: '#111827',
                    background: '#fff', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {!groups.length && <option value="">Топ жоқ — жаңасын жасаңыз</option>}
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}{g.subject ? ` — ${g.subject}` : ''}</option>
                  ))}
                </select>
                <Btn size="sm" onClick={() => setShowNewGroup(v => !v)}><Plus size={14} /></Btn>
                {activeGid && (
                  <Btn size="sm" variant="danger" onClick={() => deleteGroup(activeGid)}><Trash2 size={13} /></Btn>
                )}
              </div>

              {showNewGroup && (
                <div style={{
                  marginTop: '10px', background: '#f8fafc',
                  border: '1.5px solid #e5e7eb', borderRadius: '10px',
                  padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                  <div>
                    <FieldLabel>ТОП АТЫ</FieldLabel>
                    <StyledInput value={newName} onChange={e => setNewName(e.target.value)} placeholder='Мыс: "Инфо-45"' />
                  </div>
                  <div>
                    <FieldLabel>ПӘНІ</FieldLabel>
                    <StyledInput value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder='Мыс: "Математика"' />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Btn onClick={createGroup} sx={{ flex: 1 }}>Жасау</Btn>
                    <Btn variant="ghost" onClick={() => setShowNewGroup(false)}>Бас тарту</Btn>
                  </div>
                </div>
              )}
            </section>

            {/* 3 · Student List (Accordion) */}
            <section>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowStudentList(v => !v)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #e2e8f0',
                    background: showStudentList ? '#f1f5f9' : '#ffffff',
                    color: '#1e293b',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>👥 Оқушылар тізімін көру / өзгерту ({students.length})</span>
                    {students.length > 0 && (
                      <span style={{
                        fontSize: '10px',
                        color: students.length % 2 !== 0 ? '#b45309' : '#15803d',
                        background: students.length % 2 !== 0 ? '#fef3c7' : '#dcfce7',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        fontWeight: 700
                      }}>
                        {students.length % 2 !== 0 ? 'тақ ⚡' : 'жұп ✓'}
                      </span>
                    )}
                  </span>
                  <span style={{ color: BRAND, fontSize: '13px', fontWeight: 800 }}>
                    {showStudentList ? '▴' : '▾'}
                  </span>
                </button>

                {showStudentList && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={insertDemoData}
                        title="28 оқушының демо-тізімін қою"
                        style={{
                          background: '#eef1fb', border: '1px solid #c7d5f8',
                          color: BRAND, borderRadius: '6px', padding: '2px 8px',
                          fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          transition: 'all .15s'
                        }}
                      >
                        ✨ Үлгіні қою
                      </button>
                    </div>
                    <textarea
                      value={rawText}
                      onChange={e => { setRawText(e.target.value); applyText(e.target.value); }}
                      onBlur={handleBlur}
                      placeholder={
                        'Тізімді кез-келген форматта қойыңыз:\n\n' +
                        'Болатұлы Нұрдәулет 87754615707\n' +
                        'Еркинжан Каусар 87086898257\n\n' +
                        'Немесе сплошной мәтінмен:\n' +
                        'Болатұлы Нұрдәулет87754615707Еркинжан Каусар87086898257...\n\n' +
                        'Немесе «Үлгіні қою» батырмасын басыңыз!'
                      }
                      style={{
                        width: '100%', minHeight: '160px',
                        border: '1.5px solid #e5e7eb', borderRadius: '8px',
                        padding: '10px 12px', fontSize: '12px', color: '#111827',
                        background: '#fff', fontFamily: 'monospace',
                        lineHeight: '1.7', resize: 'vertical', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = BRAND}
                    />
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '3px', lineHeight: 1.5 }}>
                      Сплошной мәтінді де автоматты таниды. Поледен шыққанда тізім автоматты реттеледі.
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 4 · Division Type */}
            <section>
              <FieldLabel>БӨЛУ ТҮРІ</FieldLabel>
              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                {[['mixed', '🔀 Бәрі аралас'], ['gendered', '👫 Жынысы бойынша']].map(([v, l]) => (
                  <button key={v} onClick={() => setDivType(v)} style={{
                    flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none',
                    cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: 'all .15s',
                    background: divType === v ? '#fff' : 'transparent',
                    color: divType === v ? BRAND : '#6b7280',
                    boxShadow: divType === v ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                  }}>{l}</button>
                ))}
              </div>
            </section>

            {/* 5 · Gender Manual Tagging */}
            {divType === 'gendered' && students.length > 0 && (
              <section style={{
                background: '#f8fafc', border: '1.5px solid #e5e7eb',
                borderRadius: '10px', padding: '12px',
              }}>
                <FieldLabel>ЖЫНЫС БЕЛГІСІ (басу арқылы өзгерту)</FieldLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                  {students.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => toggleGender(s.id)} style={{
                        width: '26px', height: '22px', border: '1.5px solid',
                        borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 800,
                        flexShrink: 0, transition: 'all .12s',
                        background: s.gender === 'm' ? '#eff6ff' : s.gender === 'f' ? '#fdf2f8' : '#f9fafb',
                        borderColor: s.gender === 'm' ? '#93c5fd' : s.gender === 'f' ? '#f9a8d4' : '#e5e7eb',
                        color: s.gender === 'm' ? BRAND : s.gender === 'f' ? '#db2777' : '#9ca3af',
                      }}>
                        {s.gender === 'm' ? '♂' : s.gender === 'f' ? '♀' : '?'}
                      </button>
                      <span style={{ fontSize: '12px', color: '#374151', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.name}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 6 · Week Selector Buttons (1 to 16) */}
            {totalWeeks > 0 && (
              <section>
                <FieldLabel>АПТА ТАҢДАУ (1–{totalWeeks})</FieldLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {Array.from({ length: totalWeeks }, (_, i) => (
                    <button key={i} onClick={() => setWeekIdx(i)} style={{
                      padding: '5px 10px', borderRadius: '999px',
                      fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${i === safeWeek ? BRAND : '#e5e7eb'}`,
                      background: i === safeWeek ? BRAND : '#fff',
                      color: i === safeWeek ? '#fff' : '#6b7280',
                      transition: 'all .12s',
                    }}>{i + 1}</button>
                  ))}
                </div>
              </section>
            )}

            {/* 7 · «Менің топтарым» Section (Current curator's groups) */}
            <section style={{ borderTop: '1.5px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <FieldLabel>МЕНІҢ ТОПТАРЫМ ({groups.length})</FieldLabel>
                <button
                  onClick={() => setShowNewGroup(true)}
                  style={{ background: 'none', border: 'none', color: BRAND, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                >
                  + Жаңа топ
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {groups.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
                    Әзірге сақталған топ жоқ
                  </div>
                ) : (
                  groups.map(g => {
                    const isActive = g.id === activeGid;
                    return (
                      <div
                        key={g.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '9px',
                          border: `1.5px solid ${isActive ? BRAND : '#e2e8f0'}`,
                          background: isActive ? '#f8faff' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all .15s',
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: isActive ? BRAND : '#1e293b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {g.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {g.subject ? `${g.subject} • ` : ''}{g.students?.length || 0} оқушы
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => selectGroup(g.id)}
                              style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: BRAND,
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Ашу
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteGroup(g.id)}
                            title="Топты жою"
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              color: '#dc2626',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Жою
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </aside>

          {/* ════ RIGHT PANEL: Real-Time Canva SVG Live Poster ════ */}
          <main style={{
            flex: 1, overflowY: 'auto', background: '#f1f5f9',
            padding: '24px', display: 'flex', flexDirection: 'column',
            gap: '14px', alignItems: 'center',
          }}>

            {/* Onboarding block for colleagues when list or group is empty */}
            {(!activeGid || !rawText.trim() || students.length === 0) && (
              <div style={{
                width: '100%', maxWidth: '1020px',
                background: '#ffffff', border: '1.5px solid #dbeafe', borderRadius: '14px',
                padding: '18px 22px',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
                boxShadow: '0 2px 12px rgba(29,53,151,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: '#eef1fb', color: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
                      infoLogia • Куратор көмекшісі
                    </div>
                    <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, fontWeight: 500 }}>
                      <div>1. Жаңа топ құрыңыз немесе таңдаңыз</div>
                      <div>2. Оқушылар тізімін сплошной мәтін ретінде қойыңыз</div>
                      <div>3. Аптасын таңдап, дайын постерді PNG түрінде жүктеп алыңыз</div>
                    </div>
                  </div>
                </div>
                <Btn variant="primary" size="sm" onClick={insertDemoData} sx={{ flexShrink: 0, padding: '8px 14px' }}>
                  ✨ Үлгіні қою (Демо 28 оқушы)
                </Btn>
              </div>
            )}

            {/* Action Toolbar */}
            <div style={{ width: '100%', maxWidth: '1020px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* 1. Download PNG (Green) */}
              <Btn variant="success" onClick={downloadPNG}>
                <Download size={14} />Суретті жүктеу (PNG)
              </Btn>

              {/* 2. Copy WhatsApp text */}
              <Btn variant="ghost" onClick={copyWhatsApp}>
                💬 WhatsApp мәтінін көшіру
              </Btn>

              {/* 3. Copy TSV for Excel (White) */}
              <Btn variant="ghost" onClick={copyTSV}>
                <Copy size={14} />Тізімді көшіру (Excel)
              </Btn>

              <div style={{ flex: 1 }} />

              {/* Week navigation arrows */}
              {totalWeeks > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => setWeekIdx(Math.max(0, safeWeek - 1))}
                    disabled={safeWeek === 0}
                    style={{
                      width: '30px', height: '30px', border: '1.5px solid #e5e7eb',
                      borderRadius: '7px', background: '#fff', fontSize: '12px',
                      cursor: safeWeek === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: safeWeek === 0 ? '#d1d5db' : '#374151',
                    }}>◀</button>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#374151', padding: '0 8px', whiteSpace: 'nowrap' }}>
                    {safeWeek + 1}-апта / {totalWeeks}
                  </span>
                  <button
                    onClick={() => setWeekIdx(Math.min(totalWeeks - 1, safeWeek + 1))}
                    disabled={safeWeek === totalWeeks - 1}
                    style={{
                      width: '30px', height: '30px', border: '1.5px solid #e5e7eb',
                      borderRadius: '7px', background: '#fff', fontSize: '12px',
                      cursor: safeWeek === totalWeeks - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: safeWeek === totalWeeks - 1 ? '#d1d5db' : '#374151',
                    }}>▶</button>
                </div>
              )}
            </div>

            {/* SVG Live Poster Preview */}
            <div style={{ width: '100%', maxWidth: '1020px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Poster svgString={filledSvg} />
            </div>
          </main>
        </div>
      ) : (
        /* ════ TAB 2: «САБАҚ ТАПСЫРУ» EXAM SCHEDULER ═══════════ */
        <ExamScheduler
          groups={groups}
          activeGid={activeGid}
          selectGroup={selectGroup}
          createGroup={createGroup}
          deleteGroup={deleteGroup}
          newName={newName}
          setNewName={setNewName}
          newSubject={newSubject}
          setNewSubject={setNewSubject}
          showNewGroup={showNewGroup}
          setShowNewGroup={setShowNewGroup}
          students={students}
          rawText={rawText}
          setRawText={setRawText}
          applyText={applyText}
          handleBlur={handleBlur}
          insertDemoData={insertDemoData}
          activeGroup={activeGroup}
          onSaveGroup={handleSaveExamGroup}
          savedAnim={savedAnim}
          notify={notify}
        />
      )}

      {/* Toast Notification */}
      {toast && <Toast msg={toast} onHide={() => setToast('')} />}
    </div>
  );
}
