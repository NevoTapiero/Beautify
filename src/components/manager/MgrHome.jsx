import React, { useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import { SectionTitle, Empty, StatusChip, resolveAppt } from "../ui";

export default function MgrHome({ appts, clients, pending, go, refreshManagerAppts }) {
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshManagerAppts?.();
    setRefreshing(false);
  };
  const today = appts.filter((a) => a.day === 0).sort((x, y) => x.time.localeCompare(y.time));
  const needConfirm = today.filter((a) => !a.arrival && a.status !== "pending").length;

  const Stat = ({ n, l, c }) => (
    <div className="bf-card" style={{ flex: 1, padding: "12px 10px", textAlign: "center" }}>
      <div className="bf-display" style={{ fontSize: 26, fontWeight: 800, color: c }}>{n}</div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>{l}</div>
    </div>
  );

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Stat n={today.length} l="תורים היום" c="var(--plum)" />
        <Stat n={needConfirm} l="טרם אישרו הגעה" c="var(--rose)" />
        <Stat n={pending.length} l="תמונות לאישור" c="var(--gold)" />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <SectionTitle icon={CalendarDays}>הלו"ז של היום</SectionTitle>
          <button onClick={handleRefresh} disabled={refreshing} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 700, fontFamily: "inherit" }}>
            <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} /> רענון
          </button>
        </div>
        {today.length === 0 && <Empty>אין עדיין תורים להיום — יום פנוי 🤍</Empty>}
        <div style={{ display: "grid", gap: 9 }}>
          {today.map((a) => {
            const r = resolveAppt(a, clients);
            return (
              <div key={a.id} className="bf-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 11 }}>
                <div style={{ textAlign: "center", minWidth: 46 }}>
                  <div className="bf-display" style={{ fontSize: 17, fontWeight: 800, color: "var(--plum)" }}>{a.time}</div>
                  <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{r.svcDur} ד׳</div>
                </div>
                <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: r.svcGrad }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.clientName}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{r.svcName} · ₪{r.svcPrice}</div>
                </div>
                <StatusChip a={a} />
              </div>
            );
          })}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="bf-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#fff,#FDF3F6)" }}>
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: pending[0].grad }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{pending.length} תמונות מחכות לאישורך</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>לקוחות שיתפו את התוצאה</div>
            </div>
          </div>
          <button className="bf-btn bf-btn-soft bf-btn-sm" onClick={() => go("gallery")}>לאישור</button>
        </div>
      )}
    </div>
  );
}
