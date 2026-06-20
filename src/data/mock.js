export const SERVICES = [
  { id: "gel",   name: "לק ג'ל",        dur: 60,  price: 120, grad: "linear-gradient(135deg,#D9738F,#F4C9D4)" },
  { id: "fill",  name: "מילוי ג'ל",     dur: 90,  price: 160, grad: "linear-gradient(135deg,#7C2A53,#D9738F)" },
  { id: "acryl", name: "בנייה באקריל",  dur: 120, price: 220, grad: "linear-gradient(135deg,#5E1F40,#9A4E72)" },
  { id: "mani",  name: "מניקור",         dur: 45,  price: 90,  grad: "linear-gradient(135deg,#C98AA6,#F0D7DF)" },
  { id: "pedi",  name: "פדיקור",         dur: 60,  price: 130, grad: "linear-gradient(135deg,#9A4E72,#E0AFC0)" },
];

export const CLIENTS0 = [
  { id: 1, name: "נועה כהן",    phone: "050-1234567", email: "noa@mail.com",   visits: 9,  last: "לפני שבועיים",   blocked: false },
  { id: 2, name: "שיר לוי",     phone: "052-7654321", email: "shir@mail.com",  visits: 4,  last: "לפני 3 שבועות", blocked: false },
  { id: 3, name: "מאיה ביטון",  phone: "054-9988776", email: "maya@mail.com",  visits: 12, last: "לפני שבוע",      blocked: false },
  { id: 4, name: "יעל אזולאי",  phone: "053-4455667", email: "yael@mail.com",  visits: 2,  last: "לפני חודש",      blocked: false },
  { id: 5, name: "רותם דהן",    phone: "058-1122334", email: "rotem@mail.com", visits: 6,  last: "לפני 10 ימים",   blocked: false },
];

export const APPTS0 = [
  { id: 1, clientId: 1, service: "gel",   time: "09:30", day: 0, dayLabel: "היום", status: "confirmed", arrival: true,  paid: true  },
  { id: 2, clientId: 2, service: "fill",  time: "11:00", day: 0, dayLabel: "היום", status: "confirmed", arrival: false, paid: false },
  { id: 3, clientId: 3, service: "acryl", time: "13:30", day: 0, dayLabel: "היום", status: "confirmed", arrival: true,  paid: true  },
  { id: 4, clientId: 4, service: "mani",  time: "16:00", day: 0, dayLabel: "היום", status: "pending",   arrival: false, paid: false },
  { id: 5, clientId: 1, service: "gel",   time: "10:30", day: 1, dayLabel: "מחר",  status: "confirmed", arrival: false, paid: false },
];

export const PAST0 = [
  { id: 91, clientId: 1, service: "fill", time: "11:00", dateLabel: "12 במאי",    status: "done" },
  { id: 92, clientId: 1, service: "gel",  time: "10:00", dateLabel: "21 באפריל",  status: "done" },
];

export const GRADIENTS = [
  "linear-gradient(135deg,#D9738F,#F4C9D4)", "linear-gradient(135deg,#7C2A53,#C98AA6)",
  "linear-gradient(135deg,#5E1F40,#D9738F)", "linear-gradient(135deg,#E0AFC0,#9A4E72)",
  "linear-gradient(135deg,#F4C9D4,#B4893E)", "linear-gradient(135deg,#9A4E72,#2A1A2E)",
];

export const GALLERY0 = [
  { id: 1, grad: GRADIENTS[0], cap: "פרנץ' ורוד",    by: "הסטודיו",    likes: 24 },
  { id: 2, grad: GRADIENTS[1], cap: "ויין מאט",       by: "הסטודיו",    likes: 41 },
  { id: 3, grad: GRADIENTS[2], cap: "אומברה שקיעה",   by: "נועה כהן",   likes: 18 },
  { id: 4, grad: GRADIENTS[3], cap: "נוד קלאסי",      by: "הסטודיו",    likes: 33 },
  { id: 5, grad: GRADIENTS[4], cap: "כרום זהב",       by: "הסטודיו",    likes: 57 },
  { id: 6, grad: GRADIENTS[5], cap: "חתול שחור",      by: "מאיה ביטון", likes: 29 },
];

export const PENDING0 = [
  { id: 101, grad: GRADIENTS[2], cap: "אומברה ורוד",  by: "שיר לוי"  },
  { id: 102, grad: GRADIENTS[4], cap: "גליטר חגיגי",  by: "רותם דהן" },
];

export const TIMES = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"];

const DOW = ["א","ב","ג","ד","ה","ו","ש"];
export function next7() {
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() + i);
    return { offset: i, dn: d.getDate(), dl: i === 0 ? "היום" : i === 1 ? "מחר" : DOW[d.getDay()] };
  });
}
