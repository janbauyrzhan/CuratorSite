'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileUp } from 'lucide-react';
import { previousWeeklyRanking } from '../lib/certificateAwardHistory';
import { rankTopThree, readRankingPdf } from '../lib/rankingPdf.mjs';

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
          score: entry.score ?? values.score,
        }, photo);
      }
    }).catch(() => { if (!cancelled) setError('Үлгі жүктелмеді.'); });
    return () => { cancelled = true; };
  }, [entry.name, entry.second, entry.place, entry.score, template, values.teacher, values.curator,
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
  const [scores, setScores] = useState([]);
  const [pdfRows, setPdfRows] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [tieRule, setTieRule] = useState('dense');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const imageCache = useRef(new Map());
  const mode = rankMode(template);
  const previousRanking = previousWeeklyRanking(activeGroup, week);
  const rows = readRows(source, template.pair).map((row, index) => ({
    ...row,
    place: mode === 'nomination' ? null : mode === 'fixed' ? template.place : (places[index] ?? (index < 3 ? String(index + 1) : '')),
    score: scores[index] ?? null,
  }));
  const pdfRanking = pdfRows ? rankTopThree(pdfRows, tieRule) : [];
  const validWeek = /^[1-9]\d?$/.test(week);
  const validMonth = template.period !== 'Айлық' || /^[1-9]\d?$/.test(month);
  const rowReady = row => (mode !== 'flexible' || row.place) && (!template.pair || row.second);
  const formReady = validWeek && validMonth && teacher.trim() && curator.trim()
    && (!(template.subjectBadge || template.id === 'trophy') || subject.trim())
    && (template.id !== 'trophy' || score.trim())
    && (template.id !== 'photo' || (photo && !photoLoading)) && !busy;
  const canDownload = formReady && rows.length > 0 && rows.every(rowReady);

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
    setScores([]);
  }

  function changeSource(nextSource) {
    // Keep each existing student's place when lines are inserted or moved.
    const existing = new Map();
    for (const row of rows) {
      const key = row.name + '\t' + row.second;
      const list = existing.get(key) || [];
      list.push({ place: row.place, score: row.score });
      existing.set(key, list);
    }
    const nextRows = readRows(nextSource, template.pair).map((row, index) => {
      const matches = existing.get(row.name + '\t' + row.second);
      return matches?.length ? matches.shift() : { place: index < 3 ? String(index + 1) : '', score: null };
    });
    setSource(nextSource);
    setPlaces(nextRows.map(row => row.place));
    setScores(nextRows.map(row => row.score));
  }

  async function chooseRankingPdf(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPdfBusy(true);
    setPdfError('');
    setPdfRows(null);
    try {
      const found = await readRankingPdf(file);
      setPdfRows(found);
      setPdfName(file.name);
    } catch (error) {
      setPdfError(error?.message?.includes('PDF') || error?.message?.includes('бал')
        ? error.message : 'PDF файлын ашу мүмкін болмады. Мәтіндік PDF файлын тексеріңіз.');
    } finally {
      setPdfBusy(false);
    }
  }

  function applyPdfRanking() {
    if (!pdfRanking.length) return;
    if (source.trim() && !window.confirm('Қазіргі тізім PDF рейтингіндегі оқушылармен ауыстырылады. Жалғастыру керек пе?')) return;
    setSource(pdfRanking.map(row => row.name).join('\n'));
    setPlaces(pdfRanking.map(row => row.place));
    setScores(pdfRanking.map(row => String(row.score)));
    setPdfRows(null);
  }

  async function downloadRows(selectedRows) {
    if (!formReady || !selectedRows.length || !selectedRows.every(rowReady)) return;
    setBusy(true);
    setError('');
    const prepared = [];
    try {
      for (const [index, row] of selectedRows.entries()) {
        setProgress((index + 1) + ' / ' + selectedRows.length);
        const selected = resolveTemplate(row.place);
        if (!selected) throw new Error('Үлгі табылмады.');
        const image = await loader(selected);
        const canvas = document.createElement('canvas');
        canvas.width = selected.canvasWidth;
        canvas.height = selected.canvasHeight;
        renderCertificate(canvas, image, selected, {
          ...values, student: row.name, secondStudent: row.second,
          awardPlace: String(row.place || selected.place || '1'),
          score: row.score ?? values.score,
        }, photo);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('PNG файлын дайындау мүмкін болмады.');
        const safeName = [row.name, row.second].filter(Boolean).join(' - ').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').slice(0, 120);
        const place = row.place ? row.place + '-орын_' : '';
        prepared.push({ blob, filename: place + safeName + '.png', award: { template: selected, student: row.name, secondStudent: row.second,
          week: Number(week), month: selected.period === 'Айлық' ? Number(month) : null,
          awardPlace: row.place ? Number(row.place) : selected.place } });
      }
      // Browsers may ask the user to allow multiple automatic downloads.
      for (const file of prepared) {
        const url = URL.createObjectURL(file.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
      if (activeGroup) prepared.forEach(file => onSaveAward(file.award));
      setProgress('');
    } catch {
      setError('Сертификаттарды дайындау мүмкін болмады. Қайта көріңіз.');
      setProgress('');
    } finally {
      setBusy(false);
    }
  }

  function downloadBatch(event) {
    event.preventDefault();
    if (canDownload) downloadRows(rows);
  }

  return <>
    {pdfRows && <section className="certificate-pdf-review" aria-label="PDF рейтингін тексеру">
      <div><strong>PDF рейтингін тексеріңіз</strong><p className="certificate-pdf-filename">{pdfName}</p></div>
      <label>Бірдей балл кезіндегі орын
        <select value={tieRule} onChange={event => setTieRule(event.target.value)}>
          <option value="dense">Орын қалдырмау: 1, 1, 2, 3</option>
          <option value="competition">Орын өткізіледі: 1, 1, 3</option>
        </select>
      </label>
      <p>Алғашқы үш орынға кіргендердің барлығы көрсетілді. Балл бірдей болса, орын да бірдей.</p>
      <ol className="certificate-pdf-list">
        {pdfRanking.map((row, index) => <li key={index}><span>{row.place}-орын</span><strong>{row.name}</strong><span>{row.score} балл</span></li>)}
      </ol>
      <button type="button" onClick={applyPdfRanking}>Оқушыларды сертификатқа қосу</button>
    </section>}
    <div className="certificate-batch">
    <form className="certificate-form" onSubmit={downloadBatch}>
      <div className="certificate-period-fields">
        {template.period === 'Айлық' && <label>Ай нөмірі<input type="number" min="1" max="99" value={month} onChange={event => setMonth(event.target.value)} required /></label>}
        <label>Апта нөмірі<input type="number" min="1" max="99" value={week} onChange={event => setWeek(event.target.value)} required /></label>
      </div>
      {mode === 'flexible' && <div className="certificate-pdf-import">
        <label className="certificate-pdf-upload"><FileUp size={16} aria-hidden="true" /> {pdfBusy ? 'PDF оқылып жатыр…' : 'PDF рейтингін оқу'}
          <input type="file" accept="application/pdf,.pdf" onChange={chooseRankingPdf} disabled={pdfBusy} />
        </label>
        <p className="certificate-batch-hint">Файл құрылғыңызда оқылады. Рейтингті алдымен тексеріңіз.</p>
        {pdfError && <p className="certificate-pdf-error" role="alert">{pdfError}</p>}
      </div>}
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
      {template.id === 'trophy' && rows.some(row => row.score !== null) && <p className="certificate-batch-hint">PDF-тен алынған әр оқушының өз балы сертификатта көрсетіледі.</p>}
      {template.id === 'photo' && <label>Фотосурет<input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} />
        {photoLoading && <span role="status">Фотосурет жүктеліп жатыр…</span>}
        {photoError && <span role="alert">{photoError}</span>}
      </label>}
      {template.id === 'photo' && <p className="certificate-batch-hint">Бір фотосурет барлық сертификатта қолданылады.</p>}
      {template.id === 'photo' && <button type="button" className="certificate-photo-reset" onClick={resetPhoto}>Үлгі суретін қайтару</button>}
      <button className="brand-button" type="submit" disabled={!canDownload}>
        <Download size={16} aria-hidden="true" /> {busy ? 'Дайындалып жатыр… ' + progress : 'Барлығын PNG жүктеу'}
      </button>
      {rows.length > 1 && <p className="certificate-batch-hint">Әр сертификат бөлек жүктеледі. Браузер сұраса, бірнеше файлды жүктеуге рұқсат беріңіз.</p>}
      {activeGroup && <p className="certificate-batch-hint">Жүктелген нәтижелер топтың марапаттар тарихына қосылады.</p>}
      {error && <p role="alert">{error}</p>}
    </form>
    <section className="certificate-batch-results" aria-label="Сертификаттар">
      {!rows.length && <div className="certificate-batch-empty">Оқушылар тізімін енгізіңіз.</div>}
      {rows.map((row, index) => <article className="certificate-batch-card" key={index}>
        <div className="certificate-batch-card-heading">
          <strong>{row.name}{row.second ? ' · ' + row.second : ''}</strong>
          {row.score !== null && <span>{row.score} балл</span>}
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
        <button className="certificate-batch-single-download" type="button" disabled={!formReady || !rowReady(row)}
          onClick={() => downloadRows([row])} aria-label={row.name + ' сертификатын жүктеу'}>
          <Download size={14} aria-hidden="true" /> PNG жүктеу
        </button>
      </article>)}
    </section>
  </div></>;
}
