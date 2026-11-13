'use client';

import { useMemo, useState } from 'react';
import { History, Trash2 } from 'lucide-react';
import styles from './CertificateHistory.module.css';

export default function CertificateHistory({ group, onDelete }) {
  const [week, setWeek] = useState('all');
  const [student, setStudent] = useState('all');
  const awards = Array.isArray(group?.certificateAwards)
    ? group.certificateAwards.filter(award => award && typeof award === 'object')
    : [];
  const weeks = [...new Set(awards.map(award => String(award.week)).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a));
  const students = useMemo(() => {
    const names = new Set();
    for (const award of awards) {
      for (const recipient of Array.isArray(award.students) ? award.students : []) {
        if (recipient?.name) names.add(recipient.name);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'kk'));
  }, [awards]);
  const shown = awards
    .filter(award => week === 'all' || String(award.week) === week)
    .filter(award => student === 'all' || (Array.isArray(award.students) && award.students.some(recipient => recipient?.name === student)))
    .slice()
    .sort((a, b) => Number(b.week) - Number(a.week) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')));

  return (
    <section className={styles.history} aria-labelledby="certificate-history-title">
      <div className={styles.heading}>
        <div>
          <h2 id="certificate-history-title"><History size={18} aria-hidden="true" /> Марапаттар тарихы</h2>
          {group && <p>{group.name}</p>}
        </div>
        {awards.length > 0 && <div className={styles.filters}>
          <label>Апта
            <select aria-label="Апта" value={week} onChange={event => setWeek(event.target.value)}>
              <option value="all">Барлық апта</option>
              {weeks.map(value => <option key={value} value={value}>{value}-апта</option>)}
            </select>
          </label>
          <label>Оқушы
            <select aria-label="Оқушы" value={student} onChange={event => setStudent(event.target.value)}>
              <option value="all">Барлық оқушы</option>
              {students.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
        </div>}
      </div>
      {!group ? <p className={styles.empty}>Тарихты көру үшін топты таңдаңыз.</p>
        : awards.length === 0 ? <p className={styles.empty}>Бұл топта әзірге марапаттар жоқ.</p>
          : shown.length === 0 ? <p className={styles.empty}>Таңдалған сүзгі бойынша марапат табылмады.</p>
            : <ul className={styles.list}>
                {shown.map(award => <li className={styles.row} key={award.id}>
                  <div className={styles.period}>{award.week}-апта{award.period === 'Айлық' && award.month ? ' · ' + award.month + '-ай' : ''}</div>
                  <div className={styles.details}>
                    <strong>{award.category}</strong>
                    <span>{(Array.isArray(award.students) ? award.students : []).map(recipient => recipient?.name).filter(Boolean).join(' · ')}</span>
                    <small>{award.templateLabel}</small>
                  </div>
                  <button type="button" className={styles.remove} onClick={() => onDelete(award.id)}
                    aria-label={award.category + ' марапатын тарихтан жою'} title="Тарихтан жою">
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </li>)}
              </ul>}
    </section>
  );
}
