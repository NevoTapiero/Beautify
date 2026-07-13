import React, { useState, useEffect } from "react";
import { CalendarDays, RefreshCw, Moon, Bell } from "lucide-react";
import { SectionTitle, Confirm, cosmeticians } from "../ui";
import { loadWeeklyHours, getDayOverride } from "../../lib/api";
import { dateForOffset } from "../../data/mock";
import ApptSheet from "./ApptSheet";
import DaySchedule from "./DaySchedule";

export default function MgrHome({ mgr, go, cosmId, setCosmId }) {
  const [open, setOpen] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [closedToday, setClosedToday] = useState(false);
  const [todayEff, setTodayEff] = useState(null);   // today's working hours, for the slot grid
  const [remindOpen, setRemindOpen] = useState(false);

  // Switch between cosmeticians' schedules on Home (business; note 32). null = owner.
  const cosmList = cosmeticians(mgr.ownerName, mgr.employees);
  const showCosm = mgr.business && cosmList.length > 1;
  const sameCosm = (x) => (x.employeeId ?? null) === cosmId;

  // Selected cosmetician's working hours today — drives the closed banner + slot grid.
  useEffect(() => {
    let active = true;
    (async () => {
      const todayStr = dateForOffset(0);
      const [weekly, override] = await Promise.all([
        loadWeeklyHours(mgr.studio.id, cosmId), getDayOverride(mgr.studio.id, todayStr, cosmId),
      ]);
      const eff = override || weekly.find((w) => w.weekday === new Date().getDay()) || null;
      if (active) { setClosedToday(!!eff && !eff.is_open); setTodayEff(eff); }
    })();
    return () => { active = false; };
  }, [mgr.studio.id, cosmId]);

  const today = mgr.appts.filter((a) => a.day === 0 && sameCosm(a)).sort((x, y) => x.time.localeCompare(y.time));
  const todayBreaks = mgr.breaks.filter((b) => b.day === 0 && sameCosm(b));
  const unconfirmed = today.filter((a) => !a.arrival && a.status === "confirmed");

  const handleRefresh = async () => { setRefreshing(true); await mgr.refresh(); setRefreshing(false); };

  const Stat = ({ n, l, c, onClick }) => (
    <div className="bf-card" onClick={onClick} style={{ flex: 1, padding: "12px 10px", textAlign: "center", cursor: onClick ? "pointer" : "default" }}>
      <div className="bf-display" style={{ fontSize: 26, fontWeight: 800, color: c }}>{n}</div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>{l}</div>
    </div>
  );

  // Home shows only appointment notifications; schedule-approval ones live on
  // the Calendar (notes 50, 54).
  const empNotifs = mgr.lockedEmployeeId
    ? (mgr.employeeNotifications || []).filter((n) => !n.read && n.type !== "approved" && n.type !== "declined")
    : [];
  // Requests tile reflects the selected cosmetician: owner → all pending
  // requests, an employee → only hers (V6).
  const reqTileCount = cosmId
    ? (mgr.scheduleReqs || []).filter((r) => r.employee_id === cosmId).length
    : (mgr.scheduleReqs || []).length;

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      {/* Employee notifications (Phase 3b) */}
      {empNotifs.length > 0 && (
        <div style={{ display: "grid", gap: 9 }}>
          {empNotifs.map((n) => (
            <button key={n.id} onClick={() => mgr.markEmployeeNotifRead(n.id)} className="bf-card" style={{ padding: 12, textAlign: "right", cursor: "pointer", border: "1px solid var(--rose-soft)", background: "linear-gradient(135deg,#fff,#FDF3F6)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Bell size={14} color="var(--rose)" />
                <div style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</div>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3 }}>{n.body}</div>
              <div style={{ fontSize: 11, color: "var(--rose)", marginTop: 6, fontWeight: 700 }}>הקישי לסימון כנקרא</div>
            </button>
          ))}
        </div>
      )}
      {closedToday && (
        <div className="bf-card" style={{ padding: "13px 15px", display: "flex", alignItems: "center", gap: 11, background: "linear-gradient(135deg,#3A2A40,#5E1F40)", color: "#fff" }}>
          <Moon size={20} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{cosmId ? `${cosmList.find((c) => c.id === cosmId)?.name || "העובדת"} לא עובדת היום` : "הסטודיו סגור היום"}</div>
            <div style={{ fontSize: 12.5, opacity: .85 }}>לקוחות לא יוכלו לקבוע תור להיום</div>
          </div>
        </div>
      )}
      {showCosm && (
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {cosmList.map((c) => (
            <button key={c.id} onClick={() => setCosmId(c.owner ? null : c.id)}
              className={"bf-chip " + ((c.owner ? null : c.id) === cosmId ? "bf-chip-rose" : "bf-chip-wait")}
              style={{ cursor: "pointer", border: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 13, height: 13, borderRadius: "50%", background: c.color }} /> {c.name}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Stat n={today.length} l="תורים היום" c="var(--plum)" />
        <Stat n={unconfirmed.length} l="טרם אישרו הגעה" c="var(--rose)" onClick={unconfirmed.length ? () => setRemindOpen(true) : undefined} />
        {/* Employees don't approve photos — hide that tile for them (note 55).
            Clicking it opens the gallery approval screen (note 31). */}
        {!mgr.lockedEmployeeId && <Stat n={mgr.pending.length} l="תמונות לאישור" c="var(--gold)" onClick={mgr.pending.length ? () => go("gallery") : undefined} />}
        {/* Manager: employee schedule requests → jump to the calendar (notes 31, V6) */}
        {!mgr.lockedEmployeeId && mgr.business && <Stat n={reqTileCount} l="בקשות עובדות" c="#6B4E7A" onClick={reqTileCount ? () => go("cal") : undefined} />}
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <SectionTitle icon={CalendarDays}>הלו"ז של היום</SectionTitle>
          <button onClick={handleRefresh} disabled={refreshing} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} /> רענון
          </button>
        </div>

        <DaySchedule effective={todayEff} dayAppts={today} dayBreaks={todayBreaks} allAppts={mgr.appts}
          onOpenAppt={setOpen} onDeleteBreak={mgr.deleteBreak} />
      </div>

      {open && <ApptSheet appt={open} mgr={mgr} onClose={() => setOpen(null)} />}
      {remindOpen && (
        <Confirm
          title="לשלוח תזכורת לכולן?"
          body={`תישלח תזכורת ל-${unconfirmed.length} לקוחות שטרם אישרו הגעה לתורים של היום.`}
          confirmLabel="שליחת תזכורת לכולן"
          onConfirm={() => mgr.remindAll(unconfirmed)}
          onClose={() => setRemindOpen(false)}
        />
      )}
    </div>
  );
}
