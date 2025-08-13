-- Inserir usuários de teste na tabela users
-- Estes usuários precisam ser criados no Supabase Auth separadamente

INSERT INTO users (id, email, nome, perfil, ativo, created_at, updated_at) VALUES
  (gen_random_uuid(), 'admin@local', 'Admin', 'admin', true, now(), now()),
  (gen_random_uuid(), 'financeiro@local', 'Financeiro', 'financeiro', true, now(), now()),
  (gen_random_uuid(), 'mayra@local', 'Mayra', 'vendedor', true, now(), now()),
  (gen_random_uuid(), 'liliane@local', 'Liliane', 'vendedor', true, now(), now())
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  perfil = EXCLUDED.perfil,
  ativo = EXCLUDED.ativo,
  updated_at = now();
