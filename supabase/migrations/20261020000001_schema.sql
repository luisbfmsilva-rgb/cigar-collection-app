-- Long Ash — schema for phase 1 (MVP)
-- Run in the Supabase SQL editor, or with `supabase db push`.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.strength_level as enum ('mild', 'mild_medium', 'medium', 'medium_full', 'full');
create type public.cigar_status as enum ('regular', 'limited', 'discontinued');
create type public.visibility as enum ('public', 'followers', 'private');
create type public.venue_kind as enum ('shop', 'lounge', 'bar', 'restaurant', 'other');
create type public.pairing_kind as enum ('spirit', 'wine', 'beer', 'coffee', 'non_alcoholic', 'food', 'other');
create type public.target_kind as enum ('checkin', 'club_post', 'comment', 'profile', 'club', 'cigar', 'creator_link');
create type public.club_privacy as enum ('public', 'private');
create type public.club_role as enum ('owner', 'moderator', 'member');
create type public.member_status as enum ('active', 'invited', 'requested');
create type public.humidor_kind as enum ('cabinet', 'desktop', 'tupperdor', 'coolerdor', 'walk_in', 'other');
create type public.reading_source as enum ('manual', 'sensor');
create type public.creator_status as enum ('none', 'pending', 'verified', 'rejected');
create type public.link_kind as enum ('youtube', 'instagram', 'tiktok', 'article', 'podcast', 'other');
create type public.report_status as enum ('open', 'actioned', 'dismissed');
create type public.music_source as enum ('apple_music', 'spotify', 'youtube', 'link');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_.]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text,
  bio text check (char_length(bio) <= 300),
  city text,
  country text,                       -- ISO 3166-1 alpha-2
  locale text not null default 'en' check (locale in ('en', 'pt', 'es')),
  is_admin boolean not null default false,
  creator_status public.creator_status not null default 'none',
  creator_headline text check (char_length(creator_headline) <= 80),
  checkin_count int not null default 0,
  unique_cigar_count int not null default 0,
  follower_count int not null default 0,
  following_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Private data (only the owner reads it). Birthdate is kept for the 21+ rule.
create table public.private_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  birthdate date not null,
  accepted_terms_at timestamptz not null default now(),
  marketing_opt_in boolean not null default false
);

create or replace function public.enforce_age() returns trigger
language plpgsql as $$
begin
  if new.birthdate > (current_date - interval '21 years') then
    raise exception 'AGE_RESTRICTED' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger private_profiles_age before insert or update on public.private_profiles
  for each row execute function public.enforce_age();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Prevent users from promoting themselves.
create or replace function public.protect_profile_flags() returns trigger
language plpgsql as $$
begin
  if not public.is_admin() then
    new.is_admin := old.is_admin;
    new.checkin_count := old.checkin_count;
    new.unique_cigar_count := old.unique_cigar_count;
    new.follower_count := old.follower_count;
    new.following_count := old.following_count;
    -- users may only move none/rejected -> pending (apply); admins verify
    if new.creator_status <> old.creator_status
       and not (new.creator_status = 'pending' and old.creator_status in ('none', 'rejected')) then
      new.creator_status := old.creator_status;
    end if;
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_flags();

create or replace function public.protect_profile_insert() returns trigger
language plpgsql as $$
begin
  new.is_admin := false;
  new.creator_status := 'none';
  new.checkin_count := 0; new.unique_cigar_count := 0;
  new.follower_count := 0; new.following_count := 0;
  return new;
