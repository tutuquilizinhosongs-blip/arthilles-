import { query, getSettingsMap } from './db.js';

function parseTimeOnDate(date, hhmm) {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const value = new Date(date);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

export async function getAvailableSlots({ from, to }) {
  const settings = await getSettingsMap();
  const business = settings.business_hours || {
    days: [1, 2, 3, 4, 5],
    start: '13:30',
    end: '16:30',
    slotMinutes: 60,
    minimumNoticeHours: 6
  };

  const startDate = from ? new Date(from) : new Date();
  const endDate = to ? new Date(to) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const minStart = new Date(Date.now() + Number(business.minimumNoticeHours || 6) * 60 * 60 * 1000);

  const busy = await query(
    `SELECT starts_at, ends_at FROM appointments
     WHERE status IN ('scheduled', 'confirmed') AND starts_at < $2 AND ends_at > $1
     UNION ALL
     SELECT starts_at, ends_at FROM availability_blocks
     WHERE starts_at < $2 AND ends_at > $1`,
    [startDate.toISOString(), endDate.toISOString()]
  );

  const busyRanges = busy.rows.map((row) => ({
    start: new Date(row.starts_at),
    end: new Date(row.ends_at)
  }));

  const slots = [];
  const day = new Date(startDate);
  day.setHours(0, 0, 0, 0);

  while (day <= endDate) {
    const isoDay = day.getDay() === 0 ? 7 : day.getDay();
    if (business.days.includes(isoDay)) {
      let cursor = parseTimeOnDate(day, business.start);
      const close = parseTimeOnDate(day, business.end);
      const slotMs = Number(business.slotMinutes || 60) * 60 * 1000;

      while (cursor.getTime() + slotMs <= close.getTime()) {
        const slotEnd = new Date(cursor.getTime() + slotMs);
        const blocked = busyRanges.some((range) => overlaps(cursor, slotEnd, range.start, range.end));
        if (cursor >= minStart && !blocked) {
          slots.push({ startsAt: cursor.toISOString(), endsAt: slotEnd.toISOString() });
        }
        cursor = slotEnd;
      }
    }
    day.setDate(day.getDate() + 1);
  }

  return slots;
}
