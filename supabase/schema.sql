-- ============================================================
-- Beautify — database schema (single source of truth)
-- Multi-tenant: every row carries studio_id and is isolated by Row Level
-- Security. Safe & idempotent — running it again won't harm existing data
-- (it does NOT delete anything).
-- Paste into Supabase → SQL Editor → New query → Run.
-- ============================================================

-- ---------- TABLES ----------

create table if not exists studios (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  logo_url      text,
  color_primary text not null default '#7C2A53',
  color_accent  text not null default '#D9738F',
  owner_id      uuid references auth.users(id),
  notify_day_start   boolean not null default true,
  notify_after_break boolean not null default true,
  notify_client_24h  boolean not null default true,
  notify_client_1h   boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists services (
  id         uuid primary key default gen_random_uuid(),
  studio_id  uuid not null references studios(id) on delete cascade,
  name       text not null,
  duration   int  not null,
  price      int  not null,
  gradient   text,
  active     boolean not null default true,
  sort_order int not null default 0
);

create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  studio_id     uuid not null references studios(id) on delete cascade,
  auth_user_id  uuid references auth.users(id),
  name          text not null,
  phone         text not null,
  email         text,
  avatar_url    text,
  blocked       boolean not null default false,
  health_signed_at timestamptz,
  created_at    timestamptz not null default now()
);

