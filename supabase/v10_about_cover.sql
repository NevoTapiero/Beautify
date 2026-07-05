-- The "עלינו" (About Us) header photo — separate from logo_url (the app
-- icon/splash) so a studio isn't forced to stretch her small icon into a
-- banner. Falls back to a generic salon photo in code until she sets one.
alter table studios add column if not exists about_cover_url text;
