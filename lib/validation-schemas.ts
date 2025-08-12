// Validation schemas using Zod for type safety and runtime validation

import { z } from "zod"

// User schemas
export const CreateUserSchema = z.object({
  email: z.string().email("Email deve ter um formato válido").max(255, "Email muito longo"),
  nome: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  perfil: z.enum(["admin", "vendedor", "gerente"], {
    errorMap: () => ({ message: "Perfil deve ser admin, vendedor ou gerente" }),
  }),
  ativo: z.boolean().optional().default(true),
})

export const UpdateUserSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo").optional(),
  perfil: z
    .enum(["admin", "vendedor", "gerente"], {
      errorMap: () => ({ message: "Perfil deve ser admin, vendedor ou gerente" }),
    })
    .optional(),
  ativo: z.boolean().optional(),
})

// Sale schemas
export const CreateSaleSchema = z
  .object({
    vendedor_id: z.string().uuid("ID do vendedor inválido").optional(),
    cliente_nome: z.string().min(1, "Nome do cliente é obrigatório").max(255, "Nome do cliente muito longo"),
    cliente_email: z.string().email("Email do cliente inválido").max(255, "Email muito longo").optional(),
    cliente_telefone: z.string().max(50, "Telefone muito longo").optional(),
    valor_bruto: z.number().positive("Valor bruto deve ser maior que zero"),
    desconto: z.number().min(0, "Desconto não pode ser negativo").optional().default(0),
    comissao_percentual: z
      .number()
      .min(0, "Percentual de comissão não pode ser negativo")
      .max(100, "Percentual de comissão não pode ser maior que 100"),
    data_venda: z.string().refine((date) => {
      const saleDate = new Date(date)
      const today = new Date()
      return saleDate <= today
    }, "Data da venda não pode ser futura"),
    observacoes: z.string().optional(),
  })
  .refine((data) => data.desconto < data.valor_bruto, {
    message: "Desconto não pode ser maior ou igual ao valor bruto",
    path: ["desconto"],
  })

export const UpdateSaleSchema = z
  .object({
    cliente_nome: z.string().min(1, "Nome do cliente é obrigatório").max(255, "Nome do cliente muito longo").optional(),
    cliente_email: z.string().email("Email do cliente inválido").max(255, "Email muito longo").optional(),
    cliente_telefone: z.string().max(50, "Telefone muito longo").optional(),
    valor_bruto: z.number().positive("Valor bruto deve ser maior que zero").optional(),
    desconto: z.number().min(0, "Desconto não pode ser negativo").optional(),
    comissao_percentual: z
      .number()
      .min(0, "Percentual de comissão não pode ser negativo")
      .max(100, "Percentual de comissão não pode ser maior que 100")
      .optional(),
    data_venda: z
      .string()
      .refine((date) => {
        const saleDate = new Date(date)
        const today = new Date()
        return saleDate <= today
      }, "Data da venda não pode ser futura")
      .optional(),
    observacoes: z.string().optional(),
    status: z.enum(["pendente", "aprovada", "paga", "cancelada"]).optional(),
  })
  .refine(
    (data) => {
      if (data.valor_bruto !== undefined && data.desconto !== undefined) {
        return data.desconto < data.valor_bruto
      }
      return true
    },
    {
      message: "Desconto não pode ser maior ou igual ao valor bruto",
      path: ["desconto"],
    },
  )

// Commission schemas
export const UpdateCommissionSchema = z.object({
  status: z.enum(["pendente", "paga", "cancelada"]).optional(),
  data_pagamento: z.string().optional(),
  observacoes: z.string().optional(),
})

export const BatchUpdateCommissionSchema = z.object({
  comissao_ids: z
    .array(z.string().uuid("ID de comissão inválido"))
    .min(1, "Pelo menos uma comissão deve ser selecionada"),
  status: z.enum(["pendente", "paga", "cancelada"]).optional(),
  data_pagamento: z.string().optional(),
  observacoes: z.string().optional(),
})

// Query parameter schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const UserQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  perfil: z.enum(["admin", "vendedor", "gerente"]).optional(),
  ativo: z.coerce.boolean().optional(),
})

export const SaleQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  status: z.enum(["pendente", "aprovada", "paga", "cancelada"]).optional(),
  vendedor_id: z.string().uuid().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
})

export const CommissionQuerySchema = PaginationSchema.extend({
  status: z.enum(["pendente", "paga", "cancelada"]).optional(),
  vendedor_id: z.string().uuid().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
})

// Type exports
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type CreateSaleInput = z.infer<typeof CreateSaleSchema>
export type UpdateSaleInput = z.infer<typeof UpdateSaleSchema>
export type UpdateCommissionInput = z.infer<typeof UpdateCommissionSchema>
export type BatchUpdateCommissionInput = z.infer<typeof BatchUpdateCommissionSchema>
export type UserQueryInput = z.infer<typeof UserQuerySchema>
export type SaleQueryInput = z.infer<typeof SaleQuerySchema>
export type CommissionQueryInput = z.infer<typeof CommissionQuerySchema>