end $$;
create trigger profiles_protect_insert before insert on public.profiles
  for each row execute function public.protect_profile_insert();

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  country text,                       -- country of manufacture (ISO alpha-2)
  website text,
  approved boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.cigars (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete restrict,
  line text not null,                  -- e.g. "1964 Anniversary Series"
  vitola text,                         -- e.g. "Torpedo"
  shape text,                          -- parejo, torpedo, belicoso, perfecto...
  length_in numeric(4, 2) check (length_in between 2 and 12),
  ring_gauge int check (ring_gauge between 20 and 80),
  wrapper text,
  wrapper_shade text,                  -- claro, natural, colorado, maduro, oscuro...
  binder text,
  filler text,
  country text,                        -- ISO alpha-2
  factory text,
  strength public.strength_level,
  status public.cigar_status not null default 'regular',
  barcodes text[] not null default '{}',
  image_url text,
  approved boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  avg_rating numeric(3, 2),
  rating_count int not null default 0,
  avg_score100 numeric(5, 2),
  search_text text,                    -- filled by trigger, used for search
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cigars_brand_idx on public.cigars (brand_id);
create index cigars_barcodes_idx on public.cigars using gin (barcodes);
create index cigars_search_idx on public.cigars using gin (search_text extensions.gin_trgm_ops);
create index cigars_country_idx on public.cigars (country);
create trigger cigars_touch before update on public.cigars
  for each row execute function public.touch_updated_at();

create or replace function public.cigar_search_text() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare b text;
begin
  select name into b from public.brands where id = new.brand_id;
  new.search_text := lower(unaccent(coalesce(b, '') || ' ' || new.line || ' ' || coalesce(new.vitola, '')
                     || ' ' || coalesce(new.wrapper, '') || ' ' || array_to_string(new.barcodes, ' ')));
  return new;
end $$;
create trigger cigars_search before insert or update on public.cigars
  for each row execute function public.cigar_search_text();

-- Flavor wheel reference
create table public.flavor_families (
  code text primary key,
  position int not null,
  label_en text not null, label_pt text not null, label_es text not null,
  color text not null
);
create table public.flavor_notes (
  code text primary key,
  family text not null references public.flavor_families (code),
  label_en text not null, label_pt text not null, label_es text not null
);

-- ---------------------------------------------------------------------------
-- Venues and events
-- ---------------------------------------------------------------------------
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.venue_kind not null default 'shop',
  address text,
  city text,
  region text,
  country text,
  lat double precision,
  lng double precision,
  website text,
  phone text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index venues_geo_idx on public.venues (lat, lng);
create index venues_name_idx on public.venues using gin (lower(name) extensions.gin_trgm_ops);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  venue_id uuid references public.venues (id) on delete set null,
  club_id uuid,                         -- FK added after clubs
  starts_on date not null default current_date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Check-ins
-- ---------------------------------------------------------------------------
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  cigar_id uuid not null references public.cigars (id) on delete restrict,
  rating numeric(3, 2) check (rating >= 0.25 and rating <= 5 and (rating * 4) = floor(rating * 4)),
  note text check (char_length(note) <= 2000),
  venue_id uuid references public.venues (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  at_home boolean not null default false,
  visibility public.visibility not null default 'public',
  -- music
  music_source public.music_source,
  music_title text,
  music_artist text,
  music_artwork_url text,
  music_preview_url text,
  music_url text,
  -- full review (100 pts)
  score_appearance smallint check (score_appearance between 0 and 15),
  score_draw smallint check (score_draw between 0 and 15),
  score_burn smallint check (score_burn between 0 and 10),
  score_flavor smallint check (score_flavor between 0 and 30),
  score_aroma smallint check (score_aroma between 0 and 10),
  score_overall smallint check (score_overall between 0 and 20),
  score100 smallint generated always as (
    case when score_appearance is not null and score_draw is not null and score_burn is not null
          and score_flavor is not null and score_aroma is not null and score_overall is not null
    then score_appearance + score_draw + score_burn + score_flavor + score_aroma + score_overall end
  ) stored,
  strength smallint check (strength between 1 and 5),
  body smallint check (body between 1 and 5),
  duration_min smallint check (duration_min between 1 and 600),
  toast_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index checkins_user_idx on public.checkins (user_id, created_at desc);
create index checkins_cigar_idx on public.checkins (cigar_id, created_at desc);
create index checkins_created_idx on public.checkins (created_at desc);
create index checkins_venue_idx on public.checkins (venue_id);
create trigger checkins_touch before update on public.checkins
  for each row execute function public.touch_updated_at();

create table public.checkin_photos (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins (id) on delete cascade,
  path text not null,                  -- storage path in bucket checkin-photos
  position smallint not null default 0 check (position between 0 and 4),
  is_band boolean not null default false,
  created_at timestamptz not null default now(),
  unique (checkin_id, position)
);

create table public.checkin_pairings (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins (id) on delete cascade,
  kind public.pairing_kind not null,
  name text not null check (char_length(name) between 1 and 80)
);
create index checkin_pairings_checkin_idx on public.checkin_pairings (checkin_id);

create table public.checkin_flavors (
  checkin_id uuid not null references public.checkins (id) on delete cascade,
  third smallint not null check (third between 0 and 3),  -- 0 = whole cigar
  note text not null references public.flavor_notes (code),
  intensity smallint not null default 2 check (intensity between 1 and 3),
  primary key (checkin_id, third, note)
);

-- Max 5 photos per check-in
create or replace function public.limit_photos() returns trigger
language plpgsql as $$
begin
  if (select count(*) from public.checkin_photos where checkin_id = new.checkin_id) >= 5 then
    raise exception 'MAX_PHOTOS' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger checkin_photos_limit before insert on public.checkin_photos
  for each row execute function public.limit_photos();

-- ---------------------------------------------------------------------------
-- Social graph
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create or replace function public.is_blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.blocks
                 where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

create table public.toasts (           -- "likes" ("brindar")
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_kind public.target_kind not null check (target_kind in ('checkin', 'club_post', 'comment')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_kind, target_id)
);
create index toasts_target_idx on public.toasts (target_kind, target_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  target_kind public.target_kind not null check (target_kind in ('checkin', 'club_post')),
  target_id uuid not null,
  body text not null check (char_length(body) between 1 and 1000),
  toast_count int not null default 0,
  created_at timestamptz not null default now()
);
create index comments_target_idx on public.comments (target_kind, target_id, created_at);

create table public.saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  checkin_id uuid not null references public.checkins (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, checkin_id)
);

create table public.wishlist (
  user_id uuid not null references public.profiles (id) on delete cascade,
  cigar_id uuid not null references public.cigars (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, cigar_id)
);

-- ---------------------------------------------------------------------------
-- Clubs
-- ---------------------------------------------------------------------------
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 60),
  description text check (char_length(description) <= 500),
  city text,
  country text,
  privacy public.club_privacy not null default 'public',
  avatar_url text,
  cover_url text,
  member_count int not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.events add constraint events_club_fk
  foreign key (club_id) references public.clubs (id) on delete set null;

