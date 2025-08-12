export interface User {
  id: string
  email: string
  nome: string
  perfil: "admin" | "vendedor" | "gerente"
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Venda {
  id: string
  vendedor_id: string
  cliente_nome: string
  cliente_email?: string
  cliente_telefone?: string
  valor_bruto: number
  desconto: number
  valor_liquido: number
  comissao_percentual: number
  comissao_valor: number
  imposto_retido: number
  comissao_liquida: number
  status: "pendente" | "aprovada" | "paga" | "cancelada"
  data_venda: string
  observacoes?: string
  created_at: string
  updated_at: string
  vendedor?: User
}

export interface Comissao {
  id: string
  venda_id: string
  vendedor_id: string
  valor_comissao: number
  imposto_retido: number
  valor_liquido: number
  status: "pendente" | "paga" | "cancelada"
  data_pagamento?: string
  observacoes?: string
  created_at: string
  updated_at: string
  venda?: Venda
  vendedor?: User
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
