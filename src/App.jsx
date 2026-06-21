import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";

import STYLE from "./styles";
import { setServiceIndex } from "./lib/services";
import * as api from "./lib/api";

import ManagerApp from "./components/manager/ManagerApp";
import ClientApp from "./components/client/ClientApp";

export default function App() {
  const [role, setRole] = useState("manager");
  const [studio, setStudio] = useState(null);
  const [services, setServices] = useState([]);

  // Toast
  const [toast, setToast] = useState(null);
  const ping = useCallback((msg) => {
    setToast(msg);
    window.clearTimeout(window.__bft);
    window.__bft = window.setTimeout(() => setToast(null), 2400);
  }, []);

  // ─── Manager state ───────────────────────────────────────────────
  const [managerUser, setManagerUser] = useState(null);
  const [mgrAppts, setMgrAppts] = useState([]);
  const [mgrClients, setMgrClients] = useState([]);
  const [mgrGallery, setMgrGallery] = useState([]);
  const [mgrPending, setMgrPending] = useState([]);
  const [mgrBreaks, setMgrBreaks] = useState([]);

  // ─── Client state ────────────────────────────────────────────────
  const [client, setClient] = useState(null);
  const [cliAppts, setCliAppts] = useState([]);
  const [cliGallery, setCliGallery] = useState([]);
  const [cliUploads, setCliUploads] = useState([]);
  const [cliNotifs, setCliNotifs] = useState([]);
  const [cliBreaks, setCliBreaks] = useState([]);

  // ─── Initial load: studio, then restore any existing sessions ─────
  useEffect(() => {
    api.loadStudioBundle().then((b) => {
      if (!b) return;
      setStudio(b.studio);
      setServices(b.services);
      setServiceIndex(b.services);
    });
    api.getManagerSession().then((u) => { if (u) setManagerUser(u); });
    api.getCurrentClient().then((c) => { if (c) setClient(c); });
  }, []);

  // ─── Data loaders ────────────────────────────────────────────────
  const loadManagerData = useCallback(async (s) => {
    const sid = (s || studio)?.id;
    if (!sid) return;
    const [appts, clients, gallery, pending, breaks] = await Promise.all([
      api.loadManagerAppointments(sid), api.loadClients(sid),
      api.loadGallery(sid, null), api.loadPendingPhotos(sid), api.loadBreaks(sid),
    ]);
    setMgrAppts(appts || []); setMgrClients(clients || []);
    setMgrGallery(gallery || []); setMgrPending(pending || []); setMgrBreaks(breaks || []);
  }, [studio]);

  const loadClientData = useCallback(async (c, s) => {
    const cl = c || client; const sid = (s || studio)?.id;
    if (!cl || !sid) return;
    const [appts, gallery, uploads, notifs, breaks] = await Promise.all([
      api.loadMyAppointments(cl.id), api.loadGallery(sid, cl.id),
      api.loadMyUploads(), api.loadNotifications(cl.id), api.loadBreaks(sid),
    ]);
    setCliAppts(appts || []); setCliGallery(gallery || []);
    setCliUploads(uploads || []); setCliNotifs(notifs || []); setCliBreaks(breaks || []);
  }, [client, studio]);

  // Refresh each side once its prerequisites (login + studio) are ready.
  useEffect(() => { if (managerUser && studio) loadManagerData(); }, [managerUser, studio, loadManagerData]);
  useEffect(() => { if (client && studio) loadClientData(); }, [client, studio, loadClientData]);

  // If the manager blocks a client mid-session, sign her out automatically
  // (note 26). Checks on an interval and whenever the tab regains focus.
  useEffect(() => {
    if (!client) return;
    const check = async () => {
      const fresh = await api.getCurrentClient();
      if (fresh && fresh.blocked) {
        await api.clientSignOut();
        setClient(null); setCliAppts([]); setCliGallery([]); setCliUploads([]); setCliNotifs([]);
        ping("חשבונך נחסם על ידי הסטודיו");
      }
    };
    const id = window.setInterval(check, 20000);
    window.addEventListener("focus", check);
    return () => { window.clearInterval(id); window.removeEventListener("focus", check); };
  }, [client, ping]);

  // ─── Manager actions ─────────────────────────────────────────────
  const mgr = {
    user: managerUser,
    studio, appts: mgrAppts, clients: mgrClients, gallery: mgrGallery, pending: mgrPending, breaks: mgrBreaks,
    studioName: studio?.name || "הסטודיו",
    ping,
    refresh: () => loadManagerData(),
    login: async (email, password) => {
      const r = await api.managerSignIn(email, password);
      if (r.error) return r.error;
      setManagerUser(r.user);
      await loadManagerData();
      return null;
    },
    logout: async () => { await api.managerSignOut(); setManagerUser(null); setMgrAppts([]); setMgrClients([]); },
    cancelAppt: async (appt) => {
      await api.cancelAppointment(appt.id, true);
      if (appt.clientId) await api.sendNotification(studio.id, appt.clientId, {
        type: "cancelled", title: "התור בוטל", body: `הסטודיו ביטל את התור שלך ל-${appt.dayLabel} בשעה ${appt.time}.`, appointmentId: appt.id });
      ping("התור בוטל והודעה נשלחה ללקוחה");
      loadManagerData();
    },
    setStatus: async (id, status) => {
      await api.setAppointmentStatus(id, status);
      ping(status === "completed" ? "סומן כבוצע" : "סומן כלא הגיעה");
      loadManagerData();
    },
    sendReminder: async (appt) => {
      if (appt.clientId) await api.sendNotification(studio.id, appt.clientId, {
        type: "reminder", title: "תזכורת לתור", body: `מזכירים את התור שלך ל-${appt.dayLabel} בשעה ${appt.time}.`, appointmentId: appt.id });
      ping("תזכורת נשלחה ללקוחה");
    },
    requestMove: async (appt) => {
      if (appt.clientId) await api.sendNotification(studio.id, appt.clientId, {
        type: "reschedule", title: "בקשה להזזת תור", body: `הסטודיו מבקש להזיז את התור מ-${appt.dayLabel} ${appt.time}. אנא צרי קשר.`, appointmentId: appt.id });
      ping("נשלחה ללקוחה בקשה להזזת התור");
    },
    addBreak: async (dayOffset, start, end, title) => {
      await api.addBreak(studio.id, dayOffset, start, end, title);
      ping("ההפסקה נוספה"); loadManagerData();
    },
    deleteBreak: async (id) => { await api.deleteBreak(id); ping("ההפסקה הוסרה"); loadManagerData(); },
    setWeeklyHours: async (weekday, fields) => { await api.setWeeklyHours(studio.id, weekday, fields); ping("שעות העבודה נשמרו"); },
    setDayOverride: async (dateStr, fields) => { await api.setDayOverride(studio.id, dateStr, fields); ping("שעות היום עודכנו"); },
    clearDayOverride: async (dateStr) => { await api.clearDayOverride(studio.id, dateStr); ping("היום חזר לברירת המחדל"); },
    blockClient: async (c) => {
      await api.setClientBlocked(c.id, !c.blocked);
      ping(c.blocked ? "החסימה הוסרה" : "הלקוחה נחסמה"); loadManagerData();
    },
    deleteClient: async (id) => { const ok = await api.deleteClient(id); ping(ok ? "הלקוחה נמחקה" : "מחיקת הלקוחה נכשלה"); loadManagerData(); },
    updateCaption: async (id, caption) => { await api.updatePhotoCaption(id, caption); ping("התיאור עודכן"); loadManagerData(); },
    approvePhoto: async (id) => { await api.setPhotoStatus(id, "approved"); ping("התמונה אושרה ונוספה לגלריה"); loadManagerData(); },
    rejectPhoto: async (id) => { await api.setPhotoStatus(id, "rejected"); ping("התמונה נדחתה"); loadManagerData(); },
    deletePhoto: async (id) => { await api.deletePhoto(id, true); ping("התמונה נמחקה"); loadManagerData(); },
    uploadPhoto: async (file, caption) => {
      const r = await api.uploadManagerPhoto(studio.id, studio?.name, file, caption);
      if (r.error) { ping(r.error); return; }
      ping("העבודה נוספה לגלריה"); loadManagerData();
    },
    saveSettings: async (settings) => {
      await api.updateStudioSettings(studio.id, settings);
      setStudio((s) => ({ ...s, ...settings }));   // keep local copy in sync so toggles persist across screens
      ping("ההגדרה נשמרה");
    },
  };

  // ─── Client actions ──────────────────────────────────────────────
  const cli = {
    client, studio, services, appts: cliAppts, gallery: cliGallery, uploads: cliUploads, notifications: cliNotifs, breaks: cliBreaks,
    studioName: studio?.name || "הסטודיו",
    register: async ({ name, phone, email, password }) => {
      const r = await api.clientRegister(studio.id, { name, phone, email, password });
      if (r.error) return r.error;
      setClient(r.client); await loadClientData(r.client);
      ping("ברוכה הבאה ל-Beautify 🤍");
      return null;
    },
    login: async (phone, password) => {
      const r = await api.clientSignIn(studio.id, phone, password);
      if (r.error) return r.error;
      setClient(r.client); await loadClientData(r.client);
      ping(`שלום ${r.client.name} 🤍`);
      return null;
    },
    logout: async () => { await api.clientSignOut(); setClient(null); setCliAppts([]); ping("התנתקת מהחשבון"); },
    book: async (serviceId, offset, time, paid = false) => {
      const appt = await api.saveAppointment(studio.id, client.id, serviceId, offset, time, paid);
      if (appt) setCliAppts((p) => [...p, appt]);
      return appt;
    },
    cancelAppt: async (id) => { await api.cancelAppointment(id, false); ping("התור בוטל"); loadClientData(); },
    confirmArrival: async (id) => { await api.confirmArrival(id); ping("אישרת הגעה — נתראה!"); loadClientData(); },
    payAppt: async (id) => { await api.payAppointment(id); ping("התשלום בוצע ✓"); loadClientData(); },
    uploadPhoto: async (file, caption) => {
      const r = await api.uploadClientPhoto(studio.id, client, file, caption);
      if (r.error) { ping(r.error); return; }
      ping("נשלח לאישור הסטודיו 🤍"); loadClientData();
    },
    cancelUpload: async (id) => { await api.deletePhoto(id, false); ping("הבקשה בוטלה"); loadClientData(); },
    toggleLike: async (g) => {
      const liked = await api.toggleLike(g.id, client.id, g.likedByMe);
      setCliGallery((prev) => prev.map((x) => x.id === g.id
        ? { ...x, likedByMe: liked, likes: x.likes + (liked ? 1 : -1) } : x));
    },
    updateProfile: async (fields) => {
      const ok = await api.updateClientProfile(client.id, fields);
      if (ok) { setClient((c) => ({ ...c, ...fields })); ping("הפרטים עודכנו"); }
    },
    uploadAvatar: async (file) => {
      const r = await api.uploadClientAvatar(client.id, file);
      if (r.error) { ping(r.error); return; }
      setClient((c) => ({ ...c, avatar_url: r.url })); ping("תמונת הפרופיל עודכנה");
    },
    markNotifRead: async (id) => { await api.markNotificationRead(id); loadClientData(); },
    refresh: () => loadClientData(),
    ping,
  };

  return (
    <div className="bf-root">
      <style>{STYLE}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span className="bf-mark" />
        <span className="bf-display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: ".5px", color: "var(--plum-deep)" }}>Beautify</span>
      </div>

      <div className="bf-roleswitch" role="tablist" aria-label="תצוגה">
        <button className={role === "manager" ? "active" : ""} onClick={() => setRole("manager")}>תצוגת מנהלת</button>
        <button className={role === "client" ? "active" : ""} onClick={() => setRole("client")}>תצוגת לקוחה</button>
      </div>
      <div className="bf-hint">הדגמה חיה — קבעי תור בצד הלקוחה והוא יופיע ביומן המנהלת (רענון)</div>

      <div className="bf-phone" style={{ marginTop: 16 }} dir="rtl">
        {role === "manager"
          ? <ManagerApp mgr={mgr} ping={ping} />
          : <ClientApp cli={cli} ping={ping} />}
        {toast && <div className="bf-toast"><CheckCircle2 size={16} /> {toast}</div>}
      </div>
    </div>
  );
}
