-- Criar usuários de teste para o sistema
-- Nota: Estes usuários também precisam ser criados no Supabase Auth

-- Usuário Admin
INSERT INTO users (id, nome, email, perfil, ativo, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Administrador',
  'admin@empresa.com',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Mayra - Vendedora
INSERT INTO users (id, nome, email, perfil, ativo, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Mayra Santos',
  'mayra@empresa.com',
  'vendedor',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Usuário Financeiro
INSERT INTO users (id, nome, email, perfil, ativo, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'João Financeiro',
  'financeiro@empresa.com',
  'financeiro',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Gerente
INSERT INTO users (id, nome, email, perfil, ativo, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Maria Gerente',
  'gerente@empresa.com',
  'gerente',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
