import React, { useState } from "react";
import { Camera } from "lucide-react";
import { GalleryTile, Sheet } from "../ui";

export default function CliGallery({ gallery, addPending, likePhoto, ping, clients, ME }) {
  const me = clients.find((c) => c.id === ME);
  const [add, setAdd] = useState(false);
  const [cap, setCap] = useState("");

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div className="bf-card" style={{ padding: 13, display: "flex", gap: 11, alignItems: "center", background: "linear-gradient(135deg,#fff,#FDF3F6)" }}>
        <Camera size={20} color="var(--plum)" />
        <div style={{ flex: 1, fontSize: 13.5 }}><b>אהבת את התוצאה?</b> שתפי תמונה — תופיע בגלריה אחרי אישור הסטודיו.</div>
        <button className="bf-btn bf-btn-soft bf-btn-sm" onClick={() => setAdd(true)}>שיתוף</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {gallery.map((g) => <GalleryTile key={g.id} item={g} onLike={() => likePhoto(g.id)} />)}
      </div>

      {add && (
        <Sheet onClose={() => setAdd(false)}>
          <h3 className="bf-display" style={{ margin: "0 0 12px", fontSize: 20 }}>שיתוף תמונה</h3>
          <div style={{ height: 150, borderRadius: 16, background: "linear-gradient(135deg,#F4C9D4,#D9738F)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, color: "#fff" }}>
            <Camera size={34} />
          </div>
          <label className="bf-label">תיאור קצר</label>
          <input className="bf-input" placeholder="לדוגמה: אומברה ורוד" value={cap} onChange={(e) => setCap(e.target.value)} />
          <button className="bf-btn bf-btn-primary" style={{ marginTop: 14 }} onClick={() => { addPending(cap || "העבודה שלי", me.name); ping("נשלח לאישור הסטודיו 🤍"); setAdd(false); setCap(""); }}>
            שליחה לאישור
          </button>
        </Sheet>
      )}
    </div>
  );
}
