import React, { useState, useEffect } from "react";
import { Home, CalendarDays, Users, Image as ImageIcon, Settings } from "lucide-react";
import { NavBar } from "../ui";
import { getSeen, setSeen } from "../../lib/seen";
import ManagerLogin from "./ManagerLogin";
import MgrHome from "./MgrHome";
import MgrCalendar from "./MgrCalendar";
import MgrClients from "./MgrClients";
import MgrGallery from "./MgrGallery";
import MgrSettings from "./MgrSettings";

export default function ManagerApp({ mgr, ping }) {
  const [tab, setTab] = useState("home");

  if (!mgr.user) return <ManagerLogin onLogin={mgr.login} />;

  // Wait for the studio to load before rendering tabs — on a refresh the saved
  // session restores before the studio bundle, and the tabs need mgr.studio.
  if (!mgr.studio) return (
    <div className="bf-screen" style={{ display: "grid", placeItems: "center", padding: 40 }}>
      <div style={{ color: "var(--muted)", fontSize: 14 }}>טוען…</div>
    </div>
  );

  const sid = mgr.studio?.id;
  // Badges (V5): a "!" when new appointments came in, a count of new client
  // signups, the pending photo count, and pending standing-slot requests.
  const apptCount = (mgr.appts || []).length;
  const clientCount = (mgr.clients || []).length;
  const newAppts = apptCount > getSeen(sid, "mgr-appts");
  const newClients = Math.max(0, clientCount - getSeen(sid, "mgr-clients"));
  const pendingStanding = (mgr.standing || []).filter((s) => s.status === "pending").length;
  useEffect(() => { if (tab === "cal") setSeen(sid, "mgr-appts", apptCount); }, [tab, apptCount, sid]);
  useEffect(() => { if (tab === "clients") setSeen(sid, "mgr-clients", clientCount); }, [tab, clientCount, sid]);

  const titles = {
    home:     [`בוקר טוב, ${mgr.studioName}`, "הנה היום שלך"],
    cal:      ["יומן תורים", "ניהול הלו\"ז שלך"],
    clients:  ["הלקוחות שלך", `${mgr.clients.length} לקוחות רשומות`],
    gallery:  ["הגלריה שלך", "תיק העבודות שלך"],
    settings: ["הגדרות", "אוטומציות והעדפות"],
  };
  const t = titles[tab];

  return (
    <>
      <div className="bf-appbar">
        <h1 className="bf-display">{t[0]}</h1>
        <div className="sub">{t[1]}</div>
      </div>
      <div className="bf-screen">
        {tab === "home"     && <MgrHome mgr={mgr} go={setTab} />}
        {tab === "cal"      && <MgrCalendar mgr={mgr} />}
        {tab === "clients"  && <MgrClients mgr={mgr} />}
        {tab === "gallery"  && <MgrGallery mgr={mgr} />}
        {tab === "settings" && <MgrSettings mgr={mgr} />}
      </div>
      <NavBar tab={tab} setTab={setTab} items={[
        ["home", Home, "בית"], ["cal", CalendarDays, "יומן", newAppts ? "!" : 0],
        ["clients", Users, "לקוחות", newClients],
        ["gallery", ImageIcon, "גלריה", mgr.pending.length], ["settings", Settings, "הגדרות", pendingStanding],
      ]} />
    </>
  );
}
