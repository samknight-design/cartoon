-- ============================================================
-- MTG Companion — Supabase Schema
-- Run this in your Supabase project: SQL Editor > New Query
-- ============================================================

-- Profiles (auto-created on signup, extends auth.users)
create table if not exists public.profiles (
  id              uuid references auth.users on delete cascade primary key,
  email           text,
  tier            text not null default 'free' check (tier in ('free', 'pro')),
  lifetime_scans  integer not null default 0,
  stripe_customer_id       text,
  stripe_subscription_id   text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Decks
create table if not exists public.decks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  name        text not null,
  format      text not null default 'commander',
  notes       text not null default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Cards within a deck
create table if not exists public.deck_cards (
  id           uuid primary key default gen_random_uuid(),
  deck_id      uuid references public.decks on delete cascade not null,
  scryfall_id  text not null,
  name         text not null,
  count        integer not null default 1,
  card_data    jsonb not null,        -- full Scryfall response cached
  is_commander boolean not null default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique(deck_id, scryfall_id)
);

-- AI Insights saved per deck
create table if not exists public.insights (
  id                  uuid primary key default gen_random_uuid(),
  deck_id             uuid references public.decks on delete cascade not null,
  content             text not null,
  card_count_snapshot integer not null,  -- deck size when insight was generated
  deck_updated_at     timestamptz not null, -- deck.updated_at at generation time
  created_at          timestamptz default now()
);

-- Daily usage tracking (rate limiting)
create table if not exists public.usage_daily (
  user_id        uuid references auth.users on delete cascade not null,
  date           date not null default current_date,
  scan_count     integer not null default 0,
  insight_count  integer not null default 0,
  primary key (user_id, date)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.decks       enable row level security;
alter table public.deck_cards  enable row level security;
alter table public.insights    enable row level security;
alter table public.usage_daily enable row level security;

-- Profiles
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Decks
create policy "own decks all"  on public.decks for all using (auth.uid() = user_id);

-- Deck cards (join check to decks)
create policy "own deck_cards all" on public.deck_cards for all using (
  exists (select 1 from public.decks where id = deck_id and user_id = auth.uid())
);

-- Insights
create policy "own insights all" on public.insights for all using (
  exists (select 1 from public.decks where id = deck_id and user_id = auth.uid())
);

-- Usage: users can read own, service role writes
create policy "own usage select" on public.usage_daily for select using (auth.uid() = user_id);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at auto-update
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists decks_updated_at on public.decks;
create trigger decks_updated_at before update on public.decks
  for each row execute procedure public.set_updated_at();

drop trigger if exists deck_cards_updated_at on public.deck_cards;
create trigger deck_cards_updated_at before update on public.deck_cards
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Usage increment RPC functions (called by API routes)
-- ============================================================

create or replace function public.increment_lifetime_scans(p_user_id uuid)
returns void as $$
begin
  update public.profiles set lifetime_scans = lifetime_scans + 1 where id = p_user_id;
end;
$$ language plpgsql security definer;

create or replace function public.increment_daily_scans(p_user_id uuid, p_date date)
returns void as $$
begin
  insert into public.usage_daily (user_id, date, scan_count)
  values (p_user_id, p_date, 1)
  on conflict (user_id, date)
  do update set scan_count = usage_daily.scan_count + 1;
end;
$$ language plpgsql security definer;

create or replace function public.increment_daily_insights(p_user_id uuid, p_date date)
returns void as $$
begin
  insert into public.usage_daily (user_id, date, insight_count)
  values (p_user_id, p_date, 0)
  on conflict (user_id, date)
  do update set insight_count = usage_daily.insight_count + 1;
end;
$$ language plpgsql security definer;
