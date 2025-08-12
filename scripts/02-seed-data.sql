-- Insert sample admin user
INSERT INTO users (email, nome, perfil) VALUES 
('admin@empresa.com', 'Administrador', 'admin'),
('vendedor1@empresa.com', 'João Silva', 'vendedor'),
('vendedor2@empresa.com', 'Maria Santos', 'vendedor'),
('gerente@empresa.com', 'Carlos Oliveira', 'gerente')
ON CONFLICT (email) DO NOTHING;

-- Insert sample sales data
INSERT INTO vendas (
  vendedor_id, 
  cliente_nome, 
  cliente_email, 
  cliente_telefone,
  valor_bruto, 
  desconto, 
  valor_liquido, 
  comissao_percentual, 
  comissao_valor, 
  imposto_retido, 
  comissao_liquida,
  status,
  data_venda,
  observacoes
) 
SELECT 
  u.id,
  'Cliente Exemplo ' || generate_series(1, 3),
  'cliente' || generate_series(1, 3) || '@email.com',
  '(11) 9999-' || LPAD(generate_series(1000, 1002)::text, 4, '0'),
  1000.00 + (generate_series(1, 3) * 500),
  50.00,
  950.00 + (generate_series(1, 3) * 500),
  10.00,
  95.00 + (generate_series(1, 3) * 50),
  14.25 + (generate_series(1, 3) * 7.5),
  80.75 + (generate_series(1, 3) * 42.5),
  'aprovada',
  CURRENT_DATE - INTERVAL '30 days' + (generate_series(1, 3) || ' days')::INTERVAL,
  'Venda de exemplo'
FROM users u 
WHERE u.perfil = 'vendedor' 
LIMIT 1;

-- Insert corresponding commission records
INSERT INTO comissoes (venda_id, vendedor_id, valor_comissao, imposto_retido, valor_liquido, status, data_pagamento)
SELECT 
  v.id,
  v.vendedor_id,
  v.comissao_valor,
  v.imposto_retido,
  v.comissao_liquida,
  'paga',
  v.data_venda + INTERVAL '30 days'
FROM vendas v
WHERE v.status = 'aprovada';
