'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Heart, Search } from 'lucide-react';
import CertificateStudentField from './CertificateStudentField';
import CertificateHistory from './CertificateHistory';
import { EXTRA_CERTIFICATE_TEMPLATES } from './ExtraCertificateTemplates';

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
  ...EXTRA_CERTIFICATE_TEMPLATES,
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
  const regions = [];
  context.setTransform(canvas.width / template.width, 0, 0, canvas.height / template.height, 0, 0);
  context.clearRect(0, 0, template.width, template.height);
  context.drawImage(image, 0, 0, template.width, template.height);
  context.textBaseline = 'alphabetic';

  function mark(field, x, y, width, height, align = 'left') {
    const left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
    regions.push({ field, x: Math.max(0, left), y: Math.max(0, y), width, height });
  }

  function text(value, x, y, size, maxWidth, color = '#fff', align = 'center', field) {
    context.textAlign = align;
    context.font = '700 ' + size + 'px ' + FONT + ', sans-serif';
    const width = context.measureText(value).width;
    const fittedSize = width > maxWidth ? Math.max(8, size * maxWidth / width) : size;
    if (width > maxWidth) context.font = '700 ' + fittedSize + 'px ' + FONT + ', sans-serif';
    context.fillStyle = color;
    context.fillText(value, x, y, maxWidth);
    if (field) {
      const fittedWidth = Math.max(Math.min(context.measureText(value).width, maxWidth), Math.min(maxWidth, fittedSize * 2.5));
      mark(field, x, y - fittedSize, fittedWidth, fittedSize * 1.15, align);
    }
  }

  function positionedText(value, [x, y, size, width, align], field) {
    text(value, x, y, size, width, '#fff', align, field);
  }

  function completedRegions() {
    if (!template.pair) return regions;
    const first = regions.find(region => region.field === 'student');
    const second = regions.find(region => region.field === 'secondStudent');
    if (!first || !second) return regions;
    const x = Math.min(first.x, second.x);
    const y = Math.min(first.y, second.y);
    return [
      ...regions.filter(region => region.field !== 'student' && region.field !== 'secondStudent'),
      { field: 'pair', x, y, width: Math.max(first.x + first.width, second.x + second.width) - x,
        height: Math.max(first.y + first.height, second.y + second.height) - y },
    ];
  }

  if (template.custom) {
    text(values.student, ...template.student, 'student');
    text(values.teacher, ...template.teacher, 'teacher');
    text(values.curator, ...template.curator, 'curator');
    text('Мұғалімі', ...template.teacherLabel);
    if (template.pair) text(values.secondStudent, ...template.secondStudent, 'secondStudent');
    const period = template.period === 'Айлық'
      ? values.month + '-АЙ · ' + values.week + '-АПТА'
      : values.week + '-АПТА';
    text(period, ...template.periodPosition, 'schedule');
    if (template.selectablePlace) text('ТОП-' + values.awardPlace, ...template.placePosition, 'place');
    return completedRegions();
  }

  if (template.monthly) {
    positionedText(values.student, template.student, 'student');
    positionedText(values.teacher, template.teacher, 'teacher');
    positionedText(values.curator, template.curator, 'curator');
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
    mark('schedule', x, y - size, width, lines.length * lineHeight, align);
    if (template.id === 'trophy') {
      text(values.subject, 267, 77, 24, 225, '#fff', 'center', 'subject');
      text(values.month, 566, 77, 24, 50, '#fff', 'center', 'month');
      text(values.score, 810, 77, 23, 125, '#fff', 'center', 'score');
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
      mark('photo', 84, 109, 413, 594);
    }
    return regions;
  }

  text(values.student, ...template.student, template.pair ? 24 : 27, 365, template.color, 'center', 'student');
  if (template.pair) text(values.secondStudent, 590, 382, 24, 365, template.color, 'center', 'secondStudent');
  text(values.teacher, template.teacherX, 484, 15, 150, '#fff', 'center', 'teacher');
  text(values.curator, template.curatorX, 484, 15, 150, '#fff', 'center', 'curator');
  if (template.place) {
    text(values.week + '-АПТА БОЙЫНША ТОП ' + template.place, ...template.week, 13, 209, '#141414', 'center', 'schedule');
  } else {
    text(values.month + '-АЙ · ' + values.week + '-АПТА', 176, 551, 12, 290, template.color, 'center', 'schedule');
  }
  return completedRegions();
}

