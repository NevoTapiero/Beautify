import React, { useState, useEffect, useCallback } from "react";
import { Coffee, Plus, Trash2, Clock, Pencil, AlertTriangle, RefreshCw } from "lucide-react";
import { Sheet, Empty, StatusChip, resolveAppt } from "../ui";
import { next7, dateForOffset, DOW_FULL } from "../../data/mock";
import { loadWeeklyHours, getDayOverride } from "../../lib/api";
import ApptSheet from "./ApptSheet";

const hhmm = (t) => (t || "").slice(0, 5);
const toMin = (t) => { const [h, m] = hhmm(t).split(":").map(Number); return h * 60 + m; };
const overlaps = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;
const wdForOffset = (off) => { const d = new Date(); d.setDate(d.getDate() + off); return d.getDay(); };

export default function MgrCalendar({ mgr }) {
  const days = next7();
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState(null);
  const [addBreak, setAddBreak] = useState(false);
  const [editWeekly, setEditWeekly] = useState(false);
  const [editDay, setEditDay] = useState(false);

  const [weekly, setWeekly] = useState([]);
  const [override, setOverride] = useState(null);

  const dateStr = dateForOffset(sel);
  const weekday = days[sel].weekday;

  const reload = useCallback(async () => {
    const [w, o] = await Promise.all([
      loadWeeklyHours(mgr.studio.id),
      getDayOverride(mgr.studio.id, dateStr),
    ]);
    setWeekly(w); setOverride(o);
  }, [mgr.studio.id, dateStr]);

  useEffect(() => { reload(); }, [reload]);

  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = async () => { setRefreshing(true); await Promise.all([mgr.refresh(), reload()]); setRefreshing(false); };

  const effective = override || weekly.find((w) => w.weekday === weekday) || null;
  const weeklyDefault = weekly.find((w) => w.weekday === weekday) || null;

  const appts = mgr.appts.filter((a) => a.day === sel).sort((x, y) => x.time.localeCompare(y.time));
  const breaks = mgr.breaks.filter((b) => b.day === sel);

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={doRefresh} disabled={refreshing} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
          <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} /> רענון
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {days.map((d) => (
          <div key={d.offset} className={"bf-day" + (sel === d.offset ? " active" : "")} onClick={() => setSel(d.offset)}>
            <div className="dn">{d.dn}</div><div className="dl">{d.dl}</div>
          </div>
        ))}
      </div>

      <div className="bf-card" style={{ padding: "11px 13px", display: "flex", alignItems: "center", gap: 10 }}>
        <Clock size={16} color="var(--plum)" />
        <div style={{ flex: 1, fontSize: 13.5 }}>
          <b>שעות עבודה · {DOW_FULL[weekday]}</b>
          <div style={{ color: "var(--muted)", fontSize: 12.5 }}>
            {!effective || !effective.is_open ? "סגור" : `${hhmm(effective.start_time)}–${hhmm(effective.end_time)}`}
            {override && <span style={{ color: "var(--gold)", marginInlineStart: 6 }}>· חריג ליום זה</span>}
          </div>
        </div>
        <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => setEditDay(true)}><Pencil size={13} /> יום זה</button>
        <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => setEditWeekly(true)}>שבועי</button>
      </div>

      <button className="bf-btn bf-btn-ghost" onClick={() => setAddBreak(true)}><Coffee size={16} /> הוספת הפסקה ליום זה</button>

      {appts.length === 0 && breaks.length === 0 && <Empty>אין תורים ביום הזה</Empty>}

      <div style={{ display: "grid", gap: 9 }}>
        {breaks.map((b) => (
          <div key={b.id} className="bf-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 11, background: "#FBF4EE", borderStyle: "dashed" }}>
            <div className="bf-display" style={{ fontSize: 15, fontWeight: 800, color: "var(--gold)", minWidth: 46, textAlign: "center" }}>{b.time}</div>
            <Coffee size={16} color="var(--gold)" />
            <div style={{ flex: 1, fontWeight: 700, fontSize: 14, color: "#8A6D3B" }}>{b.title} · עד {b.endTime}</div>
            <button onClick={() => mgr.deleteBreak(b.id)} aria-label="מחק הפסקה" style={{ background: "none", border: "none", cursor: "pointer", color: "#B6896A" }}><Trash2 size={16} /></button>
          </div>
        ))}

        {appts.map((a) => { const r = resolveAppt(a); const ghost = a.status === "reschedule_requested"; return (
          <button key={a.id} className="bf-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 11, textAlign: "right", cursor: "pointer", border: "1px solid var(--sand)", opacity: ghost ? 0.6 : 1 }} onClick={() => setOpen(a)}>
            <div className="bf-display" style={{ fontSize: 17, fontWeight: 800, color: "var(--plum)", minWidth: 46, textAlign: "center" }}>{a.time}</div>
            <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: r.svcGrad }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{r.clientName}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{r.svcName}</div>
            </div>
            <StatusChip a={a} />
          </button> ); })}
      </div>

      {open && <ApptSheet appt={open} mgr={mgr} onClose={() => setOpen(null)} />}
      {addBreak && <AddBreakSheet day={sel} dayLabel={days[sel].dl} mgr={mgr} onClose={() => setAddBreak(false)} />}
      {editWeekly && <WeeklyHoursSheet weekly={weekly} selDay={sel} hasSelOverride={!!override} mgr={mgr} onClose={() => setEditWeekly(false)} onSaved={reload} />}
      {editDay && <DayHoursSheet day={sel} dateStr={dateStr} dayLabel={DOW_FULL[weekday]} effective={effective} weeklyDefault={weeklyDefault} hasOverride={!!override} mgr={mgr} onClose={() => setEditDay(false)} onSaved={reload} />}
    </div>
  );
}

