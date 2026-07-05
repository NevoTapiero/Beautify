const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800&family=Frank+Ruhl+Libre:wght@400;500;700;900&display=swap');
.bf-root *{ box-sizing:border-box; }
.bf-root{
  color-scheme:light;   /* never invert in device/browser dark mode (note 3) */
  --ink:#2A1A2E; --plum:#7C2A53; --plum-deep:#5E1F40; --rose:#D9738F;
  --rose-soft:#F4C9D4; --blush:#FBEFEA; --sand:#EADDD4; --gold:#B4893E;
  --surface:#FFFFFF; --muted:#6E5A69; --btn-ink:#ffffff;
  font-family:'Assistant', system-ui, -apple-system, sans-serif;
  color:var(--ink); min-height:100vh; width:100%;
  background:
    radial-gradient(120% 75% at 100% 0%, #F7E3DC 0%, rgba(247,227,220,0) 55%),
    radial-gradient(120% 75% at 0% 100%, #F2D9E1 0%, rgba(242,217,225,0) 55%),
    #FBEFEA;
  display:flex; flex-direction:column; align-items:center;
  padding:22px 14px 40px;
}
.bf-display{ font-family:'Frank Ruhl Libre', serif; }
.bf-root :focus-visible{ outline:2px solid var(--rose); outline-offset:2px; border-radius:10px; }

.bf-mark{ width:28px; height:34px; object-fit:contain; display:inline-block; flex:none; }
.bf-mark-badge{ width:46px; height:46px; border-radius:14px; background:#fff; display:inline-flex;
  align-items:center; justify-content:center; box-shadow:0 8px 18px -10px rgba(0,0,0,.35); }
.bf-mark-badge .bf-mark{ width:26px; height:32px; }
.bf-wordmark{ font-size:26px; font-weight:700; letter-spacing:.02em; color:var(--plum-deep); }

.bf-roleswitch{ display:inline-flex; background:#fff; border:1px solid var(--sand);
  border-radius:999px; padding:5px; gap:4px; box-shadow:0 6px 18px -12px rgba(42,26,46,.5); }
.bf-roleswitch button{ border:none; background:none; padding:9px 20px; border-radius:999px;
  font-weight:700; font-size:14px; color:var(--muted); cursor:pointer; transition:.18s; font-family:inherit; }
.bf-roleswitch button.active{ background:linear-gradient(135deg,var(--plum),var(--rose)); color:var(--btn-ink);
  box-shadow:0 8px 18px -10px rgba(124,42,83,.7); }

.bf-phone{ width:392px; max-width:100%; height:792px; max-height:86vh; background:var(--blush);
  border:1px solid var(--sand); border-radius:42px; overflow:hidden; display:flex; flex-direction:column;
  position:relative; box-shadow:0 50px 90px -40px rgba(42,26,46,.55), 0 0 0 10px #ffffff, 0 0 0 11px var(--sand); }
/* The real (non-demo) app: no floating mockup frame, fills the actual device
   viewport edge-to-edge — this is what a beautician's own installed PWA looks
   like, not a phone illustration on a desktop demo page. */
.bf-phone-live{ width:100%; height:100dvh; max-height:none; border:none; border-radius:0; box-shadow:none; }
.bf-root-live{ padding:0; min-height:0; height:100dvh; }
.bf-screen{ flex:1; min-height:0; overflow-y:auto; }
.bf-screen::-webkit-scrollbar{ width:0; }
.bf-pad{ padding:18px 16px 26px; }

.bf-appbar{ background:linear-gradient(135deg,var(--plum-deep),var(--plum)); color:var(--btn-ink);
  padding:16px 18px 16px; position:relative; overflow:hidden; flex:none; }
.bf-appbar::after{ content:''; position:absolute; inset:0 0 55% 0;
  background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,0)); pointer-events:none; }
.bf-appbar h1{ font-size:21px; margin:0; line-height:1.15; position:relative; }
.bf-appbar .sub{ font-size:12.5px; opacity:.82; margin-top:2px; position:relative; }
.bf-appbar .bf-wordmark{ color:var(--btn-ink); }

.bf-nav{ display:flex; background:var(--surface); border-top:1px solid var(--sand); flex:none; padding-bottom:2px; }
.bf-nav button{ flex:1; background:none; border:none; padding:9px 2px 9px; cursor:pointer;
  display:flex; flex-direction:column; align-items:center; gap:3px; color:var(--muted);
  font-size:10.5px; font-weight:700; font-family:inherit; transition:.15s; }
.bf-nav button.active{ color:var(--plum); }
.bf-nav .ndot{ width:5px; height:5px; border-radius:50%; background:var(--plum); }

.bf-card{ background:var(--surface); border:1px solid var(--sand); border-radius:18px; }
button.bf-card{ cursor:pointer; transition:border-color .15s ease, background .15s ease; }
button.bf-card:hover{ border-color:var(--rose-soft); background:var(--blush); }
.bf-btn{ font-family:inherit; font-weight:700; border:none; cursor:pointer; border-radius:14px;
  height:48px; padding:0 16px; font-size:15px; transition:transform .14s ease, box-shadow .2s ease; width:100%;
  display:inline-flex; align-items:center; justify-content:center; gap:7px; box-sizing:border-box; }
.bf-btn:active{ transform:scale(.985); }
.bf-btn:disabled{ cursor:not-allowed; opacity:.55; transform:none; }
.bf-btn-primary{ color:var(--btn-ink); background:linear-gradient(135deg,var(--plum),var(--rose));
  box-shadow:0 12px 24px -12px rgba(124,42,83,.75); position:relative; overflow:hidden; }
.bf-btn-primary::after{ content:''; position:absolute; inset:0 0 52% 0;
  background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0)); pointer-events:none; }
