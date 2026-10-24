-- ============================================================================
-- Laodicean (laodicean.online) — Supabase Database & Storage Setup
-- Run this entire script once inside Supabase -> SQL Editor -> New Query.
-- ============================================================================

-- 1. Communities table (umbrella structure; Juja is seeded first)
create table if not exists public.communities (
  slug text primary key,
  name text not null,
  subtitle text not null,
  description text not null,
  region text not null default 'Kenya',
  member_count integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.communities (slug, name, subtitle, description, region, member_count, is_active)
values (
  'juja',
  'Juja',
  'JKUAT Main Campus & Surrounding Neighborhoods',
  'Stories, survival guides, Gate A–C street food reviews, makerspace builds, house-hunting notices, and everyday campus life around JKUAT.',
  'Kiambu County, Kenya',
  1420,
  true
)
on conflict (slug) do nothing;

-- 2. Posts table (all post types mixed in one endless scroll)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  community_slug text not null references public.communities(slug) on delete cascade,
  post_type text not null check (post_type in ('story', 'gist', 'photo', 'notice')),
  title text,
  body text not null,
  spot text not null default 'Campus',
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  author_handle text not null,
  author_course text,
  image_url text,
  image_alt text,
  image_kb integer,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_community_created on public.posts (community_slug, created_at desc);

-- 3. Post comments / replies
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  author_handle text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_comments_post_id on public.post_comments (post_id, created_at asc);

-- 4. Community creation requests ("Later, users can request to create their own communities")
create table if not exists public.community_requests (
  id uuid primary key default gen_random_uuid(),
  proposed_name text not null,
  proposed_slug text not null,
  campus_or_area text not null,
  reason text not null,
  requester_contact text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

-- 5. Row Level Security (RLS)
alter table public.communities enable row level security;
alter table public.posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.community_requests enable row level security;

-- Public read access so shared WhatsApp links open immediately without login walls
create policy "Communities are viewable by everyone"
  on public.communities for select using (true);

create policy "Posts are viewable by everyone"
  on public.posts for select using (true);

create policy "Comments are viewable by everyone"
  on public.post_comments for select using (true);

create policy "Pending community requests are viewable by everyone"
  on public.community_requests for select using (true);

-- Authenticated users (or open campus beta) can publish posts, comments, and community requests
create policy "Anyone signed in can insert posts"
  on public.posts for insert with check (auth.role() in ('authenticated', 'anon'));

create policy "Anyone can update post counters"
  on public.posts for update using (true);

create policy "Anyone signed in can insert comments"
  on public.post_comments for insert with check (auth.role() in ('authenticated', 'anon'));

create policy "Anyone can request a new community"
  on public.community_requests for insert with check (true);

-- 6. Public Storage Bucket for compressed post photos
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "Public read access for post images"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Allow image uploads to post-images"
  on storage.objects for insert
  with check (bucket_id = 'post-images');
