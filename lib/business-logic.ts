// Business logic utilities for sales and commission calculations

export interface SaleCalculation {
  valor_liquido: number
  comissao_valor: number
  imposto_retido: number
  comissao_liquida: number
}

export interface TaxConfig {
  ir_rate: number // Income tax rate
  pis_rate: number // PIS rate
  cofins_rate: number // COFINS rate
  csll_rate: number // CSLL rate
  iss_rate: number // ISS rate (varies by city)
}

// Default tax configuration (Brazilian rates)
export const DEFAULT_TAX_CONFIG: TaxConfig = {
  ir_rate: 0.015, // 1.5%
  pis_rate: 0.0065, // 0.65%
  cofins_rate: 0.03, // 3%
  csll_rate: 0.01, // 1%
  iss_rate: 0.05, // 5% (varies by city)
}

/**
 * Calculate sale values including commission and taxes
 */
export function calculateSaleValues(
  valor_bruto: number,
  desconto: number,
  comissao_percentual: number,
  taxConfig: TaxConfig = DEFAULT_TAX_CONFIG,
): SaleCalculation {
  // Validate inputs
  if (valor_bruto <= 0) {
    throw new Error("Valor bruto must be greater than 0")
  }
  if (desconto < 0) {
    throw new Error("Desconto cannot be negative")
  }
  if (comissao_percentual < 0 || comissao_percentual > 100) {
    throw new Error("Comissão percentual must be between 0 and 100")
  }
  if (desconto >= valor_bruto) {
    throw new Error("Desconto cannot be greater than or equal to valor bruto")
  }

  const valor_liquido = valor_bruto - desconto
  const comissao_valor = (valor_liquido * comissao_percentual) / 100

  // Calculate total tax retention on commission
  const total_tax_rate =
    taxConfig.ir_rate + taxConfig.pis_rate + taxConfig.cofins_rate + taxConfig.csll_rate + taxConfig.iss_rate

  const imposto_retido = comissao_valor * total_tax_rate
  const comissao_liquida = comissao_valor - imposto_retido

  return {
    valor_liquido: Number(valor_liquido.toFixed(2)),
    comissao_valor: Number(comissao_valor.toFixed(2)),
    imposto_retido: Number(imposto_retido.toFixed(2)),
    comissao_liquida: Number(comissao_liquida.toFixed(2)),
  }
}

/**
 * Calculate detailed tax breakdown
 */
export function calculateTaxBreakdown(
  comissao_valor: number,
  taxConfig: TaxConfig = DEFAULT_TAX_CONFIG,
): Record<string, number> {
  return {
    ir: Number((comissao_valor * taxConfig.ir_rate).toFixed(2)),
    pis: Number((comissao_valor * taxConfig.pis_rate).toFixed(2)),
    cofins: Number((comissao_valor * taxConfig.cofins_rate).toFixed(2)),
    csll: Number((comissao_valor * taxConfig.csll_rate).toFixed(2)),
    iss: Number((comissao_valor * taxConfig.iss_rate).toFixed(2)),
  }
}

/**
 * Validate sale data
 */
