import React, { useState, useEffect } from "react";
import { CalendarDays, Clock, Sparkles, User, Heart, X } from "lucide-react";
import { Steps, SectionTitle, Back, Row, Empty, serviceBg, cosmeticians, FullScreen, Avatar } from "../ui";
import { next7, dateForOffset } from "../../data/mock";
import { availableSlots } from "../../lib/api";

export default function CliBook({ cli }) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [offset, setOffset] = useState(null);
  const [time, setTime] = useState(null);
  const [employee, setEmployee] = useState(null);   // chosen beautician (business)
  const [aboutOpen, setAboutOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  // Cosmetician choice (business): owner + employees. Required once there's
  // more than one cosmetician (note 28). "owner" maps to employee_id null.
  const cosmList = cosmeticians(cli.ownerName, cli.employees, cli.studio?.owner_photo_url);
  const showEmployees = cli.business && cosmList.length > 1;
  const empArg = employee === "owner" ? null : employee;
  const [slots, setSlots] = useState(null);   // null = loading, [] = none free
  const [parts, setParts] = useState([]);      // selected day-parts: morning/noon/evening
  const days = next7();
  const s = cli.services.find((x) => x.id === service);

  // Split the free hours into morning / noon / evening (note C).
  const PARTS = [
    { key: "morning", label: "בוקר", hint: "עד 12:00", test: (h) => h < 12 },
    { key: "noon",    label: "צהריים", hint: "12:00–17:00", test: (h) => h >= 12 && h < 17 },
    { key: "evening", label: "ערב", hint: "מ-17:00", test: (h) => h >= 17 },
  ];
  const partOf = (tm) => { const h = +tm.split(":")[0]; return PARTS.find((p) => p.test(h))?.key; };
  const togglePart = (k) => { setTime(null); setParts((p) => p.includes(k) ? p.filter((x) => x !== k) : [...p, k]); };
  const shownSlots = (slots || []).filter((tm) => parts.includes(partOf(tm)));

  // Load the real free slots whenever the chosen day changes.
  useEffect(() => {
    if (offset == null || !s) { setSlots(null); return; }
    let active = true;
    setSlots(null); setTime(null); setParts([]);
    availableSlots(cli.studio.id, dateForOffset(offset), s.dur, empArg).then((list) => {
      if (active) setSlots(list);
    });
    return () => { active = false; };
  }, [offset, service, employee]); // eslint-disable-line

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    await cli.book(service, offset, time, false, empArg);
    setBusy(false);
    cli.ping("התור נקבע ✓ נתראה!");
    setStep(1); setService(null); setOffset(null); setTime(null); setEmployee(null);
  };

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <Steps step={step} />

      {step === 1 && (<>
        <SectionTitle icon={Sparkles}>בחרי טיפול</SectionTitle>
        <div style={{ display: "grid", gap: 9 }}>
          {cli.services.map((sv) => (
            <button key={sv.id} className="bf-card" onClick={() => { setService(sv.id); setStep(2); }} style={{ padding: 12, display: "flex", alignItems: "center", gap: 12, textAlign: "right", cursor: "pointer" }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: serviceBg(sv), flex: "none" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{sv.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{sv.dur} דקות</div>
              </div>
              <div className="bf-display" style={{ fontWeight: 800, color: "var(--plum)" }}>₪{sv.price}</div>
            </button>
          ))}
        </div>
        <button className="bf-btn bf-btn-ghost" style={{ marginTop: 4 }} onClick={() => setAboutOpen(true)}><Heart size={16} /> עלינו</button>
      </>)}

      {step === 2 && (<>
        <Back onClick={() => setStep(1)} label={s?.name} />
        <div style={{ height: 120, borderRadius: 18, background: serviceBg(s), position: "relative", overflow: "hidden" }}>
          <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(20,12,22,.6) 100%)" }} />
          <div style={{ position: "absolute", insetInlineStart: 14, bottom: 10, color: "#fff" }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{s?.name}</div>
            <div style={{ fontSize: 12.5, opacity: .9 }}>{s?.dur} דקות · ₪{s?.price}</div>
          </div>
        </div>
        {showEmployees && (<>
          <SectionTitle icon={User}>בחרי קוסמטיקאית</SectionTitle>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {cosmList.map((e) => (
              <button key={e.id} onClick={() => setEmployee(e.id)}
                style={{
                  flex: "1 0 30%", aspectRatio: "1", borderRadius: 16, position: "relative", overflow: "hidden", cursor: "pointer",
                  border: employee === e.id ? "3px solid var(--rose)" : "1px solid var(--sand)",
                  background: e.avatar ? `url(${e.avatar}) center/cover` : (e.color || "var(--plum)"),
                }}>
                {!e.avatar && (
                  <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 26 }}>{(e.name || "?").charAt(0)}</span>
                )}
                <span style={{ position: "absolute", inset: "auto 0 0 0", padding: "16px 8px 8px", background: "linear-gradient(0deg,rgba(0,0,0,.55),rgba(0,0,0,0))", color: "#fff", fontSize: 12.5, fontWeight: 700, textAlign: "center" }}>{e.name}</span>
              </button>
            ))}
          </div>
        </>)}
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
          {slots === null && <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: "8px 0" }}>טוען שעות פנויות…</div>}
          {slots && slots.length === 0 && <Empty>אין שעות פנויות ביום זה — נסי יום אחר 🤍</Empty>}
          {slots && slots.length > 0 && (<>
            {/* Pick part(s) of the day first, then only their hours open up. */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
              {PARTS.map((p) => {
                const n = slots.filter((tm) => partOf(tm) === p.key).length;
                const on = parts.includes(p.key);
                return (
                  <button key={p.key} disabled={!n} onClick={() => togglePart(p.key)}
                    className={"bf-slot" + (on ? " active" : "")}
                    style={{ display: "grid", gap: 1, padding: "9px 4px", opacity: n ? 1 : 0.4, height: "auto" }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{p.label}</span>
                    <span style={{ fontSize: 10.5, opacity: 0.8 }}>{n ? `${n} פנויות` : "אין"}</span>
                  </button>
                );
              })}
            </div>
            {parts.length === 0
              ? <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 12.5, padding: "4px 0" }}>בחרי חלק מהיום כדי לראות שעות</div>
              : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                  {shownSlots.map((tm) => (
                    <button key={tm} className={"bf-slot" + (time === tm ? " active" : "")} onClick={() => setTime(tm)}>{tm}</button>
                  ))}
                </div>
              )}
          </>)}
        </>)}
        <button className="bf-btn bf-btn-primary" disabled={offset == null || !time || (showEmployees && !employee)} onClick={() => setStep(3)}>המשך לאישור</button>
      </>)}

      {step === 3 && (<>
        <Back onClick={() => setStep(2)} label="פרטי התור" />
        <div className="bf-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ height: 84, background: serviceBg(s), position: "relative" }}>
            <span style={{ position: "absolute", inset: "0 0 55% 0", background: "linear-gradient(180deg,rgba(255,255,255,.3),transparent)" }} />
          </div>
          <div style={{ padding: 14, display: "grid", gap: 7, fontSize: 14 }}>
            <Row k="טיפול" v={s?.name} />
            {showEmployees && employee && <Row k="קוסמטיקאית" v={(cosmList.find((e) => e.id === employee) || {}).name} />}
            <Row k="מתי" v={`${days[offset].dl} · ${time}`} />
            <Row k="משך" v={`${s?.dur} דקות`} />
            <Row k="מחיר" v={<span className="bf-display" style={{ fontWeight: 800, color: "var(--plum)", fontSize: 17 }}>₪{s?.price}</span>} />
          </div>
        </div>
        <button className="bf-btn bf-btn-primary" disabled={busy} onClick={finish}>קביעת התור</button>
      </>)}

      {aboutOpen && <AboutSheet cli={cli} onClose={() => setAboutOpen(false)} />}
    </div>
  );
}

