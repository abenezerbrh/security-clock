-- Security Clock In/Out System
-- Schema designed for Supabase (Postgres). Run this in the Supabase SQL editor
-- once the project is set up.

-- ============================================================
-- USERS (supervisors and managers who log into the system)
-- ============================================================
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  role text not null check (role in ('supervisor', 'manager')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- VENUES (client sites the company covers)
-- ============================================================
create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- GUARDS (the people being scanned in/out, not system users)
-- ============================================================
create table if not exists guards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  license_number text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SHIFT LOGS (the actual clock in/out records)
-- ============================================================
create table if not exists shift_logs (
  id uuid primary key default gen_random_uuid(),
  guard_id uuid not null references guards(id),
  venue_id uuid not null references venues(id),
  logged_by_user_id uuid not null references users(id),
  clock_in_time timestamptz not null default now(),
  clock_out_time timestamptz,
  license_status_at_checkin text not null, -- e.g. 'Active', 'Not Active'
  created_at timestamptz not null default now()
);

-- Helpful indexes for the most common queries
create index if not exists idx_shift_logs_active
  on shift_logs (venue_id)
  where clock_out_time is null;

create index if not exists idx_shift_logs_guard on shift_logs (guard_id);
create index if not exists idx_shift_logs_venue on shift_logs (venue_id);
create index if not exists idx_guards_license on guards (license_number);
