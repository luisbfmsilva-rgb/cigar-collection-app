-- Long Ash v1.1 — account types (Aficionado, Expert, Manufacturer), catalog corrections,
-- brand pages with articles and brand badges. "Verified influencer" stays a separate seal
-- (profiles.creator_status) that any account type can earn.

create type public.account_type as enum ('aficionado', 'expert', 'manufacturer');
create type public.request_status as enum ('pending', 'approved', 'rejected');

alter table public.profiles add column account_type public.account_type not null default 'aficionado';

-- Users cannot change their own account type (only admins / review functions).
create or replace function public.protect_profile_flags() returns trigger
language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    new.is_admin := old.is_admin;
    new.account_type := old.account_type;
    new.checkin_count := old.checkin_count;
    new.unique_cigar_count := old.unique_cigar_count;
    new.follower_count := old.follower_count;
    new.following_count := old.following_count;
    if new.creator_status <> old.creator_status
       and not (new.creator_status = 'pending' and old.creator_status in ('none', 'rejected')) then
      new.creator_status := old.creator_status;
    end if;
  end if;
  return new;
end $$;

create or replace function public.protect_profile_insert() returns trigger
language plpgsql as $$
begin
  new.is_admin := false;
  new.account_type := 'aficionado';
  new.creator_status := 'none';
  new.checkin_count := 0; new.unique_cigar_count := 0;
  new.follower_count := 0; new.following_count := 0;
  return new;
end $$;

create or replace function public.my_account_type() returns public.account_type
language sql stable security definer set search_path = public as $$
  select account_type from profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Applications to become Expert or Manufacturer
-- ---------------------------------------------------------------------------
create table public.account_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  requested_type public.account_type not null check (requested_type <> 'aficionado'),
  status public.request_status not null default 'pending',
  experience text check (char_length(experience) <= 1000),   -- expert: background, courses, years
  company text check (char_length(company) <= 120),          -- manufacturer: company name
  brand_names text check (char_length(brand_names) <= 300),  -- manufacturer: brands they make
  website text check (char_length(website) <= 300),
  contact text check (char_length(contact) <= 200),
  message text check (char_length(message) <= 1000),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index account_applications_one_pending on public.account_applications (user_id) where status = 'pending';
alter table public.account_applications enable row level security;
create policy account_applications_read on public.account_applications for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy account_applications_insert on public.account_applications for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and reviewed_by is null);
create policy account_applications_delete on public.account_applications for delete to authenticated
  using ((user_id = auth.uid() and status = 'pending') or public.is_admin());

