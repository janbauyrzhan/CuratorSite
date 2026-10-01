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
export function guessGender(name = '') {
  const parts = name.trim().split(/\s+/);
  const fn = (parts[1] || parts[0] || '').toLowerCase();
  const female = ['а','я','ова','ева','ина','ана','гүл','нур','айым','бану','ай','ару',
    'дана','зере','аяр','назгүл','жібек','меруерт','гүлнар','айгүл','салтанат','жанар','гүлім'];
  if (female.some(e => fn.endsWith(e))) return 'f';
  const male = ['ов','ев','ин','ұлы','улы','оглы','бек','хан','жан','ербол',
    'даурен','арман','тимур','асыл','нұр','мұрат','ержан','санжар'];
  if (male.some(e => fn.endsWith(e))) return 'm';
  return 'u';
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
export function parseStudents(raw, { stripPhones = false } = {}) {
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
    results.push({
      id: uid(),
      name: n,
      phone: stripPhones ? '' : (phone ? String(phone).replace(/\D/g, '') : ''),
      gender: guessGender(n),
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
  const boys   = [...students.filter(s => s.gender === 'm')];
  const girls  = [...students.filter(s => s.gender === 'f')];
  const others = students.filter(s => s.gender === 'u');
  others.forEach(s => {
    if (boys.length <= girls.length) boys.push({ ...s, gender: 'm' });
    else girls.push({ ...s, gender: 'f' });
  });
  const bs = makeSchedule(boys);
  const gs = makeSchedule(girls);
  const len = Math.max(bs.length, gs.length, 1);
  return Array.from({ length: len }, (_, w) => {
    const bPairs = bs[w % Math.max(bs.length, 1)] || [];
    const gPairs = gs[w % Math.max(gs.length, 1)] || [];
    const combined = [...bPairs, ...gPairs];
    const fullPairs = combined.filter(p => p.length >= 2);
    const singles   = combined.filter(p => p.length === 1);
    return [...fullPairs, ...singles];
  });
}

// ─── LocalStorage helpers (Strict User-Scoped Storage) ───────────────────────
// Key format: infologia_groups_${currentUser}
export function getUserGroupsKey(username) {
  const safe = String(username || '').trim().toLowerCase().replace(/[^a-z0-9а-яё_-]/gi, '_');
  return `infologia_groups_${safe}`;
}

export function loadUserGroups(username) {
  if (typeof window === 'undefined' || !username) return null;
  try {
    const key = getUserGroupsKey(username);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUserGroups(username, data) {
  if (typeof window === 'undefined' || !username) return;
  try {
    const key = getUserGroupsKey(username);
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

// Backward-compat aliases
export const getUserLSKey = getUserGroupsKey;
export const loadUserLS = loadUserGroups;
export const saveUserLS = saveUserGroups;

// ─── Session helpers ──────────────────────────────────────────────────────────
export function getSession() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('infologia_auth') || 'null'); } catch { return null; }
}
export function setSession(u) {
  localStorage.setItem('infologia_auth', JSON.stringify(u));
}
export function clearSession() {
  localStorage.removeItem('infologia_auth');
}
export function getUsers() {
  try { return JSON.parse(localStorage.getItem('infologia_users') || '[]'); } catch { return []; }
}
export function saveUsers(u) {
  localStorage.setItem('infologia_users', JSON.stringify(u));
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
