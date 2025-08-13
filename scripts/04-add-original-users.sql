-- Criar usuários que existiam no sistema original
-- Estes usuários precisam ser cadastrados via interface também

-- Inserir perfis de usuário na tabela users (após cadastro via Supabase Auth)
INSERT INTO users (id, nome, email, perfil, ativo) VALUES
  -- Estes IDs serão atualizados após o cadastro real via Supabase Auth
  ('00000000-0000-0000-0000-000000000001', 'Mayra Santos', 'mayra@empresa.com', 'vendedor', true),
  ('00000000-0000-0000-0000-000000000002', 'Financeiro', 'financeiro@empresa.com', 'financeiro', true),
  ('00000000-0000-0000-0000-000000000003', 'Admin Sistema', 'admin@empresa.com', 'admin', true),
  ('00000000-0000-0000-0000-000000000004', 'Gerente Vendas', 'gerente@empresa.com', 'gerente', true)
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  perfil = EXCLUDED.perfil,
  ativo = EXCLUDED.ativo;

-- Adicionar algumas vendas de exemplo para teste
INSERT INTO vendas (
  vendedor_id, cliente_nome, cliente_email, cliente_telefone,
  valor_bruto, desconto, valor_liquido, comissao_percentual,
  comissao_valor, imposto_retido, comissao_liquida,
  data_venda, status, observacoes
) VALUES
  ('00000000-0000-0000-0000-000000000001', 'João Silva', 'joao@cliente.com', '(11) 99999-9999',
   5000.00, 200.00, 4800.00, 10.0, 480.00, 72.00, 408.00,
   '2024-01-15', 'confirmada', 'Venda realizada via WhatsApp'),
  ('00000000-0000-0000-0000-000000000001', 'Maria Oliveira', 'maria@cliente.com', '(11) 88888-8888',
   3000.00, 0.00, 3000.00, 8.0, 240.00, 36.00, 204.00,
   '2024-01-16', 'pendente', 'Aguardando confirmação do pagamento')
ON CONFLICT DO NOTHING;
