-- Inserir os usuários que já existiam no sistema
INSERT INTO users (id, nome, email, perfil, ativo, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Admin', 'admin@local', 'admin', true, now(), now()),
  (gen_random_uuid(), 'Financeiro', 'financeiro@local', 'financeiro', true, now(), now()),
  (gen_random_uuid(), 'Mayra', 'mayra@local', 'vendedor', true, now(), now()),
  (gen_random_uuid(), 'Liliane', 'liliane@local', 'vendedor', true, now(), now())
ON CONFLICT (email) DO NOTHING;
