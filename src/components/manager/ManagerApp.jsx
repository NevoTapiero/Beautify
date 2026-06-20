import React, { useState } from "react";
import { Home, CalendarDays, Users, Image as ImageIcon, Settings } from "lucide-react";
import { NavBar } from "../ui";
import ManagerLogin from "./ManagerLogin";
import MgrHome from "./MgrHome";
import MgrCalendar from "./MgrCalendar";
import MgrClients from "./MgrClients";
import MgrGallery from "./MgrGallery";
import MgrSettings from "./MgrSettings";

export default function ManagerApp(props) {
  const { clients, appts, cancelAppt, gallery, pending, approvePhoto, rejectPhoto, ping, managerUser, handleManagerLogin, handleManagerLogout, studioName, refreshManagerAppts } = props;
  const [tab, setTab] = useState("home");

  if (!managerUser) return <ManagerLogin onLogin={handleManagerLogin} />;

  const titles = {
    home:     [`בוקר טוב, ${studioName}`, "הנה היום שלך"],
    cal:      ["יומן תורים", "ניהול הלו\"ז שלך"],
    clients:  ["הלקוחות שלך", `${clients.length} לקוחות רשומות`],
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
        {tab === "home"     && <MgrHome {...props} go={setTab} refreshManagerAppts={refreshManagerAppts} />}
        {tab === "cal"      && <MgrCalendar appts={appts} clients={clients} cancelAppt={cancelAppt} ping={ping} />}
        {tab === "clients"  && <MgrClients {...props} />}
        {tab === "gallery"  && <MgrGallery gallery={gallery} pending={pending} approvePhoto={approvePhoto} rejectPhoto={rejectPhoto} ping={ping} />}
        {tab === "settings" && <MgrSettings ping={ping} onLogout={handleManagerLogout} />}
      </div>
      <NavBar tab={tab} setTab={setTab} items={[
        ["home", Home, "בית"], ["cal", CalendarDays, "יומן"], ["clients", Users, "לקוחות"],
        ["gallery", ImageIcon, "גלריה"], ["settings", Settings, "הגדרות"],
      ]} />
    </>
  );
}
