-- ============================================================
-- Beautify — database schema v1 (multi-tenant)
-- Paste this whole file into Supabase → SQL Editor → New query → Run.
-- Every studio is a "tenant"; every row carries studio_id and is
-- isolated by Row Level Security (RLS) — each studio sees only its own data.
-- ============================================================

-- ---------- TABLES ----------

-- One row per beautician/studio (the tenant). Holds her branding.
create table if not exists studios (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,          -- e.g. "dana" → dana.beautify.co.il
  name          text not null,
  logo_url      text,
  color_primary text not null default '#7C2A53',
  color_accent  text not null default '#D9738F',
  owner_id      uuid references auth.users(id),-- the manager's login (set on first sign-in)
  created_at    timestamptz not null default now()
);

create table if not exists services (
  id         uuid primary key default gen_random_uuid(),
  studio_id  uuid not null references studios(id) on delete cascade,
  name       text not null,
  duration   int  not null,                    -- minutes
  price      int  not null,                    -- shekels
  gradient   text,
  active      boolean not null default true,
  sort_order int not null default 0
);

create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  studio_id     uuid not null references studios(id) on delete cascade,
  auth_user_id  uuid references auth.users(id),-- the client's phone login (if signed in)
  name          text not null,
  phone         text not null,
  email         text,
  blocked       boolean not null default false,
  health_signed_at timestamptz,                -- when the health declaration was signed
  created_at    timestamptz not null default now()
);

create table if not exists appointments (
  id           uuid primary key default gen_random_uuid(),
  studio_id    uuid not null references studios(id) on delete cascade,
  client_id    uuid not null references clients(id) on delete cascade,
  service_id   uuid not null references services(id),
  starts_at    timestamptz not null,
  status       text not null default 'confirmed',   -- confirmed | pending | cancelled | done
  arrival_confirmed boolean not null default false,
  paid         boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists gallery (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references studios(id) on delete cascade,
  image_url   text,
  caption     text,
  uploaded_by text,                              -- display name of who shared it
  client_id   uuid references clients(id),
  likes       int not null default 0,
  status      text not null default 'pending',   -- pending | approved | rejected
  created_at  timestamptz not null default now()
);

-- ---------- HELPER ----------
-- True when the logged-in user owns the given studio (i.e. is its manager).
create or replace function is_studio_manager(target uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from studios s where s.id = target and s.owner_id = auth.uid());
$$;

-- ---------- ENABLE RLS ----------
alter table studios       enable row level security;
alter table services      enable row level security;
alter table clients       enable row level security;
alter table appointments  enable row level security;
alter table gallery       enable row level security;

-- ---------- POLICIES ----------

-- studios: anyone may read branding (public studio page); only the owner edits.
create policy studios_read   on studios for select using (true);
create policy studios_update on studios for update using (owner_id = auth.uid());

-- services: public read (clients browse before booking); manager manages.
create policy services_read on services for select using (true);
create policy services_write on services for all
  using (is_studio_manager(studio_id)) with check (is_studio_manager(studio_id));

-- clients: a client sees only her own row; the manager sees all her studio's clients.
create policy clients_read on clients for select
  using (auth_user_id = auth.uid() or is_studio_manager(studio_id));
create policy clients_insert on clients for insert
  with check (auth_user_id = auth.uid() or is_studio_manager(studio_id));
create policy clients_update on clients for update
  using (auth_user_id = auth.uid() or is_studio_manager(studio_id));
create policy clients_delete on clients for delete
  using (is_studio_manager(studio_id));

-- appointments: client sees/books her own; manager sees/manages all.
create policy appts_read on appointments for select
  using (is_studio_manager(studio_id)
         or client_id in (select id from clients where auth_user_id = auth.uid()));
create policy appts_insert on appointments for insert
  with check (is_studio_manager(studio_id)
              or client_id in (select id from clients where auth_user_id = auth.uid()));
create policy appts_update on appointments for update
  using (is_studio_manager(studio_id)
         or client_id in (select id from clients where auth_user_id = auth.uid()));
create policy appts_delete on appointments for delete
  using (is_studio_manager(studio_id)
         or client_id in (select id from clients where auth_user_id = auth.uid()));

-- gallery: approved photos are public; manager manages; client may submit (pending).
create policy gallery_read on gallery for select
  using (status = 'approved' or is_studio_manager(studio_id));
create policy gallery_insert on gallery for insert
  with check (is_studio_manager(studio_id)
              or client_id in (select id from clients where auth_user_id = auth.uid()));
create policy gallery_write on gallery for update
  using (is_studio_manager(studio_id)) with check (is_studio_manager(studio_id));
create policy gallery_delete on gallery for delete
  using (is_studio_manager(studio_id));

-- ---------- SEED: one demo studio so the app has data on day one ----------
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