.bf-btn-primary:disabled{ background:var(--sand); color:var(--muted); box-shadow:none; opacity:1; }
.bf-btn-ghost{ background:var(--surface); color:var(--plum); border:1px solid var(--sand); }
.bf-btn-ghost:hover:not(:disabled){ background:var(--blush); border-color:var(--rose-soft); }
.bf-btn-soft{ background:var(--rose-soft); color:var(--plum-deep); }
.bf-btn-soft:hover:not(:disabled){ background:#EFB9C7; }
.bf-btn-sm{ height:36px; padding:0 12px; font-size:13px; border-radius:11px; width:auto; }

.bf-chip{ font-size:11.5px; font-weight:700; padding:4px 10px; border-radius:999px;
  display:inline-flex; align-items:center; gap:4px; }
.bf-chip-ok{ background:#E7F3EC; color:#2E7D52; }
.bf-chip-wait{ background:#FBEFD6; color:#9A6B14; }
.bf-chip-rose{ background:var(--rose-soft); color:var(--plum-deep); }

.bf-avatar{ width:42px; height:42px; border-radius:50%; flex:none; display:flex;
  align-items:center; justify-content:center; font-weight:800; font-size:15px; color:var(--btn-ink);
  background:linear-gradient(135deg,var(--plum),var(--rose)); }

.bf-input{ width:100%; background:var(--surface); border:1px solid var(--sand); border-radius:13px;
  padding:13px 14px; font-family:inherit; font-size:15px; color:var(--ink); }
.bf-input::placeholder{ color:#C2B0B8; }
.bf-input:focus{ outline:none; border-color:var(--rose); box-shadow:0 0 0 3px rgba(217,115,143,.18); }
.bf-label{ font-size:13px; font-weight:700; color:var(--muted); margin:0 2px 6px; display:block; }

.bf-tile{ aspect-ratio:1; border-radius:16px; position:relative; overflow:hidden; cursor:pointer;
  box-shadow: inset 0 -22px 30px -22px rgba(0,0,0,.4); }
.bf-tile .cap{ position:absolute; inset:auto 0 0 0; padding:8px 9px; color:#fff; font-size:11.5px;
  font-weight:700; background:linear-gradient(0deg,rgba(0,0,0,.42),rgba(0,0,0,0)); display:flex;
  align-items:center; justify-content:space-between; }
.bf-tile .glow{ position:absolute; inset:0 0 60% 0; background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0)); }

.bf-seg{ display:flex; background:#F3E7E0; border-radius:13px; padding:4px; gap:3px; height:44px; box-sizing:border-box; }
.bf-seg button{ flex:1; height:100%; border:none; background:none; padding:0 9px; border-radius:10px; cursor:pointer;
  font-family:inherit; font-weight:700; font-size:13.5px; color:var(--muted); transition:.15s;
  display:flex; align-items:center; justify-content:center; box-sizing:border-box; }
.bf-seg button.active{ background:#fff; color:var(--plum); box-shadow:0 4px 10px -6px rgba(42,26,46,.4); }

.bf-day{ min-width:50px; border:1px solid var(--sand); background:#fff; border-radius:14px; padding:9px 0;
  text-align:center; cursor:pointer; transition:.15s; flex:none; }
.bf-day:hover:not(.active){ border-color:var(--rose-soft); background:var(--blush); }
.bf-day.active{ background:linear-gradient(135deg,var(--plum),var(--rose)); border-color:transparent; color:var(--btn-ink); }
.bf-day .dn{ font-size:18px; font-weight:800; line-height:1; }
.bf-day .dl{ font-size:11px; font-weight:700; opacity:.8; margin-top:3px; }

.bf-photo-x{ position:absolute; top:10px; right:10px; width:32px; height:32px; border-radius:50%;
  background:rgba(20,12,22,.55); border:none; display:flex; align-items:center; justify-content:center;
  color:#fff; cursor:pointer; }

.bf-slot{ border:1px solid var(--sand); background:#fff; border-radius:12px; padding:11px 0; text-align:center;
  cursor:pointer; font-weight:700; font-size:14.5px; color:var(--ink); transition:.15s; }
.bf-slot:hover:not(.active):not(:disabled){ border-color:var(--rose-soft); background:var(--blush); }
.bf-slot.active{ background:var(--plum); border-color:var(--plum); color:var(--btn-ink); }
.bf-slot:disabled{ color:#CFC0C7; background:#F6EFEC; cursor:not-allowed; }

.bf-modalwrap{ position:absolute; inset:0; background:rgba(42,26,46,.5); display:flex; align-items:flex-end;
  justify-content:center; z-index:40; animation:bf-fade .2s ease; }
.bf-sheet{ background:var(--surface); width:100%; border-radius:26px 26px 0 0; padding:20px 18px 22px;
  max-height:92%; overflow-y:auto; animation:bf-up .26s cubic-bezier(.2,.8,.2,1); }

.bf-fullscreen{ position:absolute; top:0; left:0; right:0; max-height:100%; background:var(--surface);
  border-radius:0 0 26px 26px; z-index:40; overflow-y:auto; animation:bf-fade .2s ease; }
@keyframes bf-up{ from{ transform:translateY(40px); opacity:.6 } to{ transform:translateY(0); opacity:1 } }
@keyframes bf-fade{ from{ opacity:0 } to{ opacity:1 } }

.bf-toast{ position:absolute; left:50%; transform:translateX(-50%); bottom:78px; z-index:60;
  background:var(--ink); color:#fff; padding:11px 16px; border-radius:13px; font-size:13.5px; font-weight:600;
  display:flex; align-items:center; gap:8px; box-shadow:0 14px 30px -12px rgba(0,0,0,.5);
  animation:bf-up .26s ease; max-width:86%; }

.bf-hint{ font-size:12.5px; color:var(--muted); margin-top:10px; text-align:center; }
@keyframes spin{ to{ transform:rotate(360deg) } }
@media (prefers-reduced-motion: reduce){ .bf-root *{ animation:none !important; transition:none !important; } }

/* On phones the app fills the screen instead of floating as a framed card (note 3).
   .bf-phone gets a real bounded height (not height:auto) so its internal
   .bf-screen is the only thing that scrolls — the nav bar and app bar stay
   pinned in place regardless of how long the tab's content is. */
@media (max-width:560px){
  .bf-root{ padding:6px 6px 0; height:100dvh; min-height:0; overflow:hidden; }
  .bf-hint{ display:none; }
  .bf-phone{ width:100%; max-width:100%; flex:1 1 auto; min-height:0; height:auto; max-height:none;
    border-radius:18px; box-shadow:0 0 0 1px var(--sand); }
  .bf-root-live{ padding:0; }
  .bf-phone-live{ border-radius:0; box-shadow:none; }
}
`;

export default STYLE;
