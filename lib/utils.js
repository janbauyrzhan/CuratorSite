// ─── uid ────────────────────────────────────────────────────────────────────
export const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Phone formatter ─────────────────────────────────────────────────────────
export function fmtPhone(raw = '') {
  const d = String(raw).replace(/\D/g, '');
  if (d.length === 11 && (d[0] === '8' || d[0] === '7'))
    return `+7 (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7,9)}-${d.slice(9,11)}`;
  if (d.length === 10)
    return `+7 (${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,8)}-${d.slice(8,10)}`;
  return raw;
}

// ─── Gender heuristic ────────────────────────────────────────────────────────
export function normalizeGender(g) {
  if (g === 'girl' || g === 'f') return 'girl';
  if (g === 'boy' || g === 'm') return 'boy';
  return 'unknown';
}

export function guessGender(name = '') {
  const clean = cleanStudentName(name).trim();
  if (!clean) return 'unknown';

  const words = clean.toLowerCase().split(/[\s\-–—]+/);

  // 1. Strong patronymic / Kazakh / Russian suffix indicators
  for (const w of words) {
    if (w.endsWith('қызы') || w.endsWith('кызы') || w.endsWith('кизи') ||
        w.endsWith('овна') || w.endsWith('евна') || w.endsWith('ична') || w.endsWith('инична')) {
      return 'girl';
    }
    if (w.endsWith('ұлы') || w.endsWith('улы') || w.endsWith('оглы') || w.endsWith('оғлы') ||
        w.endsWith('ович') || w.endsWith('евич') || w.endsWith('ич')) {
      return 'boy';
    }
  }

  // 2. Standard Russian/Kazakh surname endings
  for (const w of words) {
    if (w.endsWith('ова') || w.endsWith('ева') || w.endsWith('ина') || w.endsWith('ая') || w.endsWith('ская')) {
      return 'girl';
    }
    if (w.endsWith('ов') || w.endsWith('ев') || w.endsWith('ин') || w.endsWith('ый') || w.endsWith('ий') || w.endsWith('ский')) {
      return 'boy';
    }
  }

  // 3. Known given names dictionary
  const femaleNames = new Set([
    'аружан', 'айгерім', 'айгерим', 'дильназ', 'адина', 'айзере', 'жұлдыз', 'жулдыз',
    'мадина', 'томирис', 'амина', 'арайлым', 'анель', 'жанель', 'ақерке', 'акерке',
    'кәусар', 'каусар', 'меруерт', 'жібек', 'жибек', 'салтанат', 'жанар', 'гүлім', 'гулим',
    'аяулым', 'айсана', 'айлин', 'динара', 'назерке', 'алина', 'камила', 'диана',
    'жансая', 'іңкәр', 'инкар', 'айдана', 'толғанай', 'толганай', 'балнұр', 'балнур',
    'дана', 'зере', 'аяу', 'айша', 'айым', 'гүлназ', 'гулназ', 'раушан', 'назым', 'аида'
  ]);

  const maleNames = new Set([
    'нұрдәулет', 'нурдаулет', 'әлихан', 'алихан', 'еркінжан', 'еркинжан', 'али', 'әли',
    'ербол', 'арман', 'даурен', 'тимур', 'санжар', 'мұрат', 'мурат', 'ержан',
    'асылхан', 'бекзат', 'бауыржан', 'айдос', 'диас', 'исмаил', 'азамат', 'темирлан',
    'темірлан', 'елдос', 'дамир', 'ернат', 'бақытжан', 'бакытжан', 'ерасыл', 'ибрагим',
    'елдар', 'бексұлтан', 'бексултан', 'нұрислам', 'нурислам', 'айбек', 'дінмұхаммед',
    'динмухаммед', 'мирас', 'сұлтан', 'султан', 'асыл', 'ерлан', 'руслан', 'бейбарыс',
    'алдияр', 'мағжан', 'магжан', 'қыран', 'кыран'
  ]);

  for (const w of words) {
    if (femaleNames.has(w)) return 'girl';
    if (maleNames.has(w)) return 'boy';
  }

  // 4. Typical roots and endings for names
  for (const w of words) {
    if (w.endsWith('бану') || w.endsWith('айым') || w.endsWith('гүл') || w.endsWith('гул') ||
        w.endsWith('ару') || w.endsWith('зере') || w.endsWith('дана')) {
      return 'girl';
    }
    if (w.endsWith('бек') || w.endsWith('хан') || w.endsWith('бай') || w.endsWith('жан') ||
        w.endsWith('бол') || w.endsWith('серік') || w.endsWith('серик')) {
      return 'boy';
    }
  }

  // 5. Fallback on first name ending
  const fn = words[1] || words[0] || '';
  if (fn.endsWith('а') || fn.endsWith('я')) return 'girl';

  return 'unknown';
}

