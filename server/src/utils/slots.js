// Pure slot logic (no DB / env access) so it can be unit-tested.
export const TZ = 'Asia/Kolkata';
const MIN = 60000;

/** Build a Date from an IST calendar date (YYYY-MM-DD) and wall-clock time (HH:mm). India has no DST. */
export const istDateTime = (date, time) => new Date(`${date}T${time}:00+05:30`);

/** YYYY-MM-DD in IST for a given instant. */
export function istDate(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** Day of week (0=Sun) for an IST calendar date. */
export const weekdayOf = (date) => new Date(`${date}T12:00:00+05:30`).getUTCDay();

export function isValidDateString(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T12:00:00+05:30`).getTime());
}

/**
 * @param {{workingHours:Array<{dayOfWeek:number,startTime:string,endTime:string}>, slotDurationMinutes:number}} profile
 * @param {string} date IST date YYYY-MM-DD
 * @param {Array<{slotStart:Date,slotEnd:Date}>} busy active appointments for that day
 * @param {Date} now
 * @param {number} leadMinutes minimum notice before a slot can be booked
 */
export function generateSlots(profile, date, busy = [], now = new Date(), leadMinutes = 15) {
  const day = weekdayOf(date);
  const windows = profile.workingHours.filter((h) => h.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const step = profile.slotDurationMinutes * MIN;
  const earliest = now.getTime() + leadMinutes * MIN;
  const slots = [];
  for (const w of windows) {
    const start = istDateTime(date, w.startTime).getTime();
    const end = istDateTime(date, w.endTime).getTime();
    for (let t = start; t + step <= end; t += step) {
      const s = new Date(t);
      const e = new Date(t + step);
      const taken = busy.some((a) => a.slotStart < e && a.slotEnd > s);
      slots.push({ startIso: s.toISOString(), endIso: e.toISOString(), isAvailable: !taken && t >= earliest });
    }
  }
  return slots;
}
