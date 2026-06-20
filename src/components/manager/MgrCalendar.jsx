import React, { useState } from "react";
import { Coffee, Plus, X, Trash2 } from "lucide-react";
import { Sheet, Empty, StatusChip, resolveAppt } from "../ui";
import { next7 } from "../../data/mock";
import ApptSheet from "./ApptSheet";

export default function MgrCalendar({ mgr }) {
  const days = next7();
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState(null);
  const [addBreak, setAddBreak] = useState(false);

  const appts = mgr.appts.filter((a) => a.day === sel).sort((x, y) => x.time.localeCompare(y.time));
  const breaks = mgr.breaks.filter((b) => b.day === sel);

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {days.map((d) => (
          <div key={d.offset} className={"bf-day" + (sel === d.offset ? " active" : "")} onClick={() => setSel(d.offset)}>
            <div className="dn">{d.dn}</div><div className="dl">{d.dl}</div>
          </div>
        ))}
      </div>

      <button className="bf-btn bf-btn-ghost" onClick={() => setAddBreak(true)}><Coffee size={16} /> הוספת הפסקה ליום זה</button>

      {appts.length === 0 && breaks.length === 0 && <Empty>אין תורים ביום הזה</Empty>}

      <div style={{ display: "grid", gap: 9 }}>
        {breaks.map((b) => (
          <div key={b.id} className="bf-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 11, background: "#FBF4EE", borderStyle: "dashed" }}>
            <div className="bf-display" style={{ fontSize: 15, fontWeight: 800, color: "var(--gold)", minWidth: 46, textAlign: "center" }}>{b.time}</div>
            <Coffee size={16} color="var(--gold)" />
            <div style={{ flex: 1, fontWeight: 700, fontSize: 14, color: "#8A6D3B" }}>{b.title} · עד {b.endTime}</div>
            <button onClick={() => mgr.deleteBreak(b.id)} aria-label="מחק הפסקה" style={{ background: "none", border: "none", cursor: "pointer", color: "#B6896A" }}><Trash2 size={16} /></button>
          </div>
        ))}

        {appts.map((a) => { const r = resolveAppt(a, mgr.clients); return (
          <button key={a.id} className="bf-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 11, textAlign: "right", cursor: "pointer", border: "1px solid var(--sand)" }} onClick={() => setOpen(a)}>
            <div className="bf-display" style={{ fontSize: 17, fontWeight: 800, color: "var(--plum)", minWidth: 46, textAlign: "center" }}>{a.time}</div>
            <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: r.svcGrad }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{r.clientName}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{r.svcName}</div>
            </div>
            <StatusChip a={a} />
          </button> ); })}
      </div>

      {open && <ApptSheet appt={open} mgr={mgr} onClose={() => setOpen(null)} />}
      {addBreak && <AddBreakSheet day={sel} dayLabel={days[sel].dl} mgr={mgr} onClose={() => setAddBreak(false)} />}
    </div>
  );
}

function AddBreakSheet({ day, dayLabel, mgr, onClose }) {
  const [start, setStart] = useState("13:00");
  const [end, setEnd] = useState("14:00");
  const [title, setTitle] = useState("הפסקה");
  const valid = end > start;

  const save = () => {
    if (!valid) return;
    mgr.addBreak(day, start, end, title);
    onClose();
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
      <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} disabled={!valid} onClick={save}><Plus size={16} /> הוספת הפסקה</button>
    </Sheet>
  );
}

function TimeSelect({ value, onChange }) {
  const opts = [];
  for (let h = 8; h <= 21; h++) for (const m of ["00", "30"]) opts.push(`${String(h).padStart(2, "0")}:${m}`);
  return (
    <select className="bf-input" value={value} onChange={(e) => onChange(e.target.value)}>
      {opts.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}
