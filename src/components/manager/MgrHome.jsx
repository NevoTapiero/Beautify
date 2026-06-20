import React, { useState } from "react";
import { CalendarDays, RefreshCw, Coffee } from "lucide-react";
import { SectionTitle, Empty, StatusChip, resolveAppt } from "../ui";
import ApptSheet from "./ApptSheet";

export default function MgrHome({ mgr, go }) {
  const [open, setOpen] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const today = mgr.appts.filter((a) => a.day === 0).sort((x, y) => x.time.localeCompare(y.time));
  const todayBreaks = mgr.breaks.filter((b) => b.day === 0);
  const needConfirm = today.filter((a) => !a.arrival && a.status === "confirmed").length;

  const handleRefresh = async () => { setRefreshing(true); await mgr.refresh(); setRefreshing(false); };

  const Stat = ({ n, l, c }) => (
    <div className="bf-card" style={{ flex: 1, padding: "12px 10px", textAlign: "center" }}>
      <div className="bf-display" style={{ fontSize: 26, fontWeight: 800, color: c }}>{n}</div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>{l}</div>
    </div>
  );

  // Merge appointments + breaks into one time-ordered list.
  const timeline = [...today.map((a) => ({ ...a, _t: "appt" })), ...todayBreaks.map((b) => ({ ...b, _t: "break" }))]
    .sort((x, y) => x.time.localeCompare(y.time));

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Stat n={today.length} l="תורים היום" c="var(--plum)" />
        <Stat n={needConfirm} l="טרם אישרו הגעה" c="var(--rose)" />
        <Stat n={mgr.pending.length} l="תמונות לאישור" c="var(--gold)" />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <SectionTitle icon={CalendarDays}>הלו"ז של היום</SectionTitle>
          <button onClick={handleRefresh} disabled={refreshing} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} /> רענון
          </button>
        </div>

        {timeline.length === 0 && <Empty>אין עדיין תורים להיום — יום פנוי 🤍</Empty>}
        <div style={{ display: "grid", gap: 9 }}>
          {timeline.map((item) => item._t === "break" ? (
            <div key={"b" + item.id} className="bf-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 11, background: "#FBF4EE", borderStyle: "dashed" }}>
              <div className="bf-display" style={{ fontSize: 15, fontWeight: 800, color: "var(--gold)", minWidth: 46, textAlign: "center" }}>{item.time}</div>
              <Coffee size={16} color="var(--gold)" />
              <div style={{ flex: 1, fontWeight: 700, fontSize: 14, color: "#8A6D3B" }}>{item.title} · עד {item.endTime}</div>
            </div>
          ) : (() => { const r = resolveAppt(item, mgr.clients); return (
            <button key={item.id} className="bf-card" onClick={() => setOpen(item)} style={{ padding: 12, display: "flex", alignItems: "center", gap: 11, textAlign: "right", cursor: "pointer", border: "1px solid var(--sand)" }}>
              <div style={{ textAlign: "center", minWidth: 46 }}>
                <div className="bf-display" style={{ fontSize: 17, fontWeight: 800, color: "var(--plum)" }}>{item.time}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{r.svcDur} ד׳</div>
              </div>
              <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: r.svcGrad }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{r.clientName}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{r.svcName} · ₪{r.svcPrice}</div>
              </div>
              <StatusChip a={item} />
            </button> ); })()
          )}
        </div>
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
    </div>
  );
}
