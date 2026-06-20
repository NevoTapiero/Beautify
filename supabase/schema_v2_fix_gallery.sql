-- ============================================================
-- Beautify — gallery insert policy fix (v2: helper function)
-- The inline sub-query check for "client owns this row" behaved
-- inconsistently on the gallery table (nested RLS on `clients`).
-- Switch to a SECURITY DEFINER helper — the SAME pattern as the
-- working is_studio_manager() check — which evaluates ownership
-- reliably. Paste into Supabase → SQL Editor → Run. Safe & idempotent.
-- ============================================================

-- Does the current signed-in user own this client row? (bypasses nested RLS)
create or replace function client_owns(p_client uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from clients where id = p_client and auth_user_id = auth.uid()
  );
$$;
grant execute on function client_owns(uuid) to anon, authenticated;

-- A client may insert a photo for herself; the manager may insert anything.
drop policy if exists gallery_insert on gallery;
create policy gallery_insert on gallery for insert
  with check (is_studio_manager(studio_id) or client_owns(client_id));

-- Manager edits (approve/reject) any of her studio's photos.
drop policy if exists gallery_write on gallery;
create policy gallery_write on gallery for update
  using (is_studio_manager(studio_id))
  with check (is_studio_manager(studio_id));

-- Manager may delete any; a client may delete only her own pending/rejected.
drop policy if exists gallery_delete on gallery;
create policy gallery_delete on gallery for delete
  using (is_studio_manager(studio_id));

drop policy if exists gallery_delete_own on gallery;
create policy gallery_delete_own on gallery for delete
  using (status in ('pending', 'rejected') and client_owns(client_id));
