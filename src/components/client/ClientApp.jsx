import React, { useState, useEffect } from "react";
import { Plus, CalendarDays, Image as ImageIcon, User } from "lucide-react";
import { NavBar } from "../ui";
import { getSeen, setSeen } from "../../lib/seen";
import ClientAuth from "./ClientAuth";
import CliBook from "./CliBook";
import CliMine from "./CliMine";
import CliGallery from "./CliGallery";
import CliProfile from "./CliProfile";

export default function ClientApp({ cli }) {
  const [tab, setTab] = useState("book");

  // Gallery badge (note A): how many studio photos are new since she last
  // looked. NOTE: must run before any early return (Rules of Hooks).
  const sid = cli.studio?.id;
  const galleryCount = (cli.gallery || []).length;
  const newPhotos = Math.max(0, galleryCount - getSeen(sid, "cli-gallery"));
  useEffect(() => { if (tab === "gallery") setSeen(sid, "cli-gallery", galleryCount); }, [tab, galleryCount, sid]);

  // "!" on the gallery tab when one of her uploads was just approved/rejected
  // (note 20). The transient banner + clearing live in CliGallery.
  const apprCount = (cli.uploads || []).filter((u) => u.status === "approved").length;
  const rejCount = (cli.uploads || []).filter((u) => u.status === "rejected").length;
  const newResolved = Math.max(0, apprCount - getSeen(sid, "cli-appr")) + Math.max(0, rejCount - getSeen(sid, "cli-rej"));
  const galleryBadge = newResolved > 0 ? "!" : newPhotos;

  // Wait for the studio before showing anything that needs it (auth + booking).
  if (!cli.studio) return (
    <div className="bf-screen" style={{ display: "grid", placeItems: "center", padding: 40 }}>
      <div style={{ color: "var(--muted)", fontSize: 14 }}>טוען…</div>
    </div>
  );

  if (!cli.client) return <ClientAuth cli={cli} />;

  const me = cli.client;
  // Reschedule requests already show as a move/cancel card, so don't also count
  // their notification (note 23).
  const unread = (cli.notifications || []).filter((n) => !n.read && n.type !== "reschedule").length
    + (cli.appts || []).filter((a) => a.status === "reschedule_requested").length;
  const titles = {
    book:    ["קביעת תור", cli.studioName],
    mine:    ["התורים שלי", me.name],
    gallery: ["הגלריה", "עבודות הסטודיו"],
    profile: ["הפרופיל שלי", me.name],
  };
  const t = titles[tab];

  return (
    <>
      <div className="bf-appbar">
        <h1 className="bf-display">{t[0]}</h1>
        <div className="sub">{t[1]}</div>
      </div>
      <div className="bf-screen">
        {tab === "book"    && <CliBook cli={cli} />}
        {tab === "mine"    && <CliMine cli={cli} />}
        {tab === "gallery" && <CliGallery cli={cli} />}
        {tab === "profile" && <CliProfile cli={cli} />}
      </div>
      <NavBar tab={tab} setTab={setTab} items={[
        ["book", Plus, "תור חדש"], ["mine", CalendarDays, "התורים שלי", unread],
        ["gallery", ImageIcon, "גלריה", galleryBadge], ["profile", User, "פרופיל"],
      ]} />
    </>
  );
}
