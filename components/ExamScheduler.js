'use client';

/* ══════════════════════════════════════════════════════════════════════════
   infoLogia • Сабақ тапсыру (Расписание сдачи экзамена)
   Live Canva SVG Template 2 Engine (1828 x 841)
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download, Shuffle, Clock, Plus, Trash2, Check,
  CalendarDays, ChevronDown, FolderOpen, Users, RotateCcw,
} from 'lucide-react';
import {
  fillSvgTemplate2, downloadSvg2AsPng, addMinutesToTime, RAW_SVG_TEMPLATE2, SLOT_NAME_Y,
} from '@/lib/svgTemplate2';
import { cleanStudentName } from '@/lib/utils';
import PosterReorder, { PosterLock } from './PosterReorder';

const BRAND = '#514fb1';

function examStudentRuleKey(student, roster) {
  const normalizedName = cleanStudentName(student?.name || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  const studentIndex = roster.findIndex(item => item.id === student?.id);
  const sameNameBefore = roster.slice(0, Math.max(0, studentIndex)).filter(item => cleanStudentName(item.name || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase() === normalizedName).length;
  return `${normalizedName}::${sameNameBefore + 1}`;
}

const DEMO_EXAM_STUDENTS = `Болатұлы Нұрдәулет
Еркинжан Каусар
Асқарұлы Дамир
Серікбай Аружан
Мұратұлы Әлихан
Жолдасбек Диана
Кеңес Азамат
Омарова Салтанат
Тұрсынбек Бауыржан
Нұрланқызы Аяулым
Бақытжан Ерасыл
Амангелді Мадина
Ибрагим Санжар
Қайратқызы Адина
Дәулетұлы Арман
Сейітқали Жансая
Бекболат Елдар
Маратқызы Іңкәр
Жұмабек Бексұлтан
Әділхан Дана
Сәбитұлы Нұрислам
Қасымбек Анель
Темірлан Айбек
Өмірзақ Айдана
Рамазанұлы Дінмұхаммед
Шәкәрім Толғанай
Хамит Мирас
Есенгелді Балнұр`;

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, fullWidth = false, sx = {}, ...buttonProps }) {
  const vars = {
    primary: { bg: BRAND,         fg: '#fff',     border: 'none' },
    ghost:   { bg: '#fff',        fg: '#374151', border: '1.5px solid #e5e7eb' },
    success: { bg: '#059669',     fg: '#fff',     border: 'none' },
    danger:  { bg: 'transparent', fg: '#dc2626', border: '1.5px solid #fecaca' },
  }[variant] || {};

  return (
    <button
      type="button"
      {...buttonProps}
      onClick={disabled ? undefined : onClick}
      className={`ui-button ui-button-${variant}`}
      disabled={disabled}
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
    <div className="field-label" style={{ fontSize: '10px', fontWeight: 800, color: '#475569', letterSpacing: '.06em', marginBottom: '5px' }}>
      {children}
    </div>
  );
}

function CleanInput({ value, onChange, placeholder, type = 'text', style: sx = {} }) {
  const [f, setF] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onFocus={() => setF(true)}
      onBlur={() => setF(false)}
      placeholder={placeholder}
      style={{
        width: '100%', border: `1.5px solid ${f ? BRAND : '#e2e8f0'}`,
        borderRadius: '8px', padding: '8px 11px', fontSize: '13px',
        color: '#111827', background: '#fff', outline: 'none', transition: 'border-color .15s',
        ...sx,
      }}
    />
  );
}

export default function ExamScheduler({
  groups = [],
  activeGid,
  selectGroup,
  createGroup,
  deleteGroup,
  newName,
  setNewName,
  newSubject,
  setNewSubject,
  showNewGroup,
  setShowNewGroup,
  students = [],
  rawText,
  setRawText,
  applyText,
  handleBlur,
  insertDemoData,
  activeGroup,
  onSaveGroup,
  savedAnim,
  notify,
}) {
  /* ── Time & Date Settings ───────────────────────────────── */
  const [examWeek, setExamWeek]         = useState(activeGroup?.examSettings?.examWeek || '1-апта');
  const [scheduleMode, setScheduleMode] = useState(activeGroup?.examSettings?.scheduleMode || 'single_day');

  // Dates
  const [dateSingle, setDateSingle] = useState(activeGroup?.examSettings?.dateSingle || '15-наурыз');
  const [dateCol1, setDateCol1]     = useState(activeGroup?.examSettings?.dateCol1 || '15-наурыз');
  const [dateCol2, setDateCol2]     = useState(activeGroup?.examSettings?.dateCol2 || '14-наурыз');

  // Times: standard <input type="time"> (no sticky masks, easy backspace)
  const [startTime, setStartTime]               = useState(activeGroup?.examSettings?.startTime || '10:00');
  const [manualStartTime2, setManualStartTime2] = useState(activeGroup?.examSettings?.manualStartTime2 || '11:20');
  const [interval, setInterval]                 = useState(activeGroup?.examSettings?.interval || 10);
  const [customOrder, setCustomOrder]           = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [slotOverrides, setSlotOverrides]       = useState(null);
  const [lockedSeats, setLockedSeats] = useState(activeGroup?.examSettings?.lockedSeats || {});
  const [individualTimes, setIndividualTimes] = useState(activeGroup?.examSettings?.individualTimes || {});
  const [individualStudentId, setIndividualStudentId] = useState('');
  const [individualTimeDraft, setIndividualTimeDraft] = useState('18:00');

  useEffect(() => {
    setSlotOverrides(activeGroup?.examSettings?.slotOverrides || null);
    setLockedSeats(activeGroup?.examSettings?.lockedSeats || {});
    setCustomOrder(activeGroup?.examSettings?.customOrder || null);
    setIndividualTimes(activeGroup?.examSettings?.individualTimes || {});
  }, [activeGroup?.id]);

  // Auto-calculated Column 2 Start Time for single_day mode
  const effectiveStartTime2 = useMemo(() => {
    if (scheduleMode === 'single_day') {
      return addMinutesToTime(startTime, 8 * interval);
    }
    return manualStartTime2 || '11:20';
  }, [scheduleMode, startTime, interval, manualStartTime2]);

  const effectiveDate1 = scheduleMode === 'single_day' ? dateSingle : dateCol1;
  const effectiveDate2 = scheduleMode === 'single_day' ? dateSingle : dateCol2;
  const individualAppointments = useMemo(() => Object.entries(individualTimes || {})
    .map(([key, time]) => ({ student: students.find(s => examStudentRuleKey(s, students) === key), time }))
    .filter(item => item.student && item.time)
    .sort((a, b) => a.time.localeCompare(b.time) || a.student.name.localeCompare(b.student.name)), [individualTimes, students]);

  /* ── SVG Template 2 ─────────────────────────────────────── */
  const [svgTemplate2, setSvgTemplate2] = useState(RAW_SVG_TEMPLATE2);

  useEffect(() => {
    fetch('/template2.svg')
      .then(r => r.text())
      .then(text => {
        if (text && text.includes('<svg')) {
          setSvgTemplate2(text);
        }
      })
      .catch(err => {
        console.warn('Using embedded template2 fallback:', err);
      });
  }, []);

  /* ── Distribute students into 16 slots (8 left, 8 right) ── */
  const slots = useMemo(() => {
    const list = [...students].map(s => ({
      ...s,
      name: cleanStudentName(s.name),
    }));
    const map = new Map(list.map(s => [s.id, s]));
    const order = Array(list.length).fill(null);
    Object.entries(lockedSeats || {}).forEach(([id, seat]) => {
      const index = Number(seat);
      if (map.has(id) && Number.isInteger(index) && index >= 0 && index < order.length && !order[index]) order[index] = id;
    });
    const fixedIds = new Set(Object.keys(lockedSeats || {}));
    const remaining = [...(customOrder || []).filter(id => map.has(id) && !fixedIds.has(id)), ...list.map(s => s.id).filter(id => !(customOrder || []).includes(id) && !fixedIds.has(id))];
    let cursor = 0;
    for (let i = 0; i < order.length; i++) if (!order[i]) order[i] = remaining[cursor++];
    const arranged = order.map(id => map.get(id)).filter(Boolean);

    const res = [];
    for (let i = 0; i < 16; i++) {
      const s1 = arranged[i * 2] || null;
      const s2 = arranged[i * 2 + 1] || null;
      res.push([s1, s2].filter(Boolean));
    }
    return res;
  }, [students, customOrder, lockedSeats]);

  const arrangedSlots = useMemo(() => {
    if (!slotOverrides?.length) return slots;
    const roster = new Map(students.map(student => [student.id, student]));
    const savedIds = slotOverrides.flat().map(student => student.id);
    if (savedIds.length !== slots.flat().length || new Set(savedIds).size !== savedIds.length ||
        savedIds.some(id => !roster.has(id))) return slots;
    return slotOverrides.map(slot => slot.map(student => roster.get(student.id)));
  }, [slots, slotOverrides, students]);

  const effectiveSlots = useMemo(() => {
    const individualIds = new Set(individualAppointments.map(({ student }) => student.id));
    return arrangedSlots.map(slot => slot.filter(student => !individualIds.has(student.id)));
  }, [arrangedSlots, individualAppointments]);

  /* ── Real-Time Dynamic SVG 2 Generation ─────────────────── */
  const filledSvg2 = useMemo(() => {
    return fillSvgTemplate2(svgTemplate2, {
      weekText: examWeek,
      date1Text: effectiveDate1,
      date2Text: effectiveDate2,
      startTime1: startTime,
      startTime2: effectiveStartTime2,
      intervalMinutes: interval,
      slots: effectiveSlots,
      individualAppointments,
    });
  }, [svgTemplate2, examWeek, effectiveDate1, effectiveDate2, startTime, effectiveStartTime2, interval, effectiveSlots, individualAppointments]);

  /* ── Shuffle Action ─────────────────────────────────────── */
  const shuffleStudents = useCallback(() => {
    if (students.length === 0) {
      notify('Оқушылар тізімі бос');
      return;
    }
    const fixedIds = new Set(Object.keys(lockedSeats || {}));
    const movable = students.filter(s => !fixedIds.has(s.id)).map(s => s.id);
    for (let i = movable.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [movable[i], movable[j]] = [movable[j], movable[i]]; }
    const order = Array(students.length).fill(null);
    Object.entries(lockedSeats || {}).forEach(([id, seat]) => { const index = Number(seat); if (students.some(s => s.id === id) && index >= 0 && index < order.length) order[index] = id; });
    let cursor = 0;
    for (let i = 0; i < order.length; i++) if (!order[i]) order[i] = movable[cursor++];
    const shuffled = order.filter(Boolean);
    setCustomOrder(shuffled);
    setSlotOverrides(null);
    onSaveGroup?.({ ...(activeGroup?.examSettings || {}), lockedSeats, customOrder: shuffled, slotOverrides: null });
    notify('🎲 Оқушылар кездейсоқ ретпен қайта бөлінді!');
  }, [students, lockedSeats, onSaveGroup, activeGroup, notify]);

  const resetOrder = useCallback(() => {
    setCustomOrder(null);
    setSlotOverrides(null);
    onSaveGroup?.({ ...(activeGroup?.examSettings || {}), lockedSeats, customOrder: null, slotOverrides: null });
    notify('Тізім реті қалпына келтірілді');
  }, [lockedSeats, onSaveGroup, activeGroup, notify]);

  function toggleStudentLockAtSeat(studentId, seatIndex) {
    const next = { ...lockedSeats };
    if (Object.hasOwn(next, studentId)) {
      delete next[studentId];
    } else {
      const occupant = Object.entries(next).find(([id, seat]) => id !== studentId && Number(seat) === seatIndex)?.[0];
      if (occupant) delete next[occupant];
      next[studentId] = seatIndex;
    }
    setLockedSeats(next);
    onSaveGroup?.({ ...(activeGroup?.examSettings || {}), lockedSeats: next, customOrder, slotOverrides });
  }

  function saveIndividualTime(studentKey, time) {
    if (!studentKey || !time) {
      notify('Оқушы мен жеке уақытты таңдаңыз');
      return;
    }
    const next = { ...individualTimes, [studentKey]: time };
    setIndividualTimes(next);
    onSaveGroup?.({ individualTimes: next });
    setIndividualStudentId('');
    notify('Жеке тапсыру уақыты сақталды ✓');
  }

  function removeIndividualTime(studentKey) {
    const next = { ...individualTimes };
    delete next[studentKey];
    setIndividualTimes(next);
    onSaveGroup?.({ ...(activeGroup?.examSettings || {}), individualTimes: next });
    notify('Жеке уақыт алынып тасталды');
  }

  function notifyLocked() {
    notify('Орын ауыстыру үшін алдымен құлыпты ашыңыз');
  }

  function swapStudents(firstId, secondId) {
    if (Object.hasOwn(lockedSeats, firstId) || Object.hasOwn(lockedSeats, secondId)) {
      notifyLocked();
      return;
    }
    const first = effectiveSlots.flat().find(student => student.id === firstId);
    const second = effectiveSlots.flat().find(student => student.id === secondId);
    if (!first || !second || firstId === secondId) return;

    const next = arrangedSlots.map(slot => slot.map(student => {
      if (student.id === firstId) return second;
      if (student.id === secondId) return first;
      return student;
    }));
    setSlotOverrides(next);
    onSaveGroup?.({ slotOverrides: next });
  }

  function resetSwaps() {
    setSlotOverrides(null);
    onSaveGroup?.({ slotOverrides: null });
  }

  /* ── PNG Export ─────────────────────────────────────────── */
  async function downloadPNG() {
    try {
      const fileName = `сабақ_тапсыру_${activeGroup?.name || 'топ'}_${examWeek}.png`;
      await downloadSvg2AsPng(filledSvg2, fileName);
      notify('PNG сурет сәтті жүктелді!');
    } catch (e) {
      console.error(e);
      notify('Қате: ' + (e?.message || e));
    }
  }

  /* ── Save Current Settings ──────────────────────────────── */
  function handleSave() {
    onSaveGroup?.({
      examWeek,
      scheduleMode,
      dateSingle,
      dateCol1,
      dateCol2,
      startTime,
      manualStartTime2,
      interval,
      slotOverrides,
      lockedSeats,
      customOrder,
      individualTimes,
    });
  }

  const posterHeight = Number(filledSvg2.match(/viewBox="0 0 1828 ([\d.]+)"/)?.[1]) || 841;
  const posterRows = effectiveSlots.flatMap((slot, slotIndex) => {
    if (!slot.length) return [];
    const left = slotIndex < 8;
    const row = slotIndex % 8;
    const start = addMinutesToTime(left ? startTime : effectiveStartTime2, row * interval);
    return [{
      key: slotIndex,
      label: `${left ? effectiveDate1 : effectiveDate2} · ${start}–${addMinutesToTime(start, interval)}`,
      students: slot.map((student, studentIndex) => {
        const y = SLOT_NAME_Y[row][studentIndex === 0 ? 'y1' : 'y2'];
        const seatIndex = slotIndex * 2 + arrangedSlots[slotIndex].findIndex(item => item.id === student.id);
        const locked = Object.hasOwn(lockedSeats, student.id);
        return {
          id: student.id,
          name: student.name,
          locked,
          position: {
            left: left ? '13.48%' : '61.05%',
            top: `${y / posterHeight * 100}%`,
            width: '14%',
            height: `${32 / posterHeight * 100}%`,
          },
          lock: {
            locked,
            label: `${student.name}: ${locked ? 'орынды бекітуден алу' : 'орынды бекіту'}`,
            onClick: () => toggleStudentLockAtSeat(student.id, seatIndex),
            style: { left: left ? '23.96%' : '71.39%', top: `${y / posterHeight * 100}%` },
          },
        };
      }),
    }];
  });
  const seatLockControls = posterRows.flatMap(row => row.students.map(student => (
    <PosterLock key={student.id} {...student.lock} />
  )));

  /* ──────────────────────────────────────────────────────────── */
  return (
    <div className="pair-workspace exam-workspace" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ════ LEFT PANEL: Settings & Group Management ═════════ */}
      <aside className="workspace-sidebar exam-sidebar">
        <div className="exam-sidebar-top">
          <section>
            <FieldLabel>ТАҢДАЛҒАН ТОП</FieldLabel>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                aria-label="Таңдалған топ"
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
            </div>
          </section>
          <div className="exam-edit-actions" role="group" aria-label="Кесте әрекеттері">
            <Btn onClick={handleSave}>
              <Check size={14} /> {savedAnim ? 'Сақталды' : 'Сақтау'}
            </Btn>
            <Btn variant="ghost" onClick={shuffleStudents} disabled={!students.length}>
              <Shuffle size={14} /> Араластыру
            </Btn>
            {(slotOverrides || customOrder) && (
              <Btn variant="ghost" onClick={slotOverrides ? resetSwaps : resetOrder} title="Бастапқы ретке қайтару" aria-label="Бастапқы ретке қайтару">
                <RotateCcw size={14} />
              </Btn>
            )}
          </div>
          <div className="exam-tool-buttons" role="group" aria-label="Кестені өңдеу">
            {[
              { id: 'students', Icon: Users, label: `Оқушылар (${students.length})` },
              { id: 'individual', Icon: Clock, label: individualAppointments.length ? `Жеке уақыт (${individualAppointments.length})` : 'Жеке уақыт' },
              { id: 'groups', Icon: FolderOpen, label: 'Менің топтарым' },
            ].map(({ id, Icon, label }) => (
              <Btn
                key={id}
                variant="ghost"
                aria-expanded={activeTool === id}
                aria-controls="exam-tool-panel"
                onClick={() => setActiveTool(tool => tool === id ? null : id)}
              >
                <Icon size={14} /> {label}
              </Btn>
            ))}
          </div>
          <button
            type="button"
            className={activeTool ? 'exam-settings-toggle has-active-tool' : 'exam-settings-toggle'}
            aria-expanded={!activeTool && showSettings}
            aria-controls="exam-settings-fields"
            onClick={() => {
              if (activeTool) {
                setActiveTool(null);
                setShowSettings(true);
              } else {
                setShowSettings(open => !open);
              }
            }}
          >
            <CalendarDays size={16} />
            <span>Кесте баптаулары</span>
            <ChevronDown size={15} />
          </button>
        </div>
        <div className="exam-sidebar-body">
          <div id="exam-settings-fields" hidden={Boolean(activeTool)} className={showSettings ? 'exam-settings-fields is-open' : 'exam-settings-fields'}>
            {/* 3 · Week Name */}
            <section>
              <FieldLabel>АПТА АТАУЫ (ПОСТЕРДЕГІ БЕЙДЖ)</FieldLabel>
              <CleanInput value={examWeek} onChange={e => setExamWeek(e.target.value)} placeholder='Мыс: "1-апта"' />
            </section>

            {/* 4 · Time and Date Settings (No sticky masks, standard time inputs) */}
            <section style={{
              background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: '12px', padding: '14px',
              display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color={BRAND} />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#1f2937', letterSpacing: '.04em' }}>
                  УАҚЫТ ЖӘНЕ КҮНДІ БАПТАУ
                </span>
              </div>

              {/* Mode Switcher Toggle */}
              <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => setScheduleMode('single_day')}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    fontSize: '11.5px', fontWeight: 700, transition: 'all .12s',
                    background: scheduleMode === 'single_day' ? '#fff' : 'transparent',
                    color: scheduleMode === 'single_day' ? BRAND : '#64748b',
                    boxShadow: scheduleMode === 'single_day' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  Бір күнде қатарынан
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode('two_shifts')}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    fontSize: '11.5px', fontWeight: 700, transition: 'all .12s',
                    background: scheduleMode === 'two_shifts' ? '#fff' : 'transparent',
                    color: scheduleMode === 'two_shifts' ? BRAND : '#64748b',
                    boxShadow: scheduleMode === 'two_shifts' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  Екі бөлек күн / ауысым
                </button>
              </div>

              {/* Date Input(s) */}
              {scheduleMode === 'single_day' ? (
                <div>
                  <FieldLabel>ТАПСЫРУ КҮНІ</FieldLabel>
                  <CleanInput value={dateSingle} onChange={e => setDateSingle(e.target.value)} placeholder='Мыс: "15-наурыз"' />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <FieldLabel>1-БАҒАНА КҮНІ</FieldLabel>
                    <CleanInput value={dateCol1} onChange={e => setDateCol1(e.target.value)} placeholder='Мыс: "15-наурыз"' />
                  </div>
                  <div>
                    <FieldLabel>2-БАҒАНА КҮНІ</FieldLabel>
                    <CleanInput value={dateCol2} onChange={e => setDateCol2(e.target.value)} placeholder='Мыс: "14-наурыз"' />
                  </div>
                </div>
              )}

              {/* Time Input(s) */}
              {scheduleMode === 'single_day' ? (
                <div>
                  <FieldLabel>БАСТАЛУ УАҚЫТЫ</FieldLabel>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    style={{
                      width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px',
                      padding: '8px 11px', fontSize: '14px', fontWeight: 700,
                      color: '#111827', background: '#fff', outline: 'none',
                    }}
                  />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', lineHeight: 1.4 }}>
                    💡 2-бағана автоматты түрде сағат <strong style={{ color: BRAND }}>{effectiveStartTime2}</strong>-де басталады.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <FieldLabel>1-БАҒАНА БАСТАЛУЫ</FieldLabel>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      style={{
                        width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px',
                        padding: '8px 10px', fontSize: '13px', fontWeight: 700,
                        color: '#111827', background: '#fff', outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <FieldLabel>2-БАҒАНА БАСТАЛУЫ</FieldLabel>
                    <input
                      type="time"
                      value={manualStartTime2}
                      onChange={e => setManualStartTime2(e.target.value)}
                      style={{
                        width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '8px',
                        padding: '8px 10px', fontSize: '13px', fontWeight: 700,
                        color: '#111827', background: '#fff', outline: 'none',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Interval Quick Buttons */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <FieldLabel>СТ ҰЗАҚТЫҒЫ (ИНТЕРВАЛ)</FieldLabel>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: BRAND }}>{interval} мин</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[10, 15, 20].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setInterval(m)}
                      style={{
                        flex: 1, padding: '7px', borderRadius: '7px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 800,
                        border: `1.5px solid ${interval === m ? BRAND : '#cbd5e1'}`,
                        background: interval === m ? BRAND : '#fff',
                        color: interval === m ? '#fff' : '#475569',
                        transition: 'all .12s',
                      }}
                    >
                      {m} мин
                    </button>
                  ))}
                </div>
              </div>
            </section>

          </div>
          <div id="exam-tool-panel" className="exam-tool-panel" hidden={!activeTool}>
            {activeTool === 'students' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setRawText(DEMO_EXAM_STUDENTS);
                      applyText(DEMO_EXAM_STUDENTS, { stripPhones: true });
                      notify('Үлгі оқушылар тізімі қойылды (телефонсыз) ✓');
                    }}
                    title="28 оқушының телефонсыз демо-тізімін қою"
                    style={{
                      background: '#eff0ff', border: '1px solid #c7d5f8',
                      color: BRAND, borderRadius: '6px', padding: '2px 8px',
                      fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      transition: 'all .15s'
                    }}
                  >
                    <Plus size={12} />Үлгіні қою (телефонсыз)
                  </button>
                </div>
                <textarea
                  aria-label="Оқушылар тізімі"
                  value={rawText}
                  onChange={e => { setRawText(e.target.value); applyText(e.target.value, { stripPhones: true }); }}
                  onBlur={() => handleBlur && handleBlur({ stripPhones: true })}
                  placeholder={
                    'Оқушылар тізімін әр жолға бір оқушыдан қойыңыз:\n\n' +
                    'Болатұлы Нұрдәулет\n' +
                    'Еркинжан Каусар\n' +
                    'Қадыр Алихан\n\n' +
                    'Телефон нөмірлері қажет емес (егер бар болса, автоматты түрде алынып тасталады).'
                  }
                  style={{
                    width: '100%', minHeight: '130px',
                    border: '1.5px solid #e5e7eb', borderRadius: '8px',
                    padding: '10px 12px', fontSize: '12px', color: '#111827',
                    background: '#fff', fontFamily: 'monospace',
                    lineHeight: '1.7', resize: 'vertical', outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = BRAND}
                />
              </div>
            )}
            {activeTool === 'individual' && (
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>Жеке уақыт тағайындалған оқушы постердің соңында көрсетіледі.</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 95px', gap: '6px', marginBottom: '7px' }}>
                  <select value={individualStudentId} onChange={e => setIndividualStudentId(e.target.value)} aria-label="Жеке уақыт қоятын оқушыны таңдаңыз" style={{ minWidth: 0, padding: '8px', borderRadius: '7px', border: '1px solid #d1d5db', background: '#fff', fontSize: '12px' }}>
                    <option value="">Оқушыны таңдаңыз</option>
                    {students.map(student => { const key = examStudentRuleKey(student, students); return <option key={key} value={key}>{student.name}</option>; })}
                  </select>
                  <input type="time" value={individualTimeDraft} onChange={e => setIndividualTimeDraft(e.target.value)} aria-label="Жеке тапсыру уақыты" style={{ width: '100%', padding: '7px', borderRadius: '7px', border: '1px solid #d1d5db', background: '#fff' }} />
                </div>
                <Btn size="sm" onClick={() => saveIndividualTime(individualStudentId, individualTimeDraft)} fullWidth sx={{ justifyContent: 'center' }}>+ Жеке уақыт қосу</Btn>
                {individualAppointments.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '9px' }}>
                  {individualAppointments.map(({ student, time }) => { const key = examStudentRuleKey(student, students); return <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: '#fff', border: '1px solid #e9e5ff', borderRadius: '7px', padding: '6px 8px' }}>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</span><b style={{ color: BRAND }}>{time}</b>
                    <button type="button" onClick={() => removeIndividualTime(key)} aria-label={`${student.name}: жеке уақытты жою`} title="Жеке уақытты жою" style={{ border: 0, background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: '15px', padding: '0 2px' }}>×</button>
                  </div>; })}
                </div>}
              </div>
            )}
            {activeTool === 'groups' && (
              <div>
                <Btn size="sm" onClick={() => setShowNewGroup(open => !open)} aria-expanded={showNewGroup} sx={{ marginBottom: '10px' }}>
                  <Plus size={14} /> Жаңа топ
                </Btn>
                {showNewGroup && (
                  <div style={{
                    marginTop: '10px', background: '#f8fafc',
                    border: '1.5px solid #e5e7eb', borderRadius: '10px',
                    padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
                  }}>
                    <div>
                      <FieldLabel>ТОП АТЫ</FieldLabel>
                      <CleanInput value={newName} onChange={e => setNewName(e.target.value)} placeholder='Мыс: "Инфо-45"' />
                    </div>
                    <div>
                      <FieldLabel>ПӘНІ</FieldLabel>
                      <CleanInput value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder='Мыс: "Информатика"' />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Btn onClick={createGroup} sx={{ flex: 1 }}>Жасау</Btn>
                      <Btn variant="ghost" onClick={() => setShowNewGroup(false)}>Бас тарту</Btn>
                    </div>
                  </div>
                )}
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
                            background: isActive ? '#eff6ff' : '#f8fafc',
                            border: `1.5px solid ${isActive ? '#93c5fd' : '#e2e8f0'}`,
                            borderRadius: '10px', padding: '9px 11px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {g.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '1px' }}>
                              {g.subject || 'Пәнсіз'} • {g.students_exam?.length || 0} оқушы
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                            <button
                              onClick={() => selectGroup(g.id)}
                              style={{
                                padding: '4px 9px', borderRadius: '6px', border: 'none',
                                background: isActive ? BRAND : '#ffffff',
                                color: isActive ? '#ffffff' : '#334155',
                                fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                              }}
                            >
                              {isActive ? 'Ашық' : 'Ашу'}
                            </button>
                            <button
                              onClick={() => deleteGroup(g.id)}
                              title="Жою"
                              style={{
                                padding: '4px 6px', borderRadius: '6px', border: '1px solid #fee2e2',
                                background: '#fff', color: '#ef4444', cursor: 'pointer'
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ════ RIGHT PANEL: Live Canvas SVG Poster ════════════ */}
      <main className="workspace-main exam-main" style={{
        flex: 1, overflowY: 'auto', background: '#f1f3ff',
        padding: '24px', display: 'flex', flexDirection: 'column',
        gap: '14px', alignItems: 'center',
      }}>

        <div className="workspace-heading exam-preview-header">
          <h1>Сабақ тапсыру</h1>
          <div className="workspace-toolbar exam-export-actions">
            <Btn variant="success" onClick={downloadPNG}>
              <Download size={14} /> PNG жүктеу
            </Btn>
          </div>
        </div>

        <div className="poster-workspace">
          <p className="poster-instructions">Оқушыны басқа оқушының орнына сүйреңіз немесе екі есімді кезекпен басыңыз. 🔓 арқылы орынды бекітіңіз. Құлыптар PNG файлында көрінбейді.</p>
          <PosterReorder key={activeGid} rows={posterRows} onSwap={swapStudents} onLocked={notifyLocked} locks={seatLockControls}>
            <div id="poster-export-exam" className="exam-poster-image" dangerouslySetInnerHTML={{ __html: filledSvg2 }} />
          </PosterReorder>
        </div>
      </main>
    </div>
  );
}