const FIELD_LABELS = {
  student: 'Оқушының аты-жөні',
  secondStudent: 'Екінші оқушының аты-жөні',
  pair: 'Жұптың есімдері',
  teacher: 'Мұғалімнің аты-жөні',
  curator: 'Куратордың аты-жөні',
  month: 'Ай нөмірі',
  week: 'Апта нөмірі',
  subject: 'Пән',
  score: 'Балл',
  schedule: 'Ай, апта және орын',
  photo: 'Фотосуретті өзгерту',
  place: 'Орын',
};

export default function CertificateCatalog({ favorites = [], onFavoriteChange = () => {}, groups = [], activeGroup = null, onSelectGroup = () => {}, onSaveAward = () => {}, onDeleteAward = () => {} }) {
  const [selectedId, setSelectedId] = useState(TEMPLATES[0].id);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState(favorites.length ? 'mine' : 'all');
  const [showHistory, setShowHistory] = useState(false);
  const [names, setNames] = useState({});
  const [teacher, setTeacher] = useState('');
  const [curator, setCurator] = useState('');
  const [week, setWeek] = useState('6');
  const [month, setMonth] = useState('1');
  const [awardPlace, setAwardPlace] = useState('1');
  const [robotPlace, setRobotPlace] = useState('1');
  const [subject, setSubject] = useState('Информатика');
  const [score, setScore] = useState('195/212');
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [activeEdit, setActiveEdit] = useState(null);
  const canvas = useRef(null);
  const photoInput = useRef(null);
  const inlineInput = useRef(null);
  const targetButtons = useRef({});
  const main = useRef(null);
  const galleryScroll = useRef(0);
  const galleryButton = useRef(null);
  const editorTitle = useRef(null);
  const photoRequest = useRef(0);
  useEffect(() => () => { photoRequest.current += 1; }, []);
  const template = TEMPLATES.find(item => item.id === selectedId);
  const normalizedQuery = query.trim().toLocaleLowerCase('kk');
  const visibleTemplates = TEMPLATES.filter(item =>
    (scope === 'all' || favorites.includes(item.id))
    && (item.label + ' ' + item.period + ' ' + (item.detail || '')).toLocaleLowerCase('kk').includes(normalizedQuery));
  const nameKey = (activeGroup?.id || 'no-group') + ':' + selectedId;
  const student = names[nameKey]?.student || '';
  const secondStudent = names[nameKey]?.secondStudent || '';
  const validWeek = /^[1-9]\d?$/.test(week);
  const validMonth = /^[1-9]\d?$/.test(month);
  const monthlyPeriod = template.period === 'Айлық';
  const chosenPlace = template.selectablePlace ? robotPlace : awardPlace;
  const image = loaded?.src === template.src ? loaded.image : null;
  const examplePhoto = loaded?.src === template.src ? loaded.examplePhoto : null;
  const canDownload = image && validWeek && (!monthlyPeriod || validMonth)
    && student.trim() && teacher.trim() && curator.trim()
    && (!template.pair || secondStudent.trim())
    && (template.id !== 'trophy' || (subject.trim() && score.trim()))
    && (template.id !== 'photo' || (examplePhoto && !photoLoading)) && !downloading;
  const canSaveAward = activeGroup && validWeek && (!monthlyPeriod || validMonth)
    && student.trim() && (!template.pair || secondStudent.trim());

  useEffect(() => {
    let cancelled = false;
    setError('');
    setExportError('');
    Promise.all([
      loadImage(template.src),
      document.fonts.load('700 27px ' + FONT),
      template.id === 'photo' ? loadImage('/certificates/monthly/example-cat.jpg') : Promise.resolve(null),
    ]).then(([nextImage, , nextExample]) => {
        if (!cancelled) setLoaded({ src: template.src, image: nextImage, examplePhoto: nextExample });
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
      awardPlace: chosenPlace, subject: subject.trim(), score: score.trim(),
    };
  }

  useEffect(() => {
    if (!image || !canvas.current) return;
    setRegions(renderCertificate(canvas.current, image, template, certificateValues(), photo || examplePhoto));
  }, [image, template, student, secondStudent, teacher, curator, week, month, chosenPlace, subject, score, photo, examplePhoto, editing]);

  useEffect(() => {
    if (activeEdit) inlineInput.current?.focus();
  }, [activeEdit]);

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
    setActiveEdit(null);
    setSelectedId(id);
    setEditing(true);
  }

  function changeName(field, value) {
    setNames(current => ({ ...current, [nameKey]: { ...current[nameKey], [field]: value } }));
  }

  function resetPhoto() {
    photoRequest.current += 1;
    setPhoto(null);
    setPhotoError('');
    setPhotoLoading(false);
    if (photoInput.current) photoInput.current.value = '';
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
      renderCertificate(canvas.current, image, template, certificateValues(), photo || examplePhoto);
      const blob = await new Promise(resolve => canvas.current.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG export failed');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = student.trim().replace(/[<>:"/\\|?*]/g, '-').slice(0, 90);
      const period = monthlyPeriod ? month + '-ай_' + week + '-апта' : week + '-апта';
      const award = template.place
        ? (template.selectablePlace ? chosenPlace : template.place) + '-орын'
        : template.id + (template.monthly ? '_' + awardPlace + '-орын' : '');
      link.download = 'сертификат_' + period + '_' + award + '_' + filename + '.png';
      link.click();
      if (canSaveAward) saveAward();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError('PNG файлын жүктеу мүмкін болмады.');
    } finally {
      setDownloading(false);
    }
  }

  function saveAward() {
    if (!canSaveAward) return;
    onSaveAward({ template, student: student.trim(), secondStudent: secondStudent.trim(),
      week: Number(week), month: monthlyPeriod ? Number(month) : null,
      awardPlace: template.monthly || template.selectablePlace ? Number(chosenPlace) : template.place });
  }

  const inlineFields = {
    student: { value: student, change: value => changeName('student', value), maxLength: 120 },
    secondStudent: { value: secondStudent, change: value => changeName('secondStudent', value), maxLength: 120 },
    teacher: { value: teacher, change: setTeacher, maxLength: 120 },
    curator: { value: curator, change: setCurator, maxLength: 120 },
    month: { value: month, change: setMonth, type: 'number' },
    week: { value: week, change: setWeek, type: 'number' },
    subject: { value: subject, change: setSubject, maxLength: 80 },
    score: { value: score, change: setScore, maxLength: 30 },
  };

  function regionStyle(region) {
    const left = 100 * region.x / template.width;
    const top = 100 * region.y / template.height;
    return {
      left: left + '%', top: top + '%',
      width: Math.min(100 - left, 100 * region.width / template.width) + '%',
      height: Math.min(100 - top, 100 * region.height / template.height) + '%',
    };
  }

  function editRegion(region) {
    if (region.field === 'photo') {
      photoInput.current?.click();
      return;
    }
    setActiveEdit(region);
  }

  function finishInlineEdit(restoreFocus = false) {
    const field = activeEdit?.field;
    setActiveEdit(null);
    if (restoreFocus && field) {
      window.requestAnimationFrame(() => {
        if (document.activeElement === document.body) targetButtons.current[field]?.focus({ preventScroll: true });
      });
    }
  }

  function inlineField(field, first = false) {
    const item = inlineFields[field];
    return <label key={field}>
      {FIELD_LABELS[field]}
      <input ref={first ? inlineInput : undefined} aria-label={'Постер — ' + FIELD_LABELS[field]}
        type={item.type || 'text'} min={item.type === 'number' ? '1' : undefined}
        max={item.type === 'number' ? '99' : undefined} maxLength={item.maxLength}
        value={item.value} onChange={event => item.change(event.target.value)} />
    </label>;
  }

  const isFavorite = favorites.includes(template.id);
  const groupedEdit = activeEdit?.field === 'schedule' || activeEdit?.field === 'pair' || activeEdit?.field === 'place';
  const inlineFieldNames = activeEdit?.field === 'pair'
    ? ['student', 'secondStudent']
    : activeEdit?.field === 'schedule'
      ? monthlyPeriod ? ['month', 'week'] : ['week']
      : activeEdit && activeEdit.field !== 'place' ? [activeEdit.field] : [];

  return (
    <main ref={main} className="certificate-catalog" aria-labelledby="certificates-title">
      <header className="workspace-heading certificate-heading">
        <div>
          {editing && <button type="button" className="certificate-back" onClick={() => setEditing(false)}>
            <ArrowLeft size={16} aria-hidden="true" /> Үлгілерге оралу
          </button>}
          <h1 id="certificates-title" ref={editorTitle} tabIndex={-1}>{editing ? template.label : 'Сертификаттар'}</h1>
        </div>
        {editing && <button type="button" className="certificate-editor-favorite"
          aria-pressed={isFavorite} onClick={() => onFavoriteChange(template.id, !isFavorite)}>
          <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
          {isFavorite ? 'Таңдаулыда' : 'Таңдаулыға қосу'}
        </button>}
        {!editing && !showHistory && <label className="certificate-search">
          <Search size={17} aria-hidden="true" />
          <input type="search" aria-label="Сертификат іздеу" placeholder="Үлгіні іздеу" value={query} onChange={e => setQuery(e.target.value)} />
        </label>}
      </header>
      {groups.length > 0 && <label className="certificate-group-select">Топ
        <select value={activeGroup?.id || ''} onChange={event => onSelectGroup(event.target.value)}>
          <option value="" disabled>Топты таңдаңыз</option>
          {groups.map(group => <option key={group.id} value={group.id}>{group.name}{group.subject ? ' — ' + group.subject : ''}</option>)}
        </select>
      </label>}
      {!editing && <>
        <div className="certificate-filter" aria-label="Каталог">
          <button type="button" aria-pressed={!showHistory && scope === 'all'} onClick={() => { setScope('all'); setShowHistory(false); }}>Барлық үлгілер</button>
          <button type="button" aria-pressed={!showHistory && scope === 'mine'} onClick={() => { setScope('mine'); setShowHistory(false); }}>
            <Heart size={15} aria-hidden="true" /> Менің каталогым ({favorites.length})
          </button>
          <button type="button" aria-pressed={showHistory} onClick={() => setShowHistory(true)}>Марапаттар тарихы</button>
        </div>
        {showHistory ? <CertificateHistory key={activeGroup?.id || 'none'} group={activeGroup} onDelete={onDeleteAward} /> : <>
        <div className="certificate-templates" role="group" aria-label="Сертификат үлгісін таңдау">
          {visibleTemplates.map(item => (
            <article className="certificate-card" key={item.id}>
              <button className="certificate-card-open" type="button" ref={selectedId === item.id ? galleryButton : null}
                aria-label={item.period + ' · ' + item.label + (item.detail ? ' · ' + item.detail : '')}
                onClick={() => openTemplate(item.id)}>
                <img src={item.thumbnail} alt="" loading="lazy" />
                <span className="certificate-card-copy">
                  <small>{item.period}{item.detail ? ' · ' + item.detail : ''}</small>
                  <strong>{item.label}</strong>
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </button>
              <button className="certificate-favorite" type="button" aria-pressed={favorites.includes(item.id)}
                aria-label={item.label + (favorites.includes(item.id) ? ' — таңдаулылардан алып тастау' : ' — таңдаулыларға қосу')}
                onClick={() => onFavoriteChange(item.id, !favorites.includes(item.id))}>
                <Heart size={18} fill={favorites.includes(item.id) ? 'currentColor' : 'none'} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
        {visibleTemplates.length === 0 && (scope === 'mine' && favorites.length === 0
          ? <div className="certificate-no-results" role="status">
              <p>Жүрек белгісі арқылы ұнаған үлгілерді осы жерге қосыңыз.</p>
              <button type="button" className="certificate-back" onClick={() => setScope('all')}>Барлық үлгілерді қарау</button>
            </div>
          : <p className="certificate-no-results" role="status">Үлгі табылмады. Басқа сөзбен іздеп көріңіз.</p>)}
        </>}
      </>}
      {editing && <div className="certificate-editor">
        <form className="certificate-form" onSubmit={download} autoComplete="off">
          <CertificateStudentField group={activeGroup} label={template.pair ? 'Бірінші оқушының аты-жөні' : 'Оқушының аты-жөні'}
            value={student} onChange={value => changeName('student', value)} />
          {template.pair && <CertificateStudentField group={activeGroup} label="Екінші оқушының аты-жөні"
            value={secondStudent} onChange={value => changeName('secondStudent', value)} />}
          <label>Куратордың аты-жөні
            <input value={curator} onChange={e => setCurator(e.target.value)} required maxLength={120} />
          </label>
          <label>Мұғалімнің аты-жөні
            <input value={teacher} onChange={e => setTeacher(e.target.value)} required maxLength={120} />
          </label>
          {(template.monthly || template.selectablePlace) && <label>Орын
            <select value={chosenPlace} onChange={e => template.selectablePlace ? setRobotPlace(e.target.value) : setAwardPlace(e.target.value)}>
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
            <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
            {photoLoading && <span role="status">Фотосурет жүктеліп жатыр…</span>}
            {photoError && <span role="alert">{photoError}</span>}
          </label>}
          {template.id === 'photo' && (!photo
            ? <p className="certificate-photo-note">Үлгідегі сурет көрсетіліп тұр. Өзіңіздің фотосуретіңізді жүктей аласыз.</p>
            : <button type="button" className="certificate-photo-reset" onClick={resetPhoto}>Үлгі суретін қайтару</button>)}
          <button className="brand-button" type="submit" disabled={!canDownload}>
            <Download size={16} aria-hidden="true" /> {downloading ? 'Дайындалып жатыр…' : 'PNG жүктеу'}
          </button>
          {activeGroup && <button className="certificate-history-save" type="button" disabled={!canSaveAward} onClick={saveAward}>Нәтижені тарихқа сақтау</button>}
          {exportError && <p role="alert">{exportError}</p>}
        </form>
        <div className="certificate-visual">
          <p className="certificate-edit-hint">Мәтінді өзгерту үшін постердегі жазуды басыңыз.</p>
          <div className="certificate-preview" style={{ aspectRatio: image ? undefined : template.width + ' / ' + template.height }}>
            {!image && <p role={error ? 'alert' : 'status'}>{error || 'Үлгі жүктеліп жатыр…'}</p>}
            <div className="certificate-poster" hidden={!image}
              style={{ aspectRatio: template.width + ' / ' + template.height,
                '--poster-max-width': 'calc(' + (100 * template.width / template.height) + 'vh - ' + (225 * template.width / template.height) + 'px)' }}>
              <canvas ref={canvas} width={template.canvasWidth} height={template.canvasHeight}
                role="img" aria-label={template.label + ' сертификатының алдын ала көрінісі'} />
              {image && regions.map(region => (
                <button key={region.field} type="button"
                  className={'certificate-hit-target' + (region.field === 'photo' ? ' certificate-hit-photo' : '')}
                  ref={element => { targetButtons.current[region.field] = element; }}
                  aria-label={'Постер — ' + (region.field === 'schedule' && !monthlyPeriod ? FIELD_LABELS.week : FIELD_LABELS[region.field])}
                  title={region.field === 'schedule' && !monthlyPeriod ? FIELD_LABELS.week : FIELD_LABELS[region.field]}
                  style={regionStyle(region)} onClick={() => editRegion(region)} />
              ))}
              {activeEdit && <div className="certificate-inline-editor"
                style={{ left: Math.min(100 * activeEdit.x / template.width, 40) + '%',
                  maxWidth: (100 - Math.min(100 * activeEdit.x / template.width, 40)) + '%',
                  width: groupedEdit ? '250px' : 'max(250px, ' + (100 * activeEdit.width / template.width) + '%)',
                  top: Math.min(100 * activeEdit.y / template.height, groupedEdit ? 52 : 78) + '%' }}
                onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) finishInlineEdit(); }}
                onKeyDown={event => {
                  if (event.key === 'Escape' || (event.key === 'Enter' && !groupedEdit)) {
                    event.preventDefault();
                    finishInlineEdit(true);
                  }
                }}>
                {inlineFieldNames.map((field, index) => inlineField(field, index === 0))}
                {((activeEdit.field === 'schedule' && template.monthly) || activeEdit.field === 'place') && <label>Орын
                  <select ref={activeEdit.field === 'place' ? inlineInput : undefined} value={chosenPlace}
                    onChange={event => template.selectablePlace ? setRobotPlace(event.target.value) : setAwardPlace(event.target.value)}>
                    {[1, 2, 3].map(value => <option key={value} value={value}>{value}-орын</option>)}
                  </select>
                </label>}
                {groupedEdit && <button type="button" onClick={() => finishInlineEdit(true)}>Дайын</button>}
              </div>}
            </div>
          </div>
        </div>
      </div>}
    </main>
  );
}