create table if not exists appointments (
  id           uuid primary key default gen_random_uuid(),
  studio_id    uuid not null references studios(id) on delete cascade,
  client_id    uuid not null references clients(id) on delete cascade,
  service_id   uuid not null references services(id),
  starts_at    timestamptz not null,
  status       text not null default 'confirmed',   -- confirmed | cancelled | completed | no_show
  arrival_confirmed boolean not null default false,
  paid         boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists gallery (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references studios(id) on delete cascade,
  image_url   text,
  caption     text,
  uploaded_by text,
  client_id   uuid references clients(id) on delete cascade,
  likes       int not null default 0,
  status      text not null default 'pending',      -- pending | approved | rejected
  created_at  timestamptz not null default now()
);

create table if not exists gallery_likes (
  gallery_id uuid not null references gallery(id) on delete cascade,
  client_id  uuid not null references clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (gallery_id, client_id)
);

create table if not exists breaks (
  id         uuid primary key default gen_random_uuid(),
  studio_id  uuid not null references studios(id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  title      text not null default 'הפסקה',
  created_at timestamptz not null default now()
);

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

-- Weekly default working hours (one row per weekday, 0=Sun .. 6=Sat).
create table if not exists work_hours (
  studio_id  uuid not null references studios(id) on delete cascade,
  weekday    int  not null,
  is_open    boolean not null default true,
  start_time time not null default '09:00',
  end_time   time not null default '19:00',
  primary key (studio_id, weekday)
);

-- Per-date overrides (holiday, short day) — replace the weekly default for a date.
create table if not exists work_overrides (
  studio_id  uuid not null references studios(id) on delete cascade,
  date       date not null,
  is_open    boolean not null default true,
  start_time time not null default '09:00',
  end_time   time not null default '19:00',
  primary key (studio_id, date)
);

-- ---------- HELPER FUNCTIONS (SECURITY DEFINER) ----------

-- True when the logged-in user owns the given studio (is its manager).
create or replace function is_studio_manager(target uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from studios s where s.id = target and s.owner_id = auth.uid());
$$;

-- True when the logged-in user owns the given client row.
create or replace function client_owns(p_client uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from clients where id = p_client and auth_user_id = auth.uid());
$$;
grant execute on function client_owns(uuid) to anon, authenticated;

-- True when a blocked client with this phone/email exists (used pre-login).
create or replace function is_contact_blocked(p_studio uuid, p_phone text, p_email text)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from clients
    where studio_id = p_studio and blocked = true
      and (phone = p_phone or (p_email is not null and p_email <> '' and email = p_email))
  );
$$;
grant execute on function is_contact_blocked(uuid, text, text) to anon, authenticated;

-- Client shares a photo for herself (lands as 'pending'). SECURITY DEFINER so a
-- client can file her own photo reliably without forging id/status.
create or replace function share_photo(p_studio uuid, p_image_url text, p_caption text)
returns gallery language plpgsql security definer as $$
declare v_client clients; v_row gallery;
begin
  select * into v_client from clients
    where studio_id = p_studio and auth_user_id = auth.uid() limit 1;
  if v_client.id is null then raise exception 'not a client of this studio'; end if;
  insert into gallery(studio_id, client_id, image_url, caption, uploaded_by, status)
    values (p_studio, v_client.id, p_image_url,
            coalesce(nullif(p_caption, ''), 'העבודה שלי'), v_client.name, 'pending')
    returning * into v_row;
  return v_row;
end $$;
grant execute on function share_photo(uuid, text, text) to authenticated;

-- Fully deletes a client (incl. her auth login) so the phone is freed for
-- re-registration. Only the studio's manager may call it.
create or replace function manager_delete_client(p_client uuid)
returns void language plpgsql security definer as $$
declare v_auth uuid; v_studio uuid;
begin
  select auth_user_id, studio_id into v_auth, v_studio from clients where id = p_client;
  if v_studio is null then return; end if;
  if not is_studio_manager(v_studio) then raise exception 'not authorized'; end if;
  delete from gallery where client_id = p_client;
  delete from clients where id = p_client;        -- cascades appointments/likes/notifications
  if v_auth is not null then delete from auth.users where id = v_auth; end if;
end $$;
grant execute on function manager_delete_client(uuid) to authenticated;

-- Returns the calling client's own photos at any status (incl. pending).
create or replace function my_uploads()
returns setof gallery language sql security definer stable as $$
  select g.* from gallery g
  join clients c on c.id = g.client_id
  where c.auth_user_id = auth.uid()
  order by g.created_at desc;
$$;
grant execute on function my_uploads() to authenticated;

-- Free start-times (every 15 min) where a p_duration-minute service fits, given
-- the studio's working hours minus existing appointments and breaks (Israel time).
create or replace function available_slots(p_studio uuid, p_date date, p_duration int)
returns setof text language plpgsql security definer stable
set timezone = 'Asia/Jerusalem' as $$
declare
  v_wd int := extract(dow from p_date);
  v_open time; v_close time; v_is_open boolean;
  v_slot timestamptz; v_window_end timestamptz; v_cand_end timestamptz;
  v_dur interval := make_interval(mins => p_duration);
begin
  select is_open, start_time, end_time into v_is_open, v_open, v_close
    from work_overrides where studio_id = p_studio and date = p_date;
  if not found then
    select is_open, start_time, end_time into v_is_open, v_open, v_close
      from work_hours where studio_id = p_studio and weekday = v_wd;
  end if;
  if not found or not coalesce(v_is_open, false) then return; end if;

  v_slot := (p_date + v_open)::timestamptz;
  v_window_end := (p_date + v_close)::timestamptz;

  while v_slot + v_dur <= v_window_end loop
    v_cand_end := v_slot + v_dur;
    if v_slot > now()
       and not exists (
         select 1 from appointments a join services s on s.id = a.service_id
         where a.studio_id = p_studio and a.status <> 'cancelled'
           and tstzrange(a.starts_at, a.starts_at + make_interval(mins => s.duration))
               && tstzrange(v_slot, v_cand_end))
       and not exists (
         select 1 from breaks b where b.studio_id = p_studio
           and tstzrange(b.starts_at, b.ends_at) && tstzrange(v_slot, v_cand_end))
    then
      return next to_char(v_slot, 'HH24:MI');
    end if;
    v_slot := v_slot + interval '15 minutes';
  end loop;
end $$;
grant execute on function available_slots(uuid, date, int) to anon, authenticated;

-- ---------- ENABLE RLS ----------
alter table studios       enable row level security;
alter table services      enable row level security;
alter table clients       enable row level security;
alter table appointments  enable row level security;
alter table gallery       enable row level security;
alter table gallery_likes enable row level security;
alter table breaks        enable row level security;
alter table notifications enable row level security;
alter table work_hours     enable row level security;
alter table work_overrides enable row level security;

-- ---------- POLICIES ----------

drop policy if exists studios_read   on studios;
drop policy if exists studios_update on studios;
create policy studios_read   on studios for select using (true);
create policy studios_update on studios for update using (owner_id = auth.uid());

drop policy if exists services_read  on services;
drop policy if exists services_write on services;
create policy services_read  on services for select using (true);
create policy services_write on services for all
  using (is_studio_manager(studio_id)) with check (is_studio_manager(studio_id));

drop policy if exists clients_read   on clients;
drop policy if exists clients_insert on clients;
drop policy if exists clients_update on clients;
drop policy if exists clients_delete on clients;
create policy clients_read on clients for select
  using (auth_user_id = auth.uid() or is_studio_manager(studio_id));
create policy clients_insert on clients for insert
  with check (auth_user_id = auth.uid() or is_studio_manager(studio_id));
create policy clients_update on clients for update
  using (auth_user_id = auth.uid() or is_studio_manager(studio_id));
create policy clients_delete on clients for delete
  using (is_studio_manager(studio_id));

drop policy if exists appts_read   on appointments;
drop policy if exists appts_insert on appointments;
drop policy if exists appts_update on appointments;
drop policy if exists appts_delete on appointments;
create policy appts_read on appointments for select
  using (is_studio_manager(studio_id) or client_owns(client_id));
create policy appts_insert on appointments for insert
  with check (is_studio_manager(studio_id) or client_owns(client_id));
create policy appts_update on appointments for update
  using (is_studio_manager(studio_id) or client_owns(client_id));
create policy appts_delete on appointments for delete
  using (is_studio_manager(studio_id) or client_owns(client_id));

drop policy if exists gallery_read       on gallery;
drop policy if exists gallery_insert     on gallery;
drop policy if exists gallery_write      on gallery;
drop policy if exists gallery_delete     on gallery;
drop policy if exists gallery_delete_own on gallery;
create policy gallery_read on gallery for select
  using (status = 'approved' or is_studio_manager(studio_id) or client_owns(client_id));
create policy gallery_insert on gallery for insert
  with check (is_studio_manager(studio_id) or client_owns(client_id));
create policy gallery_write on gallery for update
  using (is_studio_manager(studio_id)) with check (is_studio_manager(studio_id));
create policy gallery_delete on gallery for delete
  using (is_studio_manager(studio_id));
create policy gallery_delete_own on gallery for delete
  using (status in ('pending', 'rejected') and client_owns(client_id));

drop policy if exists likes_read   on gallery_likes;
drop policy if exists likes_insert on gallery_likes;
drop policy if exists likes_delete on gallery_likes;
create policy likes_read   on gallery_likes for select using (true);
create policy likes_insert on gallery_likes for insert with check (client_owns(client_id));
create policy likes_delete on gallery_likes for delete using (client_owns(client_id));

drop policy if exists breaks_read  on breaks;
drop policy if exists breaks_write on breaks;
create policy breaks_read  on breaks for select using (true);
create policy breaks_write on breaks for all
  using (is_studio_manager(studio_id)) with check (is_studio_manager(studio_id));

drop policy if exists notif_read   on notifications;
drop policy if exists notif_insert on notifications;
drop policy if exists notif_update on notifications;
create policy notif_read on notifications for select
  using (is_studio_manager(studio_id) or client_owns(client_id));
create policy notif_insert on notifications for insert
  with check (is_studio_manager(studio_id) or client_owns(client_id));
create policy notif_update on notifications for update
  using (is_studio_manager(studio_id) or client_owns(client_id));

drop policy if exists wh_read  on work_hours;
drop policy if exists wh_write on work_hours;
create policy wh_read  on work_hours for select using (true);
create policy wh_write on work_hours for all
  using (is_studio_manager(studio_id)) with check (is_studio_manager(studio_id));

drop policy if exists wo_read  on work_overrides;
drop policy if exists wo_write on work_overrides;
create policy wo_read  on work_overrides for select using (true);
create policy wo_write on work_overrides for all
  using (is_studio_manager(studio_id)) with check (is_studio_manager(studio_id));

-- ---------- STORAGE BUCKETS ----------
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

drop policy if exists "bf storage read"   on storage.objects;
drop policy if exists "bf storage insert" on storage.objects;
drop policy if exists "bf storage delete" on storage.objects;
create policy "bf storage read" on storage.objects for select
  using (bucket_id in ('gallery', 'avatars'));
create policy "bf storage insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('gallery', 'avatars'));
create policy "bf storage delete" on storage.objects for delete to authenticated
  using (bucket_id in ('gallery', 'avatars'));

-- ---------- SEED: one demo studio so the app has branding on day one ----------
-- (No demo services — the manager adds her own from Settings.)
insert into studios (slug, name) values ('demo', 'הסטודיו של דנה')
  on conflict (slug) do nothing;

-- Default weekly hours for the demo studio (Sun–Thu 09–19, Fri 09–14, Sat closed)
insert into work_hours (studio_id, weekday, is_open, start_time, end_time)
select s.id, v.wd, v.op, v.st::time, v.en::time
from studios s, (values
  (0, true,  '09:00', '19:00'), (1, true,  '09:00', '19:00'), (2, true, '09:00', '19:00'),
  (3, true,  '09:00', '19:00'), (4, true,  '09:00', '19:00'), (5, true, '09:00', '14:00'),
  (6, false, '09:00', '19:00')
) as v(wd, op, st, en)
where s.slug = 'demo'
on conflict (studio_id, weekday) do nothing;


-- ===== V5: standing weekly appointments (see v5_standing.sql) =====

create table if not exists standing_requests (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references studios(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  service_id  uuid not null references services(id),
  weekday     int  not null,          -- 0=Sunday .. 6=Saturday (matches JS getDay / pg dow)
  "time"      text not null,          -- 'HH:MM'
  status      text not null default 'pending',  -- pending | approved | declined | cancelled
  created_at  timestamptz not null default now()
);

-- Link materialized appointments back to the standing rule that created them.
alter table appointments add column if not exists standing_id uuid references standing_requests(id) on delete set null;

alter table standing_requests enable row level security;
-- All access is via the SECURITY DEFINER functions below, so no table policies
-- are needed (RLS on + no policy = locked to definer functions only).

-- Client creates a request (resolved from her auth session). One active at a time.
create or replace function request_standing(p_studio uuid, p_service uuid, p_weekday int, p_time text)
returns standing_requests language plpgsql security definer as $$
declare v_client clients; v_row standing_requests;
begin
  select * into v_client from clients where studio_id = p_studio and auth_user_id = auth.uid() limit 1;
  if v_client.id is null then raise exception 'not a client of this studio'; end if;
  if exists (select 1 from standing_requests where client_id = v_client.id and status in ('pending','approved')) then
    raise exception 'already has an active standing request';
  end if;
  insert into standing_requests(studio_id, client_id, service_id, weekday, "time", status)
    values (p_studio, v_client.id, p_service, p_weekday, p_time, 'pending')
    returning * into v_row;
  return v_row;
end $$;

-- Create the concrete weekly appointments for the next p_weeks weeks, skipping
-- past times, already-created occurrences, and slots that collide with another
-- (non-cancelled) appointment. Times are anchored to Asia/Jerusalem.
create or replace function materialize_standing(p_id uuid, p_weeks int default 1)
returns void language plpgsql security definer as $$
declare r standing_requests; dur int; d date; ts timestamptz; i int;
begin
  select * into r from standing_requests where id = p_id;
  if r.id is null or r.status <> 'approved' then return; end if;
  select duration into dur from services where id = r.service_id;
  if dur is null then return; end if;
  for i in 0..(p_weeks * 7) loop
    d := current_date + i;
    if extract(dow from d)::int = r.weekday then
      ts := (d::text || ' ' || r."time")::timestamp at time zone 'Asia/Jerusalem';
      if ts < now() then continue; end if;
      if exists (select 1 from appointments where standing_id = r.id and starts_at = ts and status <> 'cancelled') then continue; end if;
      if exists (
        select 1 from appointments a join services s on s.id = a.service_id
        where a.studio_id = r.studio_id and a.status <> 'cancelled'
          and a.starts_at < ts + make_interval(mins => dur)
          and ts < a.starts_at + make_interval(mins => s.duration)
      ) then continue; end if;
      insert into appointments(studio_id, client_id, service_id, starts_at, status, standing_id)
        values (r.studio_id, r.client_id, r.service_id, ts, 'confirmed', r.id);
    end if;
  end loop;
end $$;

-- Manager approves a request, which books the rolling horizon.
create or replace function approve_standing(p_id uuid)
returns void language plpgsql security definer as $$
declare r standing_requests;
begin
  select * into r from standing_requests where id = p_id;
  if r.id is null then raise exception 'not found'; end if;
  if not is_studio_manager(r.studio_id) then raise exception 'not your studio'; end if;
  update standing_requests set status = 'approved' where id = p_id;
  perform materialize_standing(p_id, 1);
end $$;

-- Manager declines a pending request (no appointments created).
create or replace function decline_standing(p_id uuid)
returns void language plpgsql security definer as $$
declare r standing_requests;
begin
  select * into r from standing_requests where id = p_id;
  if r.id is null then return; end if;
  if not is_studio_manager(r.studio_id) then raise exception 'not your studio'; end if;
  update standing_requests set status = 'declined' where id = p_id;
end $$;

-- Either the owning client or the manager can end a standing slot. Future,
-- not-yet-arrived appointments from it are cancelled; past ones are kept.
create or replace function cancel_standing(p_id uuid)
returns void language plpgsql security definer as $$
declare r standing_requests;
begin
  select * into r from standing_requests where id = p_id;
  if r.id is null then return; end if;
  if not (is_studio_manager(r.studio_id) or client_owns(r.client_id)) then raise exception 'not allowed'; end if;
  update standing_requests set status = 'cancelled' where id = p_id;
  update appointments set status = 'cancelled'
    where standing_id = p_id and status = 'confirmed' and starts_at > now() and arrival_confirmed = false;
end $$;

-- Top up every approved standing slot for a studio (called on manager app load
-- so the horizon keeps rolling forward over time).
create or replace function topup_standing(p_studio uuid)
returns void language plpgsql security definer as $$
declare r standing_requests;
begin
  if not is_studio_manager(p_studio) then return; end if;
  for r in select * from standing_requests where studio_id = p_studio and status = 'approved' loop
    perform materialize_standing(r.id, 1);
  end loop;
end $$;

-- Reads.
create or replace function manager_standing(p_studio uuid)
returns table(id uuid, client_id uuid, client_name text, service_id uuid, service_name text, weekday int, "time" text, status text)
language sql security definer stable as $$
  select sr.id, sr.client_id, c.name, sr.service_id, s.name, sr.weekday, sr."time", sr.status
  from standing_requests sr
  join clients  c on c.id = sr.client_id
  join services s on s.id = sr.service_id
  where sr.studio_id = p_studio and sr.status in ('pending','approved')
  order by sr.status, sr.created_at;
$$;

create or replace function my_standing()
returns table(id uuid, service_id uuid, service_name text, weekday int, "time" text, status text)
language sql security definer stable as $$
  select sr.id, sr.service_id, s.name, sr.weekday, sr."time", sr.status
  from standing_requests sr
  join clients  c on c.id = sr.client_id
  join services s on s.id = sr.service_id
  where c.auth_user_id = auth.uid() and sr.status in ('pending','approved')
  order by sr.created_at;
$$;

-- ===== V6.1: service image (see v6_1_service_image.sql) =====
alter table services add column if not exists image_url text;


-- ===== BUSINESS EDITION V1 (see v_business.sql) =====

-- 1) Business mode switch on the studio.
alter table studios add column if not exists business_mode boolean not null default false;

-- 2) Employees (registered businesses can have staff).
create table if not exists employees (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references studios(id) on delete cascade,
  name        text not null,
  title       text,
  color       text not null default '#D9738F',
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
alter table employees enable row level security;
drop policy if exists employees_read  on employees;
drop policy if exists employees_write on employees;
create policy employees_read  on employees for select using (true);
create policy employees_write on employees for all
  using (is_studio_manager(studio_id)) with check (is_studio_manager(studio_id));

-- Appointments can be assigned to a specific employee.
alter table appointments add column if not exists employee_id uuid references employees(id) on delete set null;

-- 3) Invoices (issued per appointment). Real tax-authority invoices need an
--    external provider; this stores/numbers them in-app as the foundation.
create table if not exists invoices (
  id             uuid primary key default gen_random_uuid(),
  studio_id      uuid not null references studios(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  client_id      uuid references clients(id) on delete set null,
  number         int not null,
  amount         int not null default 0,
  client_name    text,
  service_name   text,
  status         text not null default 'issued',
  issued_at      timestamptz not null default now()
);
alter table invoices enable row level security;
drop policy if exists invoices_read  on invoices;
create policy invoices_read on invoices for select using (is_studio_manager(studio_id));

-- Issue an invoice for an appointment (sequential number per studio). Returns
-- the existing one if already issued, so it's safe to call twice.
create or replace function issue_invoice(p_appointment uuid)
returns invoices language plpgsql security definer as $$
declare a appointments; v_row invoices; v_price int; v_cname text; v_sname text; v_num int;
begin
  select * into a from appointments where id = p_appointment;
  if a.id is null then raise exception 'appointment not found'; end if;
  if not is_studio_manager(a.studio_id) then raise exception 'not your studio'; end if;

  select * into v_row from invoices where appointment_id = p_appointment limit 1;
  if v_row.id is not null then return v_row; end if;

  select price, name into v_price, v_sname from services where id = a.service_id;
  select name into v_cname from clients where id = a.client_id;
  select coalesce(max(number), 0) + 1 into v_num from invoices where studio_id = a.studio_id;

  insert into invoices(studio_id, appointment_id, client_id, number, amount, client_name, service_name, status)
    values (a.studio_id, p_appointment, a.client_id, v_num, coalesce(v_price, 0), v_cname, v_sname, 'issued')
    returning * into v_row;
  return v_row;
end $$;

-- 4) Employee-aware availability. When p_employee is given, only THAT
--    employee's appointments block a slot (others can serve in parallel);
--    when null it behaves studio-wide as before. Breaks are always studio-wide.
drop function if exists available_slots(uuid, date, int);
create or replace function available_slots(p_studio uuid, p_date date, p_duration int, p_employee uuid default null)
returns setof text language plpgsql security definer stable
set timezone = 'Asia/Jerusalem' as $$
declare
  v_wd int := extract(dow from p_date);
  v_open time; v_close time; v_is_open boolean;
  v_slot timestamptz; v_window_end timestamptz; v_cand_end timestamptz;
  v_dur interval := make_interval(mins => p_duration);
