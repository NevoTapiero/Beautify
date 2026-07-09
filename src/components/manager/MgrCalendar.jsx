import React, { useState, useEffect, useCallback } from "react";
import { Coffee, Plus, Clock, Pencil, AlertTriangle, RefreshCw, MoreVertical } from "lucide-react";
import { Sheet, Confirm, cosmeticians } from "../ui";
import { next7, dateForOffset, DOW_FULL } from "../../data/mock";
import { loadWeeklyHours, getDayOverride } from "../../lib/api";
import ApptSheet from "./ApptSheet";
import DaySchedule from "./DaySchedule";
import WeekSchedule from "./WeekSchedule";

const hhmm = (t) => (t || "").slice(0, 5);
const toMin = (t) => { const [h, m] = hhmm(t).split(":").map(Number); return h * 60 + m; };
const overlaps = (s1, e1, s2, e2) => s1 < e2 && s2 < e1;
const wdForOffset = (off) => { const d = new Date(); d.setDate(d.getDate() + off); return d.getDay(); };

export default function MgrCalendar({ mgr, cosmId, setCosmId }) {
  const days = next7();
  const [sel, setSel] = useState(0);
  const [view, setView] = useState("day");   // "day" | "week" — Google-Calendar-style toggle
  const [open, setOpen] = useState(null);
  const [addBreak, setAddBreak] = useState(false);
  const [editWeekly, setEditWeekly] = useState(false);
  const [editDay, setEditDay] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [weekly, setWeekly] = useState([]);
  const [override, setOverride] = useState(null);

  // Per-cosmetician schedules (business). null = the owner. The switcher lets
  // the manager move between each cosmetician's calendar (notes 32, 36).
  const locked = !!mgr.lockedEmployeeId;   // employee-app mode (Phase 3)
  const cosmList = cosmeticians(mgr.ownerName, mgr.employees);
  const showCosm = mgr.business && cosmList.length > 1;
  const sameCosm = (x) => (x.employeeId ?? null) === cosmId;
  // An employee may edit only HER OWN schedule, and those edits become requests
  // the manager approves (Phase 3b). The manager edits directly.
  const ownSchedule = locked && cosmId === mgr.lockedEmployeeId;
  const canEdit = !locked || ownSchedule;
  const requestMode = locked;   // when an employee edits, create an approval request
  const pendingReqs = (mgr.scheduleReqs || []).filter((r) => (r.employee_id ?? null) === cosmId);

  // Employee: schedule-approval notifications show as a one-time banner and are
  // auto-marked-read — no manual confirmation (note 55).
  const schedNotifs = locked ? (mgr.employeeNotifications || []).filter((n) => !n.read && (n.type === "approved" || n.type === "declined")) : [];
  const [schedBanner] = useState(() => schedNotifs);
  useEffect(() => { schedNotifs.forEach((n) => mgr.markEmployeeNotifRead(n.id)); /* eslint-disable-next-line */ }, []);

  const dateStr = dateForOffset(sel);
  const weekday = days[sel].weekday;

  const reload = useCallback(async (isCurrent) => {
    const [w, o] = await Promise.all([
      loadWeeklyHours(mgr.studio.id, cosmId),
      getDayOverride(mgr.studio.id, dateStr, cosmId),
    ]);
    if (isCurrent()) { setWeekly(w); setOverride(o); }
  }, [mgr.studio.id, dateStr, cosmId]);

  useEffect(() => {
    let active = true;
    reload(() => active);
    return () => { active = false; };
  }, [reload]);

  const [refreshing, setRefreshing] = useState(false);
  const doRefresh = async () => { setRefreshing(true); await Promise.all([mgr.refresh(), reload(() => true)]); setRefreshing(false); };

  const effective = override || weekly.find((w) => w.weekday === weekday) || null;
  const weeklyDefault = weekly.find((w) => w.weekday === weekday) || null;

  const appts = mgr.appts.filter((a) => a.day === sel && sameCosm(a)).sort((x, y) => x.time.localeCompare(y.time));
  const breaks = mgr.breaks.filter((b) => b.day === sel && sameCosm(b));

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {canEdit
          ? <button onClick={() => setMenuOpen(true)} style={{ background: "none", border: "1px solid var(--sand)", borderRadius: 10, cursor: "pointer", color: "var(--plum)", padding: "6px 8px", display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
              <MoreVertical size={15} /> פעולות לו"ז
            </button>
          : <span />}
        <button onClick={doRefresh} disabled={refreshing} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
          <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} /> רענון
        </button>
      </div>

      <div className="bf-seg" style={{ height: 38 }}>
        <button className={view === "day" ? "active" : ""} onClick={() => setView("day")}>יום</button>
        <button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>שבוע</button>
      </div>

      {showCosm && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {cosmList.map((c) => {
            // "!" on an employee's chip when she has a pending request (note 34).
            const hasReq = !c.owner && !locked && (mgr.scheduleReqs || []).some((r) => r.employee_id === c.id);
            return (
              <button key={c.id} onClick={() => setCosmId(c.owner ? null : c.id)}
                className={"bf-chip " + ((c.owner ? null : c.id) === cosmId ? "bf-chip-rose" : "bf-chip-wait")}
                style={{ cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: 5, position: "relative" }}>
                <span style={{ width: 13, height: 13, borderRadius: "50%", background: c.color }} /> {c.name}
                {hasReq && <span style={{ marginInlineStart: 3, width: 16, height: 16, borderRadius: "50%", background: "var(--rose)", color: "#fff", fontSize: 11, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>!</span>}
              </button>
            );
          })}
        </div>
      )}

      {view === "day" && (<>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {days.map((d) => {
            // Per-day appointment count (note D) — for the selected cosmetician.
            const count = mgr.appts.filter((a) => a.day === d.offset && a.status !== "reschedule_requested" && sameCosm(a)).length;
            return (
              <div key={d.offset} className={"bf-day" + (sel === d.offset ? " active" : "")} onClick={() => setSel(d.offset)} style={{ position: "relative" }}>
                <div className="dn">{d.dn}</div><div className="dl">{d.dl}</div>
                <div style={{ marginTop: 3, fontSize: 10, fontWeight: 800, color: count ? "var(--plum)" : "var(--muted)", opacity: count ? 1 : 0.5 }}>
                  {count ? `${count} תורים` : "פנוי"}
                </div>
              </div>
            );
          })}
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
        </div>

        {locked && cosmId !== mgr.lockedEmployeeId && (
          <div className="bf-card" style={{ padding: "10px 12px", fontSize: 12.5, color: "var(--muted)", textAlign: "center" }}>
            את צופה בלו"ז של {(cosmList.find((c) => (c.owner ? null : c.id) === cosmId) || {}).name} — לצפייה בלבד
          </div>
        )}

        {/* Employee: one-time schedule-approval banner (note 54, 55) */}
        {locked && schedBanner.map((n) => (
          <div key={n.id} className="bf-card" style={{ padding: 11, border: "1px solid var(--rose-soft)", background: "linear-gradient(135deg,#fff,#FDF3F6)" }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{n.title}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{n.body}</div>
          </div>
        ))}

        {/* Schedule-change requests (Phase 3b) */}
        {pendingReqs.length > 0 && (
          <div style={{ display: "grid", gap: 8 }}>
            {pendingReqs.map((r) => (
              <div key={r.id} className="bf-card" style={{ padding: 11, border: "1px solid #E0D2E6", background: "#F6F1F8", display: "grid", gap: 9 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={15} color="#6B4E7A" />
                  <div style={{ flex: 1, fontSize: 13.5 }}>
                    <b>{locked ? "ממתין לאישור המנהלת" : "בקשת שינוי לו\"ז"}</b>
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{r.label}</div>
                  </div>
                </div>
                {!locked && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="bf-btn bf-btn-primary bf-btn-sm" style={{ flex: 1 }} onClick={() => mgr.approveScheduleRequest(r)}>אישור</button>
                    <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => mgr.declineScheduleRequest(r)}>דחייה</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <DaySchedule effective={effective} dayAppts={appts} dayBreaks={breaks} allAppts={mgr.appts}
          onOpenAppt={setOpen} onDeleteBreak={mgr.deleteBreak} />
      </>)}

      {view === "week" && (
        <WeekSchedule
          days={days} weekly={weekly}
          appts={mgr.appts.filter(sameCosm)} breaks={mgr.breaks.filter(sameCosm)}
          onOpenAppt={setOpen}
          onSelectDay={(offset) => { setSel(offset); setView("day"); }}
        />
      )}

      {menuOpen && (
        <Sheet onClose={() => setMenuOpen(false)}>
          <h3 className="bf-display" style={{ margin: "0 0 12px", fontSize: 20 }}>פעולות לו"ז · {DOW_FULL[weekday]}</h3>
          <div style={{ display: "grid", gap: 10 }}>
            <button className="bf-btn bf-btn-ghost" onClick={() => { setMenuOpen(false); setEditDay(true); }}><Pencil size={16} /> שינוי שעות היום</button>
            <button className="bf-btn bf-btn-ghost" onClick={() => { setMenuOpen(false); setEditWeekly(true); }}><Clock size={16} /> שעות עבודה שבועיות</button>
            <button className="bf-btn bf-btn-ghost" onClick={() => { setMenuOpen(false); setAddBreak(true); }}><Coffee size={16} /> הוספת הפסקה</button>
            {sel === 0 && appts.some((a) => a.status === "confirmed") && (
              <button className="bf-btn bf-btn-ghost" style={{ color: "#B23A48", borderColor: "#F0CBD0" }} onClick={() => { setMenuOpen(false); setConfirmClose(true); }}>
                <AlertTriangle size={16} /> סגירת היומן עכשיו
              </button>
            )}
          </div>
        </Sheet>
      )}
      {confirmClose && (
        <Confirm
          title="לסגור את היומן עכשיו?"
          body={requestMode ? "התורים שטרם בוצעו היום יבוטלו לאחר אישור המנהלת, והלקוחות יקבלו הודעה." : "כל התורים שטרם בוצעו היום יבוטלו והלקוחות יקבלו על כך הודעה. הפעולה אינה הפיכה."}
          confirmLabel={requestMode ? "שליחת בקשה לסגירת היומן" : "כן, סגרי את היומן"} danger
          onConfirm={() => {
            const live = appts.filter((a) => a.status === "confirmed");
            if (requestMode) mgr.createScheduleRequest("closeday", { appts: live.map((a) => ({ id: a.id, clientId: a.clientId, dayLabel: a.dayLabel, time: a.time })) }, "סגירת היומן היום");
            else mgr.closeDayNow(live);
          }}
          onClose={() => setConfirmClose(false)}
        />
      )}
      {open && <ApptSheet appt={open} mgr={mgr} onClose={() => setOpen(null)} />}
      {addBreak && <AddBreakSheet day={sel} dayLabel={days[sel].dl} mgr={mgr} cosmId={cosmId} requestMode={requestMode} onClose={() => setAddBreak(false)} />}
      {editWeekly && <WeeklyHoursSheet weekly={weekly} selDay={sel} hasSelOverride={!!override} mgr={mgr} cosmId={cosmId} requestMode={requestMode} onClose={() => setEditWeekly(false)} onSaved={reload} />}
      {editDay && <DayHoursSheet day={sel} dateStr={dateStr} dayLabel={DOW_FULL[weekday]} effective={effective} weeklyDefault={weeklyDefault} hasOverride={!!override} mgr={mgr} cosmId={cosmId} requestMode={requestMode} onClose={() => setEditDay(false)} onSaved={reload} />}
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

function AddBreakSheet({ day, dayLabel, mgr, cosmId, requestMode, onClose }) {
  const [start, setStart] = useState("13:00");
  const [end, setEnd] = useState("14:00");
  const [title, setTitle] = useState("הפסקה");
  const [conflict, setConflict] = useState(null);
  const [busy, setBusy] = useState(false);
  const valid = end > start;

  const affectedFor = () => mgr.appts.filter((a) => a.day === day && a.status === "confirmed" && (a.employeeId ?? null) === cosmId
    && overlaps(toMin(a.time), toMin(a.time) + a.serviceDur, toMin(start), toMin(end)));

  const apply = async (affected) => {
    setBusy(true);
    await mgr.addBreak(day, start, end, title, cosmId);
    if (affected.length) await mgr.rescheduleMany(affected);
    setBusy(false); onClose();
  };
  const save = () => {
    if (!valid) return;
    if (requestMode) { mgr.createScheduleRequest("break", { day, start, end, title }, `הוספת הפסקה ${dayLabel} ${start}–${end}`); onClose(); return; }
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
      <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} disabled={!valid || busy} onClick={save}><Plus size={16} /> {requestMode ? "שליחת בקשה" : "הוספת הפסקה"}</button>
      {conflict && <ConflictConfirm affected={conflict} busy={busy} onClose={() => setConflict(null)} onConfirm={() => apply(conflict)} />}
    </Sheet>
  );
}

function DayHoursSheet({ day, dateStr, dayLabel, effective, weeklyDefault, hasOverride, mgr, cosmId, requestMode, onClose, onSaved }) {
  const [isOpen, setIsOpen] = useState(effective ? effective.is_open : true);
  const [start, setStart] = useState(hhmm(effective?.start_time) || "09:00");
  const [end, setEnd] = useState(hhmm(effective?.end_time) || "19:00");
  const [conflict, setConflict] = useState(null);
  const [busy, setBusy] = useState(false);
  const valid = !isOpen || end > start;

  // appointments/breaks that no longer fit the new hours (or all, if closing).
  const computeImpact = () => {
    const dayAppts = mgr.appts.filter((a) => a.day === day && a.status === "confirmed" && (a.employeeId ?? null) === cosmId);
    const dayBreaks = mgr.breaks.filter((b) => b.day === day && (b.employeeId ?? null) === cosmId);
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
    if (matchesWeekly()) await mgr.clearDayOverride(dateStr, cosmId);
    else await mgr.setDayOverride(dateStr, { is_open: isOpen, start_time: start, end_time: end }, cosmId);
    if (staleBreaks.length) await mgr.removeBreaks(staleBreaks);
    if (affected.length) await mgr.rescheduleMany(affected);
    setBusy(false); await onSaved(); onClose();
  };
  const save = () => {
    if (!valid) return;
    if (requestMode) {
      const lbl = `שעות ${dayLabel}: ${isOpen ? `${start}–${end}` : "סגור"}`;
      mgr.createScheduleRequest("day", matchesWeekly() ? { dateStr, clear: true } : { dateStr, is_open: isOpen, start_time: start, end_time: end }, lbl);
      onClose(); return;
    }
    const impact = computeImpact();
    if (impact.affected.length) setConflict(impact); else apply(impact);
  };
  const reset = async () => { setBusy(true); await mgr.clearDayOverride(dateStr, cosmId); setBusy(false); await onSaved(); onClose(); };

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
      <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} disabled={busy || !valid} onClick={save}>{busy ? "שומרת…" : requestMode ? "שליחת בקשה" : "שמירה ליום זה"}</button>
      {hasOverride && !requestMode && <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10 }} disabled={busy} onClick={reset}>חזרה לשעות הקבועות</button>}
      {conflict && <ConflictConfirm affected={conflict.affected} busy={busy} onClose={() => setConflict(null)} onConfirm={() => apply(conflict)} />}
    </Sheet>
  );
}

function WeeklyHoursSheet({ weekly, selDay, hasSelOverride, mgr, cosmId, requestMode, onClose, onSaved }) {
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
      if ((a.employeeId ?? null) !== cosmId) continue;
      if (hasSelOverride && a.day === selDay) continue;
      const row = rows[wdForOffset(a.day)];
      if (!row.is_open || toMin(a.time) < toMin(row.start) || toMin(a.time) + a.serviceDur > toMin(row.end)) affected.push(a);
    }
    for (const b of mgr.breaks) {
      if ((b.employeeId ?? null) !== cosmId) continue;
      if (hasSelOverride && b.day === selDay) continue;
      const row = rows[wdForOffset(b.day)];
      if (!row.is_open || toMin(b.time) < toMin(row.start) || toMin(b.endTime) > toMin(row.end)) staleBreaks.push(b.id);
    }
    return { affected, staleBreaks };
  };

  const apply = async ({ affected, staleBreaks }) => {
    setBusy(true);
    for (const r of rows) await mgr.setWeeklyHours(r.weekday, { is_open: r.is_open, start_time: r.start, end_time: r.end }, cosmId);
    if (staleBreaks.length) await mgr.removeBreaks(staleBreaks);
    if (affected.length) await mgr.rescheduleMany(affected);
    setBusy(false); await onSaved(); onClose();
  };
  const save = () => {
    if (requestMode) {
      mgr.createScheduleRequest("weekly", { rows: rows.map((r) => ({ weekday: r.weekday, is_open: r.is_open, start_time: r.start, end_time: r.end })) }, "עדכון שעות עבודה שבועיות");
      onClose(); return;
    }
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
      <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} disabled={busy} onClick={save}>{busy ? "שומרת…" : requestMode ? "שליחת בקשה" : "שמירה"}</button>
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
