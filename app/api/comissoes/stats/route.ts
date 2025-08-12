import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/comissoes/stats - Get commission statistics
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
    let query = supabase.from("comissoes").select("*")

    // Apply user-based filtering
    if (userProfile.perfil === "vendedor") {
      query = query.eq("vendedor_id", user.id)
    } else if (vendedor_id && ["admin", "gerente"].includes(userProfile.perfil)) {
      query = query.eq("vendedor_id", vendedor_id)
    }

    // Apply date filters
    if (data_inicio) {
      query = query.gte("created_at", data_inicio)
    }
    if (data_fim) {
      query = query.lte("created_at", data_fim)
    }

    const { data: comissoes, error } = await query

    if (error) {
      console.error("Error fetching comissoes for stats:", error)
      return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      total_comissoes: comissoes.length,
      valor_total_bruto: comissoes.reduce((sum, c) => sum + Number(c.valor_comissao), 0),
      valor_total_impostos: comissoes.reduce((sum, c) => sum + Number(c.imposto_retido), 0),
      valor_total_liquido: comissoes.reduce((sum, c) => sum + Number(c.valor_liquido), 0),
      comissoes_por_status: {
        pendente: comissoes.filter((c) => c.status === "pendente").length,
        paga: comissoes.filter((c) => c.status === "paga").length,
        cancelada: comissoes.filter((c) => c.status === "cancelada").length,
      },
      valores_por_status: {
        pendente: comissoes.filter((c) => c.status === "pendente").reduce((sum, c) => sum + Number(c.valor_liquido), 0),
        paga: comissoes.filter((c) => c.status === "paga").reduce((sum, c) => sum + Number(c.valor_liquido), 0),
        cancelada: comissoes
          .filter((c) => c.status === "cancelada")
          .reduce((sum, c) => sum + Number(c.valor_liquido), 0),
      },
      comissao_media:
        comissoes.length > 0 ? comissoes.reduce((sum, c) => sum + Number(c.valor_liquido), 0) / comissoes.length : 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