begin
  select is_open, start_time, end_time into v_is_open, v_open, v_close
    from work_overrides where studio_id = p_studio and date = p_date;
  if not found then
    select is_open, start_time, end_time into v_is_open, v_open, v_close
      from work_hours where studio_id = p_studio and weekday = v_wd;
  end if;
  if not found or not coalesce(v_is_open, false) then return; end if;

  v_slot := (p_date + v_open)::timestamptz;
  v_window_end := (p_date + v_close)::timestamptz;

  while v_slot + v_dur <= v_window_end loop
    v_cand_end := v_slot + v_dur;
    if v_slot > now()
       and not exists (
         select 1 from appointments a join services s on s.id = a.service_id
         where a.studio_id = p_studio and a.status <> 'cancelled'
           and (p_employee is null or a.employee_id = p_employee)
           and tstzrange(a.starts_at, a.starts_at + make_interval(mins => s.duration))
               && tstzrange(v_slot, v_cand_end))
       and not exists (
         select 1 from breaks b where b.studio_id = p_studio
           and tstzrange(b.starts_at, b.ends_at) && tstzrange(v_slot, v_cand_end))
    then
      return next to_char(v_slot, 'HH24:MI');
    end if;
    v_slot := v_slot + interval '15 minutes';
  end loop;
