-- Monthly 10s — sharing schema for Supabase (free tier is fine).
-- Run this once in the SQL editor of your Supabase project, then enable
-- anonymous sign-ins under Authentication → Providers → Anonymous.
--
-- Model: each device gets an anonymous auth user. A "share" row means
-- from_user lets to_user read their months. Invites are one-time codes
-- carried in a link; accepting one creates the share rows.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.months (
  user_id uuid not null references auth.users (id) on delete cascade,
  month_key text not null,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, month_key)
);

create table if not exists public.shares (
  from_user uuid not null references auth.users (id) on delete cascade,
  to_user uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_user, to_user),
  check (from_user <> to_user)
);

create table if not exists public.invites (
  code text primary key,
  from_user uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.months enable row level security;
alter table public.shares enable row level security;
alter table public.invites enable row level security;

-- profiles: anyone signed in may read names (that's all the table holds);
-- only you may write yours.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles
  for select to authenticated using (true);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (id = auth.uid());

-- months: you own yours; friends you share with may read them.
drop policy if exists "months own" on public.months;
create policy "months own" on public.months
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "months friends read" on public.months;
create policy "months friends read" on public.months
  for select to authenticated
  using (exists (
    select 1 from public.shares s
    where s.from_user = months.user_id and s.to_user = auth.uid()
  ));

-- shares: see the ones you're part of; only share your own list; either
-- side may end a share.
drop policy if exists "shares read" on public.shares;
create policy "shares read" on public.shares
  for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());
drop policy if exists "shares insert own" on public.shares;
create policy "shares insert own" on public.shares
  for insert to authenticated with check (from_user = auth.uid());
drop policy if exists "shares delete" on public.shares;
create policy "shares delete" on public.shares
  for delete to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

-- invites: yours only. Accepting goes through the function below.
drop policy if exists "invites own" on public.invites;
create policy "invites own" on public.invites
  for all to authenticated
  using (from_user = auth.uid()) with check (from_user = auth.uid());

-- Who sent this invite? (Lets the join page show a name before accepting.)
create or replace function public.invite_preview(p_code text)
returns table (inviter_id uuid, inviter_name text)
language sql security definer set search_path = public as $$
  select i.from_user, coalesce(p.name, '')
  from public.invites i
  left join public.profiles p on p.id = i.from_user
  where i.code = p_code
    and i.created_at > now() - interval '30 days';
$$;

-- Accept an invite: the inviter's list becomes visible to me, and if I
-- agree, mine to them. Returns the inviter's id.
create or replace function public.accept_invite(p_code text, p_share_back boolean)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_from uuid;
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'not signed in';
  end if;
  select from_user into v_from
  from public.invites
  where code = p_code and created_at > now() - interval '30 days';
  if v_from is null then
    raise exception 'invite not found';
  end if;
  if v_from = v_me then
    raise exception 'own invite';
  end if;
  insert into public.shares (from_user, to_user) values (v_from, v_me)
    on conflict do nothing;
  if p_share_back then
    insert into public.shares (from_user, to_user) values (v_me, v_from)
      on conflict do nothing;
  end if;
  return v_from;
end;
$$;

revoke all on function public.invite_preview(text) from public;
revoke all on function public.accept_invite(text, boolean) from public;
grant execute on function public.invite_preview(text) to authenticated;
grant execute on function public.accept_invite(text, boolean) to authenticated;
