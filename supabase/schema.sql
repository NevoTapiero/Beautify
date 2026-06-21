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
insert into studios (slug, name) values ('demo', 'הסטודיו של דנה')
  on conflict (slug) do nothing;

insert into services (studio_id, name, duration, price, gradient, sort_order)
select s.id, v.name, v.duration, v.price, v.gradient, v.sort_order
from studios s,
  (values
    ('לק ג''ל',       60,  120, 'linear-gradient(135deg,#D9738F,#F4C9D4)', 1),
    ('מילוי ג''ל',    90,  160, 'linear-gradient(135deg,#7C2A53,#D9738F)', 2),
    ('בנייה באקריל',  120, 220, 'linear-gradient(135deg,#5E1F40,#9A4E72)', 3),
    ('מניקור',         45,  90,  'linear-gradient(135deg,#C98AA6,#F0D7DF)', 4),
    ('פדיקור',         60,  130, 'linear-gradient(135deg,#9A4E72,#E0AFC0)', 5)
  ) as v(name, duration, price, gradient, sort_order)
where s.slug = 'demo'
  and not exists (select 1 from services x where x.studio_id = s.id);

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
