import React, { useState } from "react";
import { CalendarDays, Clock, Wallet, Sparkles } from "lucide-react";
import { Steps, SectionTitle, Back, BitSheet, Row } from "../ui";
import { svc } from "../../lib/services";
import { next7, TIMES } from "../../data/mock";

export default function CliBook({ cli }) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [offset, setOffset] = useState(null);
  const [time, setTime] = useState(null);
  const [pay, setPay] = useState(false);
  const [busy, setBusy] = useState(false);
  const days = next7();
  const s = svc(service);

  const finish = async (paid) => {
    setBusy(true);
    await cli.book(service, offset, time, paid);
    setBusy(false);
    cli.ping(paid ? "התור נקבע ושולם בביט ✓" : "התור נקבע ✓ נתראה!");
    setPay(false); setStep(1); setService(null); setOffset(null); setTime(null);
  };

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <Steps step={step} />

      {step === 1 && (<>
        <SectionTitle icon={Sparkles}>בחרי טיפול</SectionTitle>
        <div style={{ display: "grid", gap: 9 }}>
          {cli.services.map((sv) => (
            <button key={sv.id} className="bf-card" onClick={() => { setService(sv.id); setStep(2); }} style={{ padding: 12, display: "flex", alignItems: "center", gap: 12, textAlign: "right", cursor: "pointer" }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: sv.grad, flex: "none" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{sv.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{sv.dur} דקות</div>
              </div>
              <div className="bf-display" style={{ fontWeight: 800, color: "var(--plum)" }}>₪{sv.price}</div>
            </button>
          ))}
        </div>
      </>)}

      {step === 2 && (<>
        <Back onClick={() => setStep(1)} label={s?.name} />
        <SectionTitle icon={CalendarDays}>בחרי יום</SectionTitle>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {days.map((d) => (
            <div key={d.offset} className={"bf-day" + (offset === d.offset ? " active" : "")} onClick={() => setOffset(d.offset)}>
              <div className="dn">{d.dn}</div><div className="dl">{d.dl}</div>
            </div>
          ))}
        </div>
        {offset != null && (<>
          <SectionTitle icon={Clock}>בחרי שעה</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
            {TIMES.map((tm) => <button key={tm} className={"bf-slot" + (time === tm ? " active" : "")} onClick={() => setTime(tm)}>{tm}</button>)}
          </div>
        </>)}
        <button className="bf-btn bf-btn-primary" disabled={offset == null || !time} onClick={() => setStep(3)}>המשך לאישור</button>
      </>)}

      {step === 3 && (<>
        <Back onClick={() => setStep(2)} label="פרטי התור" />
        <div className="bf-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ height: 84, background: s?.grad, position: "relative" }}>
            <span style={{ position: "absolute", inset: "0 0 55% 0", background: "linear-gradient(180deg,rgba(255,255,255,.3),transparent)" }} />
          </div>
          <div style={{ padding: 14, display: "grid", gap: 7, fontSize: 14 }}>
            <Row k="טיפול" v={s?.name} />
            <Row k="מתי" v={`${days[offset].dl} · ${time}`} />
            <Row k="משך" v={`${s?.dur} דקות`} />
            <Row k="מחיר" v={<span className="bf-display" style={{ fontWeight: 800, color: "var(--plum)", fontSize: 17 }}>₪{s?.price}</span>} />
          </div>
        </div>
        <button className="bf-btn bf-btn-primary" disabled={busy} onClick={() => setPay(true)}><Wallet size={17} /> תשלום בביט וקביעת התור</button>
        <button className="bf-btn bf-btn-ghost" disabled={busy} onClick={() => finish(false)}>אשלם במקום — קבעי תור</button>
      </>)}

      {pay && <BitSheet amount={s?.price} onClose={() => setPay(false)} onPaid={() => finish(true)} />}
    </div>
  );
}
