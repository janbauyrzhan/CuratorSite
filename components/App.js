'use client';

/* ══════════════════════════════════════════════════════════════════════════
   infoLogia • Куратор сайты
   Split-Screen SPA with Strict Auth Guard & Strict User-Scoped Data Isolation:
   1. «Жұптық жұмыс» (Pairs Carousel Generator with template.svg)
   2. «Сабақ тапсыру» (Exam Schedule with template2.svg)
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Download, Copy, LogOut, Sparkles, Users, Clock, Check, User, ArrowLeftRight, Shuffle
} from 'lucide-react';
import AuthPanel     from './AuthPanel';
import Poster        from './Poster';
import ExamScheduler from './ExamScheduler';
import {
  uid, makeSchedule, makeGenderedSchedule,
  parseStudents, normalizeText, normalizeGender,
  getLegacyWorkspaces, clearLegacyCredentials,
  pairsToTSV,
} from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabaseClient';
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
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [legacyWorkspaces, setLegacyWorkspaces] = useState([]);
  const [legacyImportId, setLegacyImportId] = useState('');
  const [syncState, setSyncState] = useState('saved');
  const hydrationId = useRef(0);
  const supabase = useMemo(() => getSupabaseClient(), []);

  /* ── Tab Switcher State ('hub' | 'pairs' | 'exam') ──────────────── */
  const [activeTab, setActiveTab] = useState('hub');
  const [showStudentList, setShowStudentList] = useState(false);

  /* ── Group State (Strictly isolated per username) ───────── */
  const [groups,       setGroups]       = useState([]);
  const [activeGid,    setActiveGid]    = useState(null);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newName,      setNewName]      = useState('');
  const [newSubject,   setNewSubject]   = useState('');

  /* ── «Жұптық жұмыс» Student Data (ФИО + телефон) ───────── */
  const [rawTextPairs,     setRawTextPairs]     = useState('');
  const [studentsPairs,    setStudentsPairs]    = useState([]);
  const [customPairsOrder, setCustomPairsOrder] = useState(null);

  /* ── «Сабақ тапсыру» Student Data (ТОЛЬКО ФИО) ──────────── */
  const [rawTextExam,  setRawTextExam]  = useState('');
  const [studentsExam, setStudentsExam] = useState([]);

  /* ── Algorithm Settings (Pairs) ─────────────────────────── */
  const [divType,        setDivType]        = useState('mixed');
  const [weekIdx,        setWeekIdx]        = useState(0);
  const [schedule,       setSchedule]       = useState([]);
  const [pairOverrides,  setPairOverrides]  = useState({});
  const [showSwapModal,  setShowSwapModal]  = useState(false);
  const [swapStudentA,   setSwapStudentA]   = useState('');
  const [swapStudentB,   setSwapStudentB]   = useState('');

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

  const resetWorkspace = useCallback(() => {
    setGroups([]); setActiveGid(null); setRawTextPairs(''); setStudentsPairs([]);
    setCustomPairsOrder(null); setRawTextExam(''); setStudentsExam([]);
    setSchedule([]); setPairOverrides({}); setWeekIdx(0); setDivType('mixed');
  }, []);

  const hydrateWorkspace = useCallback(async (authUser) => {
    const requestId = ++hydrationId.current;
    setWorkspaceLoaded(false);
    setWorkspaceError('');
    const { data, error } = await supabase
      .from('user_workspaces')
      .select('data')
      .eq('user_id', authUser.id)
      .maybeSingle();
    if (requestId !== hydrationId.current) return;
    if (error) {
      setWorkspaceError(error.message || 'Cloud деректерін жүктеу мүмкін болмады.');
      setWorkspaceLoaded(false);
      return;
    }

    const workspace = data?.data || null;
    const savedGroups = Array.isArray(workspace?.groups) ? workspace.groups : [];
    setUser({ id: authUser.id, email: authUser.email, username: authUser.email?.split('@')[0] || 'Куратор' });
    setGroups(savedGroups);
    const selectedGid = workspace?.activeGid || savedGroups[0]?.id || null;
    setActiveGid(selectedGid);
    setWeekIdx(workspace?.weekIdx || 0);
    setDivType(workspace?.divType || 'mixed');

    const selectedGroup = savedGroups.find(g => g.id === selectedGid);
    setRawTextPairs(selectedGroup?.rawTextPairs || '');
    setStudentsPairs(selectedGroup?.students_pairs || []);
    setCustomPairsOrder(selectedGroup?.customPairsOrder || null);
    setRawTextExam(selectedGroup?.rawTextExam || '');
    setStudentsExam(selectedGroup?.students_exam || []);
    setPairOverrides(selectedGroup?.pairOverrides || {});

    const localCopies = getLegacyWorkspaces();
    setLegacyWorkspaces(savedGroups.length === 0 ? localCopies : []);
    setLegacyImportId(savedGroups.length === 0 ? (localCopies[0]?.username || '') : '');
    clearLegacyCredentials();
    setWorkspaceLoaded(true);
    setSyncState(data ? 'saved' : 'saving');
  }, [supabase]);

  /* ── Supabase Auth session and cloud workspace ──────────── */
  useEffect(() => {
    if (!supabase) {
      setAuthLoaded(true);
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(() => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
          if (session?.user) {
            setRecoveryMode(event === 'PASSWORD_RECOVERY');
            void hydrateWorkspace(session.user).then(() => setAuthLoaded(true));
          } else {
            hydrationId.current++;
            setUser(null); setWorkspaceLoaded(false); setWorkspaceError('');
            resetWorkspace(); setAuthLoaded(true);
          }
        } else if (event === 'SIGNED_OUT') {
          hydrationId.current++;
          setUser(null); setWorkspaceLoaded(false); setWorkspaceError('');
          setRecoveryMode(false); setLegacyWorkspaces([]); resetWorkspace(); setAuthLoaded(true);
        }
      }, 0);
    });
    return () => subscription.unsubscribe();
  }, [supabase, hydrateWorkspace, resetWorkspace]);

  /* ── Persist cloud workspace after edits ────────────────── */
  useEffect(() => {
    if (!supabase || !user?.id || !workspaceLoaded || workspaceError) return;
    const data = { groups, activeGid, weekIdx, divType };
    const timer = setTimeout(async () => {
      setSyncState('saving');
      const { error } = await supabase.from('user_workspaces').upsert({
        user_id: user.id,
        data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) {
        setSyncState('error');
        notify('Cloud-қа сақтау қатесі: ' + (error.message || 'Қайта көріңіз'));
      } else {
        setSyncState('saved');
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [supabase, user, groups, activeGid, weekIdx, divType, workspaceLoaded, workspaceError, notify]);

  /* ── Rebuild Schedule when Pairs Students or Division Mode Changes */
  const orderedStudentsPairs = useMemo(() => {
    if (!customPairsOrder || customPairsOrder.length === 0) return studentsPairs;
    const map = new Map(studentsPairs.map(s => [s.id, s]));
    const ordered = customPairsOrder.map(id => map.get(id)).filter(Boolean);
    const remaining = studentsPairs.filter(s => !customPairsOrder.includes(s.id));
    return [...ordered, ...remaining];
  }, [studentsPairs, customPairsOrder]);

  useEffect(() => {
    if (orderedStudentsPairs.length < 2) {
      if (orderedStudentsPairs.length === 1) {
        setSchedule([[[orderedStudentsPairs[0]]]]);
      } else {
        setSchedule([]);
      }
      return;
    }
    const raw = divType === 'gendered' ? makeGenderedSchedule(orderedStudentsPairs) : makeSchedule(orderedStudentsPairs);
    const capped = raw.slice(0, MAX_WEEKS);
    setSchedule(capped);
    setWeekIdx(prev => Math.min(prev, Math.max(0, capped.length - 1)));
  }, [orderedStudentsPairs, divType]);

  /* ── Derived Variables (Pairs) ──────────────────────────── */
  const activeGroup  = groups.find(g => g.id === activeGid) || null;
  const safeWeek     = Math.min(weekIdx, Math.max(0, schedule.length - 1));
  const weekOverride = pairOverrides[safeWeek];
  const currentPairs = (weekOverride && weekOverride.length > 0) ? weekOverride : (schedule[safeWeek] || []);
  const totalWeeks   = schedule.length;

  const weekText    = `${safeWeek + 1}-апта`;
  const subjectText = activeGroup?.subject || activeGroup?.name || 'Жұптық жұмыс';

  /* ── Options for Student Swapping ───────────────────────── */
  const swapOptions = useMemo(() => {
    const list = [];
    currentPairs.forEach((pair, rIdx) => {
      if (pair[0] && pair[0].id !== '__bye__') {
        list.push({
          id: pair[0].id,
          label: `${rIdx + 1}-жұп (1): ${pair[0].name}`,
          name: pair[0].name,
        });
      }
      if (pair[1] && pair[1].id !== '__bye__') {
        list.push({
          id: pair[1].id,
          label: `${rIdx + 1}-жұп (2): ${pair[1].name}`,
          name: pair[1].name,
        });
      }
    });
    return list;
  }, [currentPairs]);

  /* ── Real-Time Dynamic SVG Generation (Pairs) ───────────── */
  const filledSvg = useMemo(() => {
    return fillSvgTemplate(svgTemplate, {
      weekText,
      subjectText,
      pairs: currentPairs,
    });
  }, [svgTemplate, weekText, subjectText, currentPairs]);

  /* ══ DEMO ONBOARDING ACTION (Pairs only, scoped to active group) ══ */
  function insertDemoData() {
    let targetGid = activeGid;
    if (!targetGid || !groups.find(g => g.id === targetGid)) {
      const demoGroup = {
        id: uid(),
        name: 'Инфо-45',
        subject: 'Информатика',
        rawTextPairs: DEMO_STUDENTS_TEXT,
        students_pairs: [],
        customPairsOrder: null,
        genderMap: {},
        pairOverrides: {},
        rawTextExam: '',
        students_exam: [],
      };
      targetGid = demoGroup.id;
      setGroups(prev => [demoGroup, ...prev.filter(g => g.id !== demoGroup.id)]);
      setActiveGid(targetGid);
    }
    setRawTextPairs(DEMO_STUDENTS_TEXT);
    const parsed = parseStudents(DEMO_STUDENTS_TEXT); // with phones for pairs
    const gMap = {};
    parsed.forEach(s => { gMap[s.name.trim().toLowerCase()] = normalizeGender(s.gender); });
    setStudentsPairs(parsed);
    setCustomPairsOrder(null);
    setPairOverrides({});
    setWeekIdx(0);
    setGroups(prev => prev.map(g => g.id === targetGid
      ? { ...g, rawTextPairs: DEMO_STUDENTS_TEXT, students_pairs: parsed, customPairsOrder: null, genderMap: gMap, pairOverrides: {} }
      : g
    ));
    notify('✨ 28 оқушының демо-үлгісі сәтті қойылды!');
  }

  /* ══ GROUP ACTIONS ══════════════════════════════════════════ */
  function createGroup() {
    if (!newName.trim()) return;
    const g = {
      id: uid(),
      name: newName.trim(),
      subject: newSubject.trim(),
      rawTextPairs: '',
      students_pairs: [],
      customPairsOrder: null,
      genderMap: {},
      pairOverrides: {},
      rawTextExam: '',
      students_exam: [],
    };
    const nextGroups = [...groups, g];
    setGroups(nextGroups);
    setActiveGid(g.id);
    setNewName('');
    setNewSubject('');
    setShowNewGroup(false);
    setRawTextPairs('');
    setStudentsPairs([]);
    setCustomPairsOrder(null);
    setPairOverrides({});
    setRawTextExam('');
    setStudentsExam([]);
    setWeekIdx(0);
    notify(`"${g.name}" тобы сәтті жасалды`);
  }

  function deleteGroup(gid) {
    if (!confirm('Топты жою керек пе?')) return;
    const next = groups.filter(g => g.id !== gid);
    setGroups(next);
    const ng = next[0] || null;
    setActiveGid(ng?.id || null);
    setRawTextPairs(ng?.rawTextPairs || '');
    setStudentsPairs(ng?.students_pairs || []);
    setPairOverrides(ng?.pairOverrides || {});
    setRawTextExam(ng?.rawTextExam || '');
    setStudentsExam(ng?.students_exam || []);
    setWeekIdx(0);
  }

  function selectGroup(gid) {
    const g = groups.find(g => g.id === gid);
    if (!g) return;
    setActiveGid(gid);
    // Load INDEPENDENT lists for each tab
    setRawTextPairs(g.rawTextPairs || '');
    setStudentsPairs(g.students_pairs || []);
    setCustomPairsOrder(g.customPairsOrder || null);
    setRawTextExam(g.rawTextExam || '');
    setStudentsExam(g.students_exam || []);
    setPairOverrides(g.pairOverrides || {});
    setWeekIdx(0);
    setShowSwapModal(false);
  }

  /* ══ SAVE «ЖҰПТЫҚ ЖҰМЫС» SETTINGS ONLY ════════════════════ */
  function handleSaveCurrentGroup() {
    if (!activeGid) {
      notify('Алдымен топты таңдаңыз немесе құрыңыз');
      return;
    }
    const currentGroup = groups.find(g => g.id === activeGid);
    const updatedMap = { ...(currentGroup?.genderMap || {}) };
    studentsPairs.forEach(s => {
      if (s.name) updatedMap[s.name.trim().toLowerCase()] = normalizeGender(s.gender);
    });

    const updated = groups.map(g => {
      if (g.id === activeGid) {
        return {
          ...g,
          rawTextPairs,
          students_pairs: orderedStudentsPairs,
          customPairsOrder: customPairsOrder || null,
          genderMap: updatedMap,
          pairOverrides,
          // students_exam and rawTextExam are NOT touched here
        };
      }
      return g;
    });
    setGroups(updated);
    setSavedAnim(true);
    setTimeout(() => setSavedAnim(false), 2000);
    notify('Жұптық жұмыс деректері сақталды ✓');
  }

  /* ══ SAVE «САБАҚ ТАПСЫРУ» SETTINGS ONLY ════════════════════ */
  function handleSaveExamGroup(examSettings) {
    if (!activeGid) {
      notify('Алдымен топты таңдаңыз немесе құрыңыз');
      return;
    }
    const updated = groups.map(g => {
      if (g.id === activeGid) {
        return {
          ...g,
          rawTextExam,
          students_exam: studentsExam,
          // rawTextPairs and students_pairs are NOT touched here
          examSettings: {
            ...(g.examSettings || {}),
            ...examSettings,
          },
        };
      }
      return g;
    });
    setGroups(updated);
    setSavedAnim(true);
    setTimeout(() => setSavedAnim(false), 2000);
    notify('«Сабақ тапсыру» баптаулары сақталды ✓');
  }

  /* ══ PAIRS STUDENT INPUT & PARSER ═══════════════════════════ */
  // Парсер извлекает ФИО + телефон (для жұптық жұмыс)
  function applyTextPairs(text) {
    const currentGroup = groups.find(g => g.id === activeGid);
    const existingGenders = { ...(currentGroup?.genderMap || {}) };
    studentsPairs.forEach(s => {
      if (s.name && s.gender) {
        existingGenders[s.name.trim().toLowerCase()] = normalizeGender(s.gender);
      }
    });

    const parsed = parseStudents(text, { existingGenders }); // phones kept, genders preserved
    setStudentsPairs(parsed);
    setCustomPairsOrder(null);
    setWeekIdx(0);
    setPairOverrides({});

    if (activeGid) {
      const updatedMap = { ...existingGenders };
      parsed.forEach(s => {
        updatedMap[s.name.trim().toLowerCase()] = normalizeGender(s.gender);
      });
      setGroups(prev => prev.map(g => g.id === activeGid
        ? { ...g, rawTextPairs: text, students_pairs: parsed, customPairsOrder: null, genderMap: updatedMap, pairOverrides: {} }
        : g
      ));
    }
  }

  function handleBlurPairs() {
    if (!rawTextPairs.trim()) return;
    const norm = normalizeText(rawTextPairs); // keep phones
    if (norm !== rawTextPairs) {
      setRawTextPairs(norm);
      applyTextPairs(norm);
    }
  }

  /* ══ EXAM STUDENT INPUT & PARSER ════════════════════════════ */
  // Парсер ВСЕГДА stripPhones: true — только чистые имена
  function applyTextExam(text) {
    const parsed = parseStudents(text, { stripPhones: true }); // phones stripped
    setStudentsExam(parsed);
    if (activeGid) {
      setGroups(prev => prev.map(g => g.id === activeGid
        ? { ...g, rawTextExam: text, students_exam: parsed }
        : g
      ));
    }
  }

  function handleBlurExam() {
    if (!rawTextExam.trim()) return;
    const norm = normalizeText(rawTextExam, { stripPhones: true }); // strip phones
    if (norm !== rawTextExam) {
      setRawTextExam(norm);
      applyTextExam(norm);
    }
  }

  function toggleGender(id) {
    setStudentsPairs(prev => {
      const student = prev.find(s => s.id === id);
      if (!student) return prev;
      const curG = normalizeGender(student.gender);
      const nextG = curG === 'boy' ? 'girl' : 'boy';

      const next = prev.map(s => s.id === id ? { ...s, gender: nextG } : s);

      if (activeGid) {
        setGroups(gs => gs.map(g => {
          if (g.id !== activeGid) return g;
          const currentMap = { ...(g.genderMap || {}) };
          currentMap[student.name.trim().toLowerCase()] = nextG;
          return {
            ...g,
            students_pairs: next,
            genderMap: currentMap,
          };
        }));
      }
      return next;
    });
    notify('Оқушының жынысы ауыстырылды ✓');
  }

  /* ── Shuffle Action (Pairs) ─────────────────────────────── */
  const shufflePairsStudents = useCallback(() => {
    if (!studentsPairs || studentsPairs.length === 0) {
      notify('Оқушылар тізімі бос');
      return;
    }
    const shuffled = [...studentsPairs].sort(() => Math.random() - 0.5).map(s => s.id);
    setCustomPairsOrder(shuffled);
    setPairOverrides({});
    if (activeGid) {
      setGroups(gs => gs.map(g => g.id === activeGid ? { ...g, customPairsOrder: shuffled, pairOverrides: {} } : g));
    }
    notify('🎲 Оқушылар кездейсоқ ретпен қайта бөлінді!');
  }, [studentsPairs, activeGid, notify]);

  const resetPairsOrder = useCallback(() => {
    setCustomPairsOrder(null);
    setPairOverrides({});
    if (activeGid) {
      setGroups(gs => gs.map(g => g.id === activeGid ? { ...g, customPairsOrder: null, pairOverrides: {} } : g));
    }
    notify('Тізім реті қалпына келтірілді');
  }, [activeGid, notify]);

  /* ══ MANUAL PAIR SWAP HANDLERS ══════════════════════════════ */
  function handleSwapStudents() {
    if (!swapStudentA || !swapStudentB) {
      notify('Ауыстыру үшін екі оқушыны таңдаңыз');
      return;
    }
    if (swapStudentA === swapStudentB) {
      notify('Бірдей оқушыны таңдау мүмкін емес');
      return;
    }

    const pairsCopy = currentPairs.map(p => [...p]);
    let posA = null;
    let posB = null;

    for (let r = 0; r < pairsCopy.length; r++) {
      for (let c = 0; c < pairsCopy[r].length; c++) {
        if (pairsCopy[r][c]?.id === swapStudentA) {
          posA = { r, c };
        }
        if (pairsCopy[r][c]?.id === swapStudentB) {
          posB = { r, c };
        }
      }
    }

    if (!posA || !posB) {
      notify('Таңдалған оқушылар табылған жоқ');
      return;
    }

    const temp = pairsCopy[posA.r][posA.c];
    pairsCopy[posA.r][posA.c] = pairsCopy[posB.r][posB.c];
    pairsCopy[posB.r][posB.c] = temp;

    const nextOverrides = {
      ...pairOverrides,
      [safeWeek]: pairsCopy,
    };
    setPairOverrides(nextOverrides);

    if (activeGid) {
      setGroups(gs => gs.map(g => g.id === activeGid ? { ...g, pairOverrides: nextOverrides } : g));
    }

    const nameA = temp.name;
    const nameB = pairsCopy[posA.r][posA.c]?.name;
    setSwapStudentA('');
    setSwapStudentB('');
    notify(`✓ ${nameA} және ${nameB} орындары ауыстырылды!`);
  }

  function handlePairTogether() {
    if (!swapStudentA || !swapStudentB) {
      notify('Бір жұпқа қою үшін екі оқушыны таңдаңыз');
      return;
    }
    if (swapStudentA === swapStudentB) {
      notify('Бірдей оқушыны таңдау мүмкін емес');
      return;
    }

    const pairsCopy = currentPairs.map(p => [...p]);
    let posA = null;
    let posB = null;

    for (let r = 0; r < pairsCopy.length; r++) {
      for (let c = 0; c < pairsCopy[r].length; c++) {
        if (pairsCopy[r][c]?.id === swapStudentA) posA = { r, c };
        if (pairsCopy[r][c]?.id === swapStudentB) posB = { r, c };
      }
    }

    if (!posA || !posB) {
      notify('Таңдалған оқушылар табылған жоқ');
      return;
    }

    if (posA.r === posB.r) {
      notify('Бұл екі оқушы қазірдің өзінде бір жұпта!');
      return;
    }

    const studentA = pairsCopy[posA.r][posA.c];
    const partnerA = pairsCopy[posA.r][1 - posA.c] || null;
    const studentB = pairsCopy[posB.r][posB.c];
    const partnerB = pairsCopy[posB.r][1 - posB.c] || null;

    // Put studentA and studentB together into target row posA.r
    pairsCopy[posA.r] = [studentA, studentB];

    // Put their former partners into posB.r
    if (partnerA && partnerB) {
      pairsCopy[posB.r] = [partnerA, partnerB];
    } else if (partnerA) {
      pairsCopy[posB.r] = [partnerA];
    } else if (partnerB) {
      pairsCopy[posB.r] = [partnerB];
    } else {
      pairsCopy[posB.r] = [];
    }

    const nextOverrides = {
      ...pairOverrides,
      [safeWeek]: pairsCopy,
    };
    setPairOverrides(nextOverrides);

    if (activeGid) {
      setGroups(gs => gs.map(g => g.id === activeGid ? { ...g, pairOverrides: nextOverrides } : g));
    }

    const nameA = studentA.name;
    const nameB = studentB.name;
    setSwapStudentA('');
    setSwapStudentB('');
    notify(`✓ ${nameA} және ${nameB} осы аптада бір жұпқа қойылды!`);
  }

  function handleResetWeekSwaps() {
    const nextOverrides = { ...pairOverrides };
    delete nextOverrides[safeWeek];
    setPairOverrides(nextOverrides);
    if (activeGid) {
      setGroups(gs => gs.map(g => g.id === activeGid ? { ...g, pairOverrides: nextOverrides } : g));
    }
    setSwapStudentA('');
    setSwapStudentB('');
    notify(`${safeWeek + 1}-апта бастапқы алгоритмге қайтарылды ✓`);
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

  /* ══ AUTH HANDLERS ══════════════════════════════════════════ */
  function handleAuth(authUser) {
    if (!authUser) return;
    setUser({ id: authUser.id, email: authUser.email, username: authUser.email?.split('@')[0] || 'Куратор' });
    setActiveTab('hub');
  }

  async function importLocalWorkspace() {
    const source = legacyWorkspaces.find(item => item.username === legacyImportId);
    if (!source || !user?.id || !supabase) return;
    setSyncState('saving');
    const { error } = await supabase.from('user_workspaces').upsert({
      user_id: user.id,
      data: source.data,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) {
      setSyncState('error');
      notify('Деректерді импорттау мүмкін болмады: ' + error.message);
      return;
    }

    const importedGroups = Array.isArray(source.data.groups) ? source.data.groups : [];
    const importedActiveGid = source.data.activeGid || importedGroups[0]?.id || null;
    const selectedGroup = importedGroups.find(g => g.id === importedActiveGid);
    setGroups(importedGroups);
    setActiveGid(importedActiveGid);
    setWeekIdx(source.data.weekIdx || 0);
    setDivType(source.data.divType || 'mixed');
    setRawTextPairs(selectedGroup?.rawTextPairs || '');
    setStudentsPairs(selectedGroup?.students_pairs || []);
    setCustomPairsOrder(selectedGroup?.customPairsOrder || null);
    setRawTextExam(selectedGroup?.rawTextExam || '');
    setStudentsExam(selectedGroup?.students_exam || []);
    setPairOverrides(selectedGroup?.pairOverrides || {});
    setLegacyWorkspaces([]);
    setSyncState('saved');
    notify('Осы браузердегі топтар аккаунтыңызға көшірілді ✓');
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setNewName('');
    setNewSubject('');
    setShowNewGroup(false);
    notify('Аккаунттан шықтыңыз');
  }

  /* ══════════════════════════════════════════════════════════════
     STRICT AUTH GUARD: IF NOT LOGGED IN, RENDER ONLY AUTH FORM
     ══════════════════════════════════════════════════════════════ */
  if (authLoaded && (!user || recoveryMode)) {
    return (
      <>
        <AuthPanel supabase={supabase} onAuth={handleAuth} recoveryMode={recoveryMode} onRecoveryDone={() => setRecoveryMode(false)} />
        {toast && <Toast msg={toast} onHide={() => setToast('')} />}
      </>
    );
  }

  if (!authLoaded || (user && !workspaceLoaded && !workspaceError)) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#475569', fontWeight: 700 }}>Cloud аккаунт жүктелуде...</div>;
  }

  if (workspaceError) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#f8fafc' }}>
      <div style={{ maxWidth: '520px', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 35px rgba(15,23,42,.08)' }}>
        <h2 style={{ margin: '0 0 10px', color: '#991b1b' }}>Cloud деректерін жүктеу қатесі</h2>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>{workspaceError}</p>
        <p style={{ color: '#64748b', fontSize: '13px' }}>Деректерді жоғалтпау үшін жұмыс кеңістігі ашылған жоқ. Supabase кестесі мен кіру баптауларын тексеріңіз.</p>
        <Btn variant="ghost" onClick={logout}>Аккаунттан шығу</Btn>
      </div>
    </div>;
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
          <span title={syncState === 'error' ? 'Соңғы деректер cloud-қа сақталмады' : syncState === 'saving' ? 'Cloud-қа сақталып жатыр' : 'Cloud-та сақталды'} style={{ fontSize: '11px', fontWeight: 700, color: syncState === 'error' ? '#b91c1c' : syncState === 'saving' ? '#a16207' : '#15803d' }}>
            {syncState === 'saving' ? 'Сақталуда…' : syncState === 'error' ? 'Сақтау қатесі' : 'Cloud-та сақталды ✓'}
          </span>
          <Btn variant="ghost" size="sm" onClick={logout}>
            <LogOut size={13} />Шығу
          </Btn>
        </div>
      </header>

      {legacyWorkspaces.length > 0 && groups.length === 0 && (
        <div style={{ margin: '12px 20px 0', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '220px', flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#854d0e', fontSize: '13px' }}>Осы браузерден бұрынғы топтарды импорттау</div>
            <div style={{ color: '#92400e', fontSize: '12px', marginTop: '3px' }}>Таңдалған топтар мен оқушылар тізімі Supabase аккаунтыңызға жіберіліп, басқа құрылғыларда ашылады.</div>
          </div>
          <select aria-label="Импортталатын жергілікті кабинет" value={legacyImportId} onChange={e => setLegacyImportId(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #fcd34d', borderRadius: '8px', background: '#fff', maxWidth: '220px' }}>
            {legacyWorkspaces.map(copy => <option key={copy.username} value={copy.username}>{copy.username} · {copy.data.groups.length} топ</option>)}
          </select>
          <Btn onClick={importLocalWorkspace} disabled={!legacyImportId || syncState === 'saving'}>Бұлтқа импорттау</Btn>
        </div>
      )}

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

            {/* 3 · Student List (Accordion with Gender Badges) */}
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
                    <span>👥 Оқушылар тізімін көру / өзгерту ({studentsPairs.length})</span>
                    {studentsPairs.length > 0 && (
                      <span style={{
                        fontSize: '10px',
                        color: studentsPairs.length % 2 !== 0 ? '#b45309' : '#15803d',
                        background: studentsPairs.length % 2 !== 0 ? '#fef3c7' : '#dcfce7',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        fontWeight: 700
                      }}>
                        {studentsPairs.length % 2 !== 0 ? 'тақ ⚡' : 'жұп ✓'}
                      </span>
                    )}
                  </span>
                  <span style={{ color: BRAND, fontSize: '13px', fontWeight: 800 }}>
                    {showStudentList ? '▴' : '▾'}
                  </span>
                </button>

                {showStudentList && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                      value={rawTextPairs}
                      onChange={e => { setRawTextPairs(e.target.value); applyTextPairs(e.target.value); }}
                      onBlur={handleBlurPairs}
                      placeholder={
                        'Тізімді кез-келген форматта қойыңыз:\n\n' +
                        'Болатұлы Нұрдәулет 87754615707\n' +
                        'Еркинжан Каусар 87086898257\n\n' +
                        'Немесе сплошной мәтінмен:\n' +
                        'Болатұлы Нұрдәулет87754615707Еркинжан Каусар87086898257...\n\n' +
                        'Немесе «Үлгіні қою» батырмасын басыңыз!'
                      }
                      style={{
                        width: '100%', minHeight: '140px',
                        border: '1.5px solid #e5e7eb', borderRadius: '8px',
                        padding: '10px 12px', fontSize: '12px', color: '#111827',
                        background: '#fff', fontFamily: 'monospace',
                        lineHeight: '1.7', resize: 'vertical', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = BRAND}
                    />

                    {/* Student List with One-Click Gender Toggle Badges (Requirement 2) */}
                    {studentsPairs.length > 0 && (
                      <div style={{
                        marginTop: '4px', background: '#f8fafc',
                        border: '1.5px solid #e2e8f0', borderRadius: '10px',
                        padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '.04em' }}>
                            ЖЫНЫСЫ БЕЛГІСІ ({studentsPairs.length} ОҚУШЫ)
                          </span>
                          <div style={{ display: 'flex', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
                            <span style={{ color: '#1d4ed8', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                              👦 {studentsPairs.filter(s => normalizeGender(s.gender) === 'boy').length} ұл
                            </span>
                            <span style={{ color: '#be185d', background: '#fdf2f8', padding: '1px 6px', borderRadius: '4px', border: '1px solid #fbcfe8' }}>
                              👧 {studentsPairs.filter(s => normalizeGender(s.gender) === 'girl').length} қыз
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Ауыстыру үшін бейджикті басыңыз (автоматты сақталады):
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                          {studentsPairs.map((s, idx) => {
                            const g = normalizeGender(s.gender);
                            return (
                              <div
                                key={s.id}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '5px 8px', borderRadius: '6px', background: '#ffffff',
                                  border: '1px solid #e2e8f0', fontSize: '12px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, marginRight: '8px' }}>
                                  <span style={{ color: '#94a3b8', fontSize: '11px', width: '18px', flexShrink: 0 }}>{idx + 1}.</span>
                                  <span style={{ fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {s.name}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleGender(s.id)}
                                  title="Басу арқылы ауыстыру: 👦 Ұл / 👧 Қыз"
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                                    padding: '3px 8px', borderRadius: '6px', border: '1px solid',
                                    cursor: 'pointer', fontSize: '11.5px', fontWeight: 800,
                                    transition: 'all .12s', flexShrink: 0,
                                    background: g === 'boy' ? '#eff6ff' : g === 'girl' ? '#fdf2f8' : '#f8fafc',
                                    borderColor: g === 'boy' ? '#93c5fd' : g === 'girl' ? '#f472b6' : '#cbd5e1',
                                    color: g === 'boy' ? '#1d4ed8' : g === 'girl' ? '#be185d' : '#64748b',
                                  }}
                                >
                                  {g === 'boy' ? '👦 Ұл' : g === 'girl' ? '👧 Қыз' : '❓ Белгісіз'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* 4 · Division Type (Requirement 3) */}
            <section>
              <FieldLabel>БӨЛУ РЕЖИМІ</FieldLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                  <button
                    type="button"
                    onClick={() => setDivType('mixed')}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: 'all .15s',
                      background: divType === 'mixed' ? '#fff' : 'transparent',
                      color: divType === 'mixed' ? BRAND : '#6b7280',
                      boxShadow: divType === 'mixed' ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                    }}
                  >
                    🔀 Бәрі аралас
                  </button>
                  <button
                    type="button"
                    onClick={() => setDivType('gendered')}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: '8px', border: 'none',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: 'all .15s',
                      background: divType === 'gendered' ? '#fff' : 'transparent',
                      color: divType === 'gendered' ? BRAND : '#6b7280',
                      boxShadow: divType === 'gendered' ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
                    }}
                  >
                    👫 Тек бір жынысты жұптар
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                  {divType === 'gendered'
                    ? '✓ Ұлдар тек ұлдармен, қыздар тек қыздармен жұптасады. Тақ қалған ұл мен қыз өзара бірігеді.'
                    : '✓ 16 апталық карусель: барлық оқушылар қайталанбайтын жұптарға бөлінеді.'}
                </div>
              </div>
            </section>

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

            {/* 6.5 · Distribution / Shuffle Button */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Btn onClick={shufflePairsStudents} fullWidth sx={{ justifyContent: 'center', padding: '10px' }}>
                <Shuffle size={14} /> Оқушыларды араластыру
              </Btn>
              {customPairsOrder && (
                <button
                  onClick={resetPairsOrder}
                  style={{
                    background: 'none', border: 'none', color: '#64748b',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline'
                  }}
                >
                  Бастапқы ретке қайтару
                </button>
              )}
            </section>

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
                            {g.subject ? `${g.subject} • ` : ''}{g.students_pairs?.length || 0} оқушы
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
            {(!activeGid || !rawTextPairs.trim() || studentsPairs.length === 0) && (
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

              {/* 4. Manual Pair Adjustment / Swap Toggle Button */}
              <Btn
                variant="ghost"
                onClick={() => setShowSwapModal(v => !v)}
                sx={{
                  background: showSwapModal ? '#eef1fb' : '#ffffff',
                  borderColor: showSwapModal ? BRAND : (pairOverrides[safeWeek] ? '#f59e0b' : '#e5e7eb'),
                  color: showSwapModal ? BRAND : (pairOverrides[safeWeek] ? '#b45309' : '#374151'),
                  fontWeight: 700,
                }}
              >
                <ArrowLeftRight size={14} /> ✍️ Осы аптадағы жұптарды өзгерту / Своп {pairOverrides[safeWeek] ? '⚡ (Өзгертілген)' : ''}
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

            {/* Manual Swap Panel */}
            {showSwapModal && (
              <div style={{
                width: '100%', maxWidth: '1020px',
                background: '#ffffff', border: '1.5px solid #c7d2fe', borderRadius: '14px',
                padding: '16px 20px',
                boxShadow: '0 4px 16px rgba(29,53,151,0.08)',
                display: 'flex', flexDirection: 'column', gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: '#eef1fb', color: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <ArrowLeftRight size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>
                        {safeWeek + 1}-аптадағы жұптарды қолмен реттеу (Своп)
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Кез келген екі оқушыны таңдап, орындарын бірден ауыстырыңыз. Постер мен тізім лезде жаңарады.
                      </div>
                    </div>
                  </div>

                  {pairOverrides[safeWeek] && (
                    <button
                      type="button"
                      onClick={handleResetWeekSwaps}
                      style={{
                        padding: '6px 12px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '7px',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      ↺ Бастапқы алгоритмге қайтару
                    </button>
                  )}
                </div>

                {/* Selectors and Action */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '12px',
                  alignItems: 'end',
                  background: '#f8fafc',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4b5563', marginBottom: '4px' }}>
                      1-ОҚУШЫНЫ ТАҢДАҢЫЗ:
                    </label>
                    <select
                      value={swapStudentA}
                      onChange={e => setSwapStudentA(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '7px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        background: '#ffffff',
                        outline: 'none'
                      }}
                    >
                      <option value="">-- Бірінші оқушыны таңдаңыз --</option>
                      {swapOptions.map(opt => (
                        <option key={`a-${opt.id}`} value={opt.id} disabled={opt.id === swapStudentB}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#4b5563', marginBottom: '4px' }}>
                      2-ОҚУШЫНЫ ТАҢДАҢЫЗ:
                    </label>
                    <select
                      value={swapStudentB}
                      onChange={e => setSwapStudentB(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '7px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1e293b',
                        background: '#ffffff',
                        outline: 'none'
                      }}
                    >
                      <option value="">-- Екінші оқушыны таңдаңыз --</option>
                      {swapOptions.map(opt => (
                        <option key={`b-${opt.id}`} value={opt.id} disabled={opt.id === swapStudentA}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handlePairTogether}
                      disabled={!swapStudentA || !swapStudentB || swapStudentA === swapStudentB}
                      title="Таңдалған екі оқушыны бір жұпқа қою (қалған серіктестері бір-бірімен жұптасады)"
                      style={{
                        height: '38px',
                        padding: '0 16px',
                        background: (!swapStudentA || !swapStudentB || swapStudentA === swapStudentB) ? '#94a3b8' : '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '7px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: (!swapStudentA || !swapStudentB || swapStudentA === swapStudentB) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      🤝 Бір жұпқа қою (Бірге)
                    </button>

                    <button
                      type="button"
                      onClick={handleSwapStudents}
                      disabled={!swapStudentA || !swapStudentB || swapStudentA === swapStudentB}
                      title="Таңдалған екі оқушының орындарын ауыстыру"
                      style={{
                        height: '38px',
                        padding: '0 16px',
                        background: (!swapStudentA || !swapStudentB || swapStudentA === swapStudentB) ? '#94a3b8' : BRAND,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '7px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: (!swapStudentA || !swapStudentB || swapStudentA === swapStudentB) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <ArrowLeftRight size={15} /> Орындарын ауыстыру (Своп)
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px' }}>
                  💡 <b>Маңызды:</b> Бұл түзетулер <b>ТЕК ОСЫ АПТАҒА ({safeWeek + 1}-апта)</b> сақталады. Басқа апталар өзгермейді және жалпы алгоритм бұзылмайды.
                </div>

                {/* Quick Interactive Pairs Overview */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                    Ағымдағы жұптар (жылдам таңдау үшін оқушыны басыңыз):
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: '8px',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    padding: '2px'
                  }}>
                    {currentPairs.map((pair, pIdx) => {
                      const s1 = pair[0];
                      const s2 = pair[1];
                      const isBye1 = !s1 || s1.id === '__bye__';
                      const isBye2 = !s2 || s2.id === '__bye__';

                      const isSelected1 = s1 && (swapStudentA === s1.id || swapStudentB === s1.id);
                      const isSelected2 = s2 && (swapStudentA === s2.id || swapStudentB === s2.id);

                      const selectClick = (id) => {
                        if (!id || id === '__bye__') return;
                        if (!swapStudentA) {
                          setSwapStudentA(id);
                        } else if (!swapStudentB && swapStudentA !== id) {
                          setSwapStudentB(id);
                        } else if (swapStudentA === id) {
                          setSwapStudentA('');
                        } else if (swapStudentB === id) {
                          setSwapStudentB('');
                        } else {
                          setSwapStudentB(id);
                        }
                      };

                      return (
                        <div
                          key={`pair-box-${pIdx}`}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '6px 8px',
                            fontSize: '11px',
                          }}
                        >
                          <div style={{ fontWeight: 800, color: BRAND, marginBottom: '4px', fontSize: '10px' }}>
                            {pIdx + 1}-ЖҰП
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div
                              onClick={() => !isBye1 && selectClick(s1.id)}
                              style={{
                                padding: '3px 6px',
                                borderRadius: '4px',
                                background: isSelected1 ? '#dbeafe' : '#ffffff',
                                border: isSelected1 ? `1.5px solid ${BRAND}` : '1px solid #e2e8f0',
                                fontWeight: isSelected1 ? 800 : 600,
                                color: isBye1 ? '#94a3b8' : '#1e293b',
                                cursor: isBye1 ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {isBye1 ? '—' : `${s1.gender === 'girl' ? '👧' : '👦'} ${s1.name}`}
                              </span>
                              {isSelected1 && <span style={{ fontSize: '9px', color: BRAND, fontWeight: 900 }}>✓</span>}
                            </div>
                            <div
                              onClick={() => !isBye2 && selectClick(s2.id)}
                              style={{
                                padding: '3px 6px',
                                borderRadius: '4px',
                                background: isSelected2 ? '#dbeafe' : '#ffffff',
                                border: isSelected2 ? `1.5px solid ${BRAND}` : '1px solid #e2e8f0',
                                fontWeight: isSelected2 ? 800 : 600,
                                color: isBye2 ? '#94a3b8' : '#1e293b',
                                cursor: isBye2 ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {isBye2 ? '—' : `${s2.gender === 'girl' ? '👧' : '👦'} ${s2.name}`}
                              </span>
                              {isSelected2 && <span style={{ fontSize: '9px', color: BRAND, fontWeight: 900 }}>✓</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

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
          students={studentsExam}
          rawText={rawTextExam}
          setRawText={setRawTextExam}
          applyText={applyTextExam}
          handleBlur={handleBlurExam}
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
