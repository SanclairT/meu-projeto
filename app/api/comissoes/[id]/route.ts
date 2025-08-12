import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/comissoes/[id] - Get commission by ID
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
      .from("comissoes")
      .select(
        `
        *,
        vendedor:users!vendedor_id(id, nome, email, perfil),
        venda:vendas!venda_id(id, cliente_nome, valor_liquido, data_venda)
      `,
      )
      .eq("id", id)

    // Vendedores can only see their own commissions
    if (userProfile.perfil === "vendedor") {
      query = query.eq("vendedor_id", user.id)
    }

    const { data: comissao, error } = await query.single()

    if (error) {
      console.error("Error fetching comissao:", error)
      return NextResponse.json({ error: "Comissao not found" }, { status: 404 })
    }

    return NextResponse.json(comissao)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/comissoes/[id] - Update commission (admin/gerente only)
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

    // Only admin/gerente can update commissions
    if (!["admin", "gerente"].includes(userProfile.perfil)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = params
    const body = await request.json()
    const { status, data_pagamento, observacoes } = body

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

    const { data: updatedComissao, error } = await supabase
      .from("comissoes")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        vendedor:users!vendedor_id(id, nome, email, perfil),
        venda:vendas!venda_id(id, cliente_nome, valor_liquido, data_venda)
      `,
      )
      .single()

    if (error) {
      console.error("Error updating comissao:", error)
      return NextResponse.json({ error: "Failed to update comissao" }, { status: 500 })
    }

    return NextResponse.json(updatedComissao)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
