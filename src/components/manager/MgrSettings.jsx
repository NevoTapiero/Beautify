import React, { useState } from "react";
import { Bell, Users, Sparkles, LogOut, Plus, Pencil, Trash2, Repeat, Check, X, ChevronDown, Image as ImageIcon, Briefcase, FileText, UserPlus, Smartphone, Lock } from "lucide-react";
import { SectionTitle, Row, Sheet, PhotoPicker, serviceBg, Confirm } from "../ui";
import { DOW_FULL } from "../../data/mock";

const KEYS = {
  notify_day_start:   { title: "סיכום בתחילת יום", sub: "כל הבוקר — רשימת התורים של היום" },
  notify_after_break: { title: "תזכורת אחרי הפסקה", sub: "התראה על התור הבא אחרי כל הפסקה" },
  notify_client_24h:  { title: "24 שעות לפני התור", sub: "תזכורת SMS ללקוחה + בקשת אישור הגעה" },
  notify_client_1h:   { title: "שעה לפני התור", sub: "תזכורת SMS אחרונה לפני ההגעה" },
};

const GRADS = [
  "linear-gradient(135deg,#D9738F,#F4C9D4)", "linear-gradient(135deg,#7C2A53,#D9738F)",
  "linear-gradient(135deg,#5E1F40,#9A4E72)", "linear-gradient(135deg,#C98AA6,#F0D7DF)",
  "linear-gradient(135deg,#9A4E72,#E0AFC0)", "linear-gradient(135deg,#B4893E,#F4C9D4)",
];

