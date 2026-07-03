-- The "Beautify" wordmark shown next to the icon in the demo header is now a
-- column on the demo studio's row too, so it's settable the same way as
-- logo_url/name — no code change needed to rebrand it.
alter table studios add column if not exists brand_name text;