// ─── Invisible-char cleaner ──────────────────────────────────────────────────
export function cleanInvisible(str) {
  return String(str || '').replace(/[\u200B-\u200D\uFEFF\u00AD\u2060]/g, '');
}

// ─── Clean student name (removes numbers, bullets, phone labels, trailing phones) ─
export function cleanStudentName(rawName) {
  return String(rawName || '')
    .replace(/^[\s\d\.\)\-–—•\*,;:]+/, '')
    .replace(/(?:(?:\+?[78][\s\-()]*)?(?:\d[\s\-()]*){10,11}|\b\d{10,11}\b)[\s\S]*$/, '')
    .replace(/[\s\-–—,;:\.]*(?:тел|телефон|сот|номер|ном|phone|tel)[\s\-–—,;:\.]*$/gi, '')
    .replace(/[\s\-–—,;:\.]+$/, '')
    .trim();
}

// ─── Smart parser ────────────────────────────────────────────────────────────
// Flexible: works with newline-separated lists (with or without phones),
// numbered lists ("1. Name"), comma/semicolon-separated lists,
// and continuous text with glued phone numbers.
export function parseStudents(raw, { stripPhones = false, existingGenders = {} } = {}) {
  const text = cleanInvisible(String(raw || '')).trim();
  if (!text) return [];
  const results = [];
  const seen = new Set();

  const add = (name, phone) => {
    const n = cleanStudentName(name);
    if (!n || n.length < 2) return;
    const key = n.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const existingG = existingGenders[key] || existingGenders[n];
    const gender = existingG ? normalizeGender(existingG) : guessGender(n);
    results.push({
      id: uid(),
      name: n,
      phone: stripPhones ? '' : (phone ? String(phone).replace(/\D/g, '') : ''),
      gender: normalizeGender(gender),
    });
  };

  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);

  if (lines.length > 1) {
    for (const line of lines) {
      const gluedRe = /([^\d]+?)(?:(?:\+?7|8)\d{10}|\b\d{10,11}\b)/g;
      const matches = [...line.matchAll(gluedRe)];
      if (matches.length > 1) {
        let lastEnd = 0;
        for (const m of matches) {
          add(m[1], m[0].replace(m[1], ''));
          lastEnd = m.index + m[0].length;
        }
        if (lastEnd < line.length) {
          const rest = line.slice(lastEnd).trim();
          if (cleanStudentName(rest).length >= 2) add(rest, '');
        }
      } else {
        const pm = line.match(/(?:(?:\+?[78][\s\-()]*)?(?:\d[\s\-()]*){10,11}|\b\d{10,11}\b)/);
        if (pm) {
          add(line.replace(pm[0], ''), pm[0]);
        } else {
          add(line, '');
        }
      }
    }
  } else if (lines.length === 1) {
    const single = lines[0];
    const gluedRe = /([^\d]+?)(?:(?:\+?7|8)\d{10}|\b\d{10,11}\b)/g;
    const matches = [...single.matchAll(gluedRe)];
    if (matches.length > 1) {
      let lastEnd = 0;
      for (const m of matches) {
        add(m[1], m[0].replace(m[1], ''));
        lastEnd = m.index + m[0].length;
      }
      if (lastEnd < single.length) {
        const rest = single.slice(lastEnd).trim();
        if (cleanStudentName(rest).length >= 2) add(rest, '');
      }
    } else if (matches.length === 1 && single.replace(matches[0][0], '').trim().length === 0) {
      add(matches[0][1], matches[0][0].replace(matches[0][1], ''));
    } else if (single.includes(',') || single.includes(';') || single.includes('\t')) {
      single.split(/[,;\t]+/).forEach(part => {
        const pm = part.match(/(?:(?:\+?[78][\s\-()]*)?(?:\d[\s\-()]*){10,11}|\b\d{10,11}\b)/);
        if (pm) add(part.replace(pm[0], ''), pm[0]);
        else add(part, '');
      });
    } else {
      const pm = single.match(/(?:(?:\+?[78][\s\-()]*)?(?:\d[\s\-()]*){10,11}|\b\d{10,11}\b)/);
      if (pm) add(single.replace(pm[0], ''), pm[0]);
      else add(single, '');
    }
  }

  return results;
}

// ─── Normalize textarea to one "Name Phone" (or "Name") per line ─────────────
export function normalizeText(raw, options = {}) {
  const parsed = parseStudents(raw, options);
  if (!parsed.length) return raw;
  return parsed.map(s => s.phone ? `${s.name} ${s.phone}` : s.name).join('\n');
}