// Confirmation shown when a change runs over existing appointments (notes 26-29).
function ConflictConfirm({ affected, onConfirm, onClose, busy }) {
  return (
    <Sheet onClose={busy ? () => {} : onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ width: 38, height: 38, borderRadius: "50%", background: "#FBEFD6", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><AlertTriangle size={19} color="#9A6B14" /></span>
        <h3 className="bf-display" style={{ margin: 0, fontSize: 19 }}>שינוי על תורים קיימים</h3>
      </div>
      <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
        השינוי משפיע על {affected.length} תורים. אם תמשיכי, יישלחו ללקוחות בקשות להזיז את התור.
      </div>
      <div className="bf-card" style={{ padding: 10, marginBottom: 14, display: "grid", gap: 6, maxHeight: 180, overflowY: "auto" }}>
        {affected.map((a) => (
          <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ fontWeight: 700 }}>{a.clientName}</span>
            <span style={{ color: "var(--muted)" }}>{a.dayLabel} · {a.time}</span>
          </div>
        ))}
      </div>
      <button className="bf-btn bf-btn-primary" disabled={busy} onClick={onConfirm}>{busy ? "מעדכן…" : "המשך ושלח בקשות הזזה"}</button>
      <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10 }} disabled={busy} onClick={onClose}>ביטול</button>
    </Sheet>
  );
}

function AddBreakSheet({ day, dayLabel, mgr, onClose }) {
  const [start, setStart] = useState("13:00");
  const [end, setEnd] = useState("14:00");
  const [title, setTitle] = useState("הפסקה");
  const [conflict, setConflict] = useState(null);
  const [busy, setBusy] = useState(false);
  const valid = end > start;

  const affectedFor = () => mgr.appts.filter((a) => a.day === day && a.status === "confirmed"
    && overlaps(toMin(a.time), toMin(a.time) + a.serviceDur, toMin(start), toMin(end)));

  const apply = async (affected) => {
    setBusy(true);
    await mgr.addBreak(day, start, end, title);
    if (affected.length) await mgr.rescheduleMany(affected);
    setBusy(false); onClose();
  };
  const save = () => {
    if (!valid) return;
    const affected = affectedFor();
    if (affected.length) setConflict(affected); else apply([]);
  };

  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>הוספת הפסקה · {dayLabel}</h3>
      <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>בזמן הפסקה לא ייקבעו תורים חדשים</div>
      <label className="bf-label">כותרת</label>
      <input className="bf-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="הפסקת צהריים" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div><label className="bf-label">משעה</label><TimeSelect value={start} onChange={setStart} /></div>
        <div><label className="bf-label">עד שעה</label><TimeSelect value={end} onChange={setEnd} /></div>
      </div>
      {!valid && <div style={{ color: "#B23A48", fontSize: 12.5, marginTop: 8 }}>שעת הסיום צריכה להיות אחרי ההתחלה</div>}
      <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} disabled={!valid || busy} onClick={save}><Plus size={16} /> הוספת הפסקה</button>
      {conflict && <ConflictConfirm affected={conflict} busy={busy} onClose={() => setConflict(null)} onConfirm={() => apply(conflict)} />}
    </Sheet>
  );
}