export function validateSaleData(data: {
  cliente_nome: string
  valor_bruto: number
  desconto?: number
  comissao_percentual: number
  data_venda: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!data.cliente_nome || data.cliente_nome.trim().length === 0) {
    errors.push("Nome do cliente é obrigatório")
  }

  if (!data.valor_bruto || data.valor_bruto <= 0) {
    errors.push("Valor bruto deve ser maior que zero")
  }

  if (data.desconto && data.desconto < 0) {
    errors.push("Desconto não pode ser negativo")
  }

  if (data.desconto && data.valor_bruto && data.desconto >= data.valor_bruto) {
    errors.push("Desconto não pode ser maior ou igual ao valor bruto")
  }

  if (!data.comissao_percentual || data.comissao_percentual < 0 || data.comissao_percentual > 100) {
    errors.push("Percentual de comissão deve estar entre 0 e 100")
  }

  if (!data.data_venda) {
    errors.push("Data da venda é obrigatória")
  } else {
    const saleDate = new Date(data.data_venda)
    const today = new Date()
    if (saleDate > today) {
      errors.push("Data da venda não pode ser futura")
    }
  }

  // Business rules
  if (data.cliente_nome && data.cliente_nome.length > 255) {
    errors.push("Nome do cliente não pode ter mais de 255 caracteres")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate user data
 */
export function validateUserData(data: {
  nome: string
  email: string
  perfil: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!data.nome || data.nome.trim().length === 0) {
    errors.push("Nome é obrigatório")
  }

  if (!data.email || data.email.trim().length === 0) {
    errors.push("Email é obrigatório")
  }

  if (!data.perfil) {
    errors.push("Perfil é obrigatório")
  }

  // Format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (data.email && !emailRegex.test(data.email)) {
    errors.push("Email deve ter um formato válido")
  }

  if (data.perfil && !["admin", "vendedor", "gerente"].includes(data.perfil)) {
    errors.push("Perfil deve ser admin, vendedor ou gerente")
  }

  // Business rules
  if (data.nome && data.nome.length > 255) {
    errors.push("Nome não pode ter mais de 255 caracteres")
  }

  if (data.email && data.email.length > 255) {
    errors.push("Email não pode ter mais de 255 caracteres")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check user permissions for actions
 */
export function checkPermissions(
  userPerfil: string,
  action: string,
  resourceOwnerId?: string,
  userId?: string,
): boolean {
  switch (action) {
    case "create_user":
    case "delete_user":
    case "update_any_user":
      return userPerfil === "admin"

    case "list_users":
    case "view_any_user":
    case "update_commission_status":
    case "batch_update_commissions":
      return ["admin", "gerente"].includes(userPerfil)

    case "create_sale":
    case "update_own_sale":
    case "view_own_sale":
    case "view_own_commission":
      if (userPerfil === "vendedor") {
        return !resourceOwnerId || resourceOwnerId === userId
      }
      return ["admin", "gerente"].includes(userPerfil)

    case "update_sale_status":
    case "delete_sale":
    case "view_any_sale":
    case "view_any_commission":
      return ["admin", "gerente"].includes(userPerfil)

    case "update_own_profile":
      return true // All authenticated users can update their own profile

    default:
      return false
  }
}

/**
 * Generate commission report data
 */
export function generateCommissionReport(comissoes: any[]): {
  summary: {
    total_comissoes: number
    valor_total_bruto: number
    valor_total_liquido: number
    total_impostos: number
  }
  by_status: Record<string, { count: number; value: number }>
  by_vendedor: Record<string, { count: number; value: number; nome: string }>
} {
  const summary = {
    total_comissoes: comissoes.length,
    valor_total_bruto: comissoes.reduce((sum, c) => sum + Number(c.valor_comissao), 0),
    valor_total_liquido: comissoes.reduce((sum, c) => sum + Number(c.valor_liquido), 0),
    total_impostos: comissoes.reduce((sum, c) => sum + Number(c.imposto_retido), 0),
  }

  const by_status: Record<string, { count: number; value: number }> = {}
  const by_vendedor: Record<string, { count: number; value: number; nome: string }> = {}

  comissoes.forEach((comissao) => {
    // Group by status
    if (!by_status[comissao.status]) {
      by_status[comissao.status] = { count: 0, value: 0 }
    }
    by_status[comissao.status].count++
    by_status[comissao.status].value += Number(comissao.valor_liquido)

    // Group by vendedor
    const vendedorId = comissao.vendedor_id
    if (!by_vendedor[vendedorId]) {
      by_vendedor[vendedorId] = {
        count: 0,
        value: 0,
        nome: comissao.vendedor?.nome || "Unknown",
      }
    }
    by_vendedor[vendedorId].count++
    by_vendedor[vendedorId].value += Number(comissao.valor_liquido)
  })

  return { summary, by_status, by_vendedor }
}

/**
 * Format currency for Brazilian Real
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

/**
 * Format date for Brazilian format
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("pt-BR").format(dateObj)
}