// ─── Round-Robin carousel (guarantees no repeat pairs) ───────────────────────
// When students count is odd:
// - Rows 1..N-1 get standard pairs (1 student on left, 1 on right)
// - The lone student is moved to the NEXT ROW as a single item: [lone]
// - Left cell gets the student's name and phone, right cell remains empty
export function makeSchedule(students) {
  if (!students || students.length < 2) {
    if (students && students.length === 1) return [[[students[0]]]];
    return [];
  }
  let list = [...students];
  const odd = list.length % 2 !== 0;
  if (odd) list.push({ id: '__bye__', name: 'Байпас', phone: '', gender: 'u' });
  const n = list.length;
  const schedule = [];
  const fixed = list[0];
  let rot = list.slice(1);
  for (let w = 0; w < n - 1; w++) {
    const circle = [fixed, ...rot];
    const pairs = [];
    for (let i = 0; i < n / 2; i++) pairs.push([circle[i], circle[n - 1 - i]]);
    schedule.push(pairs);
    rot = [rot[rot.length - 1], ...rot.slice(0, rot.length - 1)];
  }

  // Odd: find the pair with __bye__, extract the lone student, and place on next row
  if (odd) {
    return schedule.map(pairs => {
      const byeI = pairs.findIndex(p => p[0].id === '__bye__' || p[1].id === '__bye__');
      if (byeI === -1) return pairs;
      const lone = pairs[byeI][0].id === '__bye__' ? pairs[byeI][1] : pairs[byeI][0];
      const realPairs = pairs.filter((_, i) => i !== byeI);
      if (!realPairs.length) return lone ? [[lone]] : [];
      return [...realPairs, [lone]];
    });
  }
  return schedule;
}

// ─── Gender-separated schedule ───────────────────────────────────────────────
export function makeGenderedSchedule(students) {
  if (!students || students.length < 2) {
    if (students && students.length === 1) return [[[students[0]]]];
    return [];
  }

  const boys = students
    .filter(s => normalizeGender(s.gender) === 'boy')
    .map(s => ({ ...s, gender: 'boy' }));
  const girls = students
    .filter(s => normalizeGender(s.gender) === 'girl')
    .map(s => ({ ...s, gender: 'girl' }));
  const others = students.filter(s => normalizeGender(s.gender) === 'unknown');

  // Balance unknowns to minimize unmatched singles
  others.forEach(s => {
    if (boys.length <= girls.length) boys.push({ ...s, gender: 'boy' });
    else girls.push({ ...s, gender: 'girl' });
  });

  const bs = makeSchedule(boys);
  const gs = makeSchedule(girls);

  const len = Math.max(bs.length, gs.length, 1);
  return Array.from({ length: len }, (_, w) => {
    const bWeek = bs.length > 0 ? (bs[w % bs.length] || []) : [];
    const gWeek = gs.length > 0 ? (gs[w % gs.length] || []) : [];

    const bFull = bWeek.filter(p => p.length >= 2);
    const gFull = gWeek.filter(p => p.length >= 2);

    const bSingle = bWeek.find(p => p.length === 1)?.[0] || null;
    const gSingle = gWeek.find(p => p.length === 1)?.[0] || null;

    const pairs = [...bFull, ...gFull];

    if (bSingle && gSingle) {
      // Both groups have an odd member: pair up the odd boy and girl together
      pairs.push([bSingle, gSingle]);
    } else if (bSingle) {
      pairs.push([bSingle]);
    } else if (gSingle) {
      pairs.push([gSingle]);
    }

    return pairs;
  });
}

// Old browser-only accounts are read solely to offer an explicit workspace import.
export function getLegacyWorkspaces() {
  if (typeof window === 'undefined') return [];
  const workspaces = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('infologia_groups_')) continue;
      const data = JSON.parse(localStorage.getItem(key) || 'null');
      if (data && Array.isArray(data.groups) && data.groups.length > 0) {
        workspaces.push({ username: key.slice('infologia_groups_'.length), data });
      }
    }
  } catch {}
  return workspaces;
}

export function clearLegacyCredentials() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('infologia_auth');
  localStorage.removeItem('infologia_users');
}

// ─── Export: TSV (Excel / Google Sheets) ─────────────────────────────────────
// Format: Name1\tPhone1\tName2\tPhone2 — each row, Ctrl+V fills 4 columns
// For lone student row: {Имя}\t{Телефон}\t\t
export function pairsToTSV(pairs) {
  return pairs.map(p => {
    const name1  = p[0]?.name || '';
    const phone1 = p[0]?.phone || '';
    const name2  = p[1]?.name || '';
    const phone2 = p[1]?.phone || '';
    return [name1, phone1, name2, phone2].join('\t');
  }).join('\n');
}

// ─── Export: CSV for Canva Bulk Create ───────────────────────────────────────
export function pairsToCSV(pairs, weekNum, subject) {
  const header = 'week,subject,name1,phone1,name2,phone2\n';
  const rows = pairs.map(p =>
    [weekNum, subject || '', p[0]?.name || '', p[0]?.phone || '',
     p[1]?.name || '', p[1]?.phone || ''].join(',')
  ).join('\n');
  return header + rows;
}

// ─── Download helper ──────────────────────────────────────────────────────────
export function downloadFile(content, filename, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\ufeff' + content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
