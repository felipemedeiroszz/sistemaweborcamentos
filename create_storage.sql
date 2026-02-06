-- Script para criar o bucket de armazenamento 'images' e configurar políticas de acesso
-- Execute este script no SQL Editor do Supabase

-- 1. Criar o bucket 'images' (se não existir)
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- 2. Configurar políticas de segurança para o bucket 'images'
-- Permitir acesso público para leitura (necessário para ver as assinaturas/logos)
create policy "Public Access Select"
  on storage.objects for select
  using ( bucket_id = 'images' );

-- Permitir upload público (para assinaturas)
-- NOTA: Em produção, você deve restringir isso apenas a usuários autenticados ou usar Signed URLs
create policy "Public Access Insert"
  on storage.objects for insert
  with check ( bucket_id = 'images' );

-- Permitir atualização/deleção (opcional, útil para desenvolvimento)
create policy "Public Access Update"
  on storage.objects for update
  using ( bucket_id = 'images' );

create policy "Public Access Delete"
  on storage.objects for delete
  using ( bucket_id = 'images' );
