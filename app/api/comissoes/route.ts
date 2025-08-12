import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/comissoes - List commissions with filters and pagination
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

    // Get user profile to check permissions
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
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") || ""
    const vendedor_id = searchParams.get("vendedor_id") || ""
    const data_inicio = searchParams.get("data_inicio") || ""
    const data_fim = searchParams.get("data_fim") || ""

    const offset = (page - 1) * limit

    // Build query - vendedores can only see their own commissions
    let query = supabase.from("comissoes").select(
      `
        *,
        vendedor:users!vendedor_id(id, nome, email, perfil),
        venda:vendas!venda_id(id, cliente_nome, valor_liquido, data_venda)
      `,
      { count: "exact" },
    )

    // Apply user-based filtering
    if (userProfile.perfil === "vendedor") {
      query = query.eq("vendedor_id", user.id)
    } else if (vendedor_id && ["admin", "gerente"].includes(userProfile.perfil)) {
      query = query.eq("vendedor_id", vendedor_id)
    }

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
      console.error("Error fetching comissoes:", error)
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