end $$;


-- ===== BUSINESS V2 Phase 1 (see v_business2_p1.sql) =====

alter table gallery add column if not exists employee_id uuid references employees(id) on delete set null;

-- share_photo now also records which cosmetician did the work.
drop function if exists share_photo(uuid, text, text);
create or replace function share_photo(p_studio uuid, p_image_url text, p_caption text, p_employee uuid default null)
returns gallery language plpgsql security definer as $$
declare v_client clients; v_row gallery;
begin
  select * into v_client from clients
    where studio_id = p_studio and auth_user_id = auth.uid() limit 1;
  if v_client.id is null then raise exception 'not a client of this studio'; end if;
  insert into gallery(studio_id, client_id, image_url, caption, uploaded_by, status, employee_id)
    values (p_studio, v_client.id, p_image_url,
            coalesce(nullif(p_caption, ''), 'העבודה שלי'), v_client.name, 'pending', p_employee)
    returning * into v_row;
  return v_row;
end $$;


-- ===== BUSINESS V2 Phase 2 (see v_business2_p2.sql) =====

-- Add employee_id to the schedule tables (NULL = the owner / studio herself).
alter table work_hours     add column if not exists employee_id uuid references employees(id) on delete cascade;
alter table work_overrides add column if not exists employee_id uuid references employees(id) on delete cascade;
alter table breaks         add column if not exists employee_id uuid references employees(id) on delete cascade;

