import React from "react";
import { DOW } from "../../data/mock";

const hhmm = (t) => (t || "").slice(0, 5);
const toMin = (t) => { const [h, m] = hhmm(t).split(":").map(Number); return h * 60 + m; };

const PX_PER_MIN = 1.5;
const COL_W = 62;

// Google-Calendar-style week grid: a time-label rail on the side and one
// column per day, with appointments positioned by actual clock time. Uses
// each day's WEEKLY default hours only (not one-off day overrides) to keep
// this a single fast render instead of 7 extra network round-trips — day
// view still shows the real, override-aware hours for whichever day is open.
export default function WeekSchedule({ days, weekly, appts, breaks, onOpenAppt, onSelectDay }) {
  const rowFor = (weekday) => weekly.find((w) => w.weekday === weekday) || null;
  const openRows = days.map((d) => rowFor(d.weekday)).filter((r) => r && r.is_open);

  const startMin = openRows.length ? Math.min(...openRows.map((r) => toMin(r.start_time))) : 9 * 60;
  const endMin = openRows.length ? Math.max(...openRows.map((r) => toMin(r.end_time))) : 19 * 60;
  const gridHeight = Math.max(60, endMin - startMin) * PX_PER_MIN;

  const hourMarks = [];
  for (let m = Math.ceil(startMin / 60) * 60; m <= endMin; m += 60) hourMarks.push(m);

  return (
    <div className="bf-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", overflowX: "auto" }}>
        <div style={{ flex: "none", width: 32, position: "relative", height: gridHeight + 40 }}>
          {hourMarks.map((m) => (
            <div key={m} style={{ position: "absolute", top: (m - startMin) * PX_PER_MIN + 40, insetInlineStart: 0, fontSize: 9.5, fontWeight: 700, color: "var(--muted)", transform: "translateY(-50%)" }}>
              {String(Math.floor(m / 60)).padStart(2, "0")}
            </div>
          ))}
        </div>
        {days.map((d) => {
          const row = rowFor(d.weekday);
          const open = !!(row && row.is_open);
          const dayAppts = appts.filter((a) => a.day === d.offset);
          const dayBreaks = breaks.filter((b) => b.day === d.offset);
          const isToday = d.offset === 0;
          return (
            <div key={d.offset} style={{ flex: "none", width: COL_W, borderInlineStart: "1px solid var(--sand)" }}>
              <button
                onClick={() => onSelectDay(d.offset)}
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "4px 0 6px", textAlign: "center", fontFamily: "inherit" }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 700, color: isToday ? "var(--plum)" : "var(--muted)" }}>{DOW[d.weekday]}</div>
                <div
                  style={{
                    fontSize: 13, fontWeight: 800, marginTop: 2, width: 24, height: 24, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", margin: "2px auto 0",
                    color: isToday ? "var(--btn-ink)" : "var(--ink)",
                    background: isToday ? "linear-gradient(135deg,var(--plum),var(--rose))" : "transparent",
                  }}
                >{d.dn}</div>
              </button>
              <div
                style={{
                  position: "relative", height: gridHeight,
                  background: open ? undefined : "repeating-linear-gradient(135deg, var(--blush), var(--blush) 6px, transparent 6px, transparent 12px)",
                }}
              >
                {open && dayBreaks.map((b) => (
                  <div key={b.id} style={{
                    position: "absolute", insetInlineStart: 2, insetInlineEnd: 2,
                    top: Math.max(0, (toMin(b.time) - startMin) * PX_PER_MIN),
                    height: Math.max(8, (toMin(b.endTime) - toMin(b.time)) * PX_PER_MIN),
                    background: "#F3E7D6", borderRadius: 4,
                  }} />
                ))}
                {open && dayAppts.map((a) => {
                  const top = Math.max(0, (toMin(a.time) - startMin) * PX_PER_MIN);
                  const h = Math.max(18, a.serviceDur * PX_PER_MIN - 2);
                  const ghost = a.status === "reschedule_requested";
                  return (
                    <button
                      key={a.id}
                      onClick={() => onOpenAppt(a)}
                      style={{
                        position: "absolute", insetInlineStart: 2, insetInlineEnd: 2, top, height: h,
                        borderRadius: 5, border: "none", cursor: "pointer", opacity: ghost ? 0.5 : 1,
                        background: a.serviceGrad || "var(--plum)", color: "#fff", fontSize: 9.5, fontWeight: 700,
                        padding: "2px 4px", overflow: "hidden", textAlign: "start", lineHeight: 1.2,
                      }}
                    >
                      {a.clientName}
                      {h > 28 && <div style={{ opacity: .85, fontWeight: 600 }}>{a.time}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
