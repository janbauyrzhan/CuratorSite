'use client';

/* ══════════════════════════════════════════════════════════════════════════
   infoLogia • Куратор сайты
   Split-Screen SPA with Strict Auth Guard & Strict User-Scoped Data Isolation:
   1. «Жұптық жұмыс» (Pairs Carousel Generator with template.svg)
   2. «Сабақ тапсыру» (Exam Schedule with template2.svg)
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Download, LogOut, GraduationCap, Users, Clock, Check, User, Shuffle, ChevronDown, RotateCcw, Award
} from 'lucide-react';
import AuthPanel     from './AuthPanel';
import WorkspaceHome from './WorkspaceHome';
import Poster        from './Poster';
import PosterReorder, { PosterLock } from './PosterReorder';
import ExamScheduler from './ExamScheduler';
import WeeklyPlanner from './WeeklyPlanner';
import CertificateCatalog from './CertificateCatalog';
import {readPlanDrafts,writePlanDraft,mergePlanDrafts,acknowledgePlanDrafts} from '@/lib/planDrafts';
import { readFavoriteDrafts, writeFavoriteDraft, mergeFavoriteDrafts, acknowledgeFavoriteDrafts } from '@/lib/certificateFavorites';
import { readAwardDrafts, writeAwardDraft, mergeAwardDrafts, acknowledgeAwardDrafts, makeAwardId } from '@/lib/certificateAwardHistory';
import { certificateStudentKey } from './CertificateStudentField';
import PlanSubjects, {PLAN_SUBJECTS} from './PlanSubjects';
import {
  uid, makeSchedule, makeGenderedSchedule,
  parseStudents, normalizeText, normalizeGender,
  getLegacyWorkspaces, clearLegacyCredentials,
} from '@/lib/utils';
import { getSupabaseClient } from '@/lib/supabaseClient';
import {
  fillSvgTemplate, downloadSvgAsPng, RAW_SVG_TEMPLATE, ROW_CENTERS
} from '@/lib/svgTemplate';

/* ── Constants ──────────────────────────────────────────────── */
const BRAND     = '#514fb1';
const MAX_WEEKS = 25; // 1 to 25 weeks compact switcher

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
function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, fullWidth = false, sx = {}, ...buttonProps }) {
  const vars = {
    primary: { bg: BRAND,         fg: '#fff',     border: 'none' },
    ghost:   { bg: '#fff',        fg: '#374151', border: '1.5px solid #e5e7eb' },
    danger:  { bg: 'transparent', fg: '#dc2626', border: '1.5px solid #fecaca' },
    success: { bg: '#059669',     fg: '#fff',     border: 'none' },
  }[variant] || {};

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`ui-button ui-button-${variant}`}
      disabled={disabled}
      {...buttonProps}
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
    <div className="field-label" style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', letterSpacing: '.07em', marginBottom: '5px' }}>
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

const VIEW_STORAGE_KEY = 'infologia-active-view';
const DEFAULT_VIEW = { activeTab: 'hub', planSubject: null };

function readActiveView() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(VIEW_STORAGE_KEY));
    if (!['hub', 'pairs', 'exam', 'plan', 'certificates'].includes(saved?.activeTab)) return DEFAULT_VIEW;
    const planSubject = saved.activeTab === 'plan' && PLAN_SUBJECTS.some(subject => subject.id === saved.planSubject)
      ? saved.planSubject
      : null;
    return { activeTab: saved.activeTab, planSubject };
  } catch {
    return DEFAULT_VIEW;
  }
}

