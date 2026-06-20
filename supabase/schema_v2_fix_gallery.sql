-- ============================================================
-- Beautify — gallery insert policy fix
-- The deployed gallery INSERT policy was missing the rule that lets a
-- CLIENT add her own photo (it only allowed the manager). This recreates
-- the gallery write policies correctly, matching the appointments policy
-- that already works. Paste into Supabase → SQL Editor → Run. Safe & idempotent.
-- ============================================================

-- A client may insert a photo for herself; the manager may insert anything.
drop policy if exists gallery_insert on gallery;
create policy gallery_insert on gallery for insert
  with check (
    is_studio_manager(studio_id)
    or client_id in (select id from clients where auth_user_id = auth.uid())
  );

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
  using (
    status in ('pending', 'rejected')
    and client_id in (select id from clients where auth_user_id = auth.uid())
  );
