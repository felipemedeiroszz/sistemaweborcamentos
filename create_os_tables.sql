
-- Enable UUID extension (already enabled in existing schema)
-- create extension if not exists "uuid-ossp";

-- ===========================================
-- TABLE: service_orders (Ordens de Serviço)
-- ===========================================
create table service_orders (
  id uuid default uuid_generate_v4() primary key,
  number text not null unique, -- OS-000001
  client_id uuid references clients(id) on delete cascade not null,
  entry_date timestamp with time zone default timezone('utc'::text, now()) not null,
  expected_delivery_date timestamp with time zone,
  technician text,
  priority text not null default 'Normal', -- Normal, Urgente, Emergencial
  origin text not null default 'Loja', -- Loja, WhatsApp, Site, Telefone, Mercado Livre, Outro
  status text not null default 'Recebido', -- Recebido, Em análise, Aguardando orçamento, Orçamento enviado, Aguardando aprovação, Aguardando peças, Em reparo, Em testes, Finalizado, Pronto para retirada, Entregue, Cancelado, Garantia
  customer_defect text,
  technical_diagnosis text,
  service_executed text,
  parts_value numeric default 0,
  labor_value numeric default 0,
  discount numeric default 0,
  shipping_value numeric default 0,
  total_value numeric default 0,
  payment_method text,
  installments integer,
  payment_status text,
  warranty text,
  warranty_term text,
  portal_token text not null unique,
  entry_signature text,
  exit_signature text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ===========================================
-- TABLE: service_equipment (Equipamentos da OS)
-- ===========================================
create table service_equipment (
  id uuid default uuid_generate_v4() primary key,
  service_order_id uuid references service_orders(id) on delete cascade not null,
  category text not null,
  brand text,
  model text,
  serial_number text,
  imei text,
  color text,
  processor text,
  ram text,
  storage text,
  operating_system text,
  password text,
  physical_condition text,
  observations text,
  accessories jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ===========================================
-- TABLE: service_parts (Peças Utilizadas)
-- ===========================================
create table service_parts (
  id uuid default uuid_generate_v4() primary key,
  service_order_id uuid references service_orders(id) on delete cascade not null,
  part_name text not null,
  quantity integer not null default 1,
  unit_price numeric not null,
  total_price numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ===========================================
-- TABLE: service_checklists (Checklists)
-- ===========================================
create table service_checklists (
  id uuid default uuid_generate_v4() primary key,
  service_order_id uuid references service_orders(id) on delete cascade not null,
  equipment_category text not null,
  items jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ===========================================
-- TABLE: service_media (Fotos e Vídeos)
-- ===========================================
create table service_media (
  id uuid default uuid_generate_v4() primary key,
  service_order_id uuid references service_orders(id) on delete cascade not null,
  stage text not null, -- Entrada, Durante o Reparo, Saída
  file_url text not null,
  thumbnail_url text,
  file_type text not null, -- image, video
  file_name text,
  order_index integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ===========================================
-- TABLE: service_timeline (Histórico/Timeline)
-- ===========================================
create table service_timeline (
  id uuid default uuid_generate_v4() primary key,
  service_order_id uuid references service_orders(id) on delete cascade not null,
  action text not null,
  user_name text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ===========================================
-- ENABLE RLS
-- ===========================================
alter table service_orders enable row level security;
alter table service_equipment enable row level security;
alter table service_parts enable row level security;
alter table service_checklists enable row level security;
alter table service_media enable row level security;
alter table service_timeline enable row level security;

-- ===========================================
-- RLS POLICIES (for simplicity, public access for now)
-- ===========================================
create policy "Public access for service_orders" on service_orders for all using (true);
create policy "Public access for service_equipment" on service_equipment for all using (true);
create policy "Public access for service_parts" on service_parts for all using (true);
create policy "Public access for service_checklists" on service_checklists for all using (true);
create policy "Public access for service_media" on service_media for all using (true);
create policy "Public access for service_timeline" on service_timeline for all using (true);

