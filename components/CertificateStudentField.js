'use client';

import { useMemo } from 'react';
import { parseStudents } from '@/lib/utils';

export function certificateStudentKey(name) {
  return String(name || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('kk');
}

export function getCertificateStudents(group) {
  if (!group) return [];

  const pairs = Array.isArray(group.students_pairs) && group.students_pairs.length
    ? group.students_pairs
    : parseStudents(group.rawTextPairs || '');
  const exam = Array.isArray(group.students_exam) && group.students_exam.length
    ? group.students_exam
    : parseStudents(group.rawTextExam || '', { stripPhones: true });
  const students = new Map();

  for (const entry of [...pairs, ...exam]) {
    const name = String(typeof entry === 'string' ? entry : entry?.name || '').trim().replace(/\s+/g, ' ');
    const key = certificateStudentKey(name);
    if (key && !students.has(key)) students.set(key, { key, name });
  }

  return [...students.values()];
}

export default function CertificateStudentField({ group, label, value, onChange }) {
  const students = useMemo(() => getCertificateStudents(group), [group]);
  const selected = students.find(student => student.key === certificateStudentKey(value));

  return (
    <div style={{ display: 'grid', gap: '6px' }}>
      <label>
        {label}
        <input value={value} onChange={event => onChange(event.target.value)} required maxLength={120} />
      </label>
      {students.length > 0 && (
        <select aria-label={label + ' — топтан таңдау'} value={selected?.key || ''}
          onChange={event => {
            const student = students.find(item => item.key === event.target.value);
            if (student) onChange(student.name);
          }}>
          <option value="">Топтан таңдау</option>
          {students.map(student => <option key={student.key} value={student.key}>{student.name}</option>)}
        </select>
      )}
    </div>
  );
}
