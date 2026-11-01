-- ============================================================================
-- Laodicean (laodicean.online) — Supabase Database Schema
-- Multi-community social blogging platform with persona identity protection.
-- Paste this entire script into your Supabase SQL Editor and click "Run".
-- ============================================================================

-- 0. Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- 0b. Clean up older prototype tables/views so this script runs cleanly without column mismatch
drop view if exists public.feed_posts cascade;
drop view if exists public.feed_comments cascade;
drop table if exists public.reports cascade;
drop table if exists public.poll_votes cascade;
drop table if exists public.poll_options cascade;
drop table if exists public.polls cascade;
drop table if exists public.reactions cascade;
drop table if exists public.comments cascade;
drop table if exists public.posts cascade;
drop table if exists public.post_comments cascade;
drop table if exists public.community_members cascade;
drop table if exists public.community_requests cascade;
drop table if exists public.communities cascade;
drop table if exists public.profiles cascade;

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  real_name text not null,
  persona_name text unique not null,
  persona_avatar text,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper functions to check roles securely without RLS recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_moderator_or_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

-- ============================================================================
-- 2. COMMUNITIES TABLE
-- ============================================================================
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  banner text,
  description text not null,
  rules text[] default array[
    'Be respectful to fellow students.',
    'No harassment or unverified harmful allegations.',
    'Protect student privacy and safe spaces.'
  ],
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Pre-seed the Juja (JKUAT) flagship community
insert into public.communities (name, slug, description, rules, status)
values (
  'Juja',
  'juja',
  'JKUAT Main Campus & Juja community dispatches, Gate A-C food spots, campus stories, memes, and mushene.',
  array[
    'Be respectful to fellow students and campus workers.',
    'Clearly tag mushene and confessions.',
    'Protect privacy—do not dox students or hostel neighbors.'
  ],
  'approved'
)
on conflict (slug) do nothing;

-- ============================================================================
-- 3. COMMUNITY MEMBERS TABLE
-- ============================================================================
create table public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (community_id, user_id)
);

-- ============================================================================
-- 4. POSTS TABLE
-- ============================================================================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  post_type text not null check (
    post_type in ('story', 'poll', 'photo', 'meme', 'confession', 'event', 'mushene')
  ),
  title text,
  body text not null,
  image_url text,
  is_persona boolean not null default false,
  status text not null default 'live' check (status in ('pending', 'live', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_posts_community_status on public.posts (community_id, status, created_at desc);
create index idx_posts_author on public.posts (author_id);

-- ============================================================================
-- 5. COMMENTS TABLE (THREADED)
-- ============================================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  is_persona boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_comments_post_parent on public.comments (post_id, parent_id, created_at asc);

-- ============================================================================
-- 6. REACTIONS TABLE
-- ============================================================================
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('laugh', 'relatable', 'fire')),
  created_at timestamptz not null default now(),
  constraint chk_reaction_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);

create unique index idx_unique_post_reaction on public.reactions (post_id, user_id, reaction_type) where post_id is not null;
create unique index idx_unique_comment_reaction on public.reactions (comment_id, user_id, reaction_type) where comment_id is not null;

-- ============================================================================
-- 7. POLLS, POLL_OPTIONS, AND POLL_VOTES
-- ============================================================================
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts(id) on delete cascade,
  question text not null,
  created_at timestamptz not null default now()
);

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_text text not null,
  position integer not null default 0
);

create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (poll_id, user_id)
);

-- ============================================================================
-- 8. REPORTS TABLE
-- ============================================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (
    reason in ('spam', 'harassment', 'hate_speech', 'misinformation', 'other')
  ),
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  constraint chk_report_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);

-- ============================================================================
-- 9. USER SIGNUP TRIGGER (AUTOPROFILES) & ADMIN PRIVILEGES
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text;
begin
  -- Automatically grant admin role to pauljubilee50@gmail.com
  if lower(new.email) = 'pauljubilee50@gmail.com' then
    assigned_role := 'admin';
  else
    assigned_role := coalesce(new.raw_user_meta_data->>'role', 'user');
  end if;

  insert into public.profiles (id, real_name, persona_name, persona_avatar, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'real_name', split_part(new.email, '@', 1), 'User'),
    coalesce(
      new.raw_user_meta_data->>'persona_name',
      'juja_' || substr(md5(new.id::text || random()::text), 1, 6)
    ),
    coalesce(new.raw_user_meta_data->>'persona_avatar', '🎓'),
    assigned_role
  )
  on conflict (id) do update set
    role = case
      when lower(new.email) = 'pauljubilee50@gmail.com' then 'admin'
      else profiles.role
    end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users already signed up in auth.users
insert into public.profiles (id, real_name, persona_name, persona_avatar, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'real_name', split_part(u.email, '@', 1), 'User'),
  coalesce(u.raw_user_meta_data->>'persona_name', 'juja_' || substr(md5(u.id::text), 1, 6)),
  coalesce(u.raw_user_meta_data->>'persona_avatar', '🎓'),
  case
    when lower(u.email) = 'pauljubilee50@gmail.com' then 'admin'
    else 'user'
  end
from auth.users u
on conflict (id) do update set
  role = case
    when lower(excluded.id::text) in (select id::text from auth.users where lower(email) = 'pauljubilee50@gmail.com') then 'admin'
    else profiles.role
  end;

-- Explicitly ensure pauljubilee50@gmail.com has admin role
update public.profiles
set role = 'admin'
where id in (
  select id from auth.users where lower(email) = 'pauljubilee50@gmail.com'
);

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.reports enable row level security;

-- PROFILES
create policy "Users can view own full profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- COMMUNITIES
create policy "Anyone can view approved communities"
  on public.communities for select
  using (status = 'approved' or public.is_admin());

