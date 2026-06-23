import React, { useState, useEffect } from "react";
import { CalendarDays, Clock, Check, X, CheckCircle2, Wallet, Bell, AlertTriangle, Repeat, Plus } from "lucide-react";
import { SectionTitle, Empty, PaidChip, BitSheet, Sheet } from "../ui";
import { next7, dateForOffset, DOW_FULL } from "../../data/mock";
import { availableSlots } from "../../lib/api";

export default function CliMine({ cli }) {
  const [payFor, setPayFor] = useState(null);    // appointment being paid
  const [moveAppt, setMoveAppt] = useState(null); // appointment being rescheduled
  const [askStanding, setAskStanding] = useState(false); // request a weekly slot

  // Pull fresh appointments + messages each time this screen opens.
  useEffect(() => { cli.refresh?.(); /* eslint-disable-next-line */ }, []);

  const toMove = cli.appts.filter((a) => a.status === "reschedule_requested");
  const upcoming = cli.appts.filter((a) => a.status === "confirmed" && a.day >= 0)
    .sort((x, y) => x.day - y.day || x.time.localeCompare(y.time));
  const past = cli.appts.filter((a) => a.status === "completed" || a.status === "no_show" || (a.status === "confirmed" && a.day < 0))
    .sort((x, y) => y.day - x.day).slice(0, 3);
  const unread = cli.notifications.filter((n) => !n.read);

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      {/* Appointments the studio asked to move (notes 27) */}
      {toMove.length > 0 && (<>
        <SectionTitle icon={AlertTriangle}>תורים להזזה</SectionTitle>
        <div style={{ display: "grid", gap: 11 }}>
          {toMove.map((a) => (
            <div key={a.id} className="bf-card" style={{ padding: 13, border: "1px solid #E0D2E6", background: "#F6F1F8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "center", minWidth: 50, opacity: 0.6 }}>
                  <div className="bf-display" style={{ fontSize: 18, fontWeight: 800, color: "var(--plum)", textDecoration: "line-through" }}>{a.time}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{a.dayLabel}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{a.serviceName}</div>
                  <div style={{ fontSize: 12.5, color: "#6B4E7A", marginTop: 2 }}>הסטודיו ביקש להזיז את התור הזה</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="bf-btn bf-btn-primary bf-btn-sm" style={{ flex: 1 }} onClick={() => setMoveAppt(a)}><CalendarDays size={15} /> הזזה לשעה אחרת</button>
                <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => cli.cancelAppt(a.id)}><X size={15} /> ביטול</button>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {/* Manager messages — reminders / reschedule / cancellation */}
      {unread.length > 0 && (
        <div style={{ display: "grid", gap: 9 }}>
          <SectionTitle icon={Bell}>הודעות מהסטודיו</SectionTitle>
          {unread.map((n) => (
            <button key={n.id} onClick={() => cli.markNotifRead(n.id)} className="bf-card" style={{ padding: 12, textAlign: "right", cursor: "pointer", border: "1px solid var(--rose-soft)", background: "linear-gradient(135deg,#fff,#FDF3F6)" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{n.body}</div>
              <div style={{ fontSize: 11, color: "var(--rose)", marginTop: 6, fontWeight: 700 }}>הקישי לסימון כנקרא</div>
            </button>
          ))}
        </div>
      )}

      {/* Standing weekly appointment (V5 note B) */}
      <SectionTitle icon={Repeat}>תור קבוע שבועי</SectionTitle>
      {(cli.standing || []).length === 0 ? (
        <button className="bf-card" onClick={() => setAskStanding(true)} style={{ padding: 13, display: "flex", alignItems: "center", gap: 10, textAlign: "right", cursor: "pointer", borderStyle: "dashed" }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg,var(--plum),var(--rose))", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Plus size={17} color="#fff" /></span>
          <div style={{ fontSize: 13.5 }}>
            <b>בקשת יום ושעה קבועים</b>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>שמרי לעצמך מועד שבועי קבוע — באישור הסטודיו</div>
          </div>
        </button>
      ) : (
        <div style={{ display: "grid", gap: 9 }}>
          {cli.standing.map((st) => (
            <div key={st.id} className="bf-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 11 }}>
              <Repeat size={18} color="var(--plum)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{st.service_name} · כל {DOW_FULL[st.weekday]} בשעה {st.time}</div>
                <div style={{ fontSize: 12, color: st.status === "approved" ? "#2E7D52" : "var(--gold)", fontWeight: 700, marginTop: 2 }}>
                  {st.status === "approved" ? "מאושר ✓ נקבע אוטומטית בכל שבוע" : "ממתין לאישור הסטודיו"}
                </div>
              </div>
              <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => cli.cancelStanding(st.id)}><X size={14} /> ביטול</button>
            </div>
          ))}
        </div>
      )}

      <SectionTitle icon={CalendarDays}>תורים קרובים</SectionTitle>
      {upcoming.length === 0 && <Empty>אין לך תורים קרובים — קבעי תור חדש 🤍</Empty>}
      <div style={{ display: "grid", gap: 11 }}>
        {upcoming.map((a) => (
          <div key={a.id} className="bf-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 13 }}>
              <div style={{ textAlign: "center", minWidth: 50 }}>
                <div className="bf-display" style={{ fontSize: 18, fontWeight: 800, color: "var(--plum)" }}>{a.time}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{a.dayLabel}</div>
              </div>
              <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: a.serviceGrad, minHeight: 38 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{a.serviceName}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{a.serviceDur} דק׳ · ₪{a.servicePrice}</div>
              </div>
              <PaidChip paid={a.paid} />
            </div>
            <div style={{ display: "flex", gap: 8, padding: "0 13px 13px", flexWrap: "wrap" }}>
              {a.arrival
                ? <button className="bf-btn bf-btn-soft bf-btn-sm" disabled style={{ flex: 1, opacity: 1 }}><CheckCircle2 size={15} /> הגעה אושרה</button>
                : <button className="bf-btn bf-btn-primary bf-btn-sm" style={{ flex: 1 }} onClick={() => cli.confirmArrival(a.id)}><Check size={15} /> אישור הגעה</button>}
              {!a.paid && <button className="bf-btn bf-btn-soft bf-btn-sm" onClick={() => setPayFor(a)}><Wallet size={15} /> שלמי בביט</button>}
              <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => cli.cancelAppt(a.id)}><X size={15} /> ביטול</button>
            </div>
          </div>
        ))}
      </div>

      {past.length > 0 && (<>
        <SectionTitle icon={Clock}>היסטוריה</SectionTitle>
        <div style={{ display: "grid", gap: 9 }}>
          {past.map((a) => (
            <div key={a.id} className="bf-card" style={{ padding: 11, display: "flex", alignItems: "center", gap: 11, opacity: 0.85 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: a.serviceGrad, flex: "none" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.serviceName}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{a.dayLabel} · {a.time}</div>
              </div>
              {a.status === "no_show"
                ? <span className="bf-chip" style={{ background: "#F3E3E5", color: "#B23A48" }}>לא הגעת</span>
                : <span className="bf-chip bf-chip-ok"><Check size={12} /> הושלם</span>}
            </div>
          ))}
        </div>
      </>)}

      {payFor && <BitSheet amount={payFor.servicePrice} onClose={() => setPayFor(null)} onPaid={async () => { await cli.payAppt(payFor.id); setPayFor(null); }} />}
      {moveAppt && <RescheduleSheet appt={moveAppt} cli={cli} onClose={() => setMoveAppt(null)} />}
      {askStanding && <StandingSheet cli={cli} onClose={() => setAskStanding(false)} />}
    </div>
  );
}

// Request a fixed weekly slot: pick a service, a weekday, and a time.
function StandingSheet({ cli, onClose }) {
  const [service, setService] = useState(cli.services[0]?.id || null);
  const [weekday, setWeekday] = useState(0);
  const [time, setTime] = useState("10:00");
  const [busy, setBusy] = useState(false);
  const times = [];
  for (let h = 8; h <= 20; h++) for (const m of ["00", "30"]) times.push(`${String(h).padStart(2, "0")}:${m}`);
  const ok = service != null;

  const submit = async () => {
    setBusy(true);
    const done = await cli.requestStanding(service, weekday, time);
    setBusy(false);
    if (done) onClose();
  };

  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>בקשת תור קבוע</h3>
      <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>אותו יום ושעה בכל שבוע — הסטודיו צריך לאשר.</div>

      <label className="bf-label">טיפול</label>
      <div style={{ display: "grid", gap: 7, marginBottom: 12 }}>
        {cli.services.map((sv) => (
          <button key={sv.id} onClick={() => setService(sv.id)} className="bf-card" style={{ padding: 10, display: "flex", alignItems: "center", gap: 10, textAlign: "right", cursor: "pointer", border: service === sv.id ? "1px solid var(--rose)" : "1px solid var(--sand)" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: sv.grad, flex: "none" }} />
            <div style={{ flex: 1, fontWeight: 700, fontSize: 13.5 }}>{sv.name}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{sv.dur} דק׳ · ₪{sv.price}</div>
          </button>
        ))}
      </div>

      <label className="bf-label">יום בשבוע</label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {DOW_FULL.map((name, wd) => (
          <button key={wd} onClick={() => setWeekday(wd)} className={"bf-slot" + (weekday === wd ? " active" : "")} style={{ flex: "1 0 28%", padding: "8px 4px", fontSize: 13 }}>{name}</button>
        ))}
      </div>

      <label className="bf-label">שעה</label>
      <select className="bf-input" value={time} onChange={(e) => setTime(e.target.value)}>
        {times.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} disabled={!ok || busy} onClick={submit}>
        {busy ? "שולחת…" : "שליחת בקשה לאישור"}
      </button>
    </Sheet>
  );
}

// Pick a new free time for an appointment the studio asked to move.
function RescheduleSheet({ appt, cli, onClose }) {
  const days = next7();
  const [offset, setOffset] = useState(null);
  const [slots, setSlots] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (offset == null) { setSlots(null); return; }
    let active = true; setSlots(null);
    availableSlots(cli.studio.id, dateForOffset(offset), appt.serviceDur).then((l) => { if (active) setSlots(l); });
    return () => { active = false; };
  }, [offset]); // eslint-disable-line

  const pick = async (time) => {
    setBusy(true);
    await cli.reschedule(appt.id, offset, time);
    setBusy(false); onClose();
  };

  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>הזזת התור</h3>
      <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>{appt.serviceName} · {appt.serviceDur} דקות — בחרי מועד חדש</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {days.map((d) => (
          <div key={d.offset} className={"bf-day" + (offset === d.offset ? " active" : "")} onClick={() => setOffset(d.offset)}>
            <div className="dn">{d.dn}</div><div className="dl">{d.dl}</div>
          </div>
        ))}
      </div>
      {offset != null && (
        <div style={{ marginTop: 12 }}>
          {slots === null && <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: "8px 0" }}>טוען שעות פנויות…</div>}
          {slots && slots.length === 0 && <Empty>אין שעות פנויות ביום זה — נסי יום אחר</Empty>}
          {slots && slots.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
              {slots.map((t) => <button key={t} className="bf-slot" disabled={busy} onClick={() => pick(t)}>{t}</button>)}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
