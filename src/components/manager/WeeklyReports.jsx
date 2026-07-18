import React, { useState, useEffect } from "react";
import { Download, Trash2, FileText, RefreshCw, X } from "lucide-react";
import { Sheet, Confirm, Empty, cosmeticians } from "../ui";

// Sunday 00:00 of the week containing d (Israel week starts Sunday).
const startOfWeek = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x; };
const pad = (n) => String(n).padStart(2, "0");
const fmtDMY = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const fmtDM = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
const DOW_FULL = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const STATUS = { completed: "בוצע", no_show: "לא הגיעה", confirmed: "תואם", reschedule_requested: "בהזזה" };

// Print an HTML report via a hidden iframe — works in a normal tab AND inside an
// installed (standalone) PWA, where window.open popups are often blocked. The
// browser's print dialog then offers "Save as PDF" / share-to-Files.
function printReport(html) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed; inset-inline-end:0; bottom:0; width:0; height:0; border:0; opacity:0;";
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  const cleanup = () => setTimeout(() => iframe.remove(), 800);
  iframe.contentWindow.onafterprint = cleanup;
  setTimeout(() => { try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch { /* ignore */ } cleanup(); }, 350);
}

export function buildReportHTML({ studioName, rangeLabel, scopeLabel, rows }) {
  const money = rows.reduce((s, r) => s + (r.paid ? (r.price || 0) : 0), 0);
  const body = rows.length
    ? rows.map((r) => `<tr>
        <td>${esc(r.dateLabel)}</td><td>${esc(r.time)}</td><td>${esc(r.client)}</td>
        <td>${esc(r.service)}</td><td>${esc(r.worker)}</td>
        <td>${r.price != null ? "₪" + r.price : "—"}</td>
        <td>${r.paid ? "שולם" : "לא שולם"}</td><td>${esc(STATUS[r.status] || r.status || "")}</td>
      </tr>`).join("")
    : `<tr><td colspan="8" style="text-align:center; color:#888; padding:24px">אין תורים בשבוע זה</td></tr>`;
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8" />
    <title>דוח תורים ${esc(rangeLabel)}</title>
    <style>
      *{ box-sizing:border-box; } body{ font-family:'Assistant',Arial,sans-serif; color:#2A1A2E; margin:28px; }
      h1{ font-size:22px; margin:0 0 2px; } .sub{ color:#6E5A69; font-size:13px; margin-bottom:2px; }
      table{ width:100%; border-collapse:collapse; margin-top:16px; font-size:12.5px; }
      th,td{ border:1px solid #E0D2E6; padding:7px 9px; text-align:right; }
      th{ background:#F6F1F8; font-weight:700; }
      tr:nth-child(even) td{ background:#FBF7FB; }
      .tot{ margin-top:14px; font-size:13.5px; font-weight:700; }
      @media print{ body{ margin:12px; } }
    </style></head><body>
    <h1>${esc(studioName)}</h1>
    <div class="sub">דוח תורים · ${esc(rangeLabel)}</div>
    <div class="sub">${esc(scopeLabel)}</div>
    <table><thead><tr>
      <th>תאריך</th><th>שעה</th><th>לקוחה</th><th>שירות</th><th>קוסמטיקאית</th><th>מחיר</th><th>תשלום</th><th>סטטוס</th>
    </tr></thead><tbody>${body}</tbody></table>
    <div class="tot">סה"כ תורים: ${rows.length} · סה"כ שולם: ₪${money}</div>
    </body></html>`;
}

export default function WeeklyReports({ mgr }) {
  const [weeks, setWeeks] = useState(null);   // null = loading
  const [dl, setDl] = useState(null);         // week pending a download-scope choice
  const [del, setDel] = useState(null);       // week pending delete-confirmation
  const [busy, setBusy] = useState(false);

  const cosmList = cosmeticians(mgr.ownerName, mgr.employees);
  const multiCosm = mgr.business && cosmList.length > 1;

  const load = async () => {
    setWeeks(null);
    const appts = await mgr.loadAppointmentHistory();
    const byWeek = new Map();
    for (const a of (appts || [])) {
      const ws = startOfWeek(new Date(a.starts_at));
      const key = ws.getTime();
      if (!byWeek.has(key)) byWeek.set(key, { start: ws, appts: [] });
      byWeek.get(key).appts.push(a);
    }
    // newest week first
    setWeeks([...byWeek.values()].sort((x, y) => y.start - x.start));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const cosmName = (a) => a.employeeName || mgr.ownerName;

  const download = (week, scope) => {
    // scope: "all" | "owner" | employeeId
    const filtered = week.appts.filter((a) =>
      scope === "all" ? true : scope === "owner" ? !a.employeeId : a.employeeId === scope
    );
    const rows = filtered
      .slice().sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
      .map((a) => {
        const d = new Date(a.starts_at);
        return {
          dateLabel: `${DOW_FULL[d.getDay()]} ${fmtDMY(d)}`, time: a.time,
          client: a.clientName || "—", service: a.serviceName || "—",
          worker: cosmName(a), price: a.servicePrice, paid: a.paid, status: a.status,
        };
      });
    const end = new Date(week.start); end.setDate(end.getDate() + 6);
    const scopeLabel = scope === "all" ? "כל הצוות"
      : "קוסמטיקאית: " + (scope === "owner" ? mgr.ownerName : (cosmList.find((c) => c.id === scope)?.name || "—"));
    printReport(buildReportHTML({
      studioName: mgr.studioName, rangeLabel: `${fmtDM(week.start)}–${fmtDMY(end)}`,
      scopeLabel, rows,
    }));
    setDl(null);
  };

  const confirmDelete = async () => {
    if (!del || busy) return;
    setBusy(true);
    const end = new Date(del.start); end.setDate(end.getDate() + 7);
    const ok = await mgr.deleteWeekAppointments(del.start.toISOString(), end.toISOString());
    setBusy(false);
    setDel(null);
    if (ok) await load();
  };

  const weekLabel = (w) => { const e = new Date(w.start); e.setDate(e.getDate() + 6); return `${fmtDM(w.start)}–${fmtDMY(e)}`; };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, padding: "0 2px" }}>
        בסוף כל שבוע נוסף כאן דוח שאפשר להוריד כ-PDF (לכל הצוות או לפי קוסמטיקאית). מחיקת שורה מוחקת לצמיתות את כל התורים של אותו שבוע.
      </div>

      {weeks === null && <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: "10px 0" }}>טוען…</div>}
      {weeks && weeks.length === 0 && <Empty>עדיין אין שבועות שהסתיימו. הדוח הראשון יופיע בתחילת השבוע הבא 🤍</Empty>}

      {weeks && weeks.map((w) => (
        <div key={w.start.getTime()} className="bf-card" style={{ padding: 11, display: "flex", alignItems: "center", gap: 10 }}>
          <FileText size={17} color="var(--plum)" style={{ flex: "none" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>שבוע {weekLabel(w)}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{w.appts.length} תורים</div>
          </div>
          <button aria-label="הורדת דוח" className="bf-btn bf-btn-soft bf-btn-sm" style={{ width: "auto" }}
            onClick={() => (multiCosm ? setDl(w) : download(w, "all"))}>
            <Download size={15} /> PDF
          </button>
          <button aria-label="מחיקת השבוע" onClick={() => setDel(w)} style={{ background: "none", border: "none", cursor: "pointer", color: "#B23A48", padding: 4, flex: "none" }}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {dl && (
        <Sheet onClose={() => setDl(null)}>
          <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>הורדת דוח · שבוע {weekLabel(dl)}</h3>
          <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>בחרי איזה דוח להוריד:</div>
          <div style={{ display: "grid", gap: 9 }}>
            <button className="bf-btn bf-btn-primary" onClick={() => download(dl, "all")}><Download size={16} /> כל הצוות</button>
            {cosmList.map((c) => (
              <button key={c.id} className="bf-btn bf-btn-ghost" onClick={() => download(dl, c.owner ? "owner" : c.id)}>
                {c.name}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {del && (
        <Confirm
          title={`למחוק את שבוע ${weekLabel(del)}?`}
          body={`כל ${del.appts.length} התורים של השבוע יימחקו לצמיתות ולא ניתן יהיה לשחזר אותם. מומלץ להוריד קודם את הדוח.`}
          confirmLabel={busy ? "מוחקת…" : "כן, מחקי את השבוע"} danger
          onConfirm={confirmDelete}
          onClose={() => setDel(null)}
        />
      )}
    </div>
  );
}
