-- ───────────────────────────────────────────────────────────────────────────
-- BUSINESS EDITION V6: about-me text, employee gallery likes, and a fix for the
-- standing-appointment "phantom" regeneration. Run once. Idempotent.
-- ───────────────────────────────────────────────────────────────────────────

-- "About me" for the owner (studio) and each employee.
alter table studios   add column if not exists about text;
alter table employees add column if not exists about text;

-- Employees can like gallery photos (not only clients).
alter table gallery_likes drop constraint if exists gallery_likes_pkey;
alter table gallery_likes alter column client_id drop not null;
alter table gallery_likes add column if not exists employee_id uuid references employees(id) on delete cascade;
create unique index if not exists gallery_likes_uniq on gallery_likes(gallery_id, client_id, employee_id) nulls not distinct;

drop policy if exists likes_mgr_insert on gallery_likes;
drop policy if exists likes_mgr_delete on gallery_likes;
create policy likes_mgr_insert on gallery_likes for insert
  with check (is_studio_manager((select g.studio_id from gallery g where g.id = gallery_id)));
create policy likes_mgr_delete on gallery_likes for delete
  using (is_studio_manager((select g.studio_id from gallery g where g.id = gallery_id)));

-- Phantom fix: a standing rule keeps only ONE future appointment at a time, and
-- won't regenerate a slot that was already moved. Creates just the next one.
create or replace function materialize_standing(p_id uuid, p_weeks int default 1)
returns void language plpgsql security definer as $$
declare r standing_requests; dur int; d date; ts timestamptz; i int;
begin
  select * into r from standing_requests where id = p_id;
  if r.id is null or r.status <> 'approved' then return; end if;
  -- Already has a future (non-cancelled) occurrence? Leave it alone.
  if exists (select 1 from appointments where standing_id = r.id and status <> 'cancelled' and starts_at >= now()) then return; end if;
  select duration into dur from services where id = r.service_id;
  if dur is null then return; end if;
  for i in 0..(p_weeks * 7) loop
    d := current_date + i;
    if extract(dow from d)::int = r.weekday then
      ts := (d::text || ' ' || r."time")::timestamp at time zone 'Asia/Jerusalem';
      if ts < now() then continue; end if;
      if exists (
        select 1 from appointments a join services s on s.id = a.service_id
        where a.studio_id = r.studio_id and a.status <> 'cancelled'
          and a.starts_at < ts + make_interval(mins => dur)
          and ts < a.starts_at + make_interval(mins => s.duration)
      ) then continue; end if;
      insert into appointments(studio_id, client_id, service_id, starts_at, status, standing_id)
        values (r.studio_id, r.client_id, r.service_id, ts, 'confirmed', r.id);
      return;   -- only the next occurrence
    end if;
  end loop;
end $$;
