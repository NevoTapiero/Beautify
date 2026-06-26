import React, { useState, useEffect } from "react";
import { Home, CalendarDays, Users, Image as ImageIcon, Settings, User } from "lucide-react";
import { NavBar } from "../ui";
import { getSeen, setSeen } from "../../lib/seen";
import ManagerLogin from "./ManagerLogin";
import MgrHome from "./MgrHome";
import MgrCalendar from "./MgrCalendar";
import MgrClients from "./MgrClients";
import MgrGallery from "./MgrGallery";
import MgrSettings from "./MgrSettings";
import EmployeeProfile from "./EmployeeProfile";

export default function ManagerApp({ mgr, ping }) {
  const [tab, setTab] = useState("home");

  // Badges (V5): a "!" when new appointments came in, a count of new client
  // signups, the pending photo count, and pending standing-slot requests.
  // NOTE: these hooks must run before any early return (Rules of Hooks).
  const sid = mgr.studio?.id;
  const apptCount = (mgr.appts || []).length;
  const clientCount = (mgr.clients || []).length;
  const newAppts = apptCount > getSeen(sid, "mgr-appts");
  const newClients = Math.max(0, clientCount - getSeen(sid, "mgr-clients"));
  const pendingStanding = (mgr.standing || []).filter((s) => s.status === "pending").length;
  useEffect(() => { if (tab === "cal") setSeen(sid, "mgr-appts", apptCount); }, [tab, apptCount, sid]);
  useEffect(() => { if (tab === "clients") setSeen(sid, "mgr-clients", clientCount); }, [tab, clientCount, sid]);

  if (!mgr.user) return <ManagerLogin onLogin={mgr.login} />;

  // Wait for the studio to load before rendering tabs — on a refresh the saved
  // session restores before the studio bundle, and the tabs need mgr.studio.
  if (!mgr.studio) return (
    <div className="bf-screen" style={{ display: "grid", placeItems: "center", padding: 40 }}>
      <div style={{ color: "var(--muted)", fontSize: 14 }}>טוען…</div>
    </div>
  );

  // Employee-app mode (Phase 3): restricted view locked to one employee.
  const locked = !!mgr.lockedEmployeeId;
  const empName = mgr.lockedEmployee?.name || "עובדת";
  const safeTab = locked && (tab === "clients" || tab === "settings") ? "home" : tab;

  const titles = {
    home:     locked ? [`שלום, ${empName}`, "הלו\"ז שלך"] : [`בוקר טוב, ${mgr.studioName}`, "הנה היום שלך"],
    cal:      ["יומן תורים", locked ? "הלו\"ז שלך ושל הצוות" : "ניהול הלו\"ז שלך"],
    clients:  ["הלקוחות שלך", `${mgr.clients.length} לקוחות רשומות`],
    gallery:  ["הגלריה", locked ? "עבודות הסטודיו" : "תיק העבודות שלך"],
    settings: ["הגדרות", "אוטומציות והעדפות"],
    profile:  ["הפרופיל שלי", empName],
  };
  const t = titles[safeTab];

  return (
    <>
      <div className="bf-appbar">
        <h1 className="bf-display">{t[0]}</h1>
        <div className="sub">{t[1]}</div>
      </div>
      <div className="bf-screen">
        {safeTab === "home"     && <MgrHome mgr={mgr} go={setTab} />}
        {safeTab === "cal"      && <MgrCalendar mgr={mgr} />}
        {safeTab === "clients"  && !locked && <MgrClients mgr={mgr} />}
        {safeTab === "gallery"  && <MgrGallery mgr={mgr} />}
        {safeTab === "settings" && !locked && <MgrSettings mgr={mgr} />}
        {safeTab === "profile"  && <EmployeeProfile mgr={mgr} />}
      </div>
      <NavBar tab={safeTab} setTab={setTab} items={locked ? [
        ["home", Home, "בית"], ["cal", CalendarDays, "יומן"],
        ["gallery", ImageIcon, "גלריה"], ["profile", User, "פרופיל"],
      ] : [
        ["home", Home, "בית"], ["cal", CalendarDays, "יומן", newAppts ? "!" : 0],
        ["clients", Users, "לקוחות", newClients],
        ["gallery", ImageIcon, "גלריה", mgr.pending.length], ["settings", Settings, "הגדרות", pendingStanding],
      ]} />
    </>
  );
}
