'use client';

import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { previousWeeklyRanking } from '../lib/certificateAwardHistory';

function familyId(template, place) {
  if (/^weekly-[123]$/.test(template.id)) return 'weekly-' + place;
  if (/^weekly-cup-[123]$/.test(template.id)) return 'weekly-cup-' + place;
  return template.id;
}

function rankMode(template) {
  if (template.pair || (!template.place && !template.monthly)) return 'nomination';
  if (template.selectablePlace || template.monthly || /^weekly-(?:cup-)?[123]$/.test(template.id)) return 'flexible';
  return 'fixed';
}

function readRows(value, pair) {
  return value.split(/\r?\n/).map(line => {
    const columns = line.split('\t').map(part => part.trim()).filter(Boolean);
    if (/^\d+[.)]?$/.test(columns[0] || '')) columns.shift();
    const first = (columns[0] || '').replace(/^\d+[.)]\s*/, '').trim();
    const second = pair ? (columns[1] || '').trim() : '';
    return { name: first, second };
  }).filter(row => row.name);
}

function BatchPreview({ entry, template, values, getImage, renderCertificate, photo }) {
  const canvas = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!template) return;
    let cancelled = false;
    setError('');
    getImage(template).then(image => {
      if (!cancelled && canvas.current) {
        renderCertificate(canvas.current, image, template, {
          ...values, student: entry.name, secondStudent: entry.second || 'Екінші оқушының аты-жөні',
          awardPlace: String(entry.place || template.place || '1'),
        }, photo);
      }
    }).catch(() => { if (!cancelled) setError('Үлгі жүктелмеді.'); });
    return () => { cancelled = true; };
  }, [entry.name, entry.second, entry.place, template, values.teacher, values.curator,
    values.week, values.month, values.subject, values.score, photo, getImage, renderCertificate]);
  if (!template) return <div className="certificate-batch-pending">Орынды таңдаңыз</div>;
  return <>
    {error && <p role="alert">{error}</p>}
    <canvas ref={canvas} width={600} height={Math.round(600 * template.canvasHeight / template.canvasWidth)}
      role="img" aria-label={entry.name + ' сертификаты'} />
  </>;
}

