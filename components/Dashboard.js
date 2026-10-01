'use client';

/* ══════════════════════════════════════════════════════════════════════════
   infoLogia • Dashboard (Басты бет)
   Modern, animated, high-conversion curator workspace dashboard
   ══════════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import {
  Users, Clock, ArrowRight, Sparkles, Plus, GraduationCap, CheckCircle2, ChevronRight, Layers,
} from 'lucide-react';

const BRAND_BLUE = '#1D3597';
const BRAND_RED  = '#E52E2E';

export default function Dashboard({
  user,
  groups = [],
  activeGid,
  selectGroup,
  setShowNewGroup,
  students = [],
  onNavigate,
  onInsertDemo,
}) {
  const [hoveredCard, setHoveredCard] = useState(null);
  const activeGroup = groups.find(g => g.id === activeGid) || null;

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      padding: '32px 24px 48px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '1120px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* ══ 1. WELCOME BANNER ═════════════════════════════════ */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '24px 28px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}>
          {/* Left Text */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #1D3597 0%, #2b4cc4 100%)',
              color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(29, 53, 151, 0.25)', flexShrink: 0,
            }}>
              <GraduationCap size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, background: '#eef1fb', color: BRAND_BLUE, padding: '3px 10px', borderRadius: '999px', letterSpacing: '.06em' }}>
                  КУРАТОРДЫҢ ЖЕКЕ КАБИНЕТІ
                </span>
                {user?.email && (
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    • {user.email}
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111827', margin: '4px 0 2px', letterSpacing: '-0.5px' }}>
                Қош келдіңіз! Неден бастаймыз?
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>
                Сынып жұптарын карусельмен бөліңіз немесе емтихан тапсыру кестесін жасаңыз.
              </p>
            </div>
          </div>

          {/* Right: Quick Group Selector */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: '280px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '.06em', marginBottom: '2px' }}>
                АҒЫМДАҒЫ ТОП
              </div>
              <select
                value={activeGid || ''}
                onChange={e => e.target.value && selectGroup(e.target.value)}
                style={{
                  width: '100%', border: 'none', background: 'transparent',
                  fontSize: '13px', fontWeight: 700, color: '#111827',
                  outline: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                {!groups.length && <option value="">Топ таңдалмаған</option>}
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}{g.subject ? ` — ${g.subject}` : ''}</option>
                ))}
              </select>
            </div>
            {students.length > 0 && (
              <span style={{
                background: '#e2e8f0', color: '#334155', fontSize: '11px',
                fontWeight: 800, padding: '2px 8px', borderRadius: '999px', whiteSpace: 'nowrap',
              }}>
                {students.length} оқушы
              </span>
            )}
            <button
              onClick={() => { setShowNewGroup(true); onNavigate('pairs'); }}
              title="Жаңа топ қосу"
              style={{
                width: '28px', height: '28px', borderRadius: '7px',
                background: BRAND_BLUE, color: '#fff', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* ══ 2. TWO MAIN MODULE CARDS ═════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px',
        }}>

          {/* ── CARD 1: ЖҰПТЫҚ ЖҰМЫС (Blue #1D3597) ────────── */}
          <div
            onClick={() => onNavigate('pairs')}
            onMouseEnter={() => setHoveredCard('pairs')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              border: '2px solid',
              borderColor: hoveredCard === 'pairs' ? BRAND_BLUE : '#e2e8f0',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: hoveredCard === 'pairs' ? 'translateY(-6px)' : 'translateY(0)',
              boxShadow: hoveredCard === 'pairs'
                ? '0 20px 40px rgba(29, 53, 151, 0.12)'
                : '0 4px 20px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #1D3597 0%, #2b4cc4 100%)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(29, 53, 151, 0.28)',
              }}>
                <Users size={26} />
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 800, background: '#eff6ff',
                color: BRAND_BLUE, border: '1px solid #bfdbfe',
                padding: '4px 12px', borderRadius: '999px', letterSpacing: '.05em',
              }}>
                16 АПТА · КАРУСЕЛЬ
              </span>
            </div>

            {/* Title & Description */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                ЖҰПТЫҚ ЖҰМЫС
              </h2>
              <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                Сыныпты 16 аптаға қайталанбайтын жұптарға бөлу, карусель алгоритмі және дайын фирмалық Canva PNG постері.
              </p>
            </div>

            {/* Feature Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
              {['🔄 Қайталанбайтын жұптар', '👫 Жынысы бойынша / Аралас', '⚡ 2+1 Үшеу тройка', '📋 Excel (TSV) көшіру'].map((t, idx) => (
                <span key={idx} style={{
                  fontSize: '11px', fontWeight: 700, background: '#f8fafc',
                  border: '1px solid #e2e8f0', color: '#334155',
                  padding: '3px 9px', borderRadius: '7px',
                }}>{t}</span>
              ))}
            </div>

            {/* Miniature Mockup */}
            <div style={{
              background: '#f1f5f9',
              borderRadius: '14px',
              border: '1.5px solid #e2e8f0',
              overflow: 'hidden',
              marginBottom: '24px',
              position: 'relative',
              aspectRatio: '1702 / 988',
              maxHeight: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src="/template_extracted.png"
                alt="Жұптық жұмыс постер үлгісі"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                  transform: hoveredCard === 'pairs' ? 'scale(1.04)' : 'scale(1)',
                }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(29,53,151,0.05) 0%, rgba(29,53,151,0.25) 100%)',
                pointerEvents: 'none',
              }} />
            </div>

            {/* Action Button */}
            <button
              style={{
                width: '100%',
                background: BRAND_BLUE,
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '13px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(29, 53, 151, 0.25)',
                transition: 'background 0.15s, transform 0.15s',
              }}
            >
              <span>Генераторға кіру</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* ── CARD 2: САБАҚ ТАПСЫРУ (Red #E52E2E) ─────────── */}
          <div
            onClick={() => onNavigate('exam')}
            onMouseEnter={() => setHoveredCard('exam')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              border: '2px solid',
              borderColor: hoveredCard === 'exam' ? BRAND_RED : '#e2e8f0',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: hoveredCard === 'exam' ? 'translateY(-6px)' : 'translateY(0)',
              boxShadow: hoveredCard === 'exam'
                ? '0 20px 40px rgba(229, 46, 46, 0.12)'
                : '0 4px 20px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #E52E2E 0%, #f04848 100%)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 16px rgba(229, 46, 46, 0.28)',
              }}>
                <Clock size={26} />
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 800, background: '#fef2f2',
                color: BRAND_RED, border: '1px solid #fecaca',
                padding: '4px 12px', borderRadius: '999px', letterSpacing: '.05em',
              }}>
                ТАЙМ-СЛОТТАР · ЕМТИХАН
              </span>
            </div>

            {/* Title & Description */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                САБАҚ ТАПСЫРУ
              </h2>
              <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                Тайм-слоттар бойынша қос оқушыдан емтихан кестесін автоматты құру, реттеу және WhatsApp-қа тікелей көшіру.
              </p>
            </div>

            {/* Feature Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
              {['⏱️ 10, 15, 20 мин интервалдар', '👥 16 тайм-слот (32 оқушы)', '📅 1-ші және 2-ші ауысым', '💬 WhatsApp-қа дайын кесте'].map((t, idx) => (
                <span key={idx} style={{
                  fontSize: '11px', fontWeight: 700, background: '#f8fafc',
                  border: '1px solid #e2e8f0', color: '#334155',
                  padding: '3px 9px', borderRadius: '7px',
                }}>{t}</span>
              ))}
            </div>

            {/* Miniature Mockup */}
            <div style={{
              background: '#f1f5f9',
              borderRadius: '14px',
              border: '1.5px solid #e2e8f0',
              overflow: 'hidden',
              marginBottom: '24px',
              position: 'relative',
              aspectRatio: '1828 / 841',
              maxHeight: '180px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img
                src="/template2_img_1.png"
                alt="Сабақ тапсыру кесте үлгісі"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                  transform: hoveredCard === 'exam' ? 'scale(1.04)' : 'scale(1)',
                }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(229,46,46,0.05) 0%, rgba(229,46,46,0.25) 100%)',
                pointerEvents: 'none',
              }} />
            </div>

            {/* Action Button */}
            <button
              style={{
                width: '100%',
                background: BRAND_RED,
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '13px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(229, 46, 46, 0.25)',
                transition: 'background 0.15s, transform 0.15s',
              }}
            >
              <span>Кесте жасау</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* ══ 3. QUICK ONBOARDING / HELPER STRIP ═══════════════ */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1.5px solid #e2e8f0',
          padding: '16px 22px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={18} color={BRAND_BLUE} />
            <span style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
              Жүйені сынап көргіңіз келе ме? Бір кликпен 28 оқушының дайын үлгісін жүктеңіз:
            </span>
          </div>
          <button
            onClick={() => {
              onInsertDemo();
              onNavigate('pairs');
            }}
            style={{
              background: '#eef1fb', border: '1px solid #c7d5f8',
              color: BRAND_BLUE, borderRadius: '8px', padding: '7px 14px',
              fontSize: '12px', fontWeight: 800, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              transition: 'all .15s',
            }}
          >
            ✨ Үлгіні қою (Демо-тест)
          </button>
        </div>

      </div>
    </div>
  );
}
