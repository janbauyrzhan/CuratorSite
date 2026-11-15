import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRankingPages, rankTopThree } from '../lib/rankingPdf.mjs';

function item(text, x, y, width = 10) {
  return { str: text, width, transform: [1, 0, 0, 1, x, y] };
}
function sample(rows) {
  return [{ items: [item('Аты-жөні', 70, 100, 20), item('Сабақ', 120, 100),
    item('Қорытынды', 200, 100, 25), item('Ескерту', 250, 100),
    ...rows.flatMap((row, index) => [item(String(index + 1), 50, 90 - index * 7),
      item(row.name, 60, 90 - index * 7), item('10', 135, 90 - index * 7),
      item('9', 160, 90 - index * 7), item(row.score, 210, 90 - index * 7)])] }];
}

test('ranking includes every tied pupil and supports both ranking rules', () => {
  const rows = [{ name: 'A', score: 100 }, { name: 'B', score: 90 },
    { name: 'C', score: 90 }, { name: 'D', score: 80 }, { name: 'E', score: 75 }];
  assert.deepEqual(rankTopThree(rows).map(r => [r.name, r.place]), [['A', '1'], ['B', '2'], ['C', '2'], ['D', '3']]);
  assert.deepEqual(rankTopThree(rows, 'competition').map(r => [r.name, r.place]), [['A', '1'], ['B', '2'], ['C', '2']]);
  assert.deepEqual(rankTopThree([{ name: 'A', score: 4 }, { name: 'B', score: 4 }, { name: 'C', score: 3 }], 'competition').map(r => r.place), ['1', '1', '3']);
});

test('finds final-score column and sorts numeric scores rather than serial numbers', () => {
  const rows = extractRankingPages(sample([{ name: 'Айжан', score: '90' }, { name: 'Аслан', score: '100' }, { name: 'Әлия', score: '90' }]));
  assert.deepEqual(rankTopThree(rows).map(r => [r.name, r.place]), [['Аслан', '1'], ['Айжан', '2'], ['Әлия', '2']]);
});

test('fails safely for an unreadable score or unsupported file', () => {
  assert.throws(() => extractRankingPages(sample([{ name: 'Айжан', score: '—' }])), /бал/);
  assert.throws(() => extractRankingPages([{ items: [] }]), /баған/);
});
