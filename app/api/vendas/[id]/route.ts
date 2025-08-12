import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/vendas/[id] - Get sale by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params

    // Build query with user-based filtering
    let query = supabase
      .from("vendas")
      .select(
        `
        *,
        vendedor:users!vendedor_id(id, nome, email, perfil)
      `,
      )
      .eq("id", id)

    // Vendedores can only see their own sales
    if (userProfile.perfil === "vendedor") {
      query = query.eq("vendedor_id", user.id)
    }

    const { data: venda, error } = await query.single()

    if (error) {
      console.error("Error fetching venda:", error)
      return NextResponse.json({ error: "Venda not found" }, { status: 404 })
    }

    return NextResponse.json(venda)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/vendas/[id] - Update sale
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params
    const body = await request.json()

    // Get existing sale to check permissions
    let vendaQuery = supabase.from("vendas").select("*").eq("id", id)

    // Vendedores can only update their own sales
    if (userProfile.perfil === "vendedor") {
      vendaQuery = vendaQuery.eq("vendedor_id", user.id)
    }

    const { data: existingVenda, error: fetchError } = await vendaQuery.single()

    if (fetchError) {
      return NextResponse.json({ error: "Venda not found or access denied" }, { status: 404 })
    }

    // Only allow updates if status is 'pendente'
    if (existingVenda.status !== "pendente") {
      return NextResponse.json({ error: "Can only update pending sales" }, { status: 400 })
    }

    const {
      cliente_nome,
      cliente_email,
      cliente_telefone,
      valor_bruto,
      desconto,
      comissao_percentual,
      data_venda,
      observacoes,
      status,
    } = body

    // Prepare update data
    const updateData: any = {}

    if (cliente_nome) updateData.cliente_nome = cliente_nome
    if (cliente_email !== undefined) updateData.cliente_email = cliente_email
    if (cliente_telefone !== undefined) updateData.cliente_telefone = cliente_telefone
    if (observacoes !== undefined) updateData.observacoes = observacoes
    if (data_venda) updateData.data_venda = data_venda

    // Handle financial calculations if values changed
    if (valor_bruto !== undefined || desconto !== undefined || comissao_percentual !== undefined) {
      const newValorBruto = valor_bruto ?? existingVenda.valor_bruto
      const newDesconto = desconto ?? existingVenda.desconto
      const newComissaoPercentual = comissao_percentual ?? existingVenda.comissao_percentual

      // Validate values
      if (newValorBruto <= 0 || newDesconto < 0 || newComissaoPercentual < 0 || newComissaoPercentual > 100) {
        return NextResponse.json({ error: "Invalid numeric values" }, { status: 400 })
      }

      const valor_liquido = newValorBruto - newDesconto
      const comissao_valor = (valor_liquido * newComissaoPercentual) / 100
      const imposto_retido = comissao_valor * 0.15
      const comissao_liquida = comissao_valor - imposto_retido

      updateData.valor_bruto = newValorBruto
      updateData.desconto = newDesconto
      updateData.valor_liquido = valor_liquido
      updateData.comissao_percentual = newComissaoPercentual
      updateData.comissao_valor = comissao_valor
      updateData.imposto_retido = imposto_retido
      updateData.comissao_liquida = comissao_liquida
    }

    // Only admin/gerente can change status
    if (status && ["admin", "gerente"].includes(userProfile.perfil)) {
      if (["pendente", "aprovada", "paga", "cancelada"].includes(status)) {
        updateData.status = status
      }
    }

    const { data: updatedVenda, error } = await supabase
      .from("vendas")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        vendedor:users!vendedor_id(id, nome, email, perfil)
      `,
      )
      .single()

    if (error) {
      console.error("Error updating venda:", error)
      return NextResponse.json({ error: "Failed to update venda" }, { status: 500 })
    }

    // Update corresponding commission record if financial values changed
    if (updateData.comissao_valor !== undefined) {
      await supabase
        .from("comissoes")
        .update({
          valor_comissao: updateData.comissao_valor,
          imposto_retido: updateData.imposto_retido,
          valor_liquido: updateData.comissao_liquida,
        })
        .eq("venda_id", id)
    }

    return NextResponse.json(updatedVenda)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/vendas/[id] - Delete sale (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Only admin can delete sales
    if (userProfile.perfil !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = params

    // Check if sale exists and is deletable
    const { data: existingVenda, error: fetchError } = await supabase
      .from("vendas")
      .select("status")
      .eq("id", id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Venda not found" }, { status: 404 })
    }

    // Only allow deletion of pending or cancelled sales
    if (!["pendente", "cancelada"].includes(existingVenda.status)) {
      return NextResponse.json({ error: "Can only delete pending or cancelled sales" }, { status: 400 })
    }

    const { error } = await supabase.from("vendas").delete().eq("id", id)

    if (error) {
      console.error("Error deleting venda:", error)
      return NextResponse.json({ error: "Failed to delete venda" }, { status: 500 })
    }

    return NextResponse.json({ message: "Venda deleted successfully" })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