create table public.club_members (
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.club_role not null default 'member',
  status public.member_status not null default 'active',
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (club_id, user_id)
);
create index club_members_user_idx on public.club_members (user_id);

create table public.club_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text check (char_length(body) <= 2000),
  checkin_id uuid references public.checkins (id) on delete cascade,
  pinned boolean not null default false,
  toast_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now(),
  check (body is not null or checkin_id is not null)
);
create index club_posts_club_idx on public.club_posts (club_id, created_at desc);

create or replace function public.club_role_of(c uuid, u uuid) returns public.club_role
language sql stable security definer set search_path = public as $$
  select role from public.club_members where club_id = c and user_id = u and status = 'active';
$$;

create or replace function public.can_see_club(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.clubs where id = c and privacy = 'public')
      or exists (select 1 from public.club_members where club_id = c and user_id = auth.uid()
                 and status in ('active', 'invited'));
$$;

-- Owner becomes member on create
create or replace function public.club_after_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.club_members (club_id, user_id, role, status)
  values (new.id, new.created_by, 'owner', 'active');
  return new;
end $$;
create trigger clubs_after_insert after insert on public.clubs
  for each row execute function public.club_after_insert();

-- Members can only accept their own invite; only owners/moderators change roles or approve requests.
create or replace function public.guard_club_member_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare actor public.club_role;
begin
  if public.is_admin() then return new; end if;
  actor := public.club_role_of(new.club_id, auth.uid());
  if actor in ('owner', 'moderator') then
    if new.role = 'owner' and old.role <> 'owner' and actor <> 'owner' then
      raise exception 'ONLY_OWNER_CAN_TRANSFER' using errcode = 'P0001';
    end if;
    return new;
  end if;
  if new.user_id = auth.uid() and old.status = 'invited' and new.status = 'active' and new.role = old.role then
    return new;
  end if;
  raise exception 'NOT_ALLOWED' using errcode = 'P0001';
end $$;
create trigger club_members_guard before update on public.club_members
  for each row execute function public.guard_club_member_update();

-- ---------------------------------------------------------------------------
-- Humidor
-- ---------------------------------------------------------------------------
create table public.humidors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  kind public.humidor_kind not null default 'cabinet',
  capacity int check (capacity > 0),
  target_rh_min numeric(4, 1) not null default 65 check (target_rh_min between 50 and 85),
  target_rh_max numeric(4, 1) not null default 70 check (target_rh_max between 50 and 85),
  created_at timestamptz not null default now(),
  check (target_rh_min <= target_rh_max)
);
create index humidors_user_idx on public.humidors (user_id);

