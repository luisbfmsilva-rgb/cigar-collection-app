-- Long Ash — small additions found while building the app

-- Let a user remove their own half-created profile (used if the 21+ check fails during sign-up).
create policy profiles_delete_own on public.profiles for delete to authenticated using (id = auth.uid());

-- Who is blocked by me (to hide their content in lists that are not covered by RLS views).
create or replace function public.my_blocked_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select blocked_id from blocks where blocker_id = auth.uid()
  union
  select blocker_id from blocks where blocked_id = auth.uid();
$$;

-- To make yourself an admin after signing up, run in the SQL editor (the app never allows it):
--   update public.profiles set is_admin = true where username = 'your_username';

-- Any active member may invite people to a club (moderators still approve join requests).
drop policy if exists club_members_insert on public.club_members;
create policy club_members_insert on public.club_members for insert to authenticated
  with check (
    (user_id = auth.uid() and role = 'member' and (
       (status = 'active' and exists (select 1 from public.clubs where id = club_id and privacy = 'public'))
       or status = 'requested'))
    or (status = 'invited' and role = 'member' and invited_by = auth.uid()
        and public.club_role_of(club_id, auth.uid()) is not null)
  );

-- Search uses pg_trgm / unaccent from the extensions schema (Supabase usually grants this already).
grant usage on schema extensions to anon, authenticated;

-- The flag guards must only apply to requests coming from the app (roles anon/authenticated),
-- not to the database's own counter triggers (security definer functions run as the owner).
create or replace function public.protect_profile_flags() returns trigger
language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    new.is_admin := old.is_admin;
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

create or replace function public.guard_club_member_update() returns trigger
language plpgsql security invoker as $$
declare actor public.club_role;
begin
  -- internal updates (e.g. invited_by set to null when an account is deleted) and no-op changes
  if current_user not in ('anon', 'authenticated') then return new; end if;
  if new.role = old.role and new.status = old.status then return new; end if;
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
