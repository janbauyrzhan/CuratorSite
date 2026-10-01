'use client';

/* ══════════════════════════════════════════════════════════════
   CANVA SVG LIVE POSTER
   Renders the authentic Canva SVG with real-time dynamic data:
   - Week badge ("3-апта")
   - Subject badge ("Математика")
   - 17 rows with Person 1 (left) and Person 2 (right)
   - Trio support (ҮШЕУ) for odd student
   ══════════════════════════════════════════════════════════════ */

export default function Poster({ svgString }) {
  if (!svgString) return null;

  return (
    <div
      id="poster-export"
      style={{
        width: '100%',
        maxWidth: '1020px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        background: '#ffffff',
      }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
