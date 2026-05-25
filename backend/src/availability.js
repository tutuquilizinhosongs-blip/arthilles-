import { defaultBusinessHours, requireSupabase } from './db.js';

function parseTimeOnDate(date, hhmm) {
  const [hours, minutes] = String(hhmm || '00:00').split(':').map(Number);
  const value = new Date(date);
  value.setHours(hours || 0, minutes || 0, 0, 0);
  return value;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

export async function getAvailableSlots({ company, from, to }) {
  const db = requireSupabase();
  const business = {
    ...defaultBusinessHours(),
    ...(company?.settings?.business_hours || {})
  };

  const startDate = from ? new Date(from) : new Date();
  const endDate = to ? new Date(to) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const minStart = new Date(Date.now() + Number(business.minimumNoticeHours || 6) * 60 * 60 * 1000);

  const appointments = await db
    .from('appointments')
    .select('starts_at, ends_at')
    .eq('company_id', company.id)
    .in('status', ['scheduled', 'confirmed'])
    .lt('starts_at', endDate.toISOString())
    .gt('ends_at', startDate.toISOString());

  if (appointments.error) throw appointments.error;

  const blocks = await db
    .from('availability_blocks')
    .select('starts_at, ends_at')
    .eq('company_id', company.id)
    .lt('starts_at', endDate.toISOString())
    .gt('ends_at', startDate.toISOString());

  if (blocks.error) throw blocks.error;

  const busyRanges = [...(appointments.data || []), ...(blocks.data || [])].map((row) => ({
    start: new Date(row.starts_at),
    end: new Date(row.ends_at)
  }));

  const slots = [];
  const day = new Date(startDate);
  day.setHours(0, 0, 0, 0);

  while (day <= endDate) {
    const isoDay = day.getDay() === 0 ? 7 : day.getDay();
    if ((business.days || []).includes(isoDay)) {
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
