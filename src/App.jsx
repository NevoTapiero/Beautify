import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";

import STYLE from "./styles";
import * as api from "./lib/api";
import { applyStudioPWA } from "./lib/pwa";
import { buildThemeVars } from "./lib/theme";
import ManagerApp from "./components/manager/ManagerApp";
import ClientApp from "./components/client/ClientApp";
import ResetPasswordScreen from "./components/ResetPasswordScreen";

// Catches any render error so the app shows a recover screen instead of going
// blank. Keeps one component's bug from taking down the whole page.
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err, info) { console.error("[Beautify] render error:", err, info); }
  render() {
    if (this.state.failed) {
      return (
        <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", textAlign: "center", padding: 24, fontFamily: "'Assistant',sans-serif" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#7C2A53", marginBottom: 8 }}>משהו השתבש</div>
            <div style={{ color: "#9A8490", fontSize: 14, marginBottom: 16 }}>אנא רעננו את העמוד</div>
            <button onClick={() => window.location.reload()} style={{ border: "none", borderRadius: 12, padding: "11px 22px", background: "linear-gradient(135deg,#7C2A53,#D9738F)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>רענון</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Only the bare demo domain (no studio slug in the URL) shows the manager/
// client switcher and the floating phone-mockup chrome — that's a sales-demo
// affordance. A real studio's own link (/<slug>) opens straight into her
// clients' booking app, full-screen, with no switcher visible to them.
const isDemo = api.resolveStudioSlug() === "demo";

export default function App() {
  const [role, setRole] = useState(isDemo ? "manager" : "client");
  const [studio, setStudio] = useState(null);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  // Employee-app lock (V2 Phase 3): when set, this device shows only that
  // employee's restricted view. Persisted per device so it survives reloads.
  const [employeeLock, setEmployeeLock] = useState(() => {
    try { return localStorage.getItem("bf-emp-lock") || null; } catch { return null; }
  });

  // Toast
  const [toast, setToast] = useState(null);
  const ping = useCallback((msg) => {
    setToast(msg);
    window.clearTimeout(window.__bft);
    window.__bft = window.setTimeout(() => setToast(null), 2400);
  }, []);

  // Password-reset: a recovery link lands back here with ?reset=client|manager
  // — read it once, up front, before anything else touches the URL.
  const [recovery, setRecovery] = useState(() => api.resolvePendingRecovery());
  useEffect(() => {
    if (!recovery) return;
    api.beginPasswordRecovery(recovery).then((ok) => { if (!ok) setRecovery(null); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  const [scheduleReqs, setScheduleReqs] = useState([]);   // employee schedule-change requests (3b)
  const [empNotifs, setEmpNotifs] = useState([]);         // notifications for the locked employee
  const [myVisits, setMyVisits] = useState(0);            // locked employee's completed-appointments count

  // ─── Initial load: studio, then restore any existing sessions ─────
  useEffect(() => {
    api.loadStudioBundle().then((b) => {
      if (!b) return;
      setStudio(b.studio);
      setServices(b.services);
      setEmployees(b.employees || []);
      applyStudioPWA(b.studio);   // make the installed app *hers* (name/icon/colors)
      api.getCurrentClient(b.studio.id).then((c) => { if (c) setClient(c); });
    });
    api.getManagerSession().then((u) => { if (u) { setManagerUser(u); if (!isDemo) setRole("manager"); } });
  }, []);

  // ─── Data loaders ────────────────────────────────────────────────
  const loadManagerData = useCallback(async (s) => {
    const sid = (s || studio)?.id;
    if (!sid) return;
    const [appts, clients, gallery, pending, breaks] = await Promise.all([
      api.loadManagerAppointments(sid), api.loadClients(sid),
      api.loadGallery(sid, null, employeeLock), api.loadPendingPhotos(sid), api.loadBreaks(sid),
    ]);
    setMgrAppts(appts || []); setMgrClients(clients || []);
    setMgrGallery(gallery || []); setMgrPending(pending || []); setMgrBreaks(breaks || []);
    if ((s || studio)?.business_mode) {
      api.loadScheduleRequests(sid).then((rq) => setScheduleReqs(rq || []));
    }
  }, [studio, employeeLock]);

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

  // Cancels every not-yet-happened appointment booked to a given employee (or,
  // with no id, every appointment that has ANY employee assigned) and notifies
  // the client — used when a worker is removed or the studio drops out of
  // business mode, so a now-unassignable appointment doesn't sit there silently.
  const cancelEmployeeAppts = useCallback(async (employeeId) => {
    const affected = mgrAppts.filter((a) =>
      (employeeId ? a.employeeId === employeeId : !!a.employeeId) &&
      a.day >= 0 && a.status !== "cancelled" && a.status !== "completed" && a.status !== "no_show"
    );
    for (const a of affected) {
      await api.cancelAppointment(a.id, true);
      if (a.clientId) await api.sendNotification(studio.id, a.clientId, {
        type: "cancelled", title: "התור בוטל",
        body: `התור שלך ל-${a.dayLabel} בשעה ${a.time} בוטל.`, appointmentId: a.id,
      });
    }
  }, [mgrAppts, studio]);

  // Reload studio + services (after the manager edits her service list).
  const refreshStudio = useCallback(async () => {
    const b = await api.loadStudioBundle();
    if (b) { setStudio(b.studio); setServices(b.services); setEmployees(b.employees || []); applyStudioPWA(b.studio); }
  }, []);

  // Lock / unlock this device to a single employee's view (Phase 3).
  const lockToEmployee = useCallback((id) => { setEmployeeLock(id); try { localStorage.setItem("bf-emp-lock", id); } catch { /* ignore */ } }, []);
  const clearEmployeeLock = useCallback(() => { setEmployeeLock(null); try { localStorage.removeItem("bf-emp-lock"); } catch { /* ignore */ } }, []);

  // Refresh each side once its prerequisites (login + studio) are ready.
  useEffect(() => { if (managerUser && studio) loadManagerData(); }, [managerUser, studio, loadManagerData]);
  useEffect(() => { if (client && studio) loadClientData(); }, [client, studio, loadClientData]);

  // If the manager blocks a client mid-session, sign her out automatically
  // (note 26). Checks on an interval and whenever the tab regains focus.
  useEffect(() => {
    if (!client) return;
    const check = async () => {
      const fresh = await api.getCurrentClient(studio?.id);
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

  // Remote disconnect: if the manager removes this employee, the locked device
  // unlocks itself (Phase 3). Polls + checks on focus.
  useEffect(() => {
    if (!employeeLock || !studio) return;
    const check = async () => {
      const list = await api.loadEmployees(studio.id);
      if (!list.some((e) => e.id === employeeLock)) { clearEmployeeLock(); ping("החיבור נותק על ידי המנהלת"); return; }
      api.loadEmployeeNotifications(studio.id, employeeLock).then((n) => setEmpNotifs(n || []));
      api.countEmployeeVisits(employeeLock).then((c) => setMyVisits(c));
    };
    check();
    const id = window.setInterval(check, 20000);
    window.addEventListener("focus", check);
    return () => { window.clearInterval(id); window.removeEventListener("focus", check); };
  }, [employeeLock, studio, clearEmployeeLock, ping]);

  // ─── Manager actions ─────────────────────────────────────────────
  const mgr = {
    user: managerUser,
    studio, appts: mgrAppts, clients: mgrClients, gallery: mgrGallery, pending: mgrPending, breaks: mgrBreaks,
    studioName: studio?.name || "הסטודיו",           // business name — app title/splash/login
    ownerName: studio?.owner_name || studio?.name || "המנהלת", // her personal name — greeting + cosmetician picker
    services,
    employees,
    business: !!studio?.business_mode,
    // Employee-app lock (Phase 3)
    lockedEmployeeId: employeeLock,
    lockedEmployee: employeeLock ? (employees.find((e) => e.id === employeeLock) || null) : null,
    lockToEmployee,
    unlockManager: async (password) => {
      const ok = await api.verifyManagerPassword(managerUser?.email, password);
      if (ok) { clearEmployeeLock(); ping("חזרת לתצוגת מנהלת"); }
      return ok;
    },
    ping,
    refresh: () => loadManagerData(),
    setBusinessMode: async (on) => {
      if (!on) await cancelEmployeeAppts(null); // dropping business mode — no employee stays assignable
      await api.updateStudioSettings(studio.id, { business_mode: on });
      setStudio((s) => ({ ...s, business_mode: on }));
      ping(on ? "מצב עסק הופעל" : "מצב עסק כובה");
      loadManagerData();
    },
    addEmployee: async (fields) => { await api.addEmployee(studio.id, fields); ping("העובדת נוספה"); await refreshStudio(); },
    updateEmployee: async (id, fields) => { await api.updateEmployee(id, fields); ping("פרטי העובדת עודכנו"); await refreshStudio(); },
    deleteEmployee: async (id) => {
      await cancelEmployeeAppts(id);
      await api.deleteEmployee(id);
      ping("העובדת הוסרה ותוריה בוטלו");
      await refreshStudio(); loadManagerData();
    },
    uploadServiceImage: async (file) => {
      const r = await api.uploadServiceImage(studio.id, file);
      if (r.error) { ping(r.error); return null; }
      return r.url;
    },
    // Owner's personal photo — shown to clients only in "עלינו" (V7).
    uploadOwnerPhoto: async (file) => {
      const r = await api.uploadOwnerPhoto(studio.id, file);
      if (r.error) { ping(r.error); return; }
      setStudio((s) => ({ ...s, owner_photo_url: r.url }));
      ping("תמונת הפרופיל עודכנה");
    },
    // Employee likes a gallery photo (V6 note 59) — updates count optimistically.
    employeeLike: async (g) => {
      const liked = await api.toggleEmployeeLike(g.id, employeeLock, g.likedByMe);
      setMgrGallery((prev) => prev.map((x) => x.id === g.id ? { ...x, likedByMe: liked, likes: x.likes + (liked ? 1 : -1) } : x));
    },
    // Employee writes her "about me" (V6 note 62)
    updateMyAbout: async (text) => {
      if (!employeeLock) return;
      await api.updateEmployee(employeeLock, { about: text });
      await refreshStudio(); ping("נשמר");
    },
    addService: async (fields) => { await api.addService(studio.id, fields); ping("השירות נוסף"); await refreshStudio(); },
    updateService: async (id, fields) => { await api.updateService(id, fields); ping("השירות עודכן"); await refreshStudio(); },
    deleteService: async (id) => { await api.deleteService(id); ping("השירות הוסר"); await refreshStudio(); },
    login: async (email, password) => {
      const r = await api.managerSignIn(email, password);
      if (r.error) return r.error;
      setManagerUser(r.user);
      await loadManagerData();
      return null;
    },
    logout: async () => { await api.managerSignOut(); setManagerUser(null); setMgrAppts([]); setMgrClients([]); },
    requestPasswordReset: (email) => api.managerRequestPasswordReset(email),
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
    // Send an arrival reminder to every client who hasn't confirmed yet (note 31).
    remindAll: async (appts) => {
      let n = 0;
      for (const appt of appts) {
        if (!appt.clientId) continue;
        await api.sendNotification(studio.id, appt.clientId, {
          type: "reminder", title: "תזכורת לתור", body: `מזכירים את התור שלך ל-${appt.dayLabel} בשעה ${appt.time}.`, appointmentId: appt.id });
        n++;
      }
      ping(n ? `נשלחו ${n} תזכורות ללקוחות` : "אין למי לשלוח תזכורת");
    },
    // Ask one client to move her appointment: grays it out + notifies (notes 27).
    requestReschedule: async (appt) => {
      await api.setAppointmentStatus(appt.id, "reschedule_requested");
      if (appt.clientId) await api.sendNotification(studio.id, appt.clientId, {
        type: "reschedule", title: "בקשה להזזת תור",
        body: `הסטודיו ביקש להזיז את התור מ-${appt.dayLabel} בשעה ${appt.time}. אפשר להזיז לשעה אחרת או לבטל.`, appointmentId: appt.id });
      ping("נשלחה ללקוחה בקשה להזיז את התור");
      loadManagerData();
    },
    // Bulk version, used when a schedule change runs over several appointments.
    rescheduleMany: async (appts) => {
      for (const appt of appts) {
        await api.setAppointmentStatus(appt.id, "reschedule_requested");
        if (appt.clientId) await api.sendNotification(studio.id, appt.clientId, {
          type: "reschedule", title: "בקשה להזזת תור",
          body: `עקב שינוי בלו"ז, הסטודיו ביקש להזיז את התור מ-${appt.dayLabel} בשעה ${appt.time}. אפשר להזיז לשעה אחרת או לבטל.`, appointmentId: appt.id });
      }
      if (appts.length) ping(`נשלחו ${appts.length} בקשות הזזה ללקוחות`);
      loadManagerData();
    },
    addBreak: async (dayOffset, start, end, title, employeeId) => {
      await api.addBreak(studio.id, dayOffset, start, end, title, employeeId);
      ping("ההפסקה נוספה"); loadManagerData();
    },
    deleteBreak: async (id) => { await api.deleteBreak(id); ping("ההפסקה הוסרה"); loadManagerData(); },
    removeBreaks: async (ids) => { for (const id of ids) await api.deleteBreak(id); loadManagerData(); },
    setWeeklyHours: async (weekday, fields, employeeId) => { await api.setWeeklyHours(studio.id, weekday, fields, employeeId); ping("שעות העבודה נשמרו"); },
    setDayOverride: async (dateStr, fields, employeeId) => { await api.setDayOverride(studio.id, dateStr, fields, employeeId); ping("שעות היום עודכנו"); },
    clearDayOverride: async (dateStr, employeeId) => { await api.clearDayOverride(studio.id, dateStr, employeeId); ping("היום חזר לברירת המחדל"); },
    blockClient: async (c) => {
      await api.setClientBlocked(c.id, !c.blocked);
      ping(c.blocked ? "החסימה הוסרה" : "הלקוחה נחסמה"); loadManagerData();
    },
    deleteClient: async (id) => { const ok = await api.deleteClient(id); ping(ok ? "הלקוחה נמחקה" : "מחיקת הלקוחה נכשלה"); loadManagerData(); },
    updateCaption: async (id, caption) => { await api.updatePhotoCaption(id, caption); ping("התיאור עודכן"); loadManagerData(); },
    approvePhoto: async (id) => { await api.setPhotoStatus(id, "approved"); ping("התמונה אושרה ונוספה לגלריה"); loadManagerData(); },
    rejectPhoto: async (id) => { await api.setPhotoStatus(id, "rejected"); ping("התמונה נדחתה"); loadManagerData(); },
    deletePhoto: async (id) => { await api.deletePhoto(id, true); ping("התמונה נמחקה"); loadManagerData(); },
    uploadPhoto: async (file, caption, employeeId) => {
      const r = await api.uploadManagerPhoto(studio.id, studio?.owner_name || studio?.name, file, caption, employeeId);
      if (r.error) { ping(r.error); return; }
      ping("העבודה נוספה לגלריה"); loadManagerData();
    },
    // Employee (locked) uploads → pending for the manager to approve (V3 note 64).
    uploadEmployeePhoto: async (file, caption) => {
      const emp = employees.find((e) => e.id === employeeLock);
      if (!emp) return;
      const r = await api.uploadEmployeePhoto(studio.id, emp, file, caption);
      if (r.error) { ping(r.error); return; }
      ping("נשלח לאישור המנהלת 🤍"); loadManagerData();
    },
    // Employee updates her own profile photo (V3 note 60).
    uploadMyAvatar: async (file) => {
      if (!employeeLock) return;
      const r = await api.uploadEmployeeAvatar(employeeLock, file);
      if (r.error) { ping(r.error); return; }
      ping("תמונת הפרופיל עודכנה"); await refreshStudio();
    },
    // Emergency: stop the workday now — cancel today's not-yet-done appointments
    // and notify those clients (V2: both editions).
    closeDayNow: async (appts) => {
      let n = 0;
      for (const appt of appts) {
        await api.cancelAppointment(appt.id, true);
        if (appt.clientId) await api.sendNotification(studio.id, appt.clientId, {
          type: "cancelled", title: "התור בוטל", body: `עקב סגירת היומן, התור שלך ל-${appt.dayLabel} בשעה ${appt.time} בוטל. נשמח לקבוע מועד חדש.`, appointmentId: appt.id });
        n++;
      }
      ping(n ? `היומן נסגר — בוטלו ${n} תורים והלקוחות עודכנו` : "אין תורים פתוחים לביטול");
      loadManagerData();
    },
    saveSettings: async (settings) => {
      const ok = await api.updateStudioSettings(studio.id, settings);
      if (!ok) { ping("השמירה נכשלה — נסי שוב"); return; }
      // Keep local copy in sync so toggles persist across screens, and re-apply
      // the installed-app identity (title/manifest/icons) if name or logo changed.
      setStudio((s) => { const next = { ...s, ...settings }; applyStudioPWA(next); return next; });
      ping("ההגדרה נשמרה");
    },
    // Employee schedule-change approval flow (Phase 3b)
    scheduleReqs,
    employeeNotifications: empNotifs,
    createScheduleRequest: async (kind, payload, label) => {
      const ok = await api.createScheduleRequest(studio.id, employeeLock, kind, payload, label);
      ping(ok ? "הבקשה נשלחה לאישור המנהלת" : "שליחת הבקשה נכשלה");
      loadManagerData();
    },
    approveScheduleRequest: async (req) => {
      const p = req.payload || {};
      if (req.kind === "weekly") { for (const r of (Array.isArray(p.rows) ? p.rows : [])) await api.setWeeklyHours(studio.id, r.weekday, { is_open: r.is_open, start_time: r.start_time, end_time: r.end_time }, req.employee_id); }
      else if (req.kind === "day") { if (p.clear) await api.clearDayOverride(studio.id, p.dateStr, req.employee_id); else await api.setDayOverride(studio.id, p.dateStr, { is_open: p.is_open, start_time: p.start_time, end_time: p.end_time }, req.employee_id); }
      else if (req.kind === "break") { await api.addBreak(studio.id, p.day, p.start, p.end, p.title, req.employee_id); }
      else if (req.kind === "closeday") {
        for (const a of (Array.isArray(p.appts) ? p.appts : [])) {
          await api.cancelAppointment(a.id, true);
          if (a.clientId) await api.sendNotification(studio.id, a.clientId, { type: "cancelled", title: "התור בוטל", body: `עקב סגירת היומן, התור שלך ל-${a.dayLabel} בשעה ${a.time} בוטל.`, appointmentId: a.id });
        }
      }
      await api.setScheduleRequestStatus(req.id, "approved");
      await api.sendEmployeeNotification(studio.id, req.employee_id, { type: "approved", title: "הבקשה אושרה", body: `${req.label || "השינוי בלו\"ז"} אושר על ידי המנהלת.` });
      ping("הבקשה אושרה והשינוי הוחל"); loadManagerData();
    },
    declineScheduleRequest: async (req) => {
      await api.setScheduleRequestStatus(req.id, "declined");
      await api.sendEmployeeNotification(studio.id, req.employee_id, { type: "declined", title: "הבקשה נדחתה", body: `${req.label || "השינוי בלו\"ז"} לא אושר על ידי המנהלת.` });
      ping("הבקשה נדחתה"); loadManagerData();
    },
    markEmployeeNotifRead: async (id) => {
      await api.markNotificationReadMgr(id);   // manager auth — fixes the can't-mark-read bug (V4)
      if (employeeLock) api.loadEmployeeNotifications(studio.id, employeeLock).then((n) => setEmpNotifs(n || []));
    },
    myVisits,
    updateMyNotifPref: async (fields) => {
      if (!employeeLock) return;
      await api.updateEmployee(employeeLock, fields);
      await refreshStudio();
    },
  };

  // ─── Client actions ──────────────────────────────────────────────
  const cli = {
    client, studio, services, appts: cliAppts, gallery: cliGallery, uploads: cliUploads, notifications: cliNotifs, breaks: cliBreaks,
    employees,
    business: !!studio?.business_mode,
    studioName: studio?.name || "הסטודיו",
    ownerName: studio?.owner_name || studio?.name || "המנהלת",
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
    requestPasswordReset: (phone) => api.clientRequestPasswordReset(studio.id, phone),
    book: async (serviceId, offset, time, paid = false, employeeId = null) => {
      const appt = await api.saveAppointment(studio.id, client.id, serviceId, offset, time, paid, employeeId);
      if (appt) setCliAppts((p) => [...p, appt]);
      return appt;
    },
    cancelAppt: async (id) => { await api.cancelAppointment(id, false); ping("התור בוטל"); loadClientData(); },
    reschedule: async (apptId, offset, time) => { await api.rescheduleAppointment(apptId, offset, time); ping("התור הוזז בהצלחה ✓"); loadClientData(); },
    confirmArrival: async (id) => { await api.confirmArrival(id); ping("אישרת הגעה — נתראה!"); loadClientData(); },
    payAppt: async (id) => { await api.payAppointment(id); ping("התשלום בוצע ✓"); loadClientData(); },
    uploadPhoto: async (file, caption, employeeId) => {
      const r = await api.uploadClientPhoto(studio.id, client, file, caption, employeeId);
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
    <div className={isDemo ? "bf-root" : "bf-root bf-root-live"} style={buildThemeVars(studio)}>
      <style>{STYLE}</style>

      {/* Nothing renders until her studio row has actually loaded — otherwise
          the icon/name briefly show the generic defaults before flipping to
          her real logo_url/brand_name a moment later. */}
      {studio && (<>
        {isDemo && (<>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <img src={studio.logo_url || "/icon-mark.png"} alt="" className="bf-mark" />
            <span className="bf-display bf-wordmark">{studio.brand_name || "Beautify"}</span>
          </div>

          <div className="bf-roleswitch" role="tablist" aria-label="תצוגה">
            <button className={role === "manager" ? "active" : ""} onClick={() => setRole("manager")}>תצוגת מנהלת</button>
            <button className={role === "client" ? "active" : ""} onClick={() => setRole("client")}>תצוגת לקוחה</button>
          </div>
          <div className="bf-hint">הדגמה חיה — קבעי תור בצד הלקוחה והוא יופיע ביומן המנהלת (רענון)</div>
        </>)}

        <div className={isDemo ? "bf-phone" : "bf-phone bf-phone-live"} style={isDemo ? { marginTop: 16 } : undefined} dir="rtl">
          <ErrorBoundary>
            {recovery ? (
              <ResetPasswordScreen studio={studio} role={recovery.role} onDone={() => setRecovery(null)} ping={ping} />
            ) : (
              <div key={role} style={{ display: "flex", flexDirection: "column", flex: "1 1 auto", minHeight: 0, animation: "bf-fade .22s ease" }}>
                {role === "manager"
                  ? <ManagerApp mgr={mgr} ping={ping} />
                  : <ClientApp cli={cli} ping={ping} onManagerEntry={isDemo ? undefined : () => setRole("manager")} />}
              </div>
            )}
          </ErrorBoundary>
          {toast && <div className="bf-toast"><CheckCircle2 size={16} /> {toast}</div>}
        </div>
      </>)}
    </div>
  );
}