export default function MgrSettings({ mgr }) {
  const s = mgr.studio || {};
  const [state, setState] = useState({
    notify_day_start:   s.notify_day_start ?? true,
    notify_after_break: s.notify_after_break ?? true,
    notify_client_24h:  s.notify_client_24h ?? true,
    notify_client_1h:   s.notify_client_1h ?? true,
  });
  const [editSvc, setEditSvc] = useState(null);   // service being added/edited
  const [openStanding, setOpenStanding] = useState(false);   // standing list dropdown (note 48)
  const [editEmp, setEditEmp] = useState(null);   // employee being added/edited (business)
  const [openInvoices, setOpenInvoices] = useState(false);   // invoices dropdown (business)
  const [openServices, setOpenServices] = useState(false);   // services dropdown (note 49)
  const [openEmployees, setOpenEmployees] = useState(false); // employees dropdown (note 50)
  const [codeGate, setCodeGate] = useState(null);            // {target:true|false} business code prompt
  const [lockEmp, setLockEmp] = useState(null);              // employee to confirm locking the device to
  const [openNotif, setOpenNotif] = useState(false);         // notifications dropdown (note 44)
  const [openMore, setOpenMore] = useState(false);           // "additional settings" dropdown (note 46)
  const [nameDraft, setNameDraft] = useState(mgr.studioName);// name editor (V5 note 44)
  const [editName, setEditName] = useState(false);

  const tog = (k) => {
    const next = !state[k];
    setState((p) => ({ ...p, [k]: next }));
    mgr.saveSettings({ [k]: next });
  };

  const Toggle = ({ k }) => (
    <div className="bf-card" style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{KEYS[k].title}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{KEYS[k].sub}</div>
      </div>
      <button onClick={() => tog(k)} aria-pressed={state[k]} style={{ width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", padding: 3, background: state[k] ? "linear-gradient(135deg,var(--plum),var(--rose))" : "var(--sand)", display: "flex", justifyContent: state[k] ? "flex-end" : "flex-start", transition: ".18s" }}>
        <span style={{ width: 21, height: 21, borderRadius: "50%", background: "#fff", display: "block" }} />
      </button>
    </div>
  );

  const services = mgr.services || [];

  const emps = mgr.employees || [];
  const invoices = mgr.invoices || [];

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      {mgr.business && (<>
        {/* Employees — collapsible dropdown (note 50) */}
        <button onClick={() => setOpenEmployees((v) => !v)} className="bf-card" style={{ padding: "12px 13px", display: "flex", alignItems: "center", gap: 9, cursor: "pointer", textAlign: "right", width: "100%" }}>
          <Users size={16} color="var(--plum)" />
          <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5 }}>העובדות שלך</span>
          <span className="bf-chip bf-chip-wait">{emps.length}</span>
          <ChevronDown size={18} color="var(--muted)" style={{ transform: openEmployees ? "rotate(180deg)" : "none", transition: ".18s" }} />
        </button>
        {openEmployees && (<>
        <button className="bf-btn bf-btn-soft bf-btn-sm" style={{ justifySelf: "start" }} onClick={() => setEditEmp({ name: "", title: "", color: "#D9738F" })}>
          <UserPlus size={14} /> עובדת חדשה
        </button>
        {emps.length === 0 && (
          <div className="bf-card" style={{ padding: 14, textAlign: "center", color: "var(--muted)", fontSize: 12.5, borderStyle: "dashed" }}>
            עדיין לא הוספת עובדות — הוסיפי כדי שלקוחות יוכלו לבחור קוסמטיקאית בקביעת תור
          </div>
        )}
        <div style={{ display: "grid", gap: 9 }}>
          {emps.map((e) => (
            <div key={e.id} className="bf-card" style={{ padding: 11, display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: e.color, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>{(e.name || "?").charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{e.name}</div>
                {e.title && <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{e.title}</div>}
              </div>
              <button onClick={() => setEditEmp(e)} aria-label="עריכה" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}><Pencil size={16} /></button>
              <button onClick={() => mgr.deleteEmployee(e.id)} aria-label="מחיקה" style={{ background: "none", border: "none", cursor: "pointer", color: "#B23A48", padding: 4 }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        {/* Employee-app mode lives under the employees dropdown (note 45) */}
        {emps.length > 0 && (<>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 4 }}>
            <Smartphone size={15} color="var(--plum)" />
            <span style={{ fontWeight: 800, fontSize: 14 }}>אפליקציית עובדת</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
            נעלי את המכשיר הזה לתצוגת עובדת מסוימת. היציאה חזרה לתצוגת מנהלת תדרוש את סיסמת המנהלת.
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {emps.map((e) => (
              <button key={e.id} className="bf-card" onClick={() => setLockEmp(e)} style={{ padding: 10, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "right", width: "100%" }}>
                <Lock size={14} color="var(--muted)" />
                <span style={{ flex: 1, fontWeight: 700, fontSize: 13.5 }}>נעילה לתצוגה של {e.name}</span>
              </button>
            ))}
          </div>
        </>)}
        </>)}

        {/* Invoices — collapsible list */}
        <button onClick={() => setOpenInvoices((v) => !v)} className="bf-card" style={{ padding: "12px 13px", display: "flex", alignItems: "center", gap: 9, cursor: "pointer", textAlign: "right", width: "100%" }}>
          <FileText size={16} color="var(--plum)" />
          <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5 }}>חשבוניות שהופקו</span>
          <span className="bf-chip bf-chip-wait">{invoices.length}</span>
          <ChevronDown size={18} color="var(--muted)" style={{ transform: openInvoices ? "rotate(180deg)" : "none", transition: ".18s" }} />
        </button>
        {openInvoices && (invoices.length === 0 ? (
          <div className="bf-card" style={{ padding: 14, textAlign: "center", color: "var(--muted)", fontSize: 12.5, borderStyle: "dashed" }}>
            עדיין לא הופקו חשבוניות. אפשר להפיק חשבונית מתוך פרטי תור ביומן.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {invoices.map((inv) => (
              <div key={inv.id} className="bf-card" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <div style={{ fontWeight: 800, color: "var(--plum)", minWidth: 40 }}>#{inv.number}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{inv.client_name || "לקוחה"}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{inv.service_name || ""} · {new Date(inv.issued_at).toLocaleDateString("he-IL")}</div>
                </div>
                <div className="bf-display" style={{ fontWeight: 800 }}>₪{inv.amount}</div>
              </div>
            ))}
          </div>
        ))}
        <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6, padding: "0 2px" }}>
          חשבוניות נשמרות וממוספרות באפליקציה. חיבור לחשבונית מס רשמית (חשבונית ירוקה / iCount) יתווסף לאחר פתיחת חשבון אצל הספק.
        </div>
      </>)}

      {/* Services management — collapsible dropdown (note 49) */}
      <button onClick={() => setOpenServices((v) => !v)} className="bf-card" style={{ padding: "12px 13px", display: "flex", alignItems: "center", gap: 9, cursor: "pointer", textAlign: "right", width: "100%" }}>
        <Sparkles size={16} color="var(--plum)" />
        <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5 }}>השירותים שלך</span>
        <span className="bf-chip bf-chip-wait">{services.length}</span>
        <ChevronDown size={18} color="var(--muted)" style={{ transform: openServices ? "rotate(180deg)" : "none", transition: ".18s" }} />
      </button>
      {openServices && (<>
        <button className="bf-btn bf-btn-soft bf-btn-sm" style={{ justifySelf: "start" }} onClick={() => setEditSvc({ name: "", dur: 60, price: 100, grad: GRADS[services.length % GRADS.length] })}>
          <Plus size={14} /> שירות חדש
        </button>
        {services.length === 0 && (
          <div className="bf-card" style={{ padding: 16, textAlign: "center", color: "var(--muted)", fontSize: 13, borderStyle: "dashed" }}>
            עדיין לא הוספת שירותים — הוסיפי כדי שלקוחות יוכלו לקבוע תור
          </div>
        )}
        <div style={{ display: "grid", gap: 9 }}>
          {services.map((sv) => (
            <div key={sv.id} className="bf-card" style={{ padding: 11, display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: serviceBg(sv), flex: "none" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{sv.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{sv.dur} דק׳ · ₪{sv.price}</div>
              </div>
              <button onClick={() => setEditSvc(sv)} aria-label="עריכה" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}><Pencil size={16} /></button>
              <button onClick={() => mgr.deleteService(sv.id)} aria-label="מחיקה" style={{ background: "none", border: "none", cursor: "pointer", color: "#B23A48", padding: 4 }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </>)}

      {/* Standing weekly appointments — collapsible dropdown (note 48) */}
      {(() => {
        const pending = (mgr.standing || []).filter((s) => s.status === "pending").length;
        return (
          <button onClick={() => setOpenStanding((v) => !v)} className="bf-card" style={{ padding: "12px 13px", display: "flex", alignItems: "center", gap: 9, cursor: "pointer", textAlign: "right", width: "100%" }}>
            <Repeat size={16} color="var(--plum)" />
            <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5 }}>תורים קבועים שבועיים</span>
            {pending > 0 && <span className="bf-chip bf-chip-rose">{pending} ממתינות</span>}
            <ChevronDown size={18} color="var(--muted)" style={{ transform: openStanding ? "rotate(180deg)" : "none", transition: ".18s" }} />
          </button>
        );
      })()}
      {openStanding && ((mgr.standing || []).length === 0 ? (
        <div className="bf-card" style={{ padding: 14, textAlign: "center", color: "var(--muted)", fontSize: 12.5, borderStyle: "dashed" }}>
          אין בקשות לתורים קבועים. כשלקוחה תבקש יום ושעה קבועים, הבקשה תופיע כאן לאישורך.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 9 }}>
          {mgr.standing.map((st) => (
            <div key={st.id} className="bf-card" style={{ padding: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Repeat size={17} color="var(--plum)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{st.client_name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{st.service_name} · כל {DOW_FULL[st.weekday]} בשעה {st.time}</div>
                </div>
                {st.status === "approved" && <span className="bf-chip bf-chip-ok"><Check size={12} /> מאושר</span>}
              </div>
              {st.status === "pending" ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="bf-btn bf-btn-primary bf-btn-sm" style={{ flex: 1 }} onClick={() => mgr.approveStanding(st)}><Check size={15} /> אישור</button>
                  <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => mgr.declineStanding(st)}><X size={15} /> דחייה</button>
                </div>
              ) : (
                <button className="bf-btn bf-btn-ghost bf-btn-sm" style={{ color: "#B23A48", borderColor: "#F0CBD0" }} onClick={() => mgr.cancelStanding(st)}><X size={15} /> ביטול התור הקבוע</button>
              )}
            </div>
          ))}
        </div>
      ))}

      {/* Notifications — collapsible dropdown (note 44) */}
      <button onClick={() => setOpenNotif((v) => !v)} className="bf-card" style={{ padding: "12px 13px", display: "flex", alignItems: "center", gap: 9, cursor: "pointer", textAlign: "right", width: "100%" }}>
        <Bell size={16} color="var(--plum)" />
        <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5 }}>התראות אוטומטיות</span>
        <ChevronDown size={18} color="var(--muted)" style={{ transform: openNotif ? "rotate(180deg)" : "none", transition: ".18s" }} />
      </button>
      {openNotif && (<>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--muted)", padding: "0 2px" }}>אליי</div>
        <Toggle k="notify_day_start" />
        <Toggle k="notify_after_break" />
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--muted)", padding: "0 2px" }}>ללקוחות</div>
        <Toggle k="notify_client_24h" />
        <Toggle k="notify_client_1h" />
        <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6, padding: "0 2px" }}>
          ההתראות נשמרות אוטומטית. שליחת SMS בפועל תופעל לאחר חיבור ספק SMS.
        </div>
      </>)}

      {/* Additional settings — edition switch lives here (note 46) */}
      <button onClick={() => setOpenMore((v) => !v)} className="bf-card" style={{ padding: "12px 13px", display: "flex", alignItems: "center", gap: 9, cursor: "pointer", textAlign: "right", width: "100%" }}>
        <Sparkles size={16} color="var(--plum)" />
        <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5 }}>הגדרות נוספות</span>
        <ChevronDown size={18} color="var(--muted)" style={{ transform: openMore ? "rotate(180deg)" : "none", transition: ".18s" }} />
      </button>
      {openMore && (<>
        <div className="bf-card" style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
          <Briefcase size={18} color="var(--plum)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>{mgr.business ? "גרסת עסק פעילה" : "גרסה פרטית"}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{mgr.business ? "מעבר לגרסה פרטית · נדרש קוד" : "מעבר לגרסת עסק · נדרש קוד"}</div>
          </div>
          <button onClick={() => setCodeGate({ target: !mgr.business })} aria-pressed={mgr.business} style={{ width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", padding: 3, background: mgr.business ? "linear-gradient(135deg,var(--plum),var(--rose))" : "var(--sand)", display: "flex", justifyContent: mgr.business ? "flex-end" : "flex-start", transition: ".18s" }}>
            <span style={{ width: 21, height: 21, borderRadius: "50%", background: "#fff", display: "block" }} />
          </button>
        </div>
        <div className="bf-card" style={{ padding: 12, display: "grid", gap: 8, fontSize: 13.5 }}>
          {editName ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input className="bf-input" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="שם" autoFocus />
              <button className="bf-btn bf-btn-primary bf-btn-sm" style={{ width: "auto", whiteSpace: "nowrap" }} disabled={!nameDraft.trim()} onClick={() => { mgr.saveSettings({ name: nameDraft.trim() }); setEditName(false); }}>שמירה</button>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <span style={{ color: "var(--muted)" }}>שם</span>
              <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontWeight: 700 }}>{mgr.studioName}</span>
                <button onClick={() => { setNameDraft(mgr.studioName); setEditName(true); }} aria-label="עריכת שם" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2 }}><Pencil size={14} /></button>
              </span>
            </div>
          )}
          <Row k="שירותים פעילים" v={`${services.length || "—"}`} />
          <Row k="ערכת צבע" v="ויין · בלאש" />
        </div>
      </>)}

      <button className="bf-btn bf-btn-ghost" style={{ marginTop: 6, color: "#B23A48", borderColor: "#F0CBD0" }} onClick={mgr.logout}>
        <LogOut size={16} /> התנתקות
      </button>

      {editSvc && <ServiceEditor svc={editSvc} mgr={mgr} grads={GRADS} onClose={() => setEditSvc(null)} />}
      {editEmp && <EmployeeEditor emp={editEmp} mgr={mgr} onClose={() => setEditEmp(null)} />}
      {codeGate && <CodeGate target={codeGate.target} mgr={mgr} onClose={() => setCodeGate(null)} />}
      {lockEmp && (
        <Confirm
          title={`לנעול את המכשיר ל${lockEmp.name}?`}
          body="המכשיר יציג רק את תצוגת העובדת (יומן, גלריה ופרופיל). יציאה חזרה לניהול תדרוש את סיסמת המנהלת."
          confirmLabel="נעילה לתצוגת עובדת"
          onConfirm={() => mgr.lockToEmployee(lockEmp.id)}
          onClose={() => setLockEmp(null)}
        />
      )}
    </div>
  );
}

