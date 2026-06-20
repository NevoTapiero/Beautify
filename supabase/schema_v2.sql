-- ============================================================
-- Beautify — schema v2 (additive migration)
-- Safe to run on top of schema.sql. Everything is "if not exists" /
-- idempotent, so running it twice does no harm.
-- Paste into Supabase → SQL Editor → New query → Run.
-- ============================================================

-- ---------- 1. CLIENTS: profile photo ----------
alter table clients add column if not exists avatar_url text;

-- ---------- 2. STUDIOS: persisted notification settings (note 50) ----------
alter table studios add column if not exists notify_day_start   boolean not null default true;
alter table studios add column if not exists notify_after_break boolean not null default true;
alter table studios add column if not exists notify_client_24h  boolean not null default true;
alter table studios add column if not exists notify_client_1h   boolean not null default true;

-- ---------- 3. GALLERY LIKES (note 17 — toggle, one like per client) ----------
create table if not exists gallery_likes (
  gallery_id uuid not null references gallery(id) on delete cascade,
  client_id  uuid not null references clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (gallery_id, client_id)
);
alter table gallery_likes enable row level security;

-- anyone signed in may read like counts; a client manages only her own like.
drop policy if exists likes_read   on gallery_likes;
drop policy if exists likes_insert on gallery_likes;
drop policy if exists likes_delete on gallery_likes;
create policy likes_read   on gallery_likes for select using (true);
create policy likes_insert on gallery_likes for insert
  with check (client_id in (select id from clients where auth_user_id = auth.uid()));
create policy likes_delete on gallery_likes for delete
  using (client_id in (select id from clients where auth_user_id = auth.uid()));

-- ---------- 4. BREAKS (note 39 — manager blocks time on the calendar) ----------
create table if not exists breaks (
  id         uuid primary key default gen_random_uuid(),
  studio_id  uuid not null references studios(id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  title      text not null default 'הפסקה',
  created_at timestamptz not null default now()
);
alter table breaks enable row level security;

-- public read (so the client booking screen can hide busy times); manager manages.
drop policy if exists breaks_read  on breaks;
drop policy if exists breaks_write on breaks;
create policy breaks_read  on breaks for select using (true);
create policy breaks_write on breaks for all
  using (is_studio_manager(studio_id)) with check (is_studio_manager(studio_id));

-- ---------- 5. NOTIFICATIONS (notes 26, 37 — messages to the client) ----------
-- A manager "reminder" or "cancellation" becomes a message here, NOT a fake
-- appointment. The client reads these in her notifications area.
create table if not exists notifications (
  id             uuid primary key default gen_random_uuid(),
  studio_id      uuid not null references studios(id) on delete cascade,
  client_id      uuid not null references clients(id) on delete cascade,
  type           text not null default 'message',   -- message | reminder | reschedule | cancelled
  title          text not null,
  body           text,
  appointment_id uuid references appointments(id) on delete set null,
  read           boolean not null default false,
  created_at     timestamptz not null default now()
);
alter table notifications enable row level security;

-- client reads/updates her own; manager creates/reads for her studio.
drop policy if exists notif_read   on notifications;
drop policy if exists notif_insert on notifications;
drop policy if exists notif_update on notifications;
create policy notif_read on notifications for select
  using (is_studio_manager(studio_id)
         or client_id in (select id from clients where auth_user_id = auth.uid()));
create policy notif_insert on notifications for insert
  with check (is_studio_manager(studio_id)
              or client_id in (select id from clients where auth_user_id = auth.uid()));
create policy notif_update on notifications for update
  using (is_studio_manager(studio_id)
         or client_id in (select id from clients where auth_user_id = auth.uid()));

-- ---------- 6. STORAGE BUCKETS (note 9, 15, 47 — real photo uploads) ----------
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- Public read (these images are meant to be shown); any signed-in user may upload
-- and delete within these two buckets. (Pilot-grade simplicity — the gallery TABLE
-- still controls approval/visibility; tighten per-object ownership later.)
drop policy if exists "bf storage read"   on storage.objects;
drop policy if exists "bf storage insert" on storage.objects;
drop policy if exists "bf storage delete" on storage.objects;
create policy "bf storage read" on storage.objects for select
  using (bucket_id in ('gallery', 'avatars'));
create policy "bf storage insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('gallery', 'avatars'));
create policy "bf storage delete" on storage.objects for delete to authenticated
  using (bucket_id in ('gallery', 'avatars'));

-- ---------- 7. CLEAN OUT any leftover demo rows in the DB ----------
-- (App-level demo data is removed in code; this clears test rows you created
--  while we were wiring things up, so the pilot starts from a clean slate.)
delete from appointments a using studios s
  where a.studio_id = s.id and s.slug = 'demo';
delete from gallery g using studios s
  where g.studio_id = s.id and s.slug = 'demo';
delete from clients c using studios s
  where c.studio_id = s.id and s.slug = 'demo';

-- Done. Your studio + services + owner login stay intact; only test
-- clients/appointments/photos are cleared.
