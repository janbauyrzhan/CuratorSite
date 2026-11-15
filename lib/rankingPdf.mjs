// Extract rows using the column headings and text positions, never the row
// number: the latter is only a serial number when pupils have equal scores.
export function extractRankingPages(pages) {
  const results = [];
  for (const page of pages) {
    if (!Array.isArray(page.items) || page.items.length > 10000) throw new Error('PDF кестесі тым үлкен немесе оқылмайды.');
    const items = page.items.filter(item => typeof item.str === 'string' && item.str.trim() && Array.isArray(item.transform))
      .map(item => ({ text: item.str.trim().normalize('NFKC'), x: item.transform[4], y: item.transform[5], width: item.width || 0 }));
    const nameHeader = items.find(item => /^(аты[\s-]*жөні|аты[\s-]*жони|фио)$/iu.test(item.text));
    const totalHeaders = items.filter(item => /^(қорытынды(?:\s+балл)?|итог(?:овый\s+балл)?)$/iu.test(item.text));
    if (!nameHeader || totalHeaders.length !== 1) throw new Error('PDF бағандарын анықтау мүмкін болмады. «Аты-жөні» және «Қорытынды» бағандары бар мәтіндік PDF таңдаңыз.');
    const total = totalHeaders[0];
    const headers = items.filter(item => Math.abs(item.y - nameHeader.y) < 12);
    const firstOther = headers.filter(item => item.x > nameHeader.x + nameHeader.width + 1 && item.x < total.x)
      .sort((a, b) => a.x - b.x)[0];
    const afterTotal = headers.filter(item => item.x > total.x + total.width + 1).sort((a, b) => a.x - b.x)[0];
    if (!firstOther || !afterTotal) throw new Error('PDF кестесіндегі бағандарды сенімді анықтау мүмкін болмады.');
    const nameStart = Math.max(0, nameHeader.x - Math.max(30, nameHeader.width * 1.5));
    const nameEnd = firstOther.x;
    const totalStart = total.x - 3;
    const totalEnd = (total.x + total.width + afterTotal.x) / 2;
    if (nameEnd <= nameStart || totalStart <= nameEnd || totalEnd <= totalStart) throw new Error('PDF кестесінің пішімі қолдау таппады.');
    const lines = [];
    for (const item of items.filter(item => item.y < nameHeader.y - 4).sort((a, b) => b.y - a.y || a.x - b.x)) {
      let line = lines.find(row => Math.abs(row.y - item.y) < 1.2);
      if (!line) { line = { y: item.y, items: [] }; lines.push(line); }
      line.items.push(item);
    }
    for (const line of lines) {
      const cells = line.items.sort((a, b) => a.x - b.x);
      const prefix = cells.filter(item => item.x >= nameStart && item.x < nameEnd);
      const serial = prefix.find(item => /^\d{1,4}[.)]?$/.test(item.text));
      if (!serial) continue;
      const name = prefix.filter(item => item !== serial).map(item => item.text).join(' ').trim();
      const courseScores = cells.filter(item => item.x >= nameEnd && item.x < totalStart && /^\d+(?:[.,]\d+)?$/.test(item.text));
      if (courseScores.length < 2) continue;
      if (!/\p{L}/u.test(name)) throw new Error('Кемінде бір оқушының атын оқу мүмкін болмады. PDF файлын тексеріңіз.');
      const totals = cells.filter(item => item.x >= totalStart && item.x < totalEnd)
        .map(item => /^(\d+(?:[.,]\d+)?)(?:\s*(?=\p{L})|$)/u.exec(item.text)?.[1]).filter(Boolean);
      if (totals.length !== 1) throw new Error('Кемінде бір оқушының қорытынды балын оқу мүмкін болмады. PDF файлын тексеріңіз.');
      const score = Number(totals[0].replace(',', '.'));
      if (!Number.isFinite(score)) throw new Error('Қорытынды балды оқу мүмкін болмады.');
      results.push({ name, score });
    }
  }
  if (!results.length) throw new Error('Оқушылар мен қорытынды балдар табылмады. Сурет түріндегі PDF бұл жерде оқылмайды.');
  return results;
}

export function rankTopThree(rows, rule = 'dense') {
  const sorted = rows.map((row, index) => ({ ...row, index })).sort((a, b) => b.score - a.score || a.index - b.index);
  let previous, dense = 0, place = 0;
  return sorted.flatMap((row, index) => {
    if (index === 0 || row.score !== previous) {
      dense += 1;
      place = rule === 'competition' ? index + 1 : dense;
      previous = row.score;
    }
    return place <= 3 ? [{ name: row.name, score: row.score, place: String(place) }] : [];
  });
}

export async function readRankingPdf(file) {
  if (!file || file.size === 0 || file.size > 15 * 1024 * 1024) throw new Error('Көлемі 15 МБ-тан аспайтын PDF файлын таңдаңыз.');
  const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
  const loading = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
  try {
    const document = await loading.promise;
    if (document.numPages > 30) throw new Error('PDF 30 беттен аспауы керек.');
    const pages = [];
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      pages.push({ items: content.items });
      page.cleanup();
    }
    return extractRankingPages(pages);
  } finally {
    await loading.destroy();
  }
}