-- Replace the old (studio_id, weekday/date) primary keys with uniqueness that
-- also includes the cosmetician. NULLS NOT DISTINCT (PG15+) keeps the owner to
-- a single row per weekday/date.
alter table work_hours     drop constraint if exists work_hours_pkey;
alter table work_overrides drop constraint if exists work_overrides_pkey;
create unique index if not exists work_hours_uniq     on work_hours     (studio_id, weekday, employee_id) nulls not distinct;
create unique index if not exists work_overrides_uniq on work_overrides (studio_id, date,    employee_id) nulls not distinct;

-- Availability now reads the chosen cosmetician's own hours + breaks.
create or replace function available_slots(p_studio uuid, p_date date, p_duration int, p_employee uuid default null)
returns setof text language plpgsql security definer stable
set timezone = 'Asia/Jerusalem' as $$
declare
  v_wd int := extract(dow from p_date);
  v_open time; v_close time; v_is_open boolean;
  v_slot timestamptz; v_window_end timestamptz; v_cand_end timestamptz;
  v_dur interval := make_interval(mins => p_duration);
begin
  select is_open, start_time, end_time into v_is_open, v_open, v_close
    from work_overrides where studio_id = p_studio and date = p_date
      and employee_id is not distinct from p_employee;
  if not found then
    select is_open, start_time, end_time into v_is_open, v_open, v_close
      from work_hours where studio_id = p_studio and weekday = v_wd
        and employee_id is not distinct from p_employee;
  end if;
  if not found or not coalesce(v_is_open, false) then return; end if;

  v_slot := (p_date + v_open)::timestamptz;
  v_window_end := (p_date + v_close)::timestamptz;

  while v_slot + v_dur <= v_window_end loop
    v_cand_end := v_slot + v_dur;
    if v_slot > now()
       and not exists (
         select 1 from appointments a join services s on s.id = a.service_id
         where a.studio_id = p_studio and a.status <> 'cancelled'
           and (p_employee is null or a.employee_id = p_employee)
           and tstzrange(a.starts_at, a.starts_at + make_interval(mins => s.duration))
               && tstzrange(v_slot, v_cand_end))
       and not exists (
         select 1 from breaks b where b.studio_id = p_studio
           and b.employee_id is not distinct from p_employee
           and tstzrange(b.starts_at, b.ends_at) && tstzrange(v_slot, v_cand_end))
    then
      return next to_char(v_slot, 'HH24:MI');
    end if;
    v_slot := v_slot + interval '15 minutes';
  end loop;
end $$;

-- ===== BUSINESS V3: employee avatar =====
alter table employees add column if not exists avatar_url text;


-- ===== BUSINESS V2 Phase 3b (see v_business3b.sql) =====
-- An employee's proposed schedule change, awaiting manager approval.
-- (The locked device runs as the manager auth, so RLS is manager-scoped; the
-- employee/manager distinction is a UI workflow, not a security boundary.)
create table if not exists schedule_requests (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references studios(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  kind        text not null,                 -- weekly | day | break | closeday
  payload     jsonb not null default '{}',
  label       text,                          -- human-readable summary
  status      text not null default 'pending',  -- pending | approved | declined
  created_at  timestamptz not null default now()
);
alter table schedule_requests enable row level security;
drop policy if exists schedule_requests_all on schedule_requests;
create policy schedule_requests_all on schedule_requests for all
  using (is_studio_manager(studio_id)) with check (is_studio_manager(studio_id));

-- Notifications can target an employee (not only a client).
alter table notifications alter column client_id drop not null;
alter table notifications add column if not exists employee_id uuid references employees(id) on delete cascade;
