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
  // Selected cosmetician, shared between Home and Calendar (V6). null = owner.
  const [cosmId, setCosmId] = useState(mgr.lockedEmployeeId || null);

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
  // Employee: "!" on her calendar when a new appointment is booked for her (note 54).
  const lockedId = mgr.lockedEmployeeId;
  const empApptCount = (mgr.appts || []).filter((a) => (a.employeeId ?? null) === lockedId).length;
  const newEmpAppt = !!lockedId && empApptCount > getSeen(sid, "emp-appts");
  useEffect(() => { if (lockedId && tab === "cal") setSeen(sid, "emp-appts", empApptCount); }, [lockedId, tab, empApptCount, sid]);
  // Employee gallery "!" only when one of her photos was approved (notes 59-60).
  // The banner + seen-clearing live in MgrGallery.
  const empApprCount = (mgr.gallery || []).filter((g) => g.employeeId === lockedId).length;
  const newEmpAppr = !!lockedId && empApprCount > getSeen(sid, "emp-gal-appr");

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

  // Calendar badge: manager → pending employee schedule requests (note 34);
  // employee → her unread schedule-approval notifications (notes 50, 54).
  const schedReqCount = (mgr.scheduleReqs || []).length;
  const empSchedUnread = (mgr.employeeNotifications || []).filter((n) => !n.read && (n.type === "approved" || n.type === "declined")).length;
  // Employee sees a "!" (not a number) for new appointments / approved requests;
  // manager sees the pending-requests count (notes 54, 55).
  // V6: nav icons show only "!" — never number badges — on both sides.
  const calBadge = locked
    ? ((empSchedUnread > 0 || newEmpAppt) ? "!" : 0)
    : ((newAppts || schedReqCount > 0) ? "!" : 0);
  const galBadgeEmp = newEmpAppr ? "!" : 0;   // employee gallery badge (note 59)

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
        {safeTab === "home"     && <MgrHome mgr={mgr} go={setTab} cosmId={cosmId} setCosmId={setCosmId} />}
        {safeTab === "cal"      && <MgrCalendar mgr={mgr} cosmId={cosmId} setCosmId={setCosmId} />}
        {safeTab === "clients"  && !locked && <MgrClients mgr={mgr} />}
        {safeTab === "gallery"  && <MgrGallery mgr={mgr} />}
        {safeTab === "settings" && !locked && <MgrSettings mgr={mgr} />}
        {safeTab === "profile"  && <EmployeeProfile mgr={mgr} />}
      </div>
      <NavBar tab={safeTab} setTab={setTab} items={locked ? [
        ["home", Home, "בית"], ["cal", CalendarDays, "יומן", calBadge],
        ["gallery", ImageIcon, "גלריה", galBadgeEmp], ["profile", User, "פרופיל"],
      ] : [
        ["home", Home, "בית"], ["cal", CalendarDays, "יומן", calBadge],
        ["clients", Users, "לקוחות", newClients > 0 ? "!" : 0],
        ["gallery", ImageIcon, "גלריה", mgr.pending.length > 0 ? "!" : 0], ["settings", Settings, "הגדרות", pendingStanding > 0 ? "!" : 0],
      ]} />
    </>
  );
}