-- Which manufacturer accounts manage which brands
create table public.brand_managers (
  brand_id uuid not null references public.brands (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (brand_id, user_id)
);
create index brand_managers_user_idx on public.brand_managers (user_id);
alter table public.brand_managers enable row level security;
create policy brand_managers_read on public.brand_managers for select to authenticated using (true);
create policy brand_managers_admin on public.brand_managers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.is_brand_manager(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from brand_managers m join profiles p on p.id = m.user_id
    where m.brand_id = b and m.user_id = auth.uid() and p.account_type = 'manufacturer'
  );
$$;

create or replace function public.review_account_application(app uuid, approve boolean, brand_ids uuid[] default '{}')
returns void language plpgsql security definer set search_path = public as $$
declare a account_applications;
begin
  if not is_admin() then raise exception 'NOT_ALLOWED' using errcode = 'P0001'; end if;
  select * into a from account_applications where id = app for update;
  if a.id is null or a.status <> 'pending' then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  update account_applications set status = case when approve then 'approved'::request_status else 'rejected'::request_status end,
    reviewed_by = auth.uid(), reviewed_at = now() where id = app;
  if approve then
    update profiles set account_type = a.requested_type where id = a.user_id;
    if a.requested_type = 'manufacturer' then
      insert into brand_managers (brand_id, user_id) select unnest(brand_ids), a.user_id on conflict do nothing;
      update brands set approved = true where id = any (brand_ids);
    end if;
  end if;
end $$;

-- Admins can change anyone's type later (e.g. revoke Expert).
create or replace function public.set_account_type(target uuid, new_type public.account_type)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'NOT_ALLOWED' using errcode = 'P0001'; end if;
  update profiles set account_type = new_type where id = target;
  if new_type <> 'manufacturer' then delete from brand_managers where user_id = target; end if;
end $$;

-- ---------------------------------------------------------------------------
-- Catalog: manufacturers edit their own brand's cigars directly
-- ---------------------------------------------------------------------------
create policy cigars_manager_insert on public.cigars for insert to authenticated
  with check (created_by = auth.uid() and public.is_brand_manager(brand_id));
create policy cigars_manager_update on public.cigars for update to authenticated
  using (public.is_brand_manager(brand_id)) with check (public.is_brand_manager(brand_id));

-- Computed / moderation fields are never changed by app users other than admins.
create or replace function public.protect_cigar_fields() returns trigger
language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    new.brand_id := old.brand_id;
    new.approved := old.approved;
    new.created_by := old.created_by;
    new.avg_rating := old.avg_rating;
    new.rating_count := old.rating_count;
    new.avg_score100 := old.avg_score100;
  end if;
  return new;
end $$;
create trigger cigars_protect before update on public.cigars
  for each row execute function public.protect_cigar_fields();

-- ---------------------------------------------------------------------------
-- Catalog corrections suggested by Experts, approved by moderators
-- ---------------------------------------------------------------------------
create table public.cigar_suggestions (
  id uuid primary key default gen_random_uuid(),
  cigar_id uuid not null references public.cigars (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  changes jsonb not null check (jsonb_typeof(changes) = 'object' and changes <> '{}'::jsonb),
  note text check (char_length(note) <= 500),
  status public.request_status not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index cigar_suggestions_status_idx on public.cigar_suggestions (status, created_at);
create index cigar_suggestions_cigar_idx on public.cigar_suggestions (cigar_id);
alter table public.cigar_suggestions enable row level security;
create policy cigar_suggestions_read on public.cigar_suggestions for select to authenticated
  using (author_id = auth.uid() or public.is_admin()
         or public.is_brand_manager((select brand_id from public.cigars where id = cigar_id)));
create policy cigar_suggestions_insert on public.cigar_suggestions for insert to authenticated
  with check (author_id = auth.uid() and status = 'pending' and reviewed_by is null
              and (public.my_account_type() = 'expert' or public.is_admin()));
create policy cigar_suggestions_delete on public.cigar_suggestions for delete to authenticated
  using ((author_id = auth.uid() and status = 'pending') or public.is_admin());

create or replace function public.review_cigar_suggestion(sug uuid, approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare s cigar_suggestions; ch jsonb;
begin
  if not is_admin() then raise exception 'NOT_ALLOWED' using errcode = 'P0001'; end if;
  select * into s from cigar_suggestions where id = sug for update;
  if s.id is null or s.status <> 'pending' then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  ch := s.changes;
  if approve then
    update cigars set
      line          = case when ch ? 'line' and nullif(ch->>'line', '') is not null then ch->>'line' else line end,
      vitola        = case when ch ? 'vitola' then nullif(ch->>'vitola', '') else vitola end,
      shape         = case when ch ? 'shape' then nullif(ch->>'shape', '') else shape end,
      length_in     = case when ch ? 'length_in' then (ch->>'length_in')::numeric else length_in end,
      ring_gauge    = case when ch ? 'ring_gauge' then (ch->>'ring_gauge')::int else ring_gauge end,
      wrapper       = case when ch ? 'wrapper' then nullif(ch->>'wrapper', '') else wrapper end,
      wrapper_shade = case when ch ? 'wrapper_shade' then nullif(ch->>'wrapper_shade', '') else wrapper_shade end,
      binder        = case when ch ? 'binder' then nullif(ch->>'binder', '') else binder end,
      filler        = case when ch ? 'filler' then nullif(ch->>'filler', '') else filler end,
      country       = case when ch ? 'country' then upper(nullif(ch->>'country', '')) else country end,
      factory       = case when ch ? 'factory' then nullif(ch->>'factory', '') else factory end,
      strength      = case when ch ? 'strength' then (nullif(ch->>'strength', ''))::strength_level else strength end,
      status        = case when ch ? 'status' then (ch->>'status')::cigar_status else status end,
      barcodes      = case when ch ? 'barcodes' then array(select jsonb_array_elements_text(ch->'barcodes')) else barcodes end,
      updated_at    = now()
    where id = s.cigar_id;
  end if;
  update cigar_suggestions set status = case when approve then 'approved'::request_status else 'rejected'::request_status end,
    reviewed_by = auth.uid(), reviewed_at = now() where id = sug;
end $$;

-- ---------------------------------------------------------------------------
-- Brand articles (featured in the community feed)
-- ---------------------------------------------------------------------------
create table public.brand_articles (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 1 and 8000),
  link_url text check (link_url is null or link_url ~ '^https://'),
  cigar_id uuid references public.cigars (id) on delete set null,
  cover_path text,                      -- storage path in bucket cigar-images
  featured boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index brand_articles_feed_idx on public.brand_articles (featured, created_at desc);
create index brand_articles_brand_idx on public.brand_articles (brand_id, created_at desc);
create trigger brand_articles_touch before update on public.brand_articles
  for each row execute function public.touch_updated_at();
alter table public.brand_articles enable row level security;
create policy brand_articles_read on public.brand_articles for select to authenticated using (true);
create policy brand_articles_insert on public.brand_articles for insert to authenticated
  with check (author_id = auth.uid() and public.is_brand_manager(brand_id));
create policy brand_articles_update on public.brand_articles for update to authenticated
  using (public.is_brand_manager(brand_id) or public.is_admin())
  with check (public.is_brand_manager(brand_id) or public.is_admin());
create policy brand_articles_delete on public.brand_articles for delete to authenticated
  using (public.is_brand_manager(brand_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Brand badges: manufacturers create badges and award them to their fans
-- ---------------------------------------------------------------------------
create table public.brand_badges (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 40),
  description text check (char_length(description) <= 200),
  icon text not null default 'ribbon',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (brand_id, name)
);
create table public.brand_badge_awards (
  badge_id uuid not null references public.brand_badges (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  awarded_by uuid references public.profiles (id) on delete set null,
  message text check (char_length(message) <= 200),
  awarded_at timestamptz not null default now(),
  primary key (badge_id, user_id)
);
create index brand_badge_awards_user_idx on public.brand_badge_awards (user_id, awarded_at desc);
alter table public.brand_badges enable row level security;
alter table public.brand_badge_awards enable row level security;
create policy brand_badges_read on public.brand_badges for select to authenticated using (true);
create policy brand_badges_write on public.brand_badges for insert to authenticated
  with check (created_by = auth.uid() and public.is_brand_manager(brand_id));
create policy brand_badges_update on public.brand_badges for update to authenticated
  using (public.is_brand_manager(brand_id) or public.is_admin());
create policy brand_badges_delete on public.brand_badges for delete to authenticated
  using (public.is_brand_manager(brand_id) or public.is_admin());
create policy brand_badge_awards_read on public.brand_badge_awards for select to authenticated using (true);
create policy brand_badge_awards_insert on public.brand_badge_awards for insert to authenticated
  with check (awarded_by = auth.uid()
              and public.is_brand_manager((select brand_id from public.brand_badges where id = badge_id)));
create policy brand_badge_awards_delete on public.brand_badge_awards for delete to authenticated
  using (public.is_admin() or public.is_brand_manager((select brand_id from public.brand_badges where id = badge_id)));

-- The people who smoke a brand the most (public check-ins only), for manufacturers to reward.
create or replace function public.brand_top_fans(b uuid, max_results int default 30)
returns table (user_id uuid, username text, display_name text, avatar_url text, account_type public.account_type,
               creator_status public.creator_status, checkins bigint, unique_cigars bigint, avg_rating numeric, last_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.account_type, p.creator_status,
         count(*), count(distinct ch.cigar_id), round(avg(ch.rating), 2), max(ch.created_at)
  from checkins ch
  join cigars c on c.id = ch.cigar_id
  join profiles p on p.id = ch.user_id
  where c.brand_id = b and ch.visibility = 'public'
    and p.id not in (select * from my_blocked_ids())
  group by p.id
  order by count(*) desc, avg(ch.rating) desc nulls last
  limit least(max_results, 100);
$$;

-- ---------------------------------------------------------------------------
-- Feed view: expose the author's account type
-- ---------------------------------------------------------------------------
create or replace view public.checkin_feed with (security_invoker = true) as
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
       exists (select 1 from public.saves s where s.checkin_id = ch.id and s.user_id = auth.uid()) as saved_by_me,
       p.account_type
from public.checkins ch
join public.profiles p on p.id = ch.user_id
join public.cigar_list c on c.id = ch.cigar_id
left join public.venues v on v.id = ch.venue_id
left join public.events e on e.id = ch.event_id;

-- Reports can now also point at brand articles.
alter type public.target_kind add value if not exists 'brand_article';
