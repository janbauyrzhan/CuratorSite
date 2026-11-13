'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Search } from 'lucide-react';

const FONT = '"Certificate Open Sans"';
const TEMPLATES = [
  { id: 'weekly-1', label: '1-орын', period: 'Апталық', place: 1, student: [590, 380], week: [588, 416], teacherX: 100, curatorX: 259, color: '#f8f093' },
  { id: 'weekly-2', label: '2-орын', period: 'Апталық', place: 2, student: [590, 386], week: [597, 423], teacherX: 96, curatorX: 255, color: '#e0c2c1' },
  { id: 'weekly-3', label: '3-орын', period: 'Апталық', place: 3, student: [590, 386], week: [585, 420], teacherX: 96, curatorX: 255, color: '#18f0f6' },
  { id: 'trophy', label: 'Кубок', period: 'Айлық', monthly: true, student: [42, 414, 58, 560, 'left'], teacher: [42, 646, 28, 300, 'left'], curator: [744, 646, 28, 260, 'right'], description: [42, 466, 550, 22, 24, 'left'], teacherLabel: [43, 669] },
  { id: 'photo', label: 'Фотосуретпен', period: 'Айлық', monthly: true, student: [540, 244, 100, 815, 'left'], teacher: [549, 510, 28, 390, 'left'], curator: [1356, 510, 28, 340, 'right'], description: [549, 329, 650, 22, 24, 'left'], teacherLabel: [550, 535] },
  { id: 'classic', label: 'Классикалық', period: 'Айлық', monthly: true, student: [720, 345, 64, 750, 'center'], teacher: [455, 561, 28, 450, 'center'], curator: [1010, 561, 28, 450, 'center'], description: [720, 404, 620, 20, 27, 'center'], teacherLabel: [312, 584] },
  { id: 'best-pair', label: 'Үздік жұптық жұмыс', period: 'Айлық', pair: true, student: [590, 359], teacherX: 96, curatorX: 259, color: '#e8c7c9' },
  { id: 'best-notes', label: 'Үздік конспект', period: 'Айлық', student: [590, 391], teacherX: 101, curatorX: 264, color: '#92c0f5' },
  ...[1, 2].map(place => ({
    id: 'reward-' + place, label: 'Ашық рейтинг · ' + place + '-орын',
    period: 'Айлық', detail: place === 1 ? '4000 ₸' : '2000 ₸', place, custom: true,
    width: 810, height: 1012.49997, canvasHeight: 2025,
    student: [405, 703, 42, 650, '#fff', 'center'],
    teacher: [42, 805, 22, 300, '#fff', 'left'],
    curator: [770, 805, 22, 280, '#fff', 'right'],
    teacherLabel: [42, 829, 20, 160, '#fff', 'left'],
    periodPosition: [405, 920, 18, 600, '#fff', 'center'],
  })),
  ...[1, 2, 3].map(place => ({
    id: 'weekly-cup-' + place, label: 'Күміс кубок · ' + place + '-орын',
    period: 'Апталық', place, custom: true,
    width: 1814.25, height: 1281.749962, canvasWidth: 1920, canvasHeight: 1356,
    student: [70, 596, 100, 950, '#fff', 'left'],
    teacher: [85, 1120, 30, 360, '#fff', 'left'],
    curator: [745, 1120, 30, 360, '#fff', 'right'],
    teacherLabel: [85, 1086, 30, 250, '#fff', 'left'],
    periodPosition: [85, 1210, 24, 600, '#fff', 'left'],
  })),
  {
    id: 'monthly-gold', label: 'Алтын кубок · 1-орын', period: 'Айлық', place: 1, custom: true,
    width: 419.25, height: 297.749991, canvasHeight: 1151,
    student: [31, 153, 15, 235, '#171717', 'left'],
    teacher: [32, 263, 9, 140, '#171717', 'left'],
    curator: [315, 263, 9, 130, '#171717', 'right'],
    teacherLabel: [31, 252, 9, 90, '#171717', 'left'],
    periodPosition: [31, 284, 7, 230, '#6c43bb', 'left'],
  },
  {
    id: 'monthly-notes', label: 'Үздік конспект · Кітаптар', period: 'Айлық', custom: true,
    width: 419.25, height: 297.749991, canvasHeight: 1151,
    student: [31, 153, 15, 265, '#003faf', 'left'],
    teacher: [32, 263, 9, 140, '#171717', 'left'],
    curator: [279, 263, 9, 130, '#171717', 'right'],
    teacherLabel: [31, 252, 9, 90, '#171717', 'left'],
    periodPosition: [31, 284, 7, 230, '#003faf', 'left'],
  },
  {
    id: 'monthly-pair', label: 'Үздік жұптық жұмыс · Бірлік', period: 'Айлық', custom: true, pair: true,
    width: 419.25, height: 297.749991, canvasHeight: 1151,
    student: [31, 145, 11, 230, '#171717', 'left'],
    secondStudent: [31, 157, 11, 230, '#171717', 'left'],
    teacher: [32, 263, 9, 140, '#171717', 'left'],
    curator: [253, 263, 9, 120, '#171717', 'right'],
    teacherLabel: [31, 252, 9, 90, '#171717', 'left'],
    periodPosition: [31, 284, 7, 230, '#ae4b37', 'left'],
  },
].map(template => {
  const src = template.custom
    ? '/certificates/collection/' + template.id + '.svg'
    : template.place
      ? '/certificates/weekly/place-' + template.place + '.svg'
      : '/certificates/monthly/' + template.id + '.svg';
  return {
    ...template, src,
    thumbnail: !template.custom && template.place ? src : src.replace('.svg', '.webp'),
    width: template.width || (template.monthly ? 1440 : 810),
    height: template.height || (template.monthly ? 810 : 572.249966),
    canvasWidth: template.canvasWidth || (template.monthly ? 1920 : 1620),
    canvasHeight: template.canvasHeight || (template.monthly ? 1080 : 1145),
  };
});

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function renderCertificate(canvas, image, template, values, photo) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas context unavailable');
  context.setTransform(canvas.width / template.width, 0, 0, canvas.height / template.height, 0, 0);
  context.clearRect(0, 0, template.width, template.height);
  context.drawImage(image, 0, 0, template.width, template.height);
  context.textBaseline = 'alphabetic';

  function text(value, x, y, size, maxWidth, color = '#fff', align = 'center') {
    context.textAlign = align;
    context.font = '700 ' + size + 'px ' + FONT + ', sans-serif';
    const width = context.measureText(value).width;
    if (width > maxWidth) context.font = '700 ' + Math.max(8, size * maxWidth / width) + 'px ' + FONT + ', sans-serif';
    context.fillStyle = color;
    context.fillText(value, x, y, maxWidth);
  }

  function positionedText(value, [x, y, size, width, align]) {
    text(value, x, y, size, width, '#fff', align);
  }

  if (template.custom) {
    text(values.student, ...template.student);
    text(values.teacher, ...template.teacher);
    text(values.curator, ...template.curator);
    text('Мұғалімі', ...template.teacherLabel);
    if (template.pair) text(values.secondStudent, ...template.secondStudent);
    const period = template.period === 'Айлық'
      ? values.month + '-АЙ · ' + values.week + '-АПТА'
      : values.week + '-АПТА';
    text(period, ...template.periodPosition);
    return;
  }

  if (template.monthly) {
    positionedText(values.student, template.student);
    positionedText(values.teacher, template.teacher);
    positionedText(values.curator, template.curator);
    text('Мұғалім', ...template.teacherLabel, 22, 170, '#fff', 'left');
    const [x, y, width, size, lineHeight, align] = template.description;
    const description = values.month + '-ай ' + values.week + '-апта рейтингі бойынша ТОП-' + values.awardPlace
      + ' орынға ие болып, оқу тапсырмаларын жауапкершілікпен орындағаны және жақсы нәтижелерге қол жеткізгені үшін марапатталады!';
    context.font = '700 ' + size + 'px ' + FONT + ', sans-serif';
    const lines = [];
    let line = '';
    for (const word of description.split(' ')) {
      const next = line ? line + ' ' + word : word;
      if (line && context.measureText(next).width > width) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
    lines.forEach((value, index) => text(value, x, y + index * lineHeight, size, width, '#fff', align));
    if (template.id === 'trophy') {
      text(values.subject, 267, 77, 24, 225);
      text(values.month, 566, 77, 24, 50);
      text(values.score, 810, 77, 23, 125);
    }
    if (template.id === 'photo') {
      context.save();
      context.beginPath();
      context.roundRect(84, 109, 413, 594, 40);
      context.clip();
      context.fillStyle = '#631414';
      context.fillRect(84, 109, 413, 594);
      if (photo) {
        const scale = Math.max(413 / photo.width, 594 / photo.height);
        const width = photo.width * scale;
        const height = photo.height * scale;
        context.drawImage(photo, 84 + (413 - width) / 2, 109 + (594 - height) / 2, width, height);
      } else {
        text('Фотосурет қосыңыз', 290, 413, 26, 360);
      }
      context.restore();
    }
    return;
  }

  text(values.student, ...template.student, template.pair ? 24 : 27, 365, template.color);
  if (template.pair) text(values.secondStudent, 590, 382, 24, 365, template.color);
  text(values.teacher, template.teacherX, 484, 15, 150);
  text(values.curator, template.curatorX, 484, 15, 150);
  if (template.place) {
    text(values.week + '-АПТА БОЙЫНША ТОП ' + template.place, ...template.week, 13, 209, '#141414');
  } else {
    text(values.month + '-АЙ · ' + values.week + '-АПТА', 176, 551, 12, 290, template.color);
  }
}