export default function CertificateBatch({
  template, templates, values, teacher, curator, setTeacher, setCurator,
  week, setWeek, month, setMonth, subject, setSubject, score, setScore,
  photo, photoLoading, photoError, choosePhoto, resetPhoto, photoInput,
  activeGroup, onSaveAward, renderCertificate, loadImage,
}) {
  const [source, setSource] = useState('');
  const [places, setPlaces] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const imageCache = useRef(new Map());
  const mode = rankMode(template);
  const previousRanking = previousWeeklyRanking(activeGroup, week);
  const rows = readRows(source, template.pair).map((row, index) => ({
    ...row,
    place: mode === 'nomination' ? null : mode === 'fixed' ? template.place : (places[index] ?? (index < 3 ? String(index + 1) : '')),
  }));
  const validWeek = /^[1-9]\d?$/.test(week);
  const validMonth = template.period !== 'Айлық' || /^[1-9]\d?$/.test(month);
  const validRows = rows.length > 0 && rows.every(row => (mode !== 'flexible' || row.place) && (!template.pair || row.second));
  const canDownload = validRows && validWeek && validMonth && teacher.trim() && curator.trim()
    && (!(template.subjectBadge || template.id === 'trophy') || subject.trim())
    && (template.id !== 'trophy' || score.trim())
    && (template.id !== 'photo' || (photo && !photoLoading)) && !busy;

  function resolveTemplate(place) {
    if (mode === 'flexible' && !place) return null;
    const id = familyId(template, place);
    return templates.find(item => item.id === id) || null;
  }

  function getImage(item) {
    if (!imageCache.current.has(item.src)) {
      const promise = Promise.all([loadImage(item.src), document.fonts.load('700 27px "Certificate Open Sans"')])
        .then(([image]) => image)
        .catch(error => { imageCache.current.delete(item.src); throw error; });
      imageCache.current.set(item.src, promise);
    }
    return imageCache.current.get(item.src);
  }

  // Keep the loader stable while a user types in the form.
  const loader = useRef(getImage).current;

  function loadPreviousRanking() {
    if (!previousRanking.length) return;
    if (source.trim() && !window.confirm('Қазіргі тізім өткен аптаның рейтингімен ауыстырылады. Жалғастыру керек пе?')) return;
    setSource(previousRanking.map(row => row.name).join('\n'));
    setPlaces(previousRanking.map(row => row.place));
  }

  function changeSource(nextSource) {
    // Keep each existing student's place when lines are inserted or moved.
    const existing = new Map();
    for (const row of rows) {
      const key = row.name + '\t' + row.second;
      const list = existing.get(key) || [];
      list.push(row.place);
      existing.set(key, list);
    }
    const nextPlaces = readRows(nextSource, template.pair).map((row, index) => {
      const matches = existing.get(row.name + '\t' + row.second);
      return matches?.length ? matches.shift() : (index < 3 ? String(index + 1) : '');
    });
    setSource(nextSource);
    setPlaces(nextPlaces);
  }

  async function downloadBatch(event) {
    event.preventDefault();
    if (!canDownload) return;
    setBusy(true);
    setError('');
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const awards = [];
      for (const [index, row] of rows.entries()) {
        setProgress((index + 1) + ' / ' + rows.length);
        const selected = resolveTemplate(row.place);
        if (!selected) throw new Error('Үлгі табылмады.');
        const image = await loader(selected);
        const canvas = document.createElement('canvas');
        canvas.width = selected.canvasWidth;
        canvas.height = selected.canvasHeight;
        renderCertificate(canvas, image, selected, {
          ...values, student: row.name, secondStudent: row.second,
          awardPlace: String(row.place || selected.place || '1'),
        }, photo);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('PNG файлын дайындау мүмкін болмады.');
        const safeName = row.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').slice(0, 90);
        const number = String(index + 1).padStart(String(rows.length).length, '0');
        const place = row.place ? '_' + row.place + '-орын' : '';
        zip.file(number + '_' + safeName + place + '.png', blob);
        awards.push({ template: selected, student: row.name, secondStudent: row.second,
          week: Number(week), month: selected.period === 'Айлық' ? Number(month) : null,
          awardPlace: row.place ? Number(row.place) : selected.place });
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'сертификаттар_' + week + '-апта.zip';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (activeGroup) awards.forEach(onSaveAward);
      setProgress('');
    } catch {
      setError('Сертификаттарды дайындау мүмкін болмады. Қайта көріңіз.');
      setProgress('');
    } finally {
      setBusy(false);
    }
  }

  return <div className="certificate-batch">
    <form className="certificate-form" onSubmit={downloadBatch}>
      <div className="certificate-period-fields">
        {template.period === 'Айлық' && <label>Ай нөмірі<input type="number" min="1" max="99" value={month} onChange={event => setMonth(event.target.value)} required /></label>}
        <label>Апта нөмірі<input type="number" min="1" max="99" value={week} onChange={event => setWeek(event.target.value)} required /></label>
      </div>
      <label>Оқушылар тізімі
        <textarea value={source} onChange={event => changeSource(event.target.value)} rows={7}
          placeholder={template.pair ? 'Бірінші оқушы\tЕкінші оқушы' : 'Қалыбекқызы Ойсана\nМұханбет Ханкелді\nРайев Алихан'} />
      </label>
      <p className="certificate-batch-hint">{template.pair
        ? 'Әр жолға бір жұпты қойыңыз. Екі оқушы бөлек бағандарда болуы керек.'
        : 'Әр жолға бір оқушыдан қойыңыз. Орнын әр сертификатта өзгертуге болады.'}</p>
      {mode === 'flexible' && template.period === 'Апталық' && <div className="certificate-previous-ranking">
        <button type="button" onClick={loadPreviousRanking} disabled={!previousRanking.length}>
          Өткен аптаның рейтингін жүктеу
        </button>
        <p className="certificate-batch-hint">{!activeGroup ? 'Рейтингті көру үшін топты таңдаңыз.'
          : !validWeek || Number(week) <= 1 ? 'Алдыңғы апта үшін апта нөмірін таңдаңыз.'
          : previousRanking.length ? `${Number(week) - 1}-апта · ${previousRanking.length} оқушы, орындарымен бірге`
          : `${Number(week) - 1}-аптада сақталған рейтинг жоқ. Сертификатты жүктегенде нәтиже тарихқа қосылады.`}</p>
      </div>}
      {mode === 'fixed' && <p className="certificate-batch-hint">Бұл үлгіде {template.place}-орын бекітілген. Тізімдегі барлық оқушыға осы орын беріледі.</p>}
      {mode === 'flexible' && rows.some(row => !row.place) && <p className="certificate-batch-hint">Төртінші жолдан бастап әр оқушының орнын таңдаңыз.</p>}
      <label>Куратордың аты-жөні<input value={curator} onChange={event => setCurator(event.target.value)} maxLength={120} required /></label>
      <label>Мұғалімнің аты-жөні<input value={teacher} onChange={event => setTeacher(event.target.value)} maxLength={120} required /></label>
      {(template.subjectBadge || template.id === 'trophy') && <label>Пән<input value={subject} onChange={event => setSubject(event.target.value)} maxLength={80} required /></label>}
      {template.id === 'trophy' && <label>Балл<input value={score} onChange={event => setScore(event.target.value)} maxLength={30} required /></label>}
      {template.id === 'photo' && <label>Фотосурет<input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
        {photoLoading && <span role="status">Фотосурет жүктеліп жатыр…</span>}
        {photoError && <span role="alert">{photoError}</span>}
      </label>}
      {template.id === 'photo' && <p className="certificate-batch-hint">Бір фотосурет барлық сертификатта қолданылады.</p>}
      {template.id === 'photo' && <button type="button" className="certificate-photo-reset" onClick={resetPhoto}>Үлгі суретін қайтару</button>}
      <button className="brand-button" type="submit" disabled={!canDownload}>
        <Download size={16} aria-hidden="true" /> {busy ? 'Дайындалып жатыр… ' + progress : 'Барлығын ZIP жүктеу'}
      </button>
      {activeGroup && <p className="certificate-batch-hint">Жүктелген нәтижелер топтың марапаттар тарихына қосылады.</p>}
      {error && <p role="alert">{error}</p>}
    </form>
    <section className="certificate-batch-results" aria-label="Сертификаттар">
      {!rows.length && <div className="certificate-batch-empty">Оқушылар тізімін енгізіңіз.</div>}
      {rows.map((row, index) => <article className="certificate-batch-card" key={index}>
        <div className="certificate-batch-card-heading">
          <strong>{row.name}{row.second ? ' · ' + row.second : ''}</strong>
          {mode === 'flexible' && <label>Орын
            <select value={row.place} onChange={event => setPlaces(current => {
              const next = [...current];
              next[index] = event.target.value;
              return next;
            })}>
              <option value="">Таңдаңыз</option>
              {[1, 2, 3].map(value => <option key={value} value={value}>{value}-орын</option>)}
            </select>
          </label>}
          {mode === 'fixed' && <span>{template.place}-орын</span>}
        </div>
        {template.pair && !row.second && <p role="alert">Екінші оқушыны қосыңыз.</p>}
        <BatchPreview entry={row} template={resolveTemplate(row.place)} values={values} photo={photo}
          getImage={loader} renderCertificate={renderCertificate} />
      </article>)}
    </section>
  </div>;
}
