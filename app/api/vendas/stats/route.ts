import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/vendas/stats - Get sales statistics
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const vendedor_id = searchParams.get("vendedor_id") || ""
    const data_inicio = searchParams.get("data_inicio") || ""
    const data_fim = searchParams.get("data_fim") || ""

    // Build base query
    let query = supabase.from("vendas").select("*")

    // Apply user-based filtering
    if (userProfile.perfil === "vendedor") {
      query = query.eq("vendedor_id", user.id)
    } else if (vendedor_id && ["admin", "gerente"].includes(userProfile.perfil)) {
      query = query.eq("vendedor_id", vendedor_id)
    }

    // Apply date filters
    if (data_inicio) {
      query = query.gte("data_venda", data_inicio)
    }
    if (data_fim) {
      query = query.lte("data_venda", data_fim)
    }

    const { data: vendas, error } = await query

    if (error) {
      console.error("Error fetching vendas for stats:", error)
      return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      total_vendas: vendas.length,
      valor_total_bruto: vendas.reduce((sum, v) => sum + Number(v.valor_bruto), 0),
      valor_total_liquido: vendas.reduce((sum, v) => sum + Number(v.valor_liquido), 0),
      total_comissoes: vendas.reduce((sum, v) => sum + Number(v.comissao_valor), 0),
      total_impostos: vendas.reduce((sum, v) => sum + Number(v.imposto_retido), 0),
      total_comissoes_liquidas: vendas.reduce((sum, v) => sum + Number(v.comissao_liquida), 0),
      vendas_por_status: {
        pendente: vendas.filter((v) => v.status === "pendente").length,
        aprovada: vendas.filter((v) => v.status === "aprovada").length,
        paga: vendas.filter((v) => v.status === "paga").length,
        cancelada: vendas.filter((v) => v.status === "cancelada").length,
      },
      ticket_medio: vendas.length > 0 ? vendas.reduce((sum, v) => sum + Number(v.valor_liquido), 0) / vendas.length : 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
