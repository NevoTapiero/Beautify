import React, { useState, useEffect } from "react";
import { CalendarDays, RefreshCw, Moon } from "lucide-react";
import { SectionTitle, Confirm } from "../ui";
import { loadWeeklyHours, getDayOverride } from "../../lib/api";
import { dateForOffset } from "../../data/mock";
import ApptSheet from "./ApptSheet";
import DaySchedule from "./DaySchedule";

export default function MgrHome({ mgr, go }) {
  const [open, setOpen] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [closedToday, setClosedToday] = useState(false);
  const [todayEff, setTodayEff] = useState(null);   // today's working hours, for the slot grid
  const [remindOpen, setRemindOpen] = useState(false);

  // Today's working hours — drives the closed banner (note 23) + slot grid (note 30).
  useEffect(() => {
    let active = true;
    (async () => {
      const todayStr = dateForOffset(0);
      const [weekly, override] = await Promise.all([
        loadWeeklyHours(mgr.studio.id), getDayOverride(mgr.studio.id, todayStr),
      ]);
      const eff = override || weekly.find((w) => w.weekday === new Date().getDay()) || null;
      if (active) { setClosedToday(!!eff && !eff.is_open); setTodayEff(eff); }
    })();
    return () => { active = false; };
  }, [mgr.studio.id, mgr.breaks]);

  const today = mgr.appts.filter((a) => a.day === 0).sort((x, y) => x.time.localeCompare(y.time));
  const todayBreaks = mgr.breaks.filter((b) => b.day === 0);
  const unconfirmed = today.filter((a) => !a.arrival && a.status === "confirmed");

  const handleRefresh = async () => { setRefreshing(true); await mgr.refresh(); setRefreshing(false); };

  const Stat = ({ n, l, c, onClick }) => (
    <div className="bf-card" onClick={onClick} style={{ flex: 1, padding: "12px 10px", textAlign: "center", cursor: onClick ? "pointer" : "default" }}>
      <div className="bf-display" style={{ fontSize: 26, fontWeight: 800, color: c }}>{n}</div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>{l}</div>
    </div>
  );

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      {closedToday && (
        <div className="bf-card" style={{ padding: "13px 15px", display: "flex", alignItems: "center", gap: 11, background: "linear-gradient(135deg,#3A2A40,#5E1F40)", color: "#fff" }}>
          <Moon size={20} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>הסטודיו סגור היום</div>
            <div style={{ fontSize: 12.5, opacity: .85 }}>לקוחות לא יוכלו לקבוע תור להיום</div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <Stat n={today.length} l="תורים היום" c="var(--plum)" />
        <Stat n={unconfirmed.length} l="טרם אישרו הגעה" c="var(--rose)" onClick={unconfirmed.length ? () => setRemindOpen(true) : undefined} />
        <Stat n={mgr.pending.length} l="תמונות לאישור" c="var(--gold)" />
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

      {mgr.pending.length > 0 && (
        <div className="bf-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#fff,#FDF3F6)" }}>
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: mgr.pending[0].img ? `url(${mgr.pending[0].img}) center/cover` : "var(--rose-soft)" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{mgr.pending.length} תמונות מחכות לאישורך</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>לקוחות שיתפו את התוצאה</div>
            </div>
          </div>
          <button className="bf-btn bf-btn-soft bf-btn-sm" onClick={() => go("gallery")}>לאישור</button>
        </div>
      )}

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
