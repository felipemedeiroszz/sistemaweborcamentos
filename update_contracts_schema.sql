-- Adicionar colunas para assinatura do cliente e status no contrato
alter table contracts add column if not exists client_signature text;
alter table contracts add column if not exists client_signed_at timestamp with time zone;
alter table contracts add column if not exists status text default 'draft'; -- draft, sent, signed
