-- V6.1 note 43: a service can show an image instead of a solid color.
-- Run once in the Supabase SQL editor. Idempotent.
alter table services add column if not exists image_url text;