create policy "Logged-in users can request communities"
  on public.communities for insert
  with check (auth.role() = 'authenticated');

create policy "Admins and mods can update communities"
  on public.communities for update
  using (public.is_moderator_or_admin());

-- COMMUNITY MEMBERS
create policy "Anyone can view community memberships"
  on public.community_members for select
  using (true);

create policy "Users can manage their own memberships"
  on public.community_members for insert
  with check (auth.uid() = user_id);

create policy "Users can leave communities"
  on public.community_members for delete
  using (auth.uid() = user_id);

-- POSTS
create policy "Anyone can read live posts"
  on public.posts for select
  using (status = 'live' or auth.uid() = author_id or public.is_admin());

create policy "Logged-in users can create posts"
  on public.posts for insert
  with check (auth.role() = 'authenticated' and auth.uid() = author_id);

create policy "Authors and admins can update posts"
  on public.posts for update
  using (auth.uid() = author_id or public.is_admin());

create policy "Authors and admins can delete posts"
  on public.posts for delete
  using (auth.uid() = author_id or public.is_admin());

-- COMMENTS
create policy "Anyone can view comments on live posts"
  on public.comments for select
  using (
    exists (
      select 1 from public.posts
      where posts.id = comments.post_id and (posts.status = 'live' or auth.uid() = posts.author_id or public.is_admin())
    )
  );

create policy "Logged-in users can create comments"
  on public.comments for insert
  with check (auth.role() = 'authenticated' and auth.uid() = author_id);

create policy "Authors and admins can delete comments"
  on public.comments for delete
  using (auth.uid() = author_id or public.is_admin());

-- REACTIONS
create policy "Anyone can view reactions"
  on public.reactions for select
  using (true);

create policy "Logged-in users can add reactions"
  on public.reactions for insert
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Users can remove their reactions"
  on public.reactions for delete
  using (auth.uid() = user_id);

-- POLLS
create policy "Anyone can view polls"
  on public.polls for select
  using (true);

create policy "Anyone can view poll options"
  on public.poll_options for select
  using (true);

create policy "Authors can create polls"
  on public.polls for insert
  with check (auth.role() = 'authenticated');

create policy "Authors can create poll options"
  on public.poll_options for insert
  with check (auth.role() = 'authenticated');

create policy "Anyone can view poll votes"
  on public.poll_votes for select
  using (true);

create policy "Logged-in users can cast poll votes"
  on public.poll_votes for insert
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

-- REPORTS
create policy "Logged-in users can submit reports"
  on public.reports for insert
  with check (auth.role() = 'authenticated' and auth.uid() = reporter_id);

create policy "Moderators and admins can view reports"
  on public.reports for select
  using (public.is_moderator_or_admin());

create policy "Moderators and admins can update reports"
  on public.reports for update
  using (public.is_moderator_or_admin());

-- ============================================================================
-- 11. SECURE FEED VIEWS (AUTOMATIC PERSONA MASKING)
-- ============================================================================
create or replace view public.feed_posts as
select
  p.id,
  p.community_id,
  c.name as community_name,
  c.slug as community_slug,
  p.post_type,
  p.title,
  p.body,
  p.image_url,
  p.is_persona,
  p.status,
  p.created_at,
  p.updated_at,
  prof.persona_name,
  prof.persona_avatar,
  case
    when not p.is_persona or auth.uid() = p.author_id or public.is_admin()
    then p.author_id
    else null
  end as author_id,
  case
    when not p.is_persona or auth.uid() = p.author_id or public.is_admin()
    then prof.real_name
    else null
  end as author_real_name,
  case
    when not p.is_persona or public.is_admin()
    then prof.role
    else 'user'
  end as author_role
from public.posts p
join public.communities c on p.community_id = c.id
join public.profiles prof on p.author_id = prof.id
where p.status = 'live' or auth.uid() = p.author_id or public.is_admin();

create or replace view public.feed_comments as
select
  cm.id,
  cm.post_id,
  cm.parent_id,
  cm.body,
  cm.is_persona,
  cm.created_at,
  prof.persona_name,
  prof.persona_avatar,
  case
    when not cm.is_persona or auth.uid() = cm.author_id or public.is_admin()
    then cm.author_id
    else null
  end as author_id,
  case
    when not cm.is_persona or auth.uid() = cm.author_id or public.is_admin()
    then prof.real_name
    else null
  end as author_real_name
from public.comments cm
join public.profiles prof on cm.author_id = prof.id;

-- ============================================================================
-- 12. SUPABASE STORAGE BUCKET FOR POST PHOTOS
-- ============================================================================
-- Create public storage bucket named 'posts' for compressed images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'posts',
  'posts',
  true,
  10485760, -- 10MB limit (compressed client-side down to ~100KB for weak campus data)
  array['image/webp', 'image/jpeg', 'image/png', 'image/gif']
)
on conflict (id) do update set
  public = true;

-- Storage RLS: Anyone can view images from public 'posts' bucket
drop policy if exists "Anyone can read post images" on storage.objects;
create policy "Anyone can read post images"
  on storage.objects for select
  using (bucket_id = 'posts');

-- Storage RLS: Authenticated campus users can upload post images
drop policy if exists "Authenticated users can upload post images" on storage.objects;
create policy "Authenticated users can upload post images"
  on storage.objects for insert
  with check (bucket_id = 'posts' and auth.role() = 'authenticated');

-- Storage RLS: Users can delete their own uploaded images
drop policy if exists "Users can delete own post images" on storage.objects;
create policy "Users can delete own post images"
  on storage.objects for delete
  using (bucket_id = 'posts' and auth.uid()::text = (storage.foldername(name))[1]);

