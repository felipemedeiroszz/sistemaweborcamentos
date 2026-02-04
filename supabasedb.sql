-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: clients (Clientes)
create table clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text,
  cpf_cnpj text,
  address text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: products (Itens Salvos)
create table products (
  id uuid default uuid_generate_v4() primary key,
  description text not null,
  price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: budgets (Orçamentos)
create table budgets (
  id uuid default uuid_generate_v4() primary key,
  number text,
  client_data jsonb, -- Stores {nome, telefone} snapshot
  items jsonb, -- Stores array of items
  total numeric,
  date date,
  time time,
  currency text default 'BRL',
  language text default 'pt',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: contracts (Contratos)
create table contracts (
  id uuid default uuid_generate_v4() primary key,
  number text,
  title text,
  contractor_data jsonb,
  hired_data jsonb,
  object text,
  value numeric,
  execution_term text,
  payment_method text,
  clauses jsonb, -- Array of strings
  date date,
  time time,
  currency text default 'BRL',
  language text default 'pt',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: wallet_accounts (Contas da Carteira)
create table wallet_accounts (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: wallet_transactions (Movimentações Financeiras)
create table wallet_transactions (
  id uuid default uuid_generate_v4() primary key,
  type text not null, -- 'entrada' or 'saida'
  title text not null,
  observation text,
  date timestamp with time zone,
  value numeric not null,
  payment_method text,
  reason text,
  currency text default 'BRL',
  account text references wallet_accounts(name), -- Linking by name as used in frontend, or change to ID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: settings (Configurações)
-- We'll assume one row for settings
create table settings (
  id uuid default uuid_generate_v4() primary key,
  company_name text,
  whatsapp text,
  validity_days integer,
  logo_url text,
  slogan text,
  contractor_signature_url text,
  contractor_data jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Storage Buckets
-- You need to create a bucket named 'images' in the Supabase Dashboard -> Storage
-- Policy for images: Public Access

-- RLS Policies (Row Level Security)
-- For simplicity in this prototype, we will enable RLS but allow public access.
-- IN PRODUCTION, YOU MUST RESTRICT THIS TO AUTHENTICATED USERS.

alter table clients enable row level security;
create policy "Public access for clients" on clients for all using (true);

alter table products enable row level security;
create policy "Public access for products" on products for all using (true);

alter table budgets enable row level security;
create policy "Public access for budgets" on budgets for all using (true);

alter table contracts enable row level security;
create policy "Public access for contracts" on contracts for all using (true);

alter table wallet_accounts enable row level security;
create policy "Public access for wallet_accounts" on wallet_accounts for all using (true);

alter table wallet_transactions enable row level security;
create policy "Public access for wallet_transactions" on wallet_transactions for all using (true);

alter table settings enable row level security;
create policy "Public access for settings" on settings for all using (true);
