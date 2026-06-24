-- ───────────────────────────────────────────────────────────────────────────
-- BUSINESS EDITION V2 — Phase 1
-- Tag gallery photos with the cosmetician who did the work (owner = null).
-- Run once in the Supabase SQL editor. Idempotent.
-- ───────────────────────────────────────────────────────────────────────────

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
