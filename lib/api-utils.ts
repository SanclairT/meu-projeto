// Utility functions for API routes

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkPermissions } from "@/lib/business-logic"
import type { z } from "zod"

export interface AuthenticatedUser {
  id: string
  email: string
  perfil: string
}

/**
 * Authenticate user and get profile
 */
export async function authenticateUser(): Promise<{ user: AuthenticatedUser | null; error: NextResponse | null }> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        user: null,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      }
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("perfil")
      .eq("id", user.id)
      .single()

    if (profileError || !userProfile) {
      return {
        user: null,
        error: NextResponse.json({ error: "User profile not found" }, { status: 404 }),
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email || "",
        perfil: userProfile.perfil,
      },
      error: null,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return {
      user: null,
      error: NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    }
  }
}

/**
 * Check user permissions for an action
 */
export function checkUserPermissions(
  user: AuthenticatedUser,
  action: string,
  resourceOwnerId?: string,
): { hasPermission: boolean; error: NextResponse | null } {
  const hasPermission = checkPermissions(user.perfil, action, resourceOwnerId, user.id)

  if (!hasPermission) {
    return {
      hasPermission: false,
      error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    }
  }

  return { hasPermission: true, error: null }
}

/**
 * Validate request body against schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const errors = result.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`)
      return {
        data: null,
        error: NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 }),
      }
    }

    return { data: result.data, error: null }
  } catch (error) {
    return {
      data: null,
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    }
  }
}

/**
 * Validate query parameters against schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
): { data: T | null; error: NextResponse | null } {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const result = schema.safeParse(params)

    if (!result.success) {
      const errors = result.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`)
      return {
        data: null,
        error: NextResponse.json({ error: "Invalid query parameters", details: errors }, { status: 400 }),
      }
    }

    return { data: result.data, error: null }
  } catch (error) {
    return {
      data: null,
      error: NextResponse.json({ error: "Invalid query parameters" }, { status: 400 }),
    }
  }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any, context: string): NextResponse {
  console.error(`${context}:`, error)

  // Handle Supabase errors
  if (error.code) {
    switch (error.code) {
      case "23505": // Unique constraint violation
        return NextResponse.json({ error: "Resource already exists" }, { status: 409 })
      case "23503": // Foreign key constraint violation
        return NextResponse.json({ error: "Referenced resource not found" }, { status: 400 })
      case "42P01": // Table does not exist
        return NextResponse.json({ error: "Database configuration error" }, { status: 500 })
      default:
        return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
  }

  // Handle validation errors
  if (error.name === "ZodError") {
    const errors = error.errors.map((err: any) => `${err.path.join(".")}: ${err.message}`)
    return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 })
  }

  // Generic error
  return NextResponse.json({ error: "Internal server error" }, { status: 500 })
}

/**
 * Create success response with optional data
 */
export function createSuccessResponse(data?: any, status = 200): NextResponse {
  if (data) {
    return NextResponse.json(data, { status })
  }
  return NextResponse.json({ success: true }, { status })
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  },
): NextResponse {
  return NextResponse.json({
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  })
}
