import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/vendas - List sales with filters and pagination
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
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const vendedor_id = searchParams.get("vendedor_id") || ""
    const data_inicio = searchParams.get("data_inicio") || ""
    const data_fim = searchParams.get("data_fim") || ""

    const offset = (page - 1) * limit

    // Build query - vendedores can only see their own sales
    let query = supabase.from("vendas").select(
      `
        *,
        vendedor:users!vendedor_id(id, nome, email, perfil)
      `,
      { count: "exact" },
    )

    // Apply user-based filtering
    if (userProfile.perfil === "vendedor") {
      query = query.eq("vendedor_id", user.id)
    } else if (vendedor_id && ["admin", "gerente", "financeiro"].includes(userProfile.perfil)) {
      query = query.eq("vendedor_id", vendedor_id)
    }

    // Apply filters
    if (search) {
      query = query.or(`cliente_nome.ilike.%${search}%,cliente_email.ilike.%${search}%`)
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (data_inicio) {
      query = query.gte("data_venda", data_inicio)
    }
    if (data_fim) {
      query = query.lte("data_venda", data_fim)
    }

    // Apply pagination and ordering
    query = query.order("data_venda", { ascending: false }).range(offset, offset + limit - 1)

    const { data: vendas, error, count } = await query

    if (error) {
      console.error("Error fetching vendas:", error)
      return NextResponse.json({ error: "Failed to fetch vendas" }, { status: 500 })
    }

    return NextResponse.json({
      vendas,
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

// POST /api/vendas - Create new sale
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

    const body = await request.json()
    const {
      vendedor_id,
      cliente_nome,
      cliente_email,
      cliente_telefone,
      valor_bruto,
      desconto = 0,
      comissao_percentual,
      data_venda,
      observacoes,
    } = body

    // Validate required fields
    if (!cliente_nome || !valor_bruto || !comissao_percentual || !data_venda) {
      return NextResponse.json(
        { error: "cliente_nome, valor_bruto, comissao_percentual, and data_venda are required" },
        { status: 400 },
      )
    }

    // Validate numeric values
    if (valor_bruto <= 0 || desconto < 0 || comissao_percentual < 0 || comissao_percentual > 100) {
      return NextResponse.json({ error: "Invalid numeric values" }, { status: 400 })
    }

    // Determine vendedor_id - vendedores can only create sales for themselves
    let finalVendedorId = vendedor_id
    if (userProfile.perfil === "vendedor") {
      finalVendedorId = user.id
    } else if (!vendedor_id) {
      return NextResponse.json({ error: "vendedor_id is required" }, { status: 400 })
    }

    // Calculate values
    const valor_liquido = valor_bruto - desconto
    const comissao_valor = (valor_liquido * comissao_percentual) / 100
    const imposto_retido = comissao_valor * 0.15 // 15% tax retention
    const comissao_liquida = comissao_valor - imposto_retido

    // Create sale
    const { data: newVenda, error } = await supabase
      .from("vendas")
      .insert({
        vendedor_id: finalVendedorId,
        cliente_nome,
        cliente_email,
        cliente_telefone,
        valor_bruto,
        desconto,
        valor_liquido,
        comissao_percentual,
        comissao_valor,
        imposto_retido,
        comissao_liquida,
        data_venda,
        observacoes,
      })
      .select(
        `
        *,
        vendedor:users!vendedor_id(id, nome, email, perfil)
      `,
      )
      .single()

    if (error) {
      console.error("Error creating venda:", error)
      return NextResponse.json({ error: "Failed to create venda" }, { status: 500 })
    }

    // Create corresponding commission record
    await supabase.from("comissoes").insert({
      venda_id: newVenda.id,
      vendedor_id: finalVendedorId,
      valor_comissao: comissao_valor,
      imposto_retido,
      valor_liquido: comissao_liquida,
    })

    return NextResponse.json(newVenda, { status: 201 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
