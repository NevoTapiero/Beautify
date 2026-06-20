import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

import STYLE from "./styles";
import { CLIENTS0, APPTS0, GALLERY0, PENDING0, GRADIENTS } from "./data/mock";
import { SERVICES } from "./data/mock";
import { setServiceIndex } from "./lib/services";
import { loadStudioBundle, ensureAnonSession, registerClient, saveAppointment, managerSignIn, managerSignOut, loadManagerAppointments } from "./lib/api";

import ManagerApp from "./components/manager/ManagerApp";
import ClientApp from "./components/client/ClientApp";

export default function App() {
  const [role, setRole] = useState("manager");

  // Supabase-backed studio + services (falls back to demo data if unavailable)
  const [studio, setStudio] = useState(null);
  const [dbServices, setDbServices] = useState([]);
  const [dbClientId, setDbClientId] = useState(null);

  // Manager auth
  const [managerUser, setManagerUser] = useState(null);
  const [liveAppts, setLiveAppts] = useState(null);

  useEffect(() => {
    ensureAnonSession();
    loadStudioBundle().then((b) => {
      if (!b) return;
      setServiceIndex(b.services);
      setDbServices(b.services);
      setStudio(b.studio);
    });
  }, []);

  const handleManagerLogin = async (email, password) => {
    const result = await managerSignIn(email, password);
    if (result.error) return result.error;
    setManagerUser(result.user);
    // Studio may still be loading — the useEffect below handles that race.
    return null;
  };

  const handleManagerLogout = async () => {
    await managerSignOut();
    setManagerUser(null);
    setLiveAppts(null);
    ensureAnonSession();
  };

  const refreshManagerAppts = async () => {
    if (!studio) return;
    const rows = await loadManagerAppointments(studio.id);
    if (rows) setLiveAppts(rows);
  };

  // Load real appointments whenever the manager is logged in AND studio is ready.
  // This handles the race where studio loads after login, and the initial login.
  useEffect(() => {
    if (!managerUser || !studio) return;
    loadManagerAppointments(studio.id).then((rows) => {
      if (rows) setLiveAppts(rows);
    });
  }, [managerUser, studio]);

  // Shared in-memory state (demo + optimistic updates)
  const [clients, setClients] = useState(CLIENTS0);
  const [appts, setAppts] = useState(APPTS0);
  const [gallery, setGallery] = useState(GALLERY0);
  const [pending, setPending] = useState(PENDING0);
  const [seq, setSeq] = useState(200);
  const [registered, setRegistered] = useState(false);
  // ME starts null — set to the real client's ID after registration.
  const [ME, setME] = useState(null);

  const [toast, setToast] = useState(null);
  const ping = (msg) => {
    setToast(msg);
    window.clearTimeout(window.__bft);
    window.__bft = window.setTimeout(() => setToast(null), 2400);
  };

  const handleRegister = async ({ name, phone, email }) => {
    let dbId = null;
    if (studio) {
      dbId = await registerClient(studio.id, { name, phone, email });
      if (dbId) setDbClientId(dbId);
    }
    // Give the new client a unique local ID and add them to the clients list.
    const localId = dbId || `local_${Date.now()}`;
    setClients((prev) => [...prev, { id: localId, name, phone, email, visits: 0, last: "היום", blocked: false }]);
    setME(localId);
    setRegistered(true);
    ping("ברוכה הבאה ל-Beautify 🤍");
  };

  const book = (serviceId, offset, time, paid = false) => {
    const id = seq + 1; setSeq(id);
    setAppts((p) => [...p, {
      id, clientId: ME, service: serviceId, time,
      day: offset, dayLabel: offset === 0 ? "היום" : offset === 1 ? "מחר" : `בעוד ${offset} ימים`,
      status: "confirmed", arrival: false, paid,
    }]);
    if (studio && dbClientId) saveAppointment(studio.id, dbClientId, serviceId, offset, time, paid);
    return id;
  };

  const confirmArrival = (id) => setAppts((p) => p.map((a) => a.id === id ? { ...a, arrival: true } : a));
  const cancelAppt    = (id) => setAppts((p) => p.filter((a) => a.id !== id));
  const approvePhoto  = (ph) => { setPending((p) => p.filter((x) => x.id !== ph.id)); setGallery((g) => [{ ...ph, likes: 0 }, ...g]); };
  const rejectPhoto   = (id) => setPending((p) => p.filter((x) => x.id !== id));
  const addPending    = (cap, by) => { const id = seq + 1; setSeq(id); setPending((p) => [...p, { id, grad: GRADIENTS[id % GRADIENTS.length], cap, by }]); };
  const likePhoto     = (id) => setGallery((g) => g.map((x) => x.id === id ? { ...x, likes: x.likes + 1 } : x));

  const studioName = studio?.name || "הסטודיו של דנה";
  const services   = dbServices.length ? dbServices : SERVICES;
  const allAppts   = liveAppts ? [...liveAppts, ...appts] : appts;

  const shared = {
    clients, setClients, appts: allAppts, book, confirmArrival, cancelAppt,
    gallery, pending, approvePhoto, rejectPhoto, addPending, likePhoto,
    ping, ME, registered, handleRegister, studioName, services,
    managerUser, handleManagerLogin, handleManagerLogout, refreshManagerAppts,
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
      <div className="bf-hint">הדגמה חיה — קבעי תור בצד הלקוחה והוא יופיע מיד ביומן המנהלת</div>

      <div className="bf-phone" style={{ marginTop: 16 }} dir="rtl">
        {role === "manager" ? <ManagerApp {...shared} /> : <ClientApp {...shared} />}
        {toast && <div className="bf-toast"><CheckCircle2 size={16} /> {toast}</div>}
      </div>
    </div>
  );
}
