import React from "react";
import { DOW } from "../../data/mock";

const hhmm = (t) => (t || "").slice(0, 5);
const toMin = (t) => { const [h, m] = hhmm(t).split(":").map(Number); return h * 60 + m; };

const PX_PER_MIN = 1.5;
const COL_W = 62;
const HEADER_H = 48;   // day-header height; the time rail reserves the same, so rows line up

// Google-Calendar-style week grid: a time-label rail on the side and one
// column per day, with appointments positioned by actual clock time. Uses
// each day's WEEKLY default hours only (not one-off day overrides) to keep
// this a single fast render instead of 7 extra network round-trips — day
// view still shows the real, override-aware hours for whichever day is open.
export default function WeekSchedule({ days, weekly, appts, breaks, onOpenAppt, onSelectDay }) {
  const rowFor = (weekday) => weekly.find((w) => w.weekday === weekday) || null;
  const openRows = days.map((d) => rowFor(d.weekday)).filter((r) => r && r.is_open);

  // Range spans each day's weekly hours PLUS any appointment/break that falls
  // outside them (e.g. booked before an hours change), so nothing is clipped
  // out of view and left unreachable.
  const bounds = [];
  for (const r of openRows) { bounds.push(toMin(r.start_time), toMin(r.end_time)); }
  for (const a of appts) { bounds.push(toMin(a.time), toMin(a.time) + (a.serviceDur || 0)); }
  for (const b of breaks) { bounds.push(toMin(b.time), toMin(b.endTime)); }
  const startMin = bounds.length ? Math.min(...bounds) : 9 * 60;
  const endMin = bounds.length ? Math.max(...bounds) : 19 * 60;
  const gridHeight = Math.max(60, endMin - startMin) * PX_PER_MIN;

  // Position + clamp a [startTime, endTime] block into the visible grid.
  const place = (from, to) => {
    const top = Math.max(0, Math.min(gridHeight, (from - startMin) * PX_PER_MIN));
    const bottom = Math.max(0, Math.min(gridHeight, (to - startMin) * PX_PER_MIN));
    return { top, height: Math.max(14, bottom - top) };
  };

  const hourMarks = [];
  for (let m = Math.ceil(startMin / 60) * 60; m <= endMin; m += 60) hourMarks.push(m);

  return (
    <div className="bf-card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", overflowX: "auto" }}>
        {/* Time rail — sticky so it stays visible while the days scroll sideways. */}
        <div style={{ flex: "none", width: 32, position: "sticky", insetInlineStart: 0, zIndex: 2, background: "var(--surface)" }}>
          <div style={{ height: HEADER_H }} />
          <div style={{ position: "relative", height: gridHeight }}>
            {hourMarks.map((m) => (
              <div key={m} style={{ position: "absolute", top: (m - startMin) * PX_PER_MIN, insetInlineStart: 0, fontSize: 9.5, fontWeight: 700, color: "var(--muted)", transform: "translateY(-50%)" }}>
                {String(Math.floor(m / 60)).padStart(2, "0")}
              </div>
            ))}
          </div>
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
                style={{ width: "100%", height: HEADER_H, boxSizing: "border-box", background: "none", border: "none", cursor: "pointer", padding: "4px 0 6px", textAlign: "center", fontFamily: "inherit" }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 700, color: isToday ? "var(--plum)" : "var(--muted)" }}>{DOW[d.weekday]}</div>
                <div
                  style={{
                    fontSize: 13, fontWeight: 800, width: 24, height: 24, borderRadius: "50%",
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
                {dayBreaks.map((b) => {
                  const { top, height } = place(toMin(b.time), toMin(b.endTime));
                  return <div key={b.id} style={{ position: "absolute", insetInlineStart: 2, insetInlineEnd: 2, top, height, background: "#F3E7D6", borderRadius: 4 }} />;
                })}
                {dayAppts.map((a) => {
                  const { top, height } = place(toMin(a.time), toMin(a.time) + (a.serviceDur || 30));
                  const ghost = a.status === "reschedule_requested";
                  return (
                    <button
                      key={a.id}
                      onClick={() => onOpenAppt(a)}
                      style={{
                        position: "absolute", insetInlineStart: 2, insetInlineEnd: 2, top, height,
                        borderRadius: 5, border: "none", cursor: "pointer", opacity: ghost ? 0.5 : 1,
                        background: a.serviceGrad || "var(--plum)", color: "#fff", fontSize: 9.5, fontWeight: 700,
                        padding: "2px 4px", overflow: "hidden", textAlign: "start", lineHeight: 1.2,
                      }}
                    >
                      {a.clientName}
                      {height > 28 && <div style={{ opacity: .85, fontWeight: 600 }}>{a.time}</div>}
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
