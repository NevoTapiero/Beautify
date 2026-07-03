-- ============================================================
-- V8: separate the business name from the owner's personal name.
--
-- studios.name is the BUSINESS name (e.g. "לקי") -- used for the app
-- title/manifest, splash screen, login screen, and invoices.
-- studios.owner_name is the manager's PERSONAL name (e.g. "תמר") -- used for
-- the "בוקר טוב, תמר" greeting and anywhere she's shown as a cosmetician
-- (cosmetician picker, gallery "uploaded by", the "עלינו" team list).
--
-- Falls back to the business name until she sets her own, so nothing breaks
-- for existing studios before they fill it in.
--
-- Safe & idempotent. Paste into Supabase -> SQL Editor -> New query -> Run.
-- ============================================================

alter table studios add column if not exists owner_name text;
