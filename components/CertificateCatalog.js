'use client';

import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';

const WIDTH = 810;
const HEIGHT = 572.249966;
const FONT = '"Certificate Open Sans"';
const WEEKLY_TEMPLATES = [
  { place: 1, student: [590, 380], week: [588, 416], teacherX: 100, curatorX: 259, color: '#f8f093' },
  { place: 2, student: [590, 386], week: [597, 423], teacherX: 96, curatorX: 255, color: '#e0c2c1' },
  { place: 3, student: [590, 386], week: [585, 420], teacherX: 96, curatorX: 255, color: '#18f0f6' },
].map(template => ({ ...template, src: `/certificates/weekly/place-${template.place}.svg` }));

function renderCertificate(canvas, image, template, { student, teacher, curator, week }) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas context unavailable');
  context.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
  context.clearRect(0, 0, WIDTH, HEIGHT);
  context.drawImage(image, 0, 0, WIDTH, HEIGHT);
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';

  function text(value, x, y, size, maxWidth, color) {
    context.font = `700 ${size}px ${FONT}, sans-serif`;
    const width = context.measureText(value).width;
    if (width > maxWidth) context.font = `700 ${Math.max(8, size * maxWidth / width)}px ${FONT}, sans-serif`;
    context.fillStyle = color;
    context.fillText(value, x, y, maxWidth);
  }

  text(student, ...template.student, 27, 365, template.color);
  text(teacher, template.teacherX, 484, 15, 150, '#fff');
  text(curator, template.curatorX, 484, 15, 150, '#fff');
  text(`${week}-АПТА БОЙЫНША ТОП ${template.place}`, ...template.week, 13, 209, '#141414');
}

function loadTemplate(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export default function CertificateCatalog() {
  const [place, setPlace] = useState(1);
  const [studentNames, setStudentNames] = useState({});
  const [teacher, setTeacher] = useState('');
  const [curator, setCurator] = useState('');
  const [week, setWeek] = useState('6');
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const canvas = useRef(null);
  const template = WEEKLY_TEMPLATES[place - 1];
  const student = studentNames[place] || '';
  const validWeek = /^[1-9]\d?$/.test(week);
  const image = loaded?.src === template.src ? loaded.image : null;
  const canDownload = image && validWeek && student.trim() && teacher.trim() && curator.trim() && !downloading;

  useEffect(() => {
    let cancelled = false;
    setError('');
    setExportError('');
    Promise.all([loadTemplate(template.src), document.fonts.load(`700 27px ${FONT}`)])
      .then(([nextImage]) => {
        if (!cancelled) setLoaded({ src: template.src, image: nextImage });
      })
      .catch(() => {
        if (!cancelled) setError('Үлгі немесе қаріп жүктелмеді. Бетті жаңартып көріңіз.');
      });
    return () => { cancelled = true; };
  }, [template.src]);

  useEffect(() => {
    if (!image || !canvas.current) return;
    renderCertificate(canvas.current, image, template, {
      student: student.trim() || 'Оқушының аты-жөні',
      teacher: teacher.trim() || 'Мұғалімнің аты-жөні',
      curator: curator.trim() || 'Куратордың аты-жөні',
      week: validWeek ? week : '…',
    });
  }, [image, template, student, teacher, curator, validWeek, week]);

  async function download(event) {
    event.preventDefault();
    if (!canDownload) return;
    setDownloading(true);
    setExportError('');
    try {
      renderCertificate(canvas.current, image, template, {
        student: student.trim(), teacher: teacher.trim(), curator: curator.trim(), week,
      });
      const blob = await new Promise(resolve => canvas.current.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG export failed');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = student.trim().replace(/[<>:"/\\|?*]/g, '-').slice(0, 90);
      link.download = `сертификат_${week}-апта_${place}-орын_${filename}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError('PNG файлын жүктеу мүмкін болмады.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="certificate-catalog" aria-labelledby="certificates-title">
      <header className="workspace-heading">
        <h1 id="certificates-title">Сертификаттар</h1>
      </header>
      <section aria-labelledby="weekly-certificates-title">
        <h2 id="weekly-certificates-title">Апталық сертификаттар</h2>
        <div className="certificate-templates" role="group" aria-label="Сертификат үлгісін таңдау">
          {WEEKLY_TEMPLATES.map(item => (
            <button key={item.place} type="button" aria-pressed={place === item.place} onClick={() => setPlace(item.place)}>
              <img src={item.src} alt="" />
              <span>{item.place}-орын</span>
            </button>
          ))}
        </div>
      </section>
      <div className="certificate-editor">
        <form className="certificate-form" onSubmit={download} autoComplete="off">
          <h2>{place}-орын</h2>
          <label>Оқушының аты-жөні
            <input value={student} onChange={e => setStudentNames(names => ({ ...names, [place]: e.target.value }))} required maxLength={120} />
          </label>
          <label>Куратордың аты-жөні
            <input value={curator} onChange={e => setCurator(e.target.value)} required maxLength={120} />
          </label>
          <label>Мұғалімнің аты-жөні
            <input value={teacher} onChange={e => setTeacher(e.target.value)} required maxLength={120} />
          </label>
          <label>Апта нөмірі
            <input type="number" min="1" max="99" value={week} onChange={e => setWeek(e.target.value)} required />
          </label>
          <button className="brand-button" type="submit" disabled={!canDownload}>
            <Download size={16} aria-hidden="true" /> {downloading ? 'Дайындалып жатыр…' : 'PNG жүктеу'}
          </button>
          {exportError && <p role="alert">{exportError}</p>}
        </form>
        <div className="certificate-preview">
          {!image && <p role={error ? 'alert' : 'status'}>{error || 'Үлгі жүктеліп жатыр…'}</p>}
          <canvas ref={canvas} width="1620" height="1145" hidden={!image}
            role="img" aria-label={`${place}-орын сертификатының алдын ала көрінісі`} />
        </div>
      </div>
    </main>
  );
}
