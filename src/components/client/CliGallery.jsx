import React, { useState } from "react";
import { Camera, X, RefreshCw } from "lucide-react";
import { GalleryTile, Lightbox, PhotoPicker, Sheet, Empty } from "../ui";

const STATUS = {
  pending:  { label: "ממתין לאישור", cls: "bf-chip-wait" },
  approved: { label: "אושר ✓", cls: "bf-chip-ok" },
  rejected: { label: "נדחה", cls: "bf-chip-rose" },
};

export default function CliGallery({ cli }) {
  const [seg, setSeg] = useState("all");
  const [view, setView] = useState(null);
  const [picked, setPicked] = useState(null);
  const [cap, setCap] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const doUpload = async () => {
    setBusy(true);
    await cli.uploadPhoto(picked, cap);
    setBusy(false); setPicked(null); setCap("");
  };
  const doRefresh = async () => { setRefreshing(true); await cli.refresh(); setRefreshing(false); };

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {cli.gallery.map((g) => <GalleryTile key={g.id} item={g} onLike={cli.toggleLike} onOpen={setView} />)}
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
            ? <video src={URL.createObjectURL(picked)} controls playsInline style={{ width: "100%", height: 170, objectFit: "cover", borderRadius: 16, marginBottom: 14, background: "#000" }} />
            : <div style={{ height: 170, borderRadius: 16, background: `url(${URL.createObjectURL(picked)}) center/cover`, marginBottom: 14 }} />}
          <label className="bf-label">תיאור קצר</label>
          <input className="bf-input" placeholder="לדוגמה: אומברה ורוד" value={cap} onChange={(e) => setCap(e.target.value)} />
          <button className="bf-btn bf-btn-primary" style={{ marginTop: 14 }} disabled={busy} onClick={doUpload}>
            {busy ? "מעלה…" : "שליחה לאישור"}
          </button>
        </Sheet>
      )}
    </div>
  );
}
