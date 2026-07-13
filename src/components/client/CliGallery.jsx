import React, { useState, useEffect, useMemo } from "react";
import { Camera, X, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { GalleryTile, Lightbox, PhotoPicker, Sheet, Empty, GallerySort, sortGallery, cosmeticians } from "../ui";
import { getSeen, setSeen } from "../../lib/seen";

const STATUS = {
  pending:  { label: "ממתין לאישור", cls: "bf-chip-wait" },
  approved: { label: "אושר ✓", cls: "bf-chip-ok" },
  rejected: { label: "נדחה", cls: "bf-chip-rose" },
};

export default function CliGallery({ cli }) {
  const [seg, setSeg] = useState("all");
  const [sort, setSort] = useState("new");
  const [view, setView] = useState(null);
  const [picked, setPicked] = useState(null);
  const [cap, setCap] = useState("");
  const [pickedEmp, setPickedEmp] = useState(null);   // chosen cosmetician for the upload
  const [cosm, setCosm] = useState("all");            // gallery filter by cosmetician
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cosmList = cosmeticians(cli.ownerName, cli.employees);
  const showCosm = cli.business && cosmList.length > 1;
  const shown = (list) => cosm === "all" ? list : list.filter((g) => (g.employeeId || "owner") === cosm);

  // One-time banner when her uploads were just approved/rejected (note 20).
  // Captured on entry, then marked seen so it clears when she leaves the screen.
  const sid = cli.studio?.id;
  const apprCount = (cli.uploads || []).filter((u) => u.status === "approved").length;
  const rejCount = (cli.uploads || []).filter((u) => u.status === "rejected").length;
  const [banner] = useState(() => ({
    appr: Math.max(0, apprCount - getSeen(sid, "cli-appr")),
    rej: Math.max(0, rejCount - getSeen(sid, "cli-rej")),
  }));
  useEffect(() => { setSeen(sid, "cli-appr", apprCount); setSeen(sid, "cli-rej", rejCount); }, [sid, apprCount, rejCount]);

  // One object URL per picked file (not one per caption keystroke) — otherwise
  // the preview video restarts on every render and the URLs leak.
  const preview = useMemo(() => (picked ? URL.createObjectURL(picked) : null), [picked]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const doUpload = async () => {
    setBusy(true);
    try {
      await cli.uploadPhoto(picked, cap, pickedEmp === "owner" ? null : pickedEmp);
      setPicked(null); setCap(""); setPickedEmp(null);
    } finally {
      setBusy(false);
    }
  };
  const doRefresh = async () => { setRefreshing(true); await cli.refresh(); setRefreshing(false); };

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      {banner.appr > 0 && (
        <div className="bf-card" style={{ padding: "11px 13px", display: "flex", alignItems: "center", gap: 9, background: "#E7F3EC", border: "1px solid #BFE3CC" }}>
          <CheckCircle2 size={18} color="#2E7D52" />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#256B45" }}>{banner.appr > 1 ? `${banner.appr} מהתמונות שלך אושרו ונוספו לגלריה 🤍` : "התמונה שלך אושרה ונוספה לגלריה 🤍"}</div>
        </div>
      )}
      {banner.rej > 0 && (
        <div className="bf-card" style={{ padding: "11px 13px", display: "flex", alignItems: "center", gap: 9, background: "#FBEDEF", border: "1px solid #F0CBD0" }}>
          <XCircle size={18} color="#B23A48" />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#B23A48" }}>{banner.rej > 1 ? `${banner.rej} מהתמונות שלך לא אושרו` : "התמונה שלך לא אושרה"}</div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="bf-seg" style={{ flex: 1 }}>
          <button className={seg === "all" ? "active" : ""} onClick={() => setSeg("all")}>הגלריה ({cli.gallery.length})</button>
          <button className={seg === "mine" ? "active" : ""} onClick={() => setSeg("mine")}>השיתופים שלי ({cli.uploads.length})</button>
        </div>
        <button onClick={doRefresh} disabled={refreshing} aria-label="רענון" style={{ background: "none", border: "1px solid var(--sand)", borderRadius: 12, padding: 9, cursor: "pointer", color: "var(--plum)" }}>
          <RefreshCw size={16} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {seg === "all" && (<>
        <div className="bf-card" style={{ padding: 13, display: "flex", gap: 11, alignItems: "center", background: "linear-gradient(135deg,#fff,#FDF3F6)" }}>
          <Camera size={20} color="var(--plum)" />
          <div style={{ flex: 1, fontSize: 13.5 }}><b>אהבת את התוצאה?</b> שתפי תמונה — תופיע בגלריה אחרי אישור הסטודיו.</div>
          <PhotoPicker accept="image/*,video/*" onPick={(f) => { setPicked(f); setCap(""); }}
            onTooBig={(mb) => cli.ping(`הקובץ גדול מדי (${mb}MB). המקסימום 50MB — נסי סרטון קצר יותר.`)}>
            <button className="bf-btn bf-btn-soft bf-btn-sm">שיתוף</button>
          </PhotoPicker>
        </div>
        {cli.gallery.length === 0 && <Empty>עדיין אין תמונות בגלריה 🤍</Empty>}
        {cli.gallery.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>סינון:</span>
            <GallerySort value={sort} onChange={setSort} />
          </div>
        )}
        {showCosm && (
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <button onClick={() => setCosm("all")} className={"bf-chip " + (cosm === "all" ? "bf-chip-rose" : "bf-chip-wait")} style={{ cursor: "pointer", border: "none" }}>הכל</button>
            {cosmList.map((c) => (
              <button key={c.id} onClick={() => setCosm(c.id)} className={"bf-chip " + (cosm === c.id ? "bf-chip-rose" : "bf-chip-wait")} style={{ cursor: "pointer", border: "none" }}>{c.name}</button>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {sortGallery(shown(cli.gallery), sort).map((g) => <GalleryTile key={g.id} item={g} onLike={cli.toggleLike} onOpen={setView} />)}
        </div>
      </>)}

      {seg === "mine" && (<>
        {cli.uploads.length === 0 && <Empty>עדיין לא שיתפת תמונות</Empty>}
        <div style={{ display: "grid", gap: 10 }}>
          {cli.uploads.map((u) => {
            const st = STATUS[u.status] || STATUS.pending;
            return (
              <div key={u.id} className="bf-card" style={{ padding: 11, display: "flex", alignItems: "center", gap: 11 }}>
                <div onClick={() => setView(u)} style={{ width: 54, height: 54, borderRadius: 12, background: u.img ? `url(${u.img}) center/cover` : "var(--rose-soft)", flex: "none", cursor: "pointer" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{u.cap}</div>
                  <span className={"bf-chip " + st.cls} style={{ marginTop: 4 }}>{st.label}</span>
                </div>
                {u.status === "pending" && (
                  <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => cli.cancelUpload(u.id)}><X size={15} /> ביטול</button>
                )}
              </div>
            );
          })}
        </div>
      </>)}

      {view && <Lightbox item={view} onClose={() => setView(null)} />}

      {picked && (
        <Sheet onClose={() => setPicked(null)}>
          <h3 className="bf-display" style={{ margin: "0 0 12px", fontSize: 20 }}>שיתוף תמונה או סרטון</h3>
          {picked.type?.startsWith("video")
            ? <video src={preview} controls playsInline style={{ width: "100%", height: 170, objectFit: "cover", borderRadius: 16, marginBottom: 14, background: "#000" }} />
            : <div style={{ height: 170, borderRadius: 16, background: `url(${preview}) center/cover`, marginBottom: 14 }} />}
          <label className="bf-label">תיאור קצר</label>
          <input className="bf-input" placeholder="לדוגמה: אומברה ורוד" value={cap} onChange={(e) => setCap(e.target.value)} />
          {showCosm && (<>
            <label className="bf-label" style={{ marginTop: 12 }}>מי ביצעה את הטיפול?</label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {cosmList.map((c) => (
                <button key={c.id} onClick={() => setPickedEmp(c.id)} className={"bf-slot" + (pickedEmp === c.id ? " active" : "")} style={{ flex: "1 0 30%" }}>{c.name}</button>
              ))}
            </div>
          </>)}
          <button className="bf-btn bf-btn-primary" style={{ marginTop: 14 }} disabled={busy || (showCosm && !pickedEmp)} onClick={doUpload}>
            {busy ? "מעלה…" : "שליחה לאישור"}
          </button>
        </Sheet>
      )}
    </div>
  );
}
