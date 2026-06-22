import React, { useState } from "react";
import { Home, CalendarDays, Users, Image as ImageIcon, Settings } from "lucide-react";
import { NavBar } from "../ui";
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
        ["home", Home, "בית"], ["cal", CalendarDays, "יומן"], ["clients", Users, "לקוחות"],
        ["gallery", ImageIcon, "גלריה", mgr.pending.length], ["settings", Settings, "הגדרות"],
      ]} />
    </>
  );
}
