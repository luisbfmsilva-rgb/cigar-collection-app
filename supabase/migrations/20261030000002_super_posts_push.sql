-- Super posts (one highlighted post a day for verified influencers and manufacturers) and push notifications.

alter type public.target_kind add value if not exists 'super_post';

-- Notification preferences
alter table public.profiles
  add column if not exists notify_friends boolean not null default true,   -- check-ins from people I follow
  add column if not exists notify_creators boolean not null default true;  -- posts from followed influencers / manufacturers

-- Who may publish a super post
create or replace function public.can_super_post() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select account_type = 'manufacturer' or creator_status = 'verified' from profiles where id = auth.uid()), false);
$$;

create table public.super_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  photo_path text,
  cigar_id uuid references public.cigars (id) on delete set null,
  post_day date not null default ((now() at time zone 'America/New_York')::date),
  created_at timestamptz not null default now(),
  unique (user_id, post_day)   -- one per day
);
create index super_posts_recent_idx on public.super_posts (created_at desc);
alter table public.super_posts enable row level security;

-- The day is always decided by the server
create or replace function public.super_post_defaults() returns trigger
language plpgsql as $$
begin
  new.post_day := (now() at time zone 'America/New_York')::date;
  new.created_at := now();
  return new;
end $$;
create trigger super_posts_defaults before insert on public.super_posts
  for each row execute function public.super_post_defaults();

create policy super_posts_read on public.super_posts for select to authenticated using (true);
create policy super_posts_insert on public.super_posts for insert to authenticated
  with check (user_id = auth.uid() and public.can_super_post());
create policy super_posts_delete on public.super_posts for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Super posts of the people I follow (and mine) from the last 48 hours, with author info
create or replace function public.feed_super_posts()
returns table (id uuid, user_id uuid, body text, photo_path text, cigar_id uuid, created_at timestamptz,
               username text, display_name text, avatar_url text, account_type public.account_type, creator_status public.creator_status)
language sql stable security invoker set search_path = public as $$
  select sp.id, sp.user_id, sp.body, sp.photo_path, sp.cigar_id, sp.created_at,
         p.username, p.display_name, p.avatar_url, p.account_type, p.creator_status
  from super_posts sp join profiles p on p.id = sp.user_id
  where sp.created_at > now() - interval '48 hours'
    and (sp.user_id = auth.uid() or exists (select 1 from follows f where f.follower_id = auth.uid() and f.followee_id = sp.user_id))
    and not exists (select 1 from blocks b where (b.blocker_id = auth.uid() and b.blocked_id = sp.user_id) or (b.blocker_id = sp.user_id and b.blocked_id = auth.uid()))
  order by sp.created_at desc
  limit 20;
$$;
grant execute on function public.feed_super_posts(), public.can_super_post() to authenticated;

-- Push tokens (one per device)
create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text,
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;
create policy push_tokens_own on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
