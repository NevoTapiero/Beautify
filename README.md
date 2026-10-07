# Beautify

**Beautify is a white-label appointment-booking app with a private photo gallery, built for independent beauticians, nail artists and small beauty studios.**

Every studio gets its own branded app at its own link (for example `your-domain.com/nevo-nails`). Her clients open the link, book a treatment in a few taps and can install it on their phone's home screen as a real app, with the studio's own name, icon and colors. The studio owner runs her whole day from a separate manager view.

The interface is in **Hebrew and fully right-to-left (RTL)**, designed mobile-first.

**Live demo:** https://beautify-roan.vercel.app/demo

---

## Who it is for

| | |
|---|---|
| **Studio owner (manager)** | Sees today's schedule, manages the calendar, clients, services, working hours and breaks, approves photos, and controls notifications. |
| **Client** | Registers once, books and cancels appointments, confirms arrival, requests a fixed weekly slot, browses the studio's gallery and shares her own photos. |
| **Employee** *(Business edition)* | Gets a restricted app locked to her own schedule, gallery uploads and profile. |

---

## Features

**Booking**
- Pick a treatment, a day and a free time slot. Availability is calculated on the server from working hours, breaks, day overrides and existing appointments, so double-booking is not possible.
- Per-day overrides (close a day, special hours), recurring daily breaks, and an emergency "close the schedule now" button.
- The studio can ask a client to move an appointment; the client picks a new time.
- Standing weekly appointments: a client requests the same day and time every week, the owner approves, and one occurrence at a time is created automatically. The client can confirm arrival or skip just this week.
- Arrival confirmation, mark as completed or no-show, manual reminders.

**Private gallery**
- Studio portfolio of photos and videos, with likes.
- Clients can upload their own photos; nothing appears publicly until the owner approves it.

**Clients and notifications**
- Client list with search, history, blocking and deletion (which fully frees the phone number).
- In-app notifications and "!" badges for new activity. Automatic reminder settings (start of day, after a break, 24 hours before, one hour before).

**Per-studio branding and installable PWA**
- One codebase, many studios. The studio is resolved from the URL, and the app name, icon, colors and web manifest are generated per studio, so each studio installs as its own app.
- The whole color theme is derived from just two values stored on the studio row (`color_primary`, `color_accent`).

**Two editions from one codebase**
- **Private edition:** a solo beautician.
- **Business edition** (switched per studio): multiple cosmeticians with their own schedules, an employee app mode locked to one person, a change-approval flow where employee schedule edits are requests the owner approves or declines, employee profiles and photos, per-cosmetician gallery filtering, and a weekly appointment-log PDF export.

### What is simulated today

Online payment (Bit and credit card) is currently a **UI simulation only**. Real payment providers, official tax invoices (Green Invoice / iCount) and SMS / WhatsApp reminders are planned but not connected yet.

---

## Tech stack

- **Frontend:** React 18 + Vite, `lucide-react` icons, plain CSS-in-JS (no UI framework)
- **Backend:** [Supabase](https://supabase.com), meaning Postgres, Auth, Storage and Row Level Security
- **Hosting:** Vercel (a static build plus one small serverless function for the dynamic web manifest)
- **Multi-tenancy:** every table carries a `studio_id` and is isolated by Row Level Security. Sensitive operations (slot availability, client deletion, standing appointments) run as `SECURITY DEFINER` Postgres functions.

```
src/
├─ App.jsx                  # app orchestrator: state, manager and client action bundles
├─ components/
│  ├─ manager/              # owner and employee screens (home, calendar, clients, gallery, settings)
│  ├─ client/               # client screens (book, my appointments, gallery, profile)
│  └─ ui/                   # shared building blocks
├─ lib/
│  ├─ api.js                # every Supabase call lives here
│  ├─ theme.js              # derives the full palette from two studio colors
│  ├─ pwa.js                # per-studio manifest, icons and title
│  └─ seen.js               # "last seen" tracking for the "!" badges
└─ styles.js                # global styles (RTL, mobile layout)
api/manifest.js             # serverless function: per-studio web manifest
public/sw.js                # service worker
supabase/schema.sql         # complete, idempotent database schema
supabase/v*.sql             # the incremental migrations that built it up
scripts/                    # optional admin and seed scripts
```

---

## Run it yourself

You need **Node.js 18+** and a free **Supabase** project.

**1. Install**

```bash
git clone https://github.com/NevoTapiero/Beautify.git
cd Beautify
npm install
```

**2. Create the database**

In the Supabase dashboard open *SQL Editor* and run [`supabase/schema.sql`](supabase/schema.sql). It is the single source of truth, it is idempotent, and it never deletes data, so re-running it is safe. It creates all tables, policies and functions, the two Storage buckets used for photos (`gallery` and `avatars`), and a `demo` studio.

**3. Configure environment variables**

```bash
cp .env.example .env
```

Fill in your project's URL and the **anon** key (*Project Settings → API*). The anon key is designed to be exposed in the browser; access is protected by Row Level Security.

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**4. Create a manager account**

1. In Supabase *Authentication → Users*, add a user (email and password).
2. In the *Table Editor*, open `studios` and set the `owner_id` of your studio row (for example `demo`) to that user's id.
3. Log in from the manager view with that email and password.

**5. Start**

```bash
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

The first path segment of the URL selects the studio (`/demo`, `/your-slug`). With no path it falls back to `demo`.

### Add another studio

Insert a row into `studios` with a unique `slug` and a `name`, link it to a manager through `owner_id`, and open `/<slug>`. Optionally set `color_primary` and `color_accent` (hex values) to re-theme the whole app, and `logo_url` for the app icon. To turn on the Business edition, use the edition toggle in the manager's *Settings → Additional settings*.

### Deploy

The repo is ready for Vercel: `vercel.json` rewrites every path to the SPA and `api/manifest.js` becomes a serverless function. Set the same two `VITE_SUPABASE_*` variables in the project settings.

---

## Optional scripts

`scripts/admin-users.mjs` and `scripts/seed-showcase.mjs` are one-off admin helpers. They need the Supabase **service role** key, kept only in a local, git-ignored `.env.local` file as `SUPABASE_SERVICE_ROLE_KEY`. **Never commit that key and never ship it to the browser.**

---

## Security notes

- Only the public anon key is used in the client. All data access is guarded by Row Level Security policies defined in `supabase/schema.sql`.
- If you fork this, review the policies and the `SECURITY DEFINER` functions against your own threat model before putting real customer data in it.
- The Business edition switch in Settings is guarded by a hard-coded activation code in the client. It is a convenience gate, not a security boundary.

---

## Roadmap

- Real payments (Bit and credit card), with the final charge taken only after the appointment is completed, so cancellations and no-shows are never charged
- Official tax invoices (Green Invoice / iCount)
- SMS / WhatsApp reminders
- A guided signup flow for new studios

---

## Contributing and feedback

Issues and pull requests are welcome. Because the UI is Hebrew and RTL, please keep layout changes RTL-safe and test them on a phone-sized viewport.
