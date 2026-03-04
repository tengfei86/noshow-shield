-- NoShow Shield - Initial Migration

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Merchants
create table merchants (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  slug text not null unique,
  timezone text not null default 'America/New_York',
  booking_buffer_minutes int not null default 30,
  cancellation_policy_hours int not null default 24,
  no_show_penalty_amount numeric(10,2) not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index merchants_user_id_idx on merchants(user_id);
create unique index merchants_slug_idx on merchants(slug);

-- Services
create table services (
  id uuid primary key default uuid_generate_v4(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes int not null default 60,
  price numeric(10,2) not null default 0,
  deposit_amount numeric(10,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index services_merchant_id_idx on services(merchant_id);

-- Schedules (weekly recurring)
create table schedules (
  id uuid primary key default uuid_generate_v4(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index schedules_merchant_id_idx on schedules(merchant_id);

-- Blocked dates
create table blocked_dates (
  id uuid primary key default uuid_generate_v4(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  date date not null,
  reason text,
  created_at timestamptz not null default now(),
  unique(merchant_id, date)
);

create index blocked_dates_merchant_id_idx on blocked_dates(merchant_id);

-- Customers
create table customers (
  id uuid primary key default uuid_generate_v4(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  email text not null,
  name text not null,
  phone text,
  no_show_count int not null default 0,
  total_bookings int not null default 0,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(merchant_id, email)
);

create index customers_merchant_id_idx on customers(merchant_id);

-- Bookings
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  service_id uuid not null references services(id) on delete restrict,
  customer_id uuid not null references customers(id) on delete restrict,
  date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','no_show','completed')),
  deposit_paid boolean not null default false,
  notes text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_merchant_id_idx on bookings(merchant_id);
create index bookings_date_idx on bookings(merchant_id, date);
create index bookings_customer_id_idx on bookings(customer_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger merchants_updated_at before update on merchants for each row execute function update_updated_at();
create trigger services_updated_at before update on services for each row execute function update_updated_at();
create trigger customers_updated_at before update on customers for each row execute function update_updated_at();
create trigger bookings_updated_at before update on bookings for each row execute function update_updated_at();

-- RLS
alter table merchants enable row level security;
alter table services enable row level security;
alter table schedules enable row level security;
alter table blocked_dates enable row level security;
alter table customers enable row level security;
alter table bookings enable row level security;

-- Merchant policies: owner only
create policy "merchants_select" on merchants for select using (auth.uid() = user_id);
create policy "merchants_insert" on merchants for insert with check (auth.uid() = user_id);
create policy "merchants_update" on merchants for update using (auth.uid() = user_id);
create policy "merchants_delete" on merchants for delete using (auth.uid() = user_id);

-- Helper: check merchant ownership
create or replace function is_merchant_owner(m_id uuid)
returns boolean as $$
  select exists(select 1 from merchants where id = m_id and user_id = auth.uid());
$$ language sql security definer;

-- Services policies
create policy "services_select" on services for select using (is_merchant_owner(merchant_id));
create policy "services_insert" on services for insert with check (is_merchant_owner(merchant_id));
create policy "services_update" on services for update using (is_merchant_owner(merchant_id));
create policy "services_delete" on services for delete using (is_merchant_owner(merchant_id));

-- Public read for booking page
create policy "services_public_read" on services for select using (is_active = true);

-- Schedules policies
create policy "schedules_select" on schedules for select using (is_merchant_owner(merchant_id));
create policy "schedules_insert" on schedules for insert with check (is_merchant_owner(merchant_id));
create policy "schedules_update" on schedules for update using (is_merchant_owner(merchant_id));
create policy "schedules_delete" on schedules for delete using (is_merchant_owner(merchant_id));

create policy "schedules_public_read" on schedules for select using (is_active = true);

-- Blocked dates policies
create policy "blocked_dates_select" on blocked_dates for select using (is_merchant_owner(merchant_id));
create policy "blocked_dates_insert" on blocked_dates for insert with check (is_merchant_owner(merchant_id));
create policy "blocked_dates_delete" on blocked_dates for delete using (is_merchant_owner(merchant_id));

create policy "blocked_dates_public_read" on blocked_dates for select using (true);

-- Customers policies
create policy "customers_select" on customers for select using (is_merchant_owner(merchant_id));
create policy "customers_insert" on customers for insert with check (is_merchant_owner(merchant_id));
create policy "customers_update" on customers for update using (is_merchant_owner(merchant_id));

-- Bookings policies
create policy "bookings_select" on bookings for select using (is_merchant_owner(merchant_id));
create policy "bookings_insert" on bookings for insert with check (is_merchant_owner(merchant_id));
create policy "bookings_update" on bookings for update using (is_merchant_owner(merchant_id));

-- Public insert for customer self-booking
create policy "bookings_public_insert" on bookings for insert with check (true);
create policy "customers_public_insert" on customers for insert with check (true);
