// Static reference data. NOTE: clients / appointments / gallery are all live
// from Supabase now — no demo seed data here. SERVICES is only a fallback for
// the service lookup until the studio bundle loads from the DB.

export const SERVICES = [
  { id: "gel",   name: "לק ג'ל",        dur: 60,  price: 120, grad: "linear-gradient(135deg,#D9738F,#F4C9D4)" },
  { id: "fill",  name: "מילוי ג'ל",     dur: 90,  price: 160, grad: "linear-gradient(135deg,#7C2A53,#D9738F)" },
  { id: "acryl", name: "בנייה באקריל",  dur: 120, price: 220, grad: "linear-gradient(135deg,#5E1F40,#9A4E72)" },
  { id: "mani",  name: "מניקור",         dur: 45,  price: 90,  grad: "linear-gradient(135deg,#C98AA6,#F0D7DF)" },
  { id: "pedi",  name: "פדיקור",         dur: 60,  price: 130, grad: "linear-gradient(135deg,#9A4E72,#E0AFC0)" },
];

export const TIMES = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"];

export const DOW = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
export const DOW_FULL = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

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