create table public.humidor_items (
  id uuid primary key default gen_random_uuid(),
  humidor_id uuid not null references public.humidors (id) on delete cascade,
  cigar_id uuid not null references public.cigars (id) on delete restrict,
  quantity int not null check (quantity >= 0),
  acquired_on date not null default current_date,
  rest_days int not null default 14 check (rest_days between 0 and 3650),
  price_each numeric(8, 2) check (price_each >= 0),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index humidor_items_humidor_idx on public.humidor_items (humidor_id);
create trigger humidor_items_touch before update on public.humidor_items
  for each row execute function public.touch_updated_at();

create table public.humidor_readings (
  id uuid primary key default gen_random_uuid(),
  humidor_id uuid not null references public.humidors (id) on delete cascade,
  rh numeric(4, 1) check (rh between 0 and 100),
  temp_c numeric(4, 1) check (temp_c between -10 and 50),
  source public.reading_source not null default 'manual',
  recorded_at timestamptz not null default now(),
  check (rh is not null or temp_c is not null)
);
create index humidor_readings_idx on public.humidor_readings (humidor_id, recorded_at desc);

create or replace function public.owns_humidor(h uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.humidors where id = h and user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Creators
-- ---------------------------------------------------------------------------
create table public.creator_applications (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  channels text not null check (char_length(channels) between 5 and 1000),
  audience text check (char_length(audience) <= 500),
  message text check (char_length(message) <= 1000),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.creator_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.link_kind not null,
  url text not null check (url ~ '^https://'),
  title text not null check (char_length(title) between 2 and 140),
  thumbnail_url text,
  cigar_id uuid references public.cigars (id) on delete set null,
  is_sponsored boolean not null default false,
  created_at timestamptz not null default now()
);
create index creator_links_user_idx on public.creator_links (user_id, created_at desc);
create index creator_links_cigar_idx on public.creator_links (cigar_id);

-- ---------------------------------------------------------------------------
-- Badges
-- ---------------------------------------------------------------------------
create table public.badges (
  code text primary key,
  label_en text not null, label_pt text not null, label_es text not null,
  description_en text not null, description_pt text not null, description_es text not null,
  icon text not null default 'ribbon'
);
create table public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_code text not null references public.badges (code) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_code)
);

-- ---------------------------------------------------------------------------
-- Moderation
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_kind public.target_kind not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 500),
  status public.report_status not null default 'open',
  handled_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Counters, ratings and badges (triggers)
-- ---------------------------------------------------------------------------
create or replace function public.refresh_cigar_stats(c uuid) returns void
language sql security definer set search_path = public as $$
  update public.cigars set
    avg_rating = (select round(avg(rating)::numeric, 2) from public.checkins where cigar_id = c and rating is not null),
    rating_count = (select count(*) from public.checkins where cigar_id = c and rating is not null),
    avg_score100 = (select round(avg(score100)::numeric, 1) from public.checkins where cigar_id = c and score100 is not null)
  where id = c;
$$;

create or replace function public.refresh_user_stats(u uuid) returns void
language sql security definer set search_path = public as $$
  update public.profiles set
    checkin_count = (select count(*) from public.checkins where user_id = u),
    unique_cigar_count = (select count(distinct cigar_id) from public.checkins where user_id = u)
  where id = u;
$$;

