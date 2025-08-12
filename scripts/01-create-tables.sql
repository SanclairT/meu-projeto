-- Create users table with profile information
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  perfil VARCHAR(50) NOT NULL CHECK (perfil IN ('admin', 'vendedor', 'gerente')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendas table
CREATE TABLE IF NOT EXISTS vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_email VARCHAR(255),
  cliente_telefone VARCHAR(50),
  valor_bruto DECIMAL(10,2) NOT NULL CHECK (valor_bruto > 0),
  desconto DECIMAL(10,2) DEFAULT 0 CHECK (desconto >= 0),
  valor_liquido DECIMAL(10,2) NOT NULL CHECK (valor_liquido > 0),
  comissao_percentual DECIMAL(5,2) NOT NULL CHECK (comissao_percentual >= 0 AND comissao_percentual <= 100),
  comissao_valor DECIMAL(10,2) NOT NULL CHECK (comissao_valor >= 0),
  imposto_retido DECIMAL(10,2) DEFAULT 0 CHECK (imposto_retido >= 0),
  comissao_liquida DECIMAL(10,2) NOT NULL CHECK (comissao_liquida >= 0),
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'paga', 'cancelada')),
  data_venda DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comissoes table for tracking commission payments
CREATE TABLE IF NOT EXISTS comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  vendedor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  valor_comissao DECIMAL(10,2) NOT NULL CHECK (valor_comissao >= 0),
  imposto_retido DECIMAL(10,2) DEFAULT 0 CHECK (imposto_retido >= 0),
  valor_liquido DECIMAL(10,2) NOT NULL CHECK (valor_liquido >= 0),
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'cancelada')),
  data_pagamento DATE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendas_vendedor_id ON vendas(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data_venda ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON vendas(status);
CREATE INDEX IF NOT EXISTS idx_comissoes_vendedor_id ON comissoes(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_venda_id ON comissoes(venda_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_status ON comissoes(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_perfil ON users(perfil);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON vendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comissoes_updated_at BEFORE UPDATE ON comissoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