/* ══════════════════════════════════════════════════════════════
   MAIN APP COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function App() {
  /* ── Strict Auth Guard State ────────────────────────────── */
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [cloudHydrated, setCloudHydrated] = useState(false);
  const [workspaceError, setWorkspaceError] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [legacyWorkspaces, setLegacyWorkspaces] = useState([]);
  const [legacyImportId, setLegacyImportId] = useState('');
  const [syncState, setSyncState] = useState('saved');
  const hydrationId = useRef(0);
  const hydratedUserId = useRef(null);
  const saveQueue = useRef(Promise.resolve());
  const saveVersion = useRef(0);
  const [syncRetry,setSyncRetry]=useState(0);
  useEffect(()=>{const retry=()=>setSyncRetry(n=>n+1);window.addEventListener('online',retry);return()=>window.removeEventListener('online',retry);},[]);
  const supabase = useMemo(() => getSupabaseClient(), []);

  /* ── Tab Switcher State ('hub' | 'pairs' | 'exam') ──────────────── */
  const [{ activeTab, planSubject }, setActiveView] = useState(readActiveView);

  function navigate(tab, subject = null) {
    const view = { activeTab: tab, planSubject: subject };
    setActiveView(view);
    try {
      window.sessionStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(view));
    } catch {
      // Navigation still works if browser storage is unavailable.
    }
  }

  function selectPlanSubject(subject) {
    navigate('plan', subject);
  }
  const [showStudentList, setShowStudentList] = useState(false);

  /* ── Group State (Strictly isolated per username) ───────── */
  const [groups,       setGroups]       = useState([]);
  const [favoriteCertificates, setFavoriteCertificates] = useState([]);
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
  const [pinnedPairs, setPinnedPairs] = useState({});
  const [showPairSettings, setShowPairSettings] = useState(false);

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
    setFavoriteCertificates([]);
    setCustomPairsOrder(null); setRawTextExam(''); setStudentsExam([]);
    setSchedule([]); setPairOverrides({}); setPinnedPairs({}); setWeekIdx(0); setDivType('mixed');
  }, []);

  const hydrateWorkspace = useCallback(async (authUser) => {
    if(hydratedUserId.current===authUser.id)return;
    const requestId = ++hydrationId.current;
    const cacheKey = `infologia-workspace-cache:${authUser.id}`;
    let cachedWorkspace = null;
    try {
      const cached = JSON.parse(window.localStorage.getItem(cacheKey) || 'null');
      if (cached && typeof cached === 'object' && Array.isArray(cached.groups)) cachedWorkspace = cached;
    } catch {
      // Ignore unavailable or malformed local cache and load from Supabase.
    }

    const applyWorkspace = (workspace) => {
      const savedGroups = mergeAwardDrafts(
        mergePlanDrafts(Array.isArray(workspace?.groups) ? workspace.groups : [], readPlanDrafts(authUser.id)),
        readAwardDrafts(authUser.id)
      );
      setGroups(savedGroups);
      setFavoriteCertificates(mergeFavoriteDrafts(workspace?.favoriteCertificates, readFavoriteDrafts(authUser.id)));
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
      setPinnedPairs(selectedGroup?.pinnedPairs || {});
    };

    setCloudHydrated(false);
    setWorkspaceError('');
    if (cachedWorkspace) {
      // Show the last known workspace immediately; refresh it from Supabase below.
      applyWorkspace(cachedWorkspace);
      setUser({ id: authUser.id, email: authUser.email, username: authUser.email?.split('@')[0] || 'Куратор' });
      setWorkspaceLoaded(true);
      setAuthLoaded(true);
    } else {
      setWorkspaceLoaded(false);
    }
    const { data, error } = await supabase
      .from('user_workspaces')
      .select('data')
      .eq('user_id', authUser.id)
      .maybeSingle();
    if (requestId !== hydrationId.current) return;
    if (error) {
      if (!cachedWorkspace) {
        setWorkspaceError(error.message || 'Cloud деректерін жүктеу мүмкін болмады.');
        setWorkspaceLoaded(false);
      }
      return;
    }

    const workspace = data?.data || cachedWorkspace || null;
    const savedGroups = Array.isArray(workspace?.groups) ? workspace.groups : [];
    setUser({ id: authUser.id, email: authUser.email, username: authUser.email?.split('@')[0] || 'Куратор' });
    applyWorkspace(workspace);

    const localCopies = getLegacyWorkspaces();
    setLegacyWorkspaces(savedGroups.length === 0 ? localCopies : []);
    setLegacyImportId(savedGroups.length === 0 ? (localCopies[0]?.username || '') : '');
    clearLegacyCredentials();
    setWorkspaceLoaded(true);
    setCloudHydrated(true);
    hydratedUserId.current=authUser.id;
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
            hydratedUserId.current=null;
            hydrationId.current++;
            setUser(null); setWorkspaceLoaded(false); setCloudHydrated(false); setWorkspaceError('');
            resetWorkspace(); setAuthLoaded(true);
          }
        } else if (event === 'SIGNED_OUT') {
          hydratedUserId.current=null;
          hydrationId.current++;
          setUser(null); setWorkspaceLoaded(false); setCloudHydrated(false); setWorkspaceError('');
          setRecoveryMode(false); setLegacyWorkspaces([]); resetWorkspace(); setAuthLoaded(true);
        }
      }, 0);
    });
    return () => subscription.unsubscribe();
  }, [supabase, hydrateWorkspace, resetWorkspace]);

  /* ── Persist cloud workspace after edits ────────────────── */
  useEffect(() => {
    if (!supabase || !user?.id || !workspaceLoaded || !cloudHydrated || workspaceError) return;
    const data = { groups, activeGid, weekIdx, divType, favoriteCertificates };
    const version=++saveVersion.current;
    setSyncState('saving');
    const timer = setTimeout(() => {
      saveQueue.current=saveQueue.current.catch(()=>{}).then(async()=>{
      if(hydratedUserId.current!==user.id)return;
      const { error } = await supabase.from('user_workspaces').upsert({
        user_id: user.id,
        data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) {
        setSyncState('error');
        notify('Cloud-қа сақтау қатесі: ' + (error.message || 'Қайта көріңіз'));
      } else {
        acknowledgePlanDrafts(user.id,data.groups);
        acknowledgeAwardDrafts(user.id, data.groups);
        acknowledgeFavoriteDrafts(user.id, data.favoriteCertificates);
        if(version===saveVersion.current)setSyncState('saved');
      }
      }).catch(()=>{setSyncState('error');});
    }, 700);
    return () => clearTimeout(timer);
  }, [supabase, user, groups, activeGid, weekIdx, divType, favoriteCertificates, workspaceLoaded, cloudHydrated, workspaceError, notify,syncRetry]);

  // Keep a user-scoped copy for instant rendering on the next visit or tab restore.
  useEffect(() => {
    if (!user?.id || !workspaceLoaded) return;
    try {
      window.localStorage.setItem(`infologia-workspace-cache:${user.id}`, JSON.stringify({ groups, activeGid, weekIdx, divType, favoriteCertificates }));
    } catch {
      // Local storage can be disabled or full; the Supabase copy remains authoritative.
    }
  }, [user, groups, activeGid, weekIdx, divType, favoriteCertificates, workspaceLoaded]);

  function changeFavoriteCertificate(id, favorite) {
    if (!user?.id) return;
    try {
      writeFavoriteDraft(user.id, id, favorite);
    } catch {
      notify('Құрылғыға сақтау мүмкін болмады. Cloud сақталуын күтіңіз.');
    }
    setFavoriteCertificates(current => favorite
      ? current.includes(id) ? current : [...current, id]
      : current.filter(item => item !== id));
  }

  function saveCertificateAward({ template, student, secondStudent, week, month, awardPlace }) {
    if (!user?.id || !activeGid) return;
    const group = groups.find(item => item.id === activeGid);
    if (!group) return;
    const students = [student, secondStudent].filter(Boolean)
      .map(name => ({ id: certificateStudentKey(name), name }));
    const category = template.category || (template.pair ? 'Үздік жұптық жұмыс'
      : template.id.includes('notes') ? 'Үздік конспект'
        : awardPlace ? awardPlace + '-орын' : template.label);
    const award = { week, month, period: template.period, category,
      templateId: template.id, templateLabel: template.label, students };
    const id = makeAwardId(award);
    if (Array.isArray(group.certificateAwards) && group.certificateAwards.some(item => item.id === id)) {
      notify('Бұл нәтиже тарихта сақталған');
      return;
    }
    const entry = { ...award, id, createdAt: new Date().toISOString() };
    try {
      writeAwardDraft(user.id, activeGid, id, entry);
      notify('Нәтиже марапаттар тарихына қосылды');
    } catch {
      notify('Құрылғыға сақтау мүмкін болмады. Cloud сақталуын күтіңіз.');
    }
    setGroups(current => mergeAwardDrafts(current, { [activeGid]: { [id]: entry } }));
  }

  function deleteCertificateAward(id) {
    if (!user?.id || !activeGid) return;
    try {
      writeAwardDraft(user.id, activeGid, id, null);
    } catch {
      notify('Құрылғыға сақтау мүмкін болмады. Cloud сақталуын күтіңіз.');
    }
    setGroups(current => mergeAwardDrafts(current, { [activeGid]: { [id]: null } }));
  }

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
        setSchedule(Array.from({ length: MAX_WEEKS }, () => [[orderedStudentsPairs[0]]]));
      } else {
        setSchedule([]);
      }
      return;
    }
    const raw = divType === 'gendered' ? makeGenderedSchedule(orderedStudentsPairs, MAX_WEEKS) : makeSchedule(orderedStudentsPairs);
    const capped = Array.from({ length: MAX_WEEKS }, (_, week) => raw[week % raw.length]);
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

  /* ── Real-Time Dynamic SVG Generation (Pairs) ───────────── */
  const filledSvg = useMemo(() => {
    return fillSvgTemplate(svgTemplate, {
      weekText,
      subjectText,
      pairs: currentPairs,
      showPhones: true,
    });
  }, [svgTemplate, weekText, subjectText, currentPairs]);

  const pairPosterHeight = Number(filledSvg.match(/viewBox="0 0 1702 ([\d.]+)"/)?.[1]) || 988;
  const pairRows = currentPairs.slice(0, ROW_CENTERS.length).flatMap((pair, index) => {
    const locked = Boolean(pinnedPairs[safeWeek]?.[index]);
    const y = ROW_CENTERS[index] / pairPosterHeight * 100;
    const students = pair.flatMap((student, column) => {
      if (!student || student.id === '__bye__') return [];
      return [{
        id: student.id,
        name: student.name,
        locked,
        position: { left: column === 0 ? '15.4%' : '65.9%', top: `${y}%`, width: '17.4%', height: `${36 / pairPosterHeight * 100}%` },
      }];
    });
    if (!students.length) return [];
    return [{
      key: index,
      label: `${index + 1}-жұп`,
      students,
      lock: students.length === 2 ? {
        locked,
        label: `${index + 1}-жұп: ${locked ? 'бекітуден алу' : 'бекіту'}`,
        onClick: () => togglePinnedPair(index, pair),
        style: { left: '50%', top: `${y}%` },
      } : null,
    }];
  });
  const pairLockControls = pairRows.map(row => row.lock && <PosterLock key={row.key} {...row.lock} />);

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
        pinnedPairs: {},
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
    notify('28 оқушының демо-үлгісі сәтті қойылды!');
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
      pinnedPairs: {},
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
    setPinnedPairs({});
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
    setPinnedPairs(ng?.pinnedPairs || {});
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
    setPinnedPairs(g.pinnedPairs || {});
    setWeekIdx(0);
    setShowPairSettings(false);
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
          pinnedPairs,
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
    setPinnedPairs({});

    if (activeGid) {
      const updatedMap = { ...existingGenders };
      parsed.forEach(s => {
        updatedMap[s.name.trim().toLowerCase()] = normalizeGender(s.gender);
      });
      setGroups(prev => prev.map(g => g.id === activeGid
        ? { ...g, rawTextPairs: text, students_pairs: parsed, customPairsOrder: null, genderMap: updatedMap, pairOverrides: {}, pinnedPairs: {} }
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
    const idsByName = new Map(studentsExam.map(student => [student.name.toLowerCase(), student.id]));
    const parsed = parseStudents(text, { stripPhones: true }).map(student => ({
      ...student,
      id: idsByName.get(student.name.toLowerCase()) || student.id,
    }));
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
    const pins = pinnedPairs[safeWeek] || {};
    const fixedRows = Object.entries(pins).map(([row, ids]) => [Number(row), ids.map(id => studentsPairs.find(s => s.id === id)).filter(Boolean)]).filter(([, pair]) => pair.length === 2);
    const fixedIds = new Set(fixedRows.flatMap(([, pair]) => pair.map(s => s.id)));
    const movable = studentsPairs.filter(s => !fixedIds.has(s.id));
    const usedBefore = new Set((schedule || []).filter((_, i) => i !== safeWeek).flatMap(week => week.map(pair => pair.length === 2 ? [pair[0].id < pair[1].id ? `${pair[0].id}|${pair[1].id}` : `${pair[1].id}|${pair[0].id}`] : [])));
    let best = null;
    let bestScore = Infinity;
    for (let attempt = 0; attempt < 100; attempt++) {
      const shuffled = [...movable];
      for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
      const rows = Array.from({ length: Math.ceil(studentsPairs.length / 2) }, () => null);
      fixedRows.forEach(([row, pair]) => { if (row < rows.length) rows[row] = pair; });
      let cursor = 0;
      for (let row = 0; row < rows.length; row++) if (!rows[row]) rows[row] = shuffled.slice(cursor, cursor += 2);
      const score = rows.reduce((sum, pair) => pair.length === 2 ? sum + (usedBefore.has(pair[0].id < pair[1].id ? `${pair[0].id}|${pair[1].id}` : `${pair[1].id}|${pair[0].id}`) ? 1 : 0) : sum, 0);
      if (score < bestScore) { best = rows; bestScore = score; }
      if (score === 0) break;
    }
    const nextOverrides = { ...pairOverrides, [safeWeek]: best || [] };
    setPairOverrides(nextOverrides);
    setCustomPairsOrder(null);
    if (activeGid) {
      setGroups(gs => gs.map(g => g.id === activeGid ? { ...g, customPairsOrder: null, pairOverrides: nextOverrides, pinnedPairs } : g));
    }
    notify('🎲 Оқушылар кездейсоқ ретпен қайта бөлінді!');
  }, [studentsPairs, activeGid, notify, pinnedPairs, safeWeek, schedule, pairOverrides]);

  function togglePinnedPair(row, pair) {
    const next = { ...pinnedPairs, [safeWeek]: { ...(pinnedPairs[safeWeek] || {}) } };
    if (next[safeWeek][row]) delete next[safeWeek][row];
    else next[safeWeek][row] = pair.filter(s => s && s.id !== '__bye__').map(s => s.id);
    setPinnedPairs(next);
    if (activeGid) setGroups(gs => gs.map(g => g.id === activeGid ? { ...g, pinnedPairs: next } : g));
    notify(next[safeWeek][row] ? 'Жұп осы аптаға бекітілді ✓' : 'Жұп бекітуден алынды');
  }

  const resetPairsOrder = useCallback(() => {
    setCustomPairsOrder(null);
    setPairOverrides({});
    setPinnedPairs({});
    if (activeGid) {
      setGroups(gs => gs.map(g => g.id === activeGid ? { ...g, customPairsOrder: null, pairOverrides: {}, pinnedPairs: {} } : g));
    }
    notify('Тізім реті қалпына келтірілді');
  }, [activeGid, notify]);

  function notifyLockedPair() {
    notify('Орын ауыстыру үшін алдымен жұптың құлпын ашыңыз');
  }

  function swapPairStudents(firstId, secondId) {
    const firstRow = currentPairs.findIndex(pair => pair.some(student => student.id === firstId));
    const secondRow = currentPairs.findIndex(pair => pair.some(student => student.id === secondId));
    if (firstRow < 0 || secondRow < 0 || firstId === secondId) return;
    if (pinnedPairs[safeWeek]?.[firstRow] || pinnedPairs[safeWeek]?.[secondRow]) {
      notifyLockedPair();
      return;
    }
    const first = currentPairs[firstRow].find(student => student.id === firstId);
    const second = currentPairs[secondRow].find(student => student.id === secondId);
    const next = currentPairs.map(pair => pair.map(student => {
      if (student.id === firstId) return second;
      if (student.id === secondId) return first;
      return student;
    }));
    const overrides = { ...pairOverrides, [safeWeek]: next };
    setPairOverrides(overrides);
    setGroups(gs => gs.map(group => group.id === activeGid ? { ...group, pairOverrides: overrides } : group));
    notify('Оқушылардың орындары ауыстырылды');
  }

  function resetPairWeek() {
    if (Object.keys(pinnedPairs[safeWeek] || {}).length) {
      notify('Бастапқы ретке қайтару үшін бекітілген жұптарды босатыңыз');
      return;
    }
    const overrides = { ...pairOverrides };
    delete overrides[safeWeek];
    setPairOverrides(overrides);
    setGroups(gs => gs.map(group => group.id === activeGid ? { ...group, pairOverrides: overrides } : group));
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

  /* ══ AUTH HANDLERS ══════════════════════════════════════════ */
  function handleAuth(authUser) {
    if (!authUser) return;
    setUser({ id: authUser.id, email: authUser.email, username: authUser.email?.split('@')[0] || 'Куратор' });
  }

  async function importLocalWorkspace() {
    const source = legacyWorkspaces.find(item => item.username === legacyImportId);
    if (!source || !user?.id || !supabase) return;
    setSyncState('saving');
    const { error } = await supabase.from('user_workspaces').upsert({
      user_id: user.id,
      data: { ...source.data, favoriteCertificates },
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
      setPinnedPairs(selectedGroup?.pinnedPairs || {});
    setLegacyWorkspaces([]);
    setSyncState('saved');
    notify('Осы браузердегі топтар аккаунтыңызға көшірілді ✓');
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    navigate('hub');
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
    <div className="app-shell" style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f7f8ff' }}>

      {/* ══ TOP BAR: LOGO, TWO TABS, USERNAME & LOGOUT ONLY ═════ */}
      <header style={{
        height: '56px', background: '#fff',
        borderBottom: '1.5px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', flexShrink: 0, zIndex: 10,
      }} className="app-header">
        {/* Brand & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="app-header-left">
          <div
            onClick={() => navigate('hub')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            className="app-brand" role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('hub'); } }}
            title="Басты мәзірге өту"
          >
            <img src="/infologia-wordmark.png" alt="infoLogia — Кураторлардың жұмыс кабинеті" className="app-brand-logo" />
          </div>
          <div style={{ width: '1px', height: '18px', background: '#e5e7eb' }} />

          {/* Navigation Controls: If in workspace, show «← Басты мәзірге» and 2 Tabs */}
          {activeTab !== 'hub' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="app-nav">
              <button
                type="button"
                onClick={() => navigate('hub')}
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

              <nav className="app-tabs" aria-label="Жұмыс бөлімдері" style={{ display: 'flex', background: '#eff0ff', borderRadius: '10px', padding: '3px', gap: '3px' }}>
                <button
                  onClick={() => navigate('pairs')}
                  aria-current={activeTab === 'pairs' ? 'page' : undefined}
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
                  onClick={() => navigate('exam')}
                  aria-current={activeTab === 'exam' ? 'page' : undefined}
                  style={{
                    padding: '6px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                    fontSize: '13px', fontWeight: 700, transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: activeTab === 'exam' ? '#fff' : 'transparent',
                    color: activeTab === 'exam' ? BRAND : '#6b7280',
                    boxShadow: activeTab === 'exam' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <Clock size={14} /> Сабақ тапсыру
                </button>
                <button className="planner-tab" aria-current={activeTab === 'plan' ? 'page' : undefined} onClick={() => navigate('plan')}>Апталық жоспар</button>
                <button className="planner-tab certificate-tab" type="button" onClick={() => navigate('certificates')}
                  aria-current={activeTab === 'certificates' ? 'page' : undefined}>
                  <Award size={14} aria-hidden="true" /> Сертификаттар
                </button>
              </nav>
            </div>
          ) : (
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              Куратор кабинеті
            </span>
          )}
        </div>

        {/* User Auth Info & Logout Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="app-account">
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
          <span role="status" className="sync-status" title={syncState === 'error' ? 'Соңғы деректер cloud-қа сақталмады' : syncState === 'saving' ? 'Cloud-қа сақталып жатыр' : 'Cloud-та сақталды'} style={{ fontSize: '11px', fontWeight: 700, color: syncState === 'error' ? '#b91c1c' : syncState === 'saving' ? '#a16207' : '#15803d' }}>
            {syncState === 'saving' ? 'Сақталуда…' : syncState === 'error' ? 'Сақтау қатесі' : activeTab==='plan' ? 'Автоматты сақталды ✓' : 'Cloud-та сақталды ✓'}
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
        <WorkspaceHome username={user?.username} onSelect={navigate} />
      ) : activeTab === 'pairs' ? (
        /* ════ TAB 1: «ЖҰПТЫҚ ЖҰМЫС» PAIRS GENERATOR ═══════════ */
        <div className="pair-workspace pairs-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ════ LEFT PANEL: Settings & Student List ═══════════ */}
          <aside className="workspace-sidebar" style={{
            width: '360px', flexShrink: 0,
            background: '#fff', borderRight: '1.5px solid #e5e7eb',
            overflowY: 'auto', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '18px',
          }}>

            <button type="button" className="pairs-settings-toggle" aria-expanded={showPairSettings}
              aria-controls="pairs-settings" onClick={() => setShowPairSettings(open => !open)}>
              <Users size={16} /> Жұп баптаулары <ChevronDown size={15} />
            </button>
            <div id="pairs-settings" className={showPairSettings ? 'pairs-settings is-open' : 'pairs-settings'}>
            {/* 1 · Save Button (Prominent with visual confirmation) */}
            <section>
              <button
                className="workspace-save"
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
                  boxShadow: savedAnim ? '0 4px 14px rgba(5,150,105,0.3)' : '0 4px 14px rgba(54,64,151,0.2)',
                }}
              >
                {savedAnim ? (
                  <>
                    <Check size={16} /> Сақталды ✓
                  </>
                ) : (
                  'Өзгерістерді сақтау'
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
                    <span>Оқушылар тізімін көру / өзгерту ({studentsPairs.length})</span>
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
                          background: '#eff0ff', border: '1px solid #c7d5f8',
                          color: BRAND, borderRadius: '6px', padding: '2px 8px',
                          fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          transition: 'all .15s'
                        }}
                      >
                        <Plus size={12} />Үлгіні қою
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
                        'Немесе тұтас мәтінмен:\n' +
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
                    Бәрі аралас
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
                    Тек бір жынысты жұптар
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                  {divType === 'gendered'
                    ? '✓ 25 апта: ұлдар ұлдармен, қыздар қыздармен жұптасады. Тақ қалған ұл мен қыз бірігеді. Әр топтың жұптары біткен соң циклі қайталанады.'
                    : '✓ 25 апталық карусель: барлық жұптар өткен соң цикл қайталанады.'}
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
            </div>
          </aside>

          {/* ════ RIGHT PANEL: Real-Time Canva SVG Live Poster ════ */}
          <main className="workspace-main" style={{
            flex: 1, overflowY: 'auto', background: '#f1f3ff',
            padding: '24px', display: 'flex', flexDirection: 'column',
            gap: '14px', alignItems: 'center',
          }}>

            <div className="workspace-heading"><h1>Жұптық жұмыс</h1></div>

            {/* Onboarding block for colleagues when list or group is empty */}
            {(!activeGid || !rawTextPairs.trim() || studentsPairs.length === 0) && (
              <div style={{
                width: '100%', maxWidth: '1020px',
                background: '#ffffff', border: '1.5px solid #dbeafe', borderRadius: '14px',
                padding: '18px 22px',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
                boxShadow: '0 2px 12px rgba(54,64,151,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: '#eff0ff', color: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
                      infoLogia • Куратор көмекшісі
                    </div>
                    <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.6, fontWeight: 500 }}>
                      <div>1. Жаңа топ құрыңыз немесе таңдаңыз</div>
                      <div>2. Оқушылар тізімін тұтас мәтін ретінде қойыңыз</div>
                      <div>3. Аптасын таңдап, дайын постерді PNG түрінде жүктеп алыңыз</div>
                    </div>
                  </div>
                </div>
                <Btn variant="primary" size="sm" onClick={insertDemoData} sx={{ flexShrink: 0, padding: '8px 14px' }}>
                  <Plus size={14} />Үлгіні қою (28 оқушы)
                </Btn>
              </div>
            )}

            {/* Action Toolbar */}
            <div className="workspace-toolbar" style={{ width: '100%', maxWidth: '1020px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* 1. Download PNG (Green) */}
              <Btn variant="success" onClick={downloadPNG}>
                <Download size={14} />Суретті жүктеу (PNG)
              </Btn>

              {weekOverride && (
                <Btn variant="ghost" onClick={resetPairWeek}>
                  <RotateCcw size={14} /> Аптаны қалпына келтіру
                </Btn>
              )}

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

            <div className="poster-workspace">
              <p className="poster-instructions">Оқушыны басқа оқушының орнына сүйреңіз немесе екі есімді кезекпен басыңыз. Жұпты осы аптаға бекіту үшін 🔓 белгісін басыңыз. Құлыптар PNG файлында көрінбейді.</p>
              <PosterReorder key={`${activeGid}:${safeWeek}`} rows={pairRows} onSwap={swapPairStudents} onLocked={notifyLockedPair} locks={pairLockControls}>
                <Poster svgString={filledSvg} />
              </PosterReorder>
            </div>
          </main>
        </div>
      ) : activeTab === 'certificates' ? (
        <CertificateCatalog favorites={favoriteCertificates} onFavoriteChange={changeFavoriteCertificate}
          groups={groups} activeGroup={activeGroup} onSelectGroup={selectGroup}
          onSaveAward={saveCertificateAward} onDeleteAward={deleteCertificateAward} />
      ) : activeTab === 'plan' ? (
        <div className="plan-workspace">
        <nav className="plan-subject-nav" aria-label="Жоспар пәндері">
          <button className="planner-tab" type="button" aria-current={!planSubject ? 'page' : undefined} onClick={() => selectPlanSubject(null)}>Барлық пәндер</button>
          {PLAN_SUBJECTS.map(subject => <button className="planner-tab" key={subject.id} type="button"
            aria-current={planSubject === subject.id ? 'page' : undefined} onClick={() => selectPlanSubject(subject.id)}>{subject.name}</button>)}
        </nav>
        {!['informatics','mathematics','physics'].includes(planSubject) ? <PlanSubjects subject={planSubject} onSelect={selectPlanSubject}/> :
        <WeeklyPlanner userId={user?.id} syncState={syncState} groups={groups} activeGid={activeGid} selectGroup={selectGroup} notify={notify} subject={planSubject}
          onChange={(gid, week, plan, subject=planSubject) => {try{writePlanDraft(user.id,gid,week,plan,subject);}catch{notify('Құрылғыға сақтау мүмкін болмады. Cloud сақталуын күтіңіз.');}setGroups(current => current.map(g => g.id === gid ? {
            ...g, weeklyPlans: {...g.weeklyPlans, [subject]: {...g.weeklyPlans?.[subject], [week]: plan}},
          } : g));}} />}
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