create or replace function public.award_badges(u uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  total int; brazil int; countries int; maduro int; reviews int; venues int; pairings int;
begin
  select count(*) into total from checkins where user_id = u;
  select count(*) into brazil from checkins ch join cigars c on c.id = ch.cigar_id
    where ch.user_id = u and c.country = 'BR';
  select count(distinct c.country) into countries from checkins ch join cigars c on c.id = ch.cigar_id
    where ch.user_id = u and c.country is not null;
  select count(*) into maduro from checkins ch join cigars c on c.id = ch.cigar_id
    where ch.user_id = u and c.wrapper_shade ilike 'maduro%';
  select count(*) into reviews from checkins where user_id = u and score100 is not null;
  select count(distinct venue_id) into venues from checkins where user_id = u and venue_id is not null;
  select count(*) into pairings from checkin_pairings p join checkins ch on ch.id = p.checkin_id where ch.user_id = u;

  insert into user_badges (user_id, badge_code)
  select u, b.code from (values
    ('first_light', total >= 1),
    ('ten_sticks', total >= 10),
    ('fifty_sticks', total >= 50),
    ('century', total >= 100),
    ('orgulho_brasileiro', brazil >= 10),
    ('globetrotter', countries >= 5),
    ('maduro_lover', maduro >= 10),
    ('critic', reviews >= 10),
    ('lounge_hopper', venues >= 5),
    ('sommelier', pairings >= 10)
  ) as b(code, ok)
  join badges on badges.code = b.code
  where b.ok
  on conflict do nothing;
end $$;

create or replace function public.checkins_after_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform refresh_cigar_stats(new.cigar_id);
    perform refresh_user_stats(new.user_id);
    perform award_badges(new.user_id);
  end if;
  if tg_op = 'UPDATE' and old.cigar_id <> new.cigar_id then
    perform refresh_cigar_stats(old.cigar_id);
  end if;
  if tg_op = 'DELETE' then
    perform refresh_cigar_stats(old.cigar_id);
    perform refresh_user_stats(old.user_id);
  end if;
  return null;
end $$;
create trigger checkins_after_change after insert or update or delete on public.checkins
  for each row execute function public.checkins_after_change();

create or replace function public.follows_after_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare f uuid; e uuid;
begin
  f := coalesce(new.follower_id, old.follower_id);
  e := coalesce(new.followee_id, old.followee_id);
  update profiles set following_count = (select count(*) from follows where follower_id = f) where id = f;
  update profiles set follower_count = (select count(*) from follows where followee_id = e) where id = e;
  return null;
end $$;
create trigger follows_after_change after insert or delete on public.follows
  for each row execute function public.follows_after_change();

create or replace function public.toasts_after_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare k public.target_kind; t uuid; n int;
begin
  k := coalesce(new.target_kind, old.target_kind);
  t := coalesce(new.target_id, old.target_id);
  select count(*) into n from toasts where target_kind = k and target_id = t;
  if k = 'checkin' then update checkins set toast_count = n where id = t;
  elsif k = 'club_post' then update club_posts set toast_count = n where id = t;
  elsif k = 'comment' then update comments set toast_count = n where id = t;
  end if;
  return null;
end $$;
create trigger toasts_after_change after insert or delete on public.toasts
  for each row execute function public.toasts_after_change();

create or replace function public.comments_after_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare k public.target_kind; t uuid; n int;
begin
  k := coalesce(new.target_kind, old.target_kind);
  t := coalesce(new.target_id, old.target_id);
  select count(*) into n from comments where target_kind = k and target_id = t;
  if k = 'checkin' then update checkins set comment_count = n where id = t;
  elsif k = 'club_post' then update club_posts set comment_count = n where id = t;
  end if;
  return null;
end $$;
create trigger comments_after_change after insert or delete on public.comments
  for each row execute function public.comments_after_change();

create or replace function public.club_members_after_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare c uuid;
begin
  c := coalesce(new.club_id, old.club_id);
  update clubs set member_count = (select count(*) from club_members where club_id = c and status = 'active')
  where id = c;
  return null;
end $$;
create trigger club_members_after_change after insert or update or delete on public.club_members
  for each row execute function public.club_members_after_change();

-- ---------------------------------------------------------------------------
-- Visibility rule for check-ins
-- ---------------------------------------------------------------------------
create or replace function public.can_see_checkin(owner uuid, vis public.visibility) returns boolean
language sql stable security definer set search_path = public as $$
  select owner = auth.uid()
      or (not public.is_blocked_between(owner, auth.uid())
          and (vis = 'public'
               or (vis = 'followers' and exists (select 1 from public.follows
                                                 where follower_id = auth.uid() and followee_id = owner))));
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.private_profiles enable row level security;
alter table public.brands enable row level security;
alter table public.cigars enable row level security;
alter table public.flavor_families enable row level security;
alter table public.flavor_notes enable row level security;
alter table public.venues enable row level security;
alter table public.events enable row level security;
alter table public.checkins enable row level security;
alter table public.checkin_photos enable row level security;
alter table public.checkin_pairings enable row level security;
alter table public.checkin_flavors enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.toasts enable row level security;
alter table public.comments enable row level security;
alter table public.saves enable row level security;
alter table public.wishlist enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.club_posts enable row level security;
alter table public.humidors enable row level security;
alter table public.humidor_items enable row level security;
alter table public.humidor_readings enable row level security;
alter table public.creator_applications enable row level security;
alter table public.creator_links enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.reports enable row level security;

-- profiles
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy private_profiles_own on public.private_profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- catalog: everyone reads approved items (and their own submissions); anyone signed in may submit
create policy brands_read on public.brands for select to authenticated
  using (approved or created_by = auth.uid() or public.is_admin());
create policy brands_insert on public.brands for insert to authenticated
  with check (created_by = auth.uid() and (not approved or public.is_admin()));
create policy brands_admin on public.brands for update to authenticated using (public.is_admin());

create policy cigars_read on public.cigars for select to authenticated
  using (approved or created_by = auth.uid() or public.is_admin());
create policy cigars_insert on public.cigars for insert to authenticated
  with check (created_by = auth.uid() and (not approved or public.is_admin()));
create policy cigars_admin_update on public.cigars for update to authenticated using (public.is_admin());
create policy cigars_admin_delete on public.cigars for delete to authenticated using (public.is_admin());

create policy flavor_families_read on public.flavor_families for select using (true);
create policy flavor_notes_read on public.flavor_notes for select using (true);
create policy badges_read on public.badges for select using (true);

-- venues / events
create policy venues_read on public.venues for select to authenticated using (true);
create policy venues_insert on public.venues for insert to authenticated with check (created_by = auth.uid());
create policy venues_update on public.venues for update to authenticated
  using (created_by = auth.uid() or public.is_admin());

create policy events_read on public.events for select to authenticated
  using (club_id is null or public.can_see_club(club_id));
create policy events_insert on public.events for insert to authenticated with check (created_by = auth.uid());
create policy events_update on public.events for update to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- check-ins
create policy checkins_read on public.checkins for select to authenticated
  using (public.can_see_checkin(user_id, visibility));
create policy checkins_insert on public.checkins for insert to authenticated with check (user_id = auth.uid());
create policy checkins_update on public.checkins for update to authenticated using (user_id = auth.uid());
create policy checkins_delete on public.checkins for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy checkin_children_read_photos on public.checkin_photos for select to authenticated
  using (exists (select 1 from public.checkins c where c.id = checkin_id));
create policy checkin_children_write_photos on public.checkin_photos for all to authenticated
  using (exists (select 1 from public.checkins c where c.id = checkin_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.checkins c where c.id = checkin_id and c.user_id = auth.uid()));

create policy checkin_children_read_pairings on public.checkin_pairings for select to authenticated
  using (exists (select 1 from public.checkins c where c.id = checkin_id));
create policy checkin_children_write_pairings on public.checkin_pairings for all to authenticated
  using (exists (select 1 from public.checkins c where c.id = checkin_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.checkins c where c.id = checkin_id and c.user_id = auth.uid()));

create policy checkin_children_read_flavors on public.checkin_flavors for select to authenticated
  using (exists (select 1 from public.checkins c where c.id = checkin_id));
create policy checkin_children_write_flavors on public.checkin_flavors for all to authenticated
  using (exists (select 1 from public.checkins c where c.id = checkin_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.checkins c where c.id = checkin_id and c.user_id = auth.uid()));

-- social
create policy follows_read on public.follows for select to authenticated using (true);
create policy follows_write on public.follows for insert to authenticated
  with check (follower_id = auth.uid() and not public.is_blocked_between(follower_id, followee_id));
create policy follows_delete on public.follows for delete to authenticated
  using (follower_id = auth.uid() or followee_id = auth.uid());

create policy blocks_own on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy toasts_read on public.toasts for select to authenticated using (true);
create policy toasts_write on public.toasts for insert to authenticated with check (user_id = auth.uid());
create policy toasts_delete on public.toasts for delete to authenticated using (user_id = auth.uid());

create policy comments_read on public.comments for select to authenticated
  using (not public.is_blocked_between(user_id, auth.uid()));
create policy comments_insert on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy comments_delete on public.comments for delete to authenticated
  using (user_id = auth.uid() or public.is_admin()
         or (target_kind = 'checkin' and exists (select 1 from public.checkins c
                                                  where c.id = target_id and c.user_id = auth.uid())));

create policy saves_own on public.saves for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy wishlist_own on public.wishlist for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- clubs
create policy clubs_read on public.clubs for select to authenticated using (true);  -- name/description are discoverable
create policy clubs_insert on public.clubs for insert to authenticated with check (created_by = auth.uid());
create policy clubs_update on public.clubs for update to authenticated
  using (public.club_role_of(id, auth.uid()) in ('owner', 'moderator') or public.is_admin());
create policy clubs_delete on public.clubs for delete to authenticated
  using (public.club_role_of(id, auth.uid()) = 'owner' or public.is_admin());

create policy club_members_read on public.club_members for select to authenticated
  using (public.can_see_club(club_id) or user_id = auth.uid());
-- join a public club, request a private one, or be invited by a moderator
create policy club_members_insert on public.club_members for insert to authenticated
  with check (
    (user_id = auth.uid() and role = 'member' and (
       (status = 'active' and exists (select 1 from public.clubs where id = club_id and privacy = 'public'))
       or status = 'requested'))
    or (status = 'invited' and role = 'member'
        and public.club_role_of(club_id, auth.uid()) in ('owner', 'moderator'))
  );
-- accept an invite (self) or manage members (owner/moderator); transitions checked by trigger
create policy club_members_update on public.club_members for update to authenticated
  using (user_id = auth.uid() or public.club_role_of(club_id, auth.uid()) in ('owner', 'moderator'))
  with check (user_id = auth.uid() or public.club_role_of(club_id, auth.uid()) in ('owner', 'moderator'));
create policy club_members_delete on public.club_members for delete to authenticated
  using (user_id = auth.uid() or public.club_role_of(club_id, auth.uid()) in ('owner', 'moderator'));

create policy club_posts_read on public.club_posts for select to authenticated
  using (public.can_see_club(club_id) and not public.is_blocked_between(user_id, auth.uid()));
create policy club_posts_insert on public.club_posts for insert to authenticated
  with check (user_id = auth.uid() and public.club_role_of(club_id, auth.uid()) is not null);
create policy club_posts_update on public.club_posts for update to authenticated
  using (user_id = auth.uid() or public.club_role_of(club_id, auth.uid()) in ('owner', 'moderator'));
create policy club_posts_delete on public.club_posts for delete to authenticated
  using (user_id = auth.uid() or public.club_role_of(club_id, auth.uid()) in ('owner', 'moderator')
         or public.is_admin());

-- humidor (private to the owner)
create policy humidors_own on public.humidors for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy humidor_items_own on public.humidor_items for all to authenticated
  using (public.owns_humidor(humidor_id)) with check (public.owns_humidor(humidor_id));
create policy humidor_readings_own on public.humidor_readings for all to authenticated
  using (public.owns_humidor(humidor_id)) with check (public.owns_humidor(humidor_id));

-- creators
create policy creator_applications_own on public.creator_applications for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy creator_applications_insert on public.creator_applications for insert to authenticated
  with check (user_id = auth.uid());
create policy creator_applications_update on public.creator_applications for update to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy creator_links_read on public.creator_links for select to authenticated using (true);
create policy creator_links_write on public.creator_links for insert to authenticated
  with check (user_id = auth.uid()
              and exists (select 1 from public.profiles where id = auth.uid() and creator_status = 'verified'));
create policy creator_links_update on public.creator_links for update to authenticated using (user_id = auth.uid());
create policy creator_links_delete on public.creator_links for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- badges
create policy user_badges_read on public.user_badges for select to authenticated using (true);

-- reports
create policy reports_insert on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_read on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
create policy reports_update on public.reports for update to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Read models (views run with the caller's permissions)
-- ---------------------------------------------------------------------------
create view public.cigar_list with (security_invoker = true) as
select c.id, c.brand_id, b.name as brand_name, c.line, c.vitola, c.shape, c.length_in, c.ring_gauge,
       c.wrapper, c.wrapper_shade, c.binder, c.filler, c.country, c.factory, c.strength, c.status,
       c.barcodes, c.image_url, c.approved, c.avg_rating, c.rating_count, c.avg_score100, c.search_text,
       c.created_by
from public.cigars c join public.brands b on b.id = c.brand_id;

create view public.checkin_feed with (security_invoker = true) as
select ch.*,
       p.username, p.display_name, p.avatar_url, p.creator_status,
       c.brand_name, c.line as cigar_line, c.vitola as cigar_vitola, c.wrapper_shade, c.country as cigar_country,
       c.ring_gauge, c.length_in,
       v.name as venue_name, v.city as venue_city, v.region as venue_region,
       e.title as event_title,
       (select coalesce(json_agg(json_build_object('path', ph.path, 'position', ph.position) order by ph.position), '[]'::json)
          from public.checkin_photos ph where ph.checkin_id = ch.id) as photos,
       (select coalesce(json_agg(json_build_object('kind', pa.kind, 'name', pa.name)), '[]'::json)
          from public.checkin_pairings pa where pa.checkin_id = ch.id) as pairings,
       (select coalesce(json_agg(distinct cf.note), '[]'::json)
          from public.checkin_flavors cf where cf.checkin_id = ch.id) as flavor_notes,
       exists (select 1 from public.toasts t where t.target_kind = 'checkin' and t.target_id = ch.id
               and t.user_id = auth.uid()) as toasted_by_me,
       exists (select 1 from public.saves s where s.checkin_id = ch.id and s.user_id = auth.uid()) as saved_by_me
from public.checkins ch
join public.profiles p on p.id = ch.user_id
join public.cigar_list c on c.id = ch.cigar_id
left join public.venues v on v.id = ch.venue_id
left join public.events e on e.id = ch.event_id;

-- Flavor profile of a cigar from the community
create or replace function public.cigar_flavor_profile(c uuid)
returns table (note text, family text, mentions bigint)
language sql stable security definer set search_path = public as $$
  select cf.note, fn.family, count(distinct cf.checkin_id) as mentions
  from checkin_flavors cf
  join checkins ch on ch.id = cf.checkin_id
  join flavor_notes fn on fn.code = cf.note
  where ch.cigar_id = c and ch.visibility = 'public'
  group by cf.note, fn.family
  order by mentions desc
  limit 12;
$$;

create or replace function public.cigar_top_pairings(c uuid)
returns table (kind public.pairing_kind, name text, mentions bigint)
language sql stable security definer set search_path = public as $$
  select pa.kind, initcap(lower(pa.name)), count(*) as mentions
  from checkin_pairings pa join checkins ch on ch.id = pa.checkin_id
  where ch.cigar_id = c and ch.visibility = 'public'
  group by pa.kind, initcap(lower(pa.name))
  order by mentions desc
  limit 6;
$$;

-- Average among people I follow
create or replace function public.cigar_friends_rating(c uuid)
returns table (avg_rating numeric, rating_count bigint)
language sql stable security definer set search_path = public as $$
  select round(avg(ch.rating)::numeric, 2), count(*)
  from checkins ch
  join follows f on f.followee_id = ch.user_id and f.follower_id = auth.uid()
  where ch.cigar_id = c and ch.rating is not null and ch.visibility in ('public', 'followers');
$$;

-- Venues near a point (km)
create or replace function public.nearby_venues(p_lat double precision, p_lng double precision, radius_km double precision default 50)
returns setof public.venues
language sql stable set search_path = public as $$
  select v.* from venues v
  where v.lat is not null and v.lng is not null
    and 6371 * 2 * asin(sqrt(power(sin(radians(v.lat - p_lat) / 2), 2)
        + cos(radians(p_lat)) * cos(radians(v.lat)) * power(sin(radians(v.lng - p_lng) / 2), 2))) <= radius_km
  order by power(v.lat - p_lat, 2) + power(v.lng - p_lng, 2)
  limit 30;
$$;

-- Catalog search (accent and case insensitive)
create or replace function public.search_cigars(q text, max_results int default 30)
returns setof public.cigar_list
language sql stable set search_path = public, extensions as $$
  select * from cigar_list
  where search_text like '%' || lower(unaccent(q)) || '%'
     or similarity(search_text, lower(unaccent(q))) > 0.2
  order by (search_text like lower(unaccent(q)) || '%') desc, similarity(search_text, lower(unaccent(q))) desc,
           rating_count desc
  limit max_results;
$$;

-- Rankings: top rated with a minimum number of ratings
create or replace function public.top_cigars(min_ratings int default 3, country_filter text default null, max_results int default 50)
returns setof public.cigar_list
language sql stable set search_path = public as $$
  select * from cigar_list
  where approved and rating_count >= min_ratings and (country_filter is null or country = country_filter)
  order by avg_rating desc nulls last, rating_count desc
  limit max_results;
$$;

-- Account deletion (required by Apple and Google)
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('checkin-photos', 'checkin-photos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('avatars', 'avatars', true, 4194304, array['image/jpeg', 'image/png', 'image/webp']),
  ('club-images', 'club-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
  ('cigar-images', 'cigar-images', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Files go under a folder named after the user id: <uid>/<file>
create policy storage_read on storage.objects for select
  using (bucket_id in ('checkin-photos', 'avatars', 'club-images', 'cigar-images'));
create policy storage_insert_own on storage.objects for insert to authenticated
  with check (bucket_id in ('checkin-photos', 'avatars', 'club-images', 'cigar-images')
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy storage_update_own on storage.objects for update to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);
create policy storage_delete_own on storage.objects for delete to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin());
