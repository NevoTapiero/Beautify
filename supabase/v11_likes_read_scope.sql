-- Tighten gallery_likes read access to match gallery_read: likes on a photo
-- should only be visible to the same audience allowed to see the photo
-- itself (approved photos are public, plus the studio's own manager/client),
-- not "everyone, always" as before.
drop policy if exists likes_read on gallery_likes;
create policy likes_read on gallery_likes for select
  using (exists (select 1 from gallery g where g.id = gallery_id
    and (g.status = 'approved' or is_studio_manager(g.studio_id) or client_owns(gallery_likes.client_id))));