function DayHoursSheet({ day, dateStr, dayLabel, effective, weeklyDefault, hasOverride, mgr, onClose, onSaved }) {
  const [isOpen, setIsOpen] = useState(effective ? effective.is_open : true);
  const [start, setStart] = useState(hhmm(effective?.start_time) || "09:00");
  const [end, setEnd] = useState(hhmm(effective?.end_time) || "19:00");
  const [conflict, setConflict] = useState(null);
  const [busy, setBusy] = useState(false);
  const valid = !isOpen || end > start;

  // appointments/breaks that no longer fit the new hours (or all, if closing).
  const computeImpact = () => {
    const dayAppts = mgr.appts.filter((a) => a.day === day && a.status === "confirmed");
    const dayBreaks = mgr.breaks.filter((b) => b.day === day);
    if (!isOpen) return { affected: dayAppts, staleBreaks: dayBreaks.map((b) => b.id) };
    const o = toMin(start), c = toMin(end);
    const affected = dayAppts.filter((a) => toMin(a.time) < o || toMin(a.time) + a.serviceDur > c);
    const staleBreaks = dayBreaks.filter((b) => toMin(b.time) < o || toMin(b.endTime) > c).map((b) => b.id);
    return { affected, staleBreaks };
  };

  // True when the chosen hours equal the weekly default — then it's not an
  // "exception", so we clear any override instead of creating one (note 29).
  const matchesWeekly = () => {
    const w = weeklyDefault;
    if (!w) return false;
    if (!isOpen && !w.is_open) return true;
    return isOpen && w.is_open && hhmm(w.start_time) === start && hhmm(w.end_time) === end;
  };

  const apply = async ({ affected, staleBreaks }) => {
    setBusy(true);
    if (matchesWeekly()) await mgr.clearDayOverride(dateStr);
    else await mgr.setDayOverride(dateStr, { is_open: isOpen, start_time: start, end_time: end });
    if (staleBreaks.length) await mgr.removeBreaks(staleBreaks);
    if (affected.length) await mgr.rescheduleMany(affected);
    setBusy(false); await onSaved(); onClose();
  };
  const save = () => {
    if (!valid) return;
    const impact = computeImpact();
    if (impact.affected.length) setConflict(impact); else apply(impact);
  };
  const reset = async () => { setBusy(true); await mgr.clearDayOverride(dateStr); setBusy(false); await onSaved(); onClose(); };

  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>שעות ליום {dayLabel}</h3>
      <div style={{ color: "var(--muted)", fontSize: 12.5, marginBottom: 14 }}>שינוי חד-פעמי ליום זה בלבד (חג, יום מקוצר וכו׳).</div>
      <div className="bf-card" style={{ padding: "11px 13px", display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{isOpen ? "פתוח" : "סגור"}</div>
        <button onClick={() => setIsOpen((v) => !v)} aria-pressed={isOpen}
          style={{ width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", padding: 3, background: isOpen ? "linear-gradient(135deg,var(--plum),var(--rose))" : "var(--sand)", display: "flex", justifyContent: isOpen ? "flex-end" : "flex-start" }}>
          <span style={{ width: 21, height: 21, borderRadius: "50%", background: "#fff", display: "block" }} />
        </button>
      </div>
      {isOpen && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label className="bf-label">משעה</label><TimeSelect value={start} onChange={setStart} /></div>
          <div><label className="bf-label">עד שעה</label><TimeSelect value={end} onChange={setEnd} /></div>
        </div>
      )}
      {!valid && <div style={{ color: "#B23A48", fontSize: 12.5, marginTop: 8 }}>שעת הסיום צריכה להיות אחרי ההתחלה</div>}
      <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} disabled={busy || !valid} onClick={save}>{busy ? "שומרת…" : "שמירה ליום זה"}</button>
      {hasOverride && <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10 }} disabled={busy} onClick={reset}>חזרה לשעות הקבועות</button>}
      {conflict && <ConflictConfirm affected={conflict.affected} busy={busy} onClose={() => setConflict(null)} onConfirm={() => apply(conflict)} />}
    </Sheet>
  );
}

