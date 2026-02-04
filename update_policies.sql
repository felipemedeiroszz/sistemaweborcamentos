-- Atualizar políticas de segurança para permitir inserção explícita
alter table clients enable row level security;
drop policy if exists "Public access for clients" on clients;
create policy "Public access for clients" on clients for all using (true) with check (true);

alter table products enable row level security;
drop policy if exists "Public access for products" on products;
create policy "Public access for products" on products for all using (true) with check (true);

alter table budgets enable row level security;
drop policy if exists "Public access for budgets" on budgets;
create policy "Public access for budgets" on budgets for all using (true) with check (true);

alter table contracts enable row level security;
drop policy if exists "Public access for contracts" on contracts;
create policy "Public access for contracts" on contracts for all using (true) with check (true);

alter table wallet_accounts enable row level security;
drop policy if exists "Public access for wallet_accounts" on wallet_accounts;
create policy "Public access for wallet_accounts" on wallet_accounts for all using (true) with check (true);

alter table wallet_transactions enable row level security;
drop policy if exists "Public access for wallet_transactions" on wallet_transactions;
create policy "Public access for wallet_transactions" on wallet_transactions for all using (true) with check (true);

alter table settings enable row level security;
drop policy if exists "Public access for settings" on settings;
create policy "Public access for settings" on settings for all using (true) with check (true);
