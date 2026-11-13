const DAY = 24 * 60;
const SEATS_PER_SLOT = 2;

function toMinutes(time) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes) {
  const value = minutes % DAY;
  return [Math.floor(value / 60), value % 60].map(part => String(part).padStart(2, '0')).join(':');
}

export function buildExamSchedule({ order, appointments, locks, singleDay, startTime, secondStartTime, dates, interval }) {
  const duration = Number(interval) || 10;
  const firstStart = toMinutes(startTime) ?? 600;
  const secondStart = toMinutes(secondStartTime) ?? firstStart + 8 * duration;
  const days = singleDay
    ? [{ start: firstStart, size: 16, offset: 0, date: dates[0] }]
    : [
      { start: firstStart, size: 8, offset: 0, date: dates[0] },
      { start: secondStart, size: 8, offset: 8, date: dates[1] },
    ];
  const basePositions = new Map(order.flatMap((row, index) =>
    row.map((student, seat) => [student.id, index * SEATS_PER_SLOT + seat])
  ));
  const studentsById = new Map(order.flat().map(student => [student.id, student]));
  const fixedTimes = new Map();
  for (const appointment of appointments) {
    const minutes = toMinutes(appointment.time);
    if (minutes === null) continue;
    const original = (basePositions.get(appointment.student.id) ?? 0) >= 16 ? 1 : 0;
    const matching = days.flatMap(({ start, size }, index) => {
      const relative = (minutes - start + DAY) % DAY;
      return relative < size * duration ? [{ index, minutes: start + relative }] : [];
    });
    const day = matching.length === 1 ? matching[0].index : singleDay ? 0 : original;
    fixedTimes.set(appointment.student.id, {
      ...appointment,
      minutes: matching.find(item => item.index === day)?.minutes ?? minutes,
      day,
    });
  }
  const overbooked = [...fixedTimes.values()].filter(item => (
    [...fixedTimes.values()].filter(other =>
      other.day === item.day && other.minutes <= item.minutes && other.minutes + duration > item.minutes
    ).length > SEATS_PER_SLOT
  ));

  const placed = new Set();
  const placements = new Map();
  const assignedDays = days.map(({ start, size, offset, date }, day) => {
    const reserved = [...fixedTimes.values()].filter(item => item.day === day);
    const timeRows = new Map();
    const rows = [];
    const createRow = (minutes, slot = null) => {
      const row = { minutes, time: toTime(minutes), date, day, slot, seats: [null, null] };
      rows.push(row);
      if (!timeRows.has(minutes)) timeRows.set(minutes, []);
      timeRows.get(minutes).push(row);
      return row;
    };
    const place = (student, row, seat) => {
      row.seats[seat] = student;
      placed.add(student.id);
      placements.set(student.id, { row, seat, fixedTime: fixedTimes.has(student.id) });
    };

    for (let index = 0; index < size; index++) createRow(start + index * duration, offset + index);
    // A custom start can overlap an ordinary interval without starting on its grid.
    // Reserve enough seats for the busiest part of each ordinary interval.
    function capacityAt(minutes) {
      const overlapping = reserved.filter(item => item.minutes < minutes + duration && item.minutes + duration > minutes);
      const moments = [minutes, ...overlapping.map(item => item.minutes).filter(time => time > minutes)];
      const busiest = Math.max(...moments.map(time => overlapping.filter(item => item.minutes <= time && item.minutes + duration > time).length));
      const startsHere = overlapping.filter(item => item.minutes === minutes).length;
      return Math.max(Math.min(startsHere, SEATS_PER_SLOT), SEATS_PER_SLOT - busiest + startsHere);
    }

    // Preserve a positional lock where the requested start leaves room.
    for (const row of rows) {
      const capacity = capacityAt(row.minutes);
      const appointmentsHere = reserved.filter(item => item.minutes === row.minutes).length;
      let room = capacity - appointmentsHere;
      for (const [id, position] of Object.entries(locks)) {
        const seat = Number(position) - row.slot * SEATS_PER_SLOT;
        const student = studentsById.get(id);
        if (room <= 0) break;
        if (!student || ![0, 1].includes(seat) || row.seats[seat] || fixedTimes.has(id) || placed.has(id)) continue;
        place(student, row, seat);
        room--;
      }
    }

    for (const { student, minutes } of reserved) {
      const row = timeRows.get(minutes)?.find(item => item.seats.includes(null)) || createRow(minutes);
      place(student, row, row.seats.indexOf(null));
    }

    const dayOrder = singleDay ? order : day === 0 ? order.slice(0, 8) : order.slice(8);
    const free = dayOrder.flat().filter(student => !fixedTimes.has(student.id) && !placed.has(student.id));
    let index = 0;
    for (const row of rows.filter(item => item.slot !== null)) {
      const capacity = capacityAt(row.minutes);
      while (index < free.length && row.seats.filter(Boolean).length < capacity) {
        place(free[index++], row, row.seats.indexOf(null));
      }
    }
    for (let minutes = start + size * duration; index < free.length && minutes < start + DAY; minutes += duration) {
      const existing = timeRows.get(minutes)?.[0];
      const capacity = capacityAt(minutes);
      if (!capacity || (existing && existing.seats.filter(Boolean).length >= capacity)) continue;
      const row = existing || createRow(minutes);
      while (index < free.length && row.seats.filter(Boolean).length < capacity) {
        place(free[index++], row, row.seats.indexOf(null));
      }
    }
    return {
      rows: rows.sort((a, b) => a.minutes - b.minutes).filter(
        row => row.seats.some(Boolean) || rows.some(next => next.minutes > row.minutes && next.slot !== null && next.seats.some(Boolean))
      ),
      unassigned: free.slice(index),
    };
  });

  const [first, second] = assignedDays.map(day => day.rows);
  const main = singleDay ? first.slice(0, 16) : [
    ...Array.from({ length: 8 }, (_, index) => first[index]),
    ...second.slice(0, 8),
  ];
  const overflow = singleDay ? first.slice(16) : [...first.slice(8), ...second.slice(8)];
  const displacedLocks = [...placements].filter(([id, { row, seat, fixedTime }]) => {
    if (fixedTime || !Object.hasOwn(locks, id)) return false;
    return row.slot === null || row.slot * SEATS_PER_SLOT + seat !== Number(locks[id]);
  });
  return { main, overflow, placements, overbooked, displacedLocks, unassigned: assignedDays.flatMap(day => day.unassigned) };
}