function WeeklyHoursSheet({ weekly, selDay, hasSelOverride, mgr, onClose, onSaved }) {
  const byDay = (wd) => weekly.find((w) => w.weekday === wd) || { is_open: wd !== 6, start_time: "09:00", end_time: wd === 5 ? "14:00" : "19:00" };
  const [rows, setRows] = useState(() => Array.from({ length: 7 }, (_, wd) => {
    const r = byDay(wd); return { weekday: wd, is_open: r.is_open, start: hhmm(r.start_time), end: hhmm(r.end_time) };
  }));
  const [conflict, setConflict] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (wd, patch) => setRows((p) => p.map((r) => r.weekday === wd ? { ...r, ...patch } : r));

  // Appointments/breaks in the next 7 days that won't fit the NEW weekly hours.
  // Skips the selected day if it has its own override (weekly doesn't affect it).
  const computeImpact = () => {
    const affected = []; const staleBreaks = [];
    for (const a of mgr.appts) {
      if (a.status !== "confirmed") continue;
      if (hasSelOverride && a.day === selDay) continue;
      const row = rows[wdForOffset(a.day)];
      if (!row.is_open || toMin(a.time) < toMin(row.start) || toMin(a.time) + a.serviceDur > toMin(row.end)) affected.push(a);
    }
    for (const b of mgr.breaks) {
      if (hasSelOverride && b.day === selDay) continue;
      const row = rows[wdForOffset(b.day)];
      if (!row.is_open || toMin(b.time) < toMin(row.start) || toMin(b.endTime) > toMin(row.end)) staleBreaks.push(b.id);
    }
    return { affected, staleBreaks };
  };

  const apply = async ({ affected, staleBreaks }) => {
    setBusy(true);
    for (const r of rows) await mgr.setWeeklyHours(r.weekday, { is_open: r.is_open, start_time: r.start, end_time: r.end });
    if (staleBreaks.length) await mgr.removeBreaks(staleBreaks);
    if (affected.length) await mgr.rescheduleMany(affected);
    setBusy(false); await onSaved(); onClose();
  };
  const save = () => {
    const impact = computeImpact();
    if (impact.affected.length) setConflict(impact); else apply(impact);
  };

  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>שעות עבודה שבועיות</h3>
      <div style={{ color: "var(--muted)", fontSize: 12.5, marginBottom: 14 }}>ברירת המחדל לכל יום בשבוע. אפשר לשנות יום ספציפי דרך "יום זה".</div>
      <div style={{ display: "grid", gap: 8 }}>
        {rows.map((r) => (
          <div key={r.weekday} className="bf-card" style={{ padding: "9px 11px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 42, fontWeight: 700, fontSize: 13.5 }}>{DOW_FULL[r.weekday]}</div>
            <button onClick={() => set(r.weekday, { is_open: !r.is_open })} aria-pressed={r.is_open}
              style={{ width: 40, height: 24, borderRadius: 999, border: "none", cursor: "pointer", padding: 3, background: r.is_open ? "linear-gradient(135deg,var(--plum),var(--rose))" : "var(--sand)", display: "flex", justifyContent: r.is_open ? "flex-end" : "flex-start" }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", display: "block" }} />
            </button>
            {r.is_open ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                <TimeSelect value={r.start} onChange={(v) => set(r.weekday, { start: v })} small />
                <span style={{ color: "var(--muted)" }}>–</span>
                <TimeSelect value={r.end} onChange={(v) => set(r.weekday, { end: v })} small />
              </div>
            ) : <div style={{ flex: 1, textAlign: "left", color: "var(--muted)", fontSize: 13 }}>סגור</div>}
          </div>
        ))}
      </div>
      <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} disabled={busy} onClick={save}>{busy ? "שומרת…" : "שמירה"}</button>
      {conflict && <ConflictConfirm affected={conflict.affected} busy={busy} onClose={() => setConflict(null)} onConfirm={() => apply(conflict)} />}
    </Sheet>
  );
}

function TimeSelect({ value, onChange, small }) {
  const opts = [];
  for (let h = 6; h <= 23; h++) for (const m of ["00", "30"]) opts.push(`${String(h).padStart(2, "0")}:${m}`);
  return (
    <select className="bf-input" value={value} onChange={(e) => onChange(e.target.value)} style={small ? { padding: "7px 8px", fontSize: 13, width: "auto" } : undefined}>
      {opts.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}
