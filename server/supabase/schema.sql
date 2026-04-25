-- Run this in Supabase SQL editor before starting server.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  company text default 'Sri Lakshmi Engineering Plastics',
  is_active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  email text,
  gstin text,
  pan text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  price_per_kg numeric not null,
  density numeric,
  description text,
  supplier_name text,
  price_history jsonb not null default '[]'::jsonb,
  updated_by uuid references public.admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calculations (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  notes text,
  mode text not null check (mode in ('A', 'B')),
  inputs jsonb not null,
  outputs jsonb not null,
  created_by uuid not null references public.admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_number text unique not null,
  quote_date timestamptz not null,
  valid_until timestamptz not null,
  reference_number text,
  client_id uuid references public.clients(id) on delete set null,
  client jsonb not null,
  line_items jsonb not null default '[]'::jsonb,
  line_subtotal numeric not null,
  profit_margin numeric not null,
  profit_amount numeric not null,
  after_profit numeric not null,
  additional_charges jsonb not null default '[]'::jsonb,
  additional_total numeric not null default 0,
  after_additional numeric not null,
  discount_percent numeric not null default 0,
  discount_amount numeric not null default 0,
  taxable_amount numeric not null,
  gst_percent numeric not null,
  gst_type text not null check (gst_type in ('same_state', 'inter_state')),
  cgst numeric not null default 0,
  sgst numeric not null default 0,
  igst numeric not null default 0,
  gst_amount numeric not null,
  grand_total numeric not null,
  amount_in_words text not null,
  payment_terms text,
  delivery_terms text,
  notes text,
  status text not null default 'draft',
  linked_calculation_id uuid references public.calculations(id) on delete set null,
  created_by uuid not null references public.admin_users(id),
  created_by_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  company_name text not null default 'Sri Lakshmi Engineering Plastics',
  address text default 'S-13,3rd Cross, New Kalappa Block, Ramachandrapuram, Bengaluru-560021',
  phone text default '+998055511',
  email text default 'sleplastics@gmail.com',
  gstin text default '29GBPGUD39642PZT2H',
  cin text,
  logo_url text,
  default_gst_percent numeric not null default 18,
  default_profit_margin numeric not null default 15,
  currency_symbol text not null default 'INR',
  decimal_precision int not null default 2,
  updated_by uuid references public.admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_record_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  fields jsonb not null default '[]'::jsonb,
  created_by uuid not null references public.admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_record_entries (
  id uuid primary key default gen_random_uuid(),
  record_type_id uuid not null references public.custom_record_types(id) on delete cascade,
  values jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.admin_users(id),
  updated_by uuid not null references public.admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.clients enable row level security;
alter table public.materials enable row level security;
alter table public.calculations enable row level security;
alter table public.quotations enable row level security;
alter table public.settings enable row level security;
alter table public.custom_record_types enable row level security;
alter table public.custom_record_entries enable row level security;

drop policy if exists "deny direct access admin_users" on public.admin_users;
drop policy if exists "deny direct access clients" on public.clients;
drop policy if exists "deny direct access materials" on public.materials;
drop policy if exists "deny direct access calculations" on public.calculations;
drop policy if exists "deny direct access quotations" on public.quotations;
drop policy if exists "deny direct access settings" on public.settings;
drop policy if exists "deny direct access custom_record_types" on public.custom_record_types;
drop policy if exists "deny direct access custom_record_entries" on public.custom_record_entries;

create policy "deny direct access admin_users" on public.admin_users for all using (false) with check (false);
create policy "deny direct access clients" on public.clients for all using (false) with check (false);
create policy "deny direct access materials" on public.materials for all using (false) with check (false);
create policy "deny direct access calculations" on public.calculations for all using (false) with check (false);
create policy "deny direct access quotations" on public.quotations for all using (false) with check (false);
create policy "deny direct access settings" on public.settings for all using (false) with check (false);
create policy "deny direct access custom_record_types" on public.custom_record_types for all using (false) with check (false);
create policy "deny direct access custom_record_entries" on public.custom_record_entries for all using (false) with check (false);
