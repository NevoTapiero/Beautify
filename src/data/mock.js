// Calendar/date helpers. All clients, services, appointments, and gallery
// content are live from Supabase — there is no demo seed data here.

export const DOW = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
export const DOW_FULL = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

// The next 7 days, each with its offset, day-of-month, short label, and weekday.
export function next7() {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() + i);
    return { offset: i, dn: d.getDate(), dl: i === 0 ? "היום" : i === 1 ? "מחר" : DOW[d.getDay()], weekday: d.getDay() };
  });
}

// "YYYY-MM-DD" for a day offset from today, in local (Israel) time.
export function dateForOffset(offset) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
