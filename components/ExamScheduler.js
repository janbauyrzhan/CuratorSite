'use client';

/* ══════════════════════════════════════════════════════════════════════════
   infoLogia • Сабақ тапсыру (Расписание сдачи экзамена)
   Live Canva SVG Template 2 Engine (1828 x 841)
   ══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download, Shuffle, Clock, Plus, Trash2, Check,
} from 'lucide-react';
import {
  fillSvgTemplate2, downloadSvg2AsPng, addMinutesToTime, RAW_SVG_TEMPLATE2,
} from '@/lib/svgTemplate2';
import { cleanStudentName } from '@/lib/utils';

const BRAND = '#1D3597';

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

function Btn({ children, onClick, variant = 'primary', size = 'md', disabled = false, fullWidth = false, sx = {} }) {
  const vars = {
    primary: { bg: BRAND,         fg: '#fff',     border: 'none' },
    ghost:   { bg: '#fff',        fg: '#374151', border: '1.5px solid #e5e7eb' },
    success: { bg: '#059669',     fg: '#fff',     border: 'none' },
    danger:  { bg: 'transparent', fg: '#dc2626', border: '1.5px solid #fecaca' },
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
    <div style={{ fontSize: '10px', fontWeight: 800, color: '#475569', letterSpacing: '.06em', marginBottom: '5px' }}>
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
  const [showStudentList, setShowStudentList]   = useState(false);

  // Auto-calculated Column 2 Start Time for single_day mode
  const effectiveStartTime2 = useMemo(() => {
    if (scheduleMode === 'single_day') {
      return addMinutesToTime(startTime, 8 * interval);
    }
    return manualStartTime2 || '11:20';
  }, [scheduleMode, startTime, interval, manualStartTime2]);

  const effectiveDate1 = scheduleMode === 'single_day' ? dateSingle : dateCol1;
  const effectiveDate2 = scheduleMode === 'single_day' ? dateSingle : dateCol2;

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
    let list = [...students].map(s => ({
      ...s,
      name: cleanStudentName(s.name),
    }));
    if (customOrder && customOrder.length > 0) {
      const map = new Map(list.map(s => [s.id, s]));
      const ordered = customOrder.map(id => map.get(id)).filter(Boolean);
      const remaining = list.filter(s => !customOrder.includes(s.id));
      list = [...ordered, ...remaining];
    }

    const res = [];
    for (let i = 0; i < 16; i++) {
      const s1 = list[i * 2] || null;
      const s2 = list[i * 2 + 1] || null;
      const pair = [s1, s2].filter(Boolean);
      res.push(pair);
    }
    return res;
  }, [students, customOrder]);

  /* ── Real-Time Dynamic SVG 2 Generation ─────────────────── */
  const filledSvg2 = useMemo(() => {
    return fillSvgTemplate2(svgTemplate2, {
      weekText: examWeek,
      date1Text: effectiveDate1,
      date2Text: effectiveDate2,
      startTime1: startTime,
      startTime2: effectiveStartTime2,
      intervalMinutes: interval,
      slots,
    });
  }, [svgTemplate2, examWeek, effectiveDate1, effectiveDate2, startTime, effectiveStartTime2, interval, slots]);

  /* ── Shuffle Action ─────────────────────────────────────── */
  const shuffleStudents = useCallback(() => {
    if (students.length === 0) {
      notify('Оқушылар тізімі бос');
      return;
    }
    const shuffled = [...students].sort(() => Math.random() - 0.5).map(s => s.id);
    setCustomOrder(shuffled);
    notify('🎲 Оқушылар кездейсоқ ретпен қайта бөлінді!');
  }, [students, notify]);

  const resetOrder = useCallback(() => {
    setCustomOrder(null);
    notify('Тізім реті қалпына келтірілді');
  }, [notify]);

  /* ── PNG Export ─────────────────────────────────────────── */
  async function downloadPNG() {
    try {
      const fileName = `сабақ_тапсыру_${activeGroup?.name || 'топ'}_${examWeek}.png`;
      await downloadSvg2AsPng(filledSvg2, fileName);
      notify('PNG сурет сәтті жүктелді (1828 × 841)!');
    } catch (e) {
      console.error(e);
      notify('Қате: ' + (e?.message || e));
    }
  }

  /* ── WhatsApp Text Copy ─────────────────────────────────── */
  const copyWhatsApp = useCallback(() => {
    if (!students || students.length === 0) {
      notify('Оқушылар тізімі бос');
      return;
    }
    const cleanWeek = (examWeek || '1-АПТА').toUpperCase();
    const groupTitle = activeGroup?.name ? activeGroup.name : 'Топ';
    const subjTitle = activeGroup?.subject ? ` (${activeGroup.subject})` : '';

    let text = `📅 ${cleanWeek} • САБАҚ ТАПСЫРУ КЕСТЕСІ\n👥 Топ: ${groupTitle}${subjTitle}\n`;

    if (scheduleMode === 'single_day') {
      text += `\n📍 ${effectiveDate1}:\n`;
      let hasAny = false;
      for (let i = 0; i < 16; i++) {
        const slotData = slots[i] || [];
        if (slotData.length === 0) continue;
        hasAny = true;
        const sStart = i < 8
          ? addMinutesToTime(startTime, i * interval)
          : addMinutesToTime(effectiveStartTime2, (i - 8) * interval);
        const sEnd = addMinutesToTime(sStart, interval);
        const names = slotData.map(s => s.name).join(', ');
        text += `• ${sStart} - ${sEnd}: ${names}\n`;
      }
      if (!hasAny) text += `(бос)\n`;
    } else {
      text += `\n📍 ${effectiveDate1} (1-бағана):\n`;
      let col1Has = false;
      for (let i = 0; i < 8; i++) {
        const slotData = slots[i] || [];
        if (slotData.length === 0) continue;
        col1Has = true;
        const sStart = addMinutesToTime(startTime, i * interval);
        const sEnd = addMinutesToTime(sStart, interval);
        const names = slotData.map(s => s.name).join(', ');
        text += `• ${sStart} - ${sEnd}: ${names}\n`;
      }
      if (!col1Has) text += `(бос)\n`;

      text += `\n📍 ${effectiveDate2} (2-бағана):\n`;
      let col2Has = false;
      for (let i = 8; i < 16; i++) {
        const slotData = slots[i] || [];
        if (slotData.length === 0) continue;
        col2Has = true;
        const sStart = addMinutesToTime(effectiveStartTime2, (i - 8) * interval);
        const sEnd = addMinutesToTime(sStart, interval);
        const names = slotData.map(s => s.name).join(', ');
        text += `• ${sStart} - ${sEnd}: ${names}\n`;
      }
      if (!col2Has) text += `(бос)\n`;
    }

    navigator.clipboard.writeText(text.trim())
      .then(() => notify('WhatsApp мәтіні көшірілді! ✓'))
      .catch(() => notify('Көшіру мүмкін болмады'));
  }, [students, examWeek, activeGroup, scheduleMode, effectiveDate1, effectiveDate2, startTime, effectiveStartTime2, interval, slots, notify]);

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
    });
  }

  /* ──────────────────────────────────────────────────────────── */
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

      {/* ════ LEFT PANEL: Settings & Group Management ═════════ */}
      <aside style={{
        width: '360px', flexShrink: 0,
        background: '#fff', borderRight: '1.5px solid #e5e7eb',
        overflowY: 'auto', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '18px',
      }}>

        {/* 1 · Save Button */}
        <section>
          <button
            type="button"
            onClick={handleSave}
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
        </section>

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

        {/* 5 · Student List (Accordion) */}
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
              <span>👥 Оқушылар тізімін көру / өзгерту ({students.length})</span>
              <span style={{ color: BRAND, fontSize: '13px', fontWeight: 800 }}>
                {showStudentList ? '▴' : '▾'}
              </span>
            </button>

            {showStudentList && (
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
                      background: '#eef1fb', border: '1px solid #c7d5f8',
                      color: BRAND, borderRadius: '6px', padding: '2px 8px',
                      fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      transition: 'all .15s'
                    }}
                  >
                    ✨ Үлгіні қою (телефонсыз)
                  </button>
                </div>
                <textarea
                  value={rawText}
                  onChange={e => { setRawText(e.target.value); applyText(e.target.value, { stripPhones: true }); }}
                  onBlur={() => handleBlur && handleBlur({ stripPhones: true })}
                  placeholder={
                    'Оқушылар тізімін әр жолға бір оқушыдан қойыңыз (немесе сплошной мәтінмен):\n\n' +
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
          </div>
        </section>

        {/* 6 · Distribution / Shuffle Button */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Btn onClick={shuffleStudents} fullWidth sx={{ justifyContent: 'center', padding: '10px' }}>
            <Shuffle size={14} /> Оқушыларды араластыру
          </Btn>
          {customOrder && (
            <button
              onClick={resetOrder}
              style={{
                background: 'none', border: 'none', color: '#64748b',
                fontSize: '11px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline'
              }}
            >
              Бастапқы ретке қайтару
            </button>
          )}
        </section>

        {/* 7 · «Менің топтарым» Section */}
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
                        {g.subject || 'Пәнсіз'} • {g.students?.length || 0} оқушы
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
        </section>

      </aside>

      {/* ════ RIGHT PANEL: Live Canvas SVG Poster ════════════ */}
      <main style={{
        flex: 1, overflowY: 'auto', background: '#f1f5f9',
        padding: '24px', display: 'flex', flexDirection: 'column',
        gap: '14px', alignItems: 'center',
      }}>

        {/* Action Toolbar */}
        <div style={{ width: '100%', maxWidth: '1060px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* 1. Download PNG */}
          <Btn variant="success" onClick={downloadPNG}>
            <Download size={14} />Суретті жүктеу (PNG)
          </Btn>

          {/* 2. Copy WhatsApp text */}
          <Btn variant="ghost" onClick={copyWhatsApp}>
            💬 WhatsApp мәтінін көшіру
          </Btn>
        </div>

        {/* Live SVG Poster 2 */}
        <div style={{ width: '100%', maxWidth: '1060px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            id="poster-export-exam"
            style={{
              width: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              background: '#ffffff',
            }}
            dangerouslySetInnerHTML={{ __html: filledSvg2 }}
          />
        </div>
      </main>
    </div>
  );
}