// Switching between editions requires a code we hand out (notes 51-54).
function CodeGate({ target, mgr, onClose }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(false);
  const needed = target ? "BusinessBeautify" : "PrivateBeautify";
  const submit = () => {
    if (code.trim() === needed) { mgr.setBusinessMode(target); onClose(); }
    else setErr(true);
  };
  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>{target ? "מעבר לגרסת עסק" : "חזרה לגרסה פרטית"}</h3>
      <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
        {target ? "הזיני את קוד ההפעלה לעסקים שקיבלת מאיתנו." : "הזיני את הקוד לחזרה לגרסה הפרטית."}
      </div>
      <input className="bf-input" value={code} onChange={(e) => { setCode(e.target.value); setErr(false); }} placeholder="קוד" onKeyDown={(e) => e.key === "Enter" && submit()} />
      {err && <div style={{ color: "#B23A48", fontSize: 12.5, marginTop: 8, fontWeight: 600 }}>קוד שגוי</div>}
      <button className="bf-btn bf-btn-primary" style={{ marginTop: 14 }} disabled={!code.trim()} onClick={submit}>אישור</button>
    </Sheet>
  );
}

function EmployeeEditor({ emp, mgr, onClose }) {
  const editing = !!emp.id;
  const [name, setName] = useState(emp.name || "");
  const [title, setTitle] = useState(emp.title || "");
  const [color, setColor] = useState(emp.color || "#D9738F");
  const [busy, setBusy] = useState(false);
  const colors = ["#D9738F", "#7C2A53", "#B4893E", "#5E1F40", "#9A4E72", "#C98AA6"];
  const ok = name.trim();

  const save = async () => {
    if (!ok) return;
    setBusy(true);
    if (editing) await mgr.updateEmployee(emp.id, { name, title, color });
    else await mgr.addEmployee({ name, title, color });
    setBusy(false); onClose();
  };

  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 14px", fontSize: 20 }}>{editing ? "עריכת עובדת" : "עובדת חדשה"}</h3>
      <div style={{ display: "grid", gap: 12 }}>
        <div><label className="bf-label">שם</label><input className="bf-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: מאיה" /></div>
        <div><label className="bf-label">תפקיד (לא חובה)</label><input className="bf-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="לדוגמה: מומחית לק ג'ל" /></div>
        <div>
          <label className="bf-label">צבע</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {colors.map((c) => (
              <button key={c} onClick={() => setColor(c)} aria-label="צבע" style={{ width: 38, height: 38, borderRadius: "50%", background: c, border: color === c ? "3px solid var(--ink)" : "2px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
        </div>
        <button className="bf-btn bf-btn-primary" disabled={!ok || busy} onClick={save}>{busy ? "שומרת…" : (editing ? "שמירה" : "הוספת עובדת")}</button>
      </div>
    </Sheet>
  );
}

function ServiceEditor({ svc, mgr, grads, onClose }) {
  const editing = !!svc.id;
  const [name, setName] = useState(svc.name || "");
  const [dur, setDur] = useState(svc.dur || 60);
  const [price, setPrice] = useState(svc.price || 100);
  const [grad, setGrad] = useState(svc.grad || grads[0]);
  const [img, setImg] = useState(svc.img || null);   // optional cover image (note 43)
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const ok = name.trim() && dur > 0 && price >= 0;

  const pickImage = async (file) => {
    setUploading(true);
    const url = await mgr.uploadServiceImage(file);
    setUploading(false);
    if (url) setImg(url);
  };

  const save = async () => {
    if (!ok) return;
    setBusy(true);
    const fields = { name, duration: dur, price, gradient: grad, image_url: img || null };
    if (editing) await mgr.updateService(svc.id, fields);
    else await mgr.addService(fields);
    setBusy(false); onClose();
  };

  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 14px", fontSize: 20 }}>{editing ? "עריכת שירות" : "שירות חדש"}</h3>
      <div style={{ display: "grid", gap: 12 }}>
        <div><label className="bf-label">שם השירות</label><input className="bf-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: לק ג'ל" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label className="bf-label">משך (דקות)</label><input className="bf-input" type="number" inputMode="numeric" value={dur} onChange={(e) => setDur(+e.target.value)} /></div>
          <div><label className="bf-label">מחיר (₪)</label><input className="bf-input" type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(+e.target.value)} /></div>
        </div>

        {/* Cover: an uploaded image, or a color if no image is chosen (note 43). */}
        <div>
          <label className="bf-label">תמונת השירות</label>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 56, height: 56, borderRadius: 13, background: serviceBg({ img, grad }), flex: "none", border: "1px solid var(--sand)" }} />
            <PhotoPicker onPick={pickImage} onTooBig={(mb) => mgr.ping(`הקובץ גדול מדי (${mb}MB)`)}>
              <button className="bf-btn bf-btn-soft bf-btn-sm"><ImageIcon size={15} /> {uploading ? "מעלה…" : img ? "החלפת תמונה" : "בחירת תמונה"}</button>
            </PhotoPicker>
            {img && <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => setImg(null)}>הסרה</button>}
          </div>
        </div>

        {!img && (
          <div>
            <label className="bf-label">צבע</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {grads.map((g) => (
                <button key={g} onClick={() => setGrad(g)} aria-label="צבע" style={{ width: 40, height: 40, borderRadius: 11, background: g, border: grad === g ? "3px solid var(--plum)" : "2px solid transparent", cursor: "pointer" }} />
              ))}
            </div>
          </div>
        )}

        <button className="bf-btn bf-btn-primary" disabled={!ok || busy} onClick={save}>{busy ? "שומרת…" : (editing ? "שמירה" : "הוספת שירות")}</button>
      </div>
    </Sheet>
  );
}
