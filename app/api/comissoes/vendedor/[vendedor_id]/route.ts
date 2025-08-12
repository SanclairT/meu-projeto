import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/comissoes/vendedor/[vendedor_id] - Get commissions by vendedor
export async function GET(request: NextRequest, { params }: { params: { vendedor_id: string } }) {
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

    const { vendedor_id } = params

    // Vendedores can only see their own commissions
    if (userProfile.perfil === "vendedor" && user.id !== vendedor_id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") || ""
    const data_inicio = searchParams.get("data_inicio") || ""
    const data_fim = searchParams.get("data_fim") || ""

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from("comissoes")
      .select(
        `
        *,
        vendedor:users!vendedor_id(id, nome, email, perfil),
        venda:vendas!venda_id(id, cliente_nome, valor_liquido, data_venda)
      `,
        { count: "exact" },
      )
      .eq("vendedor_id", vendedor_id)

    // Apply filters
    if (status) {
      query = query.eq("status", status)
    }
    if (data_inicio) {
      query = query.gte("created_at", data_inicio)
    }
    if (data_fim) {
      query = query.lte("created_at", data_fim)
    }

    // Apply pagination and ordering
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data: comissoes, error, count } = await query

    if (error) {
      console.error("Error fetching comissoes by vendedor:", error)
      return NextResponse.json({ error: "Failed to fetch comissoes" }, { status: 500 })
    }

    return NextResponse.json({
      comissoes,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