// "עלינו" — the team's photos; tap one to read her "about me" (note 29).
function AboutSheet({ cli, onClose }) {
  const team = [
    { id: "owner", name: cli.ownerName, avatar: cli.studio?.owner_photo_url, about: cli.studio?.about, color: "#7C2A53" },
    ...(cli.employees || []),
  ];
  const [sel, setSel] = useState(null);
  const person = team.find((t) => t.id === sel);

  return (
    <FullScreen onClose={onClose}>
      <div style={{ height: 160, background: cli.studio?.logo_url ? `url(${cli.studio.logo_url}) center/cover` : "linear-gradient(135deg,var(--plum),var(--rose))", position: "relative" }}>
        <span style={{ position: "absolute", inset: "0 0 55% 0", background: "linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0))" }} />
        <div style={{ position: "absolute", insetInlineStart: 18, bottom: 14, color: "#fff" }}>
          <div className="bf-display" style={{ fontWeight: 800, fontSize: 20 }}>עלינו</div>
          <div style={{ fontSize: 12.5, opacity: .9 }}>הצוות שלנו — הקישי על תמונה כדי להכיר</div>
        </div>
      </div>
      <div className="bf-pad" style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center" }}>
        {team.map((t) => (
          <button key={t.id} onClick={() => setSel(sel === t.id ? null : t.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "grid", gap: 7, justifyItems: "center", width: 92 }}>
            {t.avatar
              ? <img src={t.avatar} alt={t.name} style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--sand)" }} />
              : <div style={{ width: 84, height: 84, borderRadius: "50%", background: t.color || "var(--plum)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 30 }}>{(t.name || "?").charAt(0)}</div>}
            <div style={{ fontSize: 13, fontWeight: 700, textAlign: "center" }}>{t.name}</div>
          </button>
        ))}
      </div>
      {person && (
        <div className="bf-modalwrap" style={{ alignItems: "center", background: "rgba(20,12,22,.86)" }} onClick={() => setSel(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "88%", maxWidth: 340, display: "grid", gap: 12 }}>
            <div style={{ position: "relative" }}>
              {person.avatar
                ? <div style={{ aspectRatio: "1", borderRadius: 20, background: `url(${person.avatar}) center/cover`, boxShadow: "0 30px 60px -20px rgba(0,0,0,.7)" }} />
                : <div style={{ aspectRatio: "1", borderRadius: 20, background: person.color || "var(--plum)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 64, boxShadow: "0 30px 60px -20px rgba(0,0,0,.7)" }}>{(person.name || "?").charAt(0)}</div>}
              <button className="bf-photo-x" aria-label="סגירה" onClick={() => setSel(null)}><X size={17} /></button>
            </div>
            <div style={{ color: "#fff", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{person.name}{person.title ? ` · ${person.title}` : ""}</div>
              <div style={{ fontSize: 13.5, marginTop: 6, lineHeight: 1.6, whiteSpace: "pre-wrap", opacity: .9 }}>
                {person.about || "עוד לא נכתב תיאור."}
              </div>
            </div>
          </div>
        </div>
      )}
    </FullScreen>
  );
}
