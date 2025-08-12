import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET /api/users - List all users (admin/gerente only)
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

    // Only admin and gerente can list users
    if (!["admin", "gerente"].includes(userProfile.perfil)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const perfil = searchParams.get("perfil") || ""
    const ativo = searchParams.get("ativo")

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from("users")
      .select("id, email, nome, perfil, ativo, created_at, updated_at", { count: "exact" })

    // Apply filters
    if (search) {
      query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (perfil) {
      query = query.eq("perfil", perfil)
    }
    if (ativo !== null && ativo !== "") {
      query = query.eq("ativo", ativo === "true")
    }

    // Apply pagination and ordering
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({
      users,
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

// POST /api/users - Create new user (admin only)
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

    // Get user profile to check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("perfil")
      .eq("id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Only admin can create users
    if (userProfile.perfil !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { email, nome, perfil, ativo = true } = body

    // Validate required fields
    if (!email || !nome || !perfil) {
      return NextResponse.json({ error: "Email, nome, and perfil are required" }, { status: 400 })
    }

    // Validate perfil
    if (!["admin", "vendedor", "gerente"].includes(perfil)) {
      return NextResponse.json({ error: "Invalid perfil" }, { status: 400 })
    }

    // Create user
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email,
        nome,
        perfil,
        ativo,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating user:", error)
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