export default function CertificateCatalog() {
  const [selectedId, setSelectedId] = useState(TEMPLATES[0].id);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [names, setNames] = useState({});
  const [teacher, setTeacher] = useState('');
  const [curator, setCurator] = useState('');
  const [week, setWeek] = useState('6');
  const [month, setMonth] = useState('1');
  const [awardPlace, setAwardPlace] = useState('1');
  const [subject, setSubject] = useState('Информатика');
  const [score, setScore] = useState('195/212');
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const canvas = useRef(null);
  const main = useRef(null);
  const galleryScroll = useRef(0);
  const galleryButton = useRef(null);
  const editorTitle = useRef(null);
  const photoRequest = useRef(0);
  useEffect(() => () => { photoRequest.current += 1; }, []);
  const template = TEMPLATES.find(item => item.id === selectedId);
  const normalizedQuery = query.trim().toLocaleLowerCase('kk');
  const visibleTemplates = TEMPLATES.filter(item =>
    (item.label + ' ' + item.period + ' ' + (item.detail || '')).toLocaleLowerCase('kk').includes(normalizedQuery));
  const student = names[selectedId]?.student || '';
  const secondStudent = names[selectedId]?.secondStudent || '';
  const validWeek = /^[1-9]\d?$/.test(week);
  const validMonth = /^[1-9]\d?$/.test(month);
  const monthlyPeriod = template.period === 'Айлық';
  const image = loaded?.src === template.src ? loaded.image : null;
  const canDownload = image && validWeek && (!monthlyPeriod || validMonth)
    && student.trim() && teacher.trim() && curator.trim()
    && (!template.pair || secondStudent.trim())
    && (template.id !== 'trophy' || (subject.trim() && score.trim()))
    && (template.id !== 'photo' || (photo && !photoLoading)) && !downloading;

  useEffect(() => {
    let cancelled = false;
    setError('');
    setExportError('');
    Promise.all([loadImage(template.src), document.fonts.load('700 27px ' + FONT)])
      .then(([nextImage]) => {
        if (!cancelled) setLoaded({ src: template.src, image: nextImage });
      })
      .catch(() => {
        if (!cancelled) setError('Үлгі немесе қаріп жүктелмеді. Бетті жаңартып көріңіз.');
      });
    return () => { cancelled = true; };
  }, [template.src]);

  function certificateValues() {
    return {
      student: student.trim() || 'Оқушының аты-жөні',
      secondStudent: secondStudent.trim() || 'Екінші оқушының аты-жөні',
      teacher: teacher.trim() || 'Мұғалімнің аты-жөні',
      curator: curator.trim() || 'Куратордың аты-жөні',
      week: validWeek ? week : '…', month: validMonth ? month : '…',
      awardPlace, subject: subject.trim(), score: score.trim(),
    };
  }

  useEffect(() => {
    if (!image || !canvas.current) return;
    renderCertificate(canvas.current, image, template, certificateValues(), photo);
  }, [image, template, student, secondStudent, teacher, curator, week, month, awardPlace, subject, score, photo, editing]);

  useEffect(() => {
    if (editing) {
      main.current?.scrollTo({ top: 0 });
      editorTitle.current?.focus({ preventScroll: true });
    } else {
      main.current?.scrollTo({ top: galleryScroll.current });
      galleryButton.current?.focus({ preventScroll: true });
    }
  }, [editing]);

  function openTemplate(id) {
    galleryScroll.current = main.current?.scrollTop || 0;
    setSelectedId(id);
    setEditing(true);
  }

  function changeName(field, value) {
    setNames(current => ({ ...current, [selectedId]: { ...current[selectedId], [field]: value } }));
  }

  async function choosePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const request = ++photoRequest.current;
    setPhotoError('');
    setPhotoLoading(true);
    const url = URL.createObjectURL(file);
    try {
      const nextPhoto = await loadImage(url);
      if (photoRequest.current === request) setPhoto(nextPhoto);
    } catch {
      if (photoRequest.current === request) setPhotoError('Фотосурет ашылмады. JPG, PNG немесе WebP файлын таңдаңыз.');
    } finally {
      URL.revokeObjectURL(url);
      if (photoRequest.current === request) setPhotoLoading(false);
    }
  }

  async function download(event) {
    event.preventDefault();
    if (!canDownload) return;
    setDownloading(true);
    setExportError('');
    try {
      renderCertificate(canvas.current, image, template, certificateValues(), photo);
      const blob = await new Promise(resolve => canvas.current.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG export failed');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = student.trim().replace(/[<>:"/\\|?*]/g, '-').slice(0, 90);
      const period = monthlyPeriod ? month + '-ай_' + week + '-апта' : week + '-апта';
      const award = template.place
        ? template.place + '-орын'
        : template.id + (template.monthly ? '_' + awardPlace + '-орын' : '');
      link.download = 'сертификат_' + period + '_' + award + '_' + filename + '.png';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError('PNG файлын жүктеу мүмкін болмады.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main ref={main} className="certificate-catalog" aria-labelledby="certificates-title">
      <header className="workspace-heading certificate-heading">
        <div>
          {editing && <button type="button" className="certificate-back" onClick={() => setEditing(false)}>
            <ArrowLeft size={16} aria-hidden="true" /> Үлгілерге оралу
          </button>}
          <h1 id="certificates-title" ref={editorTitle} tabIndex={-1}>{editing ? template.label : 'Сертификаттар'}</h1>
        </div>
        {!editing && <label className="certificate-search">
          <Search size={17} aria-hidden="true" />
          <input type="search" aria-label="Сертификат іздеу" placeholder="Үлгіні іздеу" value={query} onChange={e => setQuery(e.target.value)} />
        </label>}
      </header>
      {!editing && <>
        <div className="certificate-templates" role="group" aria-label="Сертификат үлгісін таңдау">
          {visibleTemplates.map(item => (
            <button key={item.id} type="button" ref={selectedId === item.id ? galleryButton : null}
              aria-label={item.period + ' · ' + item.label + (item.detail ? ' · ' + item.detail : '')}
              onClick={() => openTemplate(item.id)}>
              <img src={item.thumbnail} alt="" loading="lazy" />
              <span className="certificate-card-copy">
                <small>{item.period}{item.detail ? ' · ' + item.detail : ''}</small>
                <strong>{item.label}</strong>
                <ArrowRight size={16} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
        {visibleTemplates.length === 0 && <p className="certificate-no-results" role="status">
          Үлгі табылмады. Басқа сөзбен іздеп көріңіз.
        </p>}
      </>}
      {editing && <div className="certificate-editor">
        <form className="certificate-form" onSubmit={download} autoComplete="off">
          <label>{template.pair ? 'Бірінші оқушының аты-жөні' : 'Оқушының аты-жөні'}
            <input value={student} onChange={e => changeName('student', e.target.value)} required maxLength={120} />
          </label>
          {template.pair && <label>Екінші оқушының аты-жөні
            <input value={secondStudent} onChange={e => changeName('secondStudent', e.target.value)} required maxLength={120} />
          </label>}
          <label>Куратордың аты-жөні
            <input value={curator} onChange={e => setCurator(e.target.value)} required maxLength={120} />
          </label>
          <label>Мұғалімнің аты-жөні
            <input value={teacher} onChange={e => setTeacher(e.target.value)} required maxLength={120} />
          </label>
          {template.monthly && <label>Орын
            <select value={awardPlace} onChange={e => setAwardPlace(e.target.value)}>
              {[1, 2, 3].map(value => <option key={value} value={value}>{value}-орын</option>)}
            </select>
          </label>}
          <div className="certificate-period-fields">
            {monthlyPeriod && <label>Ай нөмірі
              <input type="number" min="1" max="99" value={month} onChange={e => setMonth(e.target.value)} required />
            </label>}
            <label>Апта нөмірі
              <input type="number" min="1" max="99" value={week} onChange={e => setWeek(e.target.value)} required />
            </label>
          </div>
          {template.id === 'trophy' && <>
            <label>Пән<input value={subject} onChange={e => setSubject(e.target.value)} maxLength={80} required /></label>
            <label>Балл<input value={score} onChange={e => setScore(e.target.value)} maxLength={30} required /></label>
          </>}
          {template.id === 'photo' && <label>Оқушының фотосуреті
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
            {photoLoading && <span role="status">Фотосурет жүктеліп жатыр…</span>}
            {photoError && <span role="alert">{photoError}</span>}
          </label>}
          <button className="brand-button" type="submit" disabled={!canDownload}>
            <Download size={16} aria-hidden="true" /> {downloading ? 'Дайындалып жатыр…' : 'PNG жүктеу'}
          </button>
          {exportError && <p role="alert">{exportError}</p>}
        </form>
        <div className="certificate-preview" style={{ aspectRatio: image ? undefined : template.width + ' / ' + template.height }}>
          {!image && <p role={error ? 'alert' : 'status'}>{error || 'Үлгі жүктеліп жатыр…'}</p>}
          <canvas ref={canvas} width={template.canvasWidth} height={template.canvasHeight} hidden={!image}
            role="img" aria-label={template.label + ' сертификатының алдын ала көрінісі'} />
        </div>
      </div>}
    </main>
  );
}
