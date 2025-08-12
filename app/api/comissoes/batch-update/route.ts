import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// POST /api/comissoes/batch-update - Batch update commissions (admin/gerente only)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("perfil")
      .eq("id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Only admin/gerente can batch update commissions
    if (!["admin", "gerente"].includes(userProfile.perfil)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { comissao_ids, status, data_pagamento, observacoes } = body

    // Validate required fields
    if (!comissao_ids || !Array.isArray(comissao_ids) || comissao_ids.length === 0) {
      return NextResponse.json({ error: "comissao_ids array is required" }, { status: 400 })
    }

    // Validate status
    if (status && !["pendente", "paga", "cancelada"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {}

    if (status) {
      updateData.status = status
      // If marking as paid, set payment date
      if (status === "paga" && !data_pagamento) {
        updateData.data_pagamento = new Date().toISOString().split("T")[0]
      }
    }

    if (data_pagamento) {
      updateData.data_pagamento = data_pagamento
    }

    if (observacoes !== undefined) {
      updateData.observacoes = observacoes
    }

    // Perform batch update
    const { data: updatedComissoes, error } = await supabase
      .from("comissoes")
      .update(updateData)
      .in("id", comissao_ids)
      .select(
        `
        *,
        vendedor:users!vendedor_id(id, nome, email, perfil),
        venda:vendas!venda_id(id, cliente_nome, valor_liquido, data_venda)
      `,
      )

    if (error) {
      console.error("Error batch updating comissoes:", error)
      return NextResponse.json({ error: "Failed to update comissoes" }, { status: 500 })
    }

    return NextResponse.json({
      message: `Successfully updated ${updatedComissoes.length} commissions`,
      updated_comissoes: updatedComissoes,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
