-- ============================================================
-- V7: separate the studio's brand icon from the owner's personal photo.
--
-- Until now, studios.logo_url was reused for BOTH the app icon/splash/login
-- screen icon AND the owner's personal photo shown to clients in "עלינו".
-- Those are two different assets in practice (a stylized logo vs a real
-- headshot), so this splits them:
--   - studios.logo_url        -> stays the app icon / splash / login icon
--   - studios.owner_photo_url -> new, personal photo shown in "עלינו" only
--
-- Safe & idempotent. Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================

alter table studios add column if not exists owner_photo_url text;
