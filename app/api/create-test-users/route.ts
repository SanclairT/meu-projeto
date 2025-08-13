import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const testUsers = [
      { email: "admin@local", password: "123456", nome: "Admin", perfil: "admin" },
      { email: "financeiro@local", password: "123456", nome: "Financeiro", perfil: "financeiro" },
      { email: "mayra@local", password: "123456", nome: "Mayra", perfil: "vendedor" },
      { email: "liliane@local", password: "123456", nome: "Liliane", perfil: "vendedor" },
    ]

    const results = []

    for (const user of testUsers) {
      try {
        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        })

        if (authError) {
          console.error(`Error creating auth user ${user.email}:`, authError)
          results.push({ email: user.email, success: false, error: authError.message })
          continue
        }

        // Create user profile in users table
        const { error: profileError } = await supabaseAdmin.from("users").upsert({
          id: authData.user.id,
          email: user.email,
          nome: user.nome,
          perfil: user.perfil,
          ativo: true,
        })

        if (profileError) {
          console.error(`Error creating user profile ${user.email}:`, profileError)
          results.push({ email: user.email, success: false, error: profileError.message })
        } else {
          results.push({ email: user.email, success: true })
        }
      } catch (error) {
        console.error(`Unexpected error for user ${user.email}:`, error)
        results.push({ email: user.email, success: false, error: "Unexpected error" })
      }
    }

    return NextResponse.json({
      message: "Test users creation completed",
      results,
    })
  } catch (error) {
    console.error("Error creating test users:", error)
    return NextResponse.json({ error: "Failed to create test users" }, { status: 500 })
  }
}
