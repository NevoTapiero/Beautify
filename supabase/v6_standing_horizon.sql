-- ───────────────────────────────────────────────────────────────────────────
-- V6 note 24: standing weekly appointments should only ever book the COMING
-- week, not 8 weeks ahead. Run this whole file once in the Supabase SQL editor.
-- Idempotent and safe to re-run.
-- ───────────────────────────────────────────────────────────────────────────

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

create or replace function topup_standing(p_studio uuid)
returns void language plpgsql security definer as $$
declare r standing_requests;
begin
  if not is_studio_manager(p_studio) then return; end if;
  for r in select * from standing_requests where studio_id = p_studio and status = 'approved' loop
    perform materialize_standing(r.id, 1);
  end loop;
end $$;

-- Clean up the extra weeks that earlier testing already booked: keep only the
-- next upcoming occurrence of each standing slot, cancel the rest (future,
-- not-yet-arrived ones only — past visits are untouched).
update appointments a set status = 'cancelled'
where a.standing_id is not null
  and a.status = 'confirmed'
  and a.arrival_confirmed = false
  and a.starts_at > now()
  and a.starts_at > (
    select min(b.starts_at) from appointments b
    where b.standing_id = a.standing_id and b.status = 'confirmed' and b.starts_at > now()
  );
