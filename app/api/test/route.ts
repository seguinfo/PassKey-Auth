import { NextResponse, type NextRequest } from "next/server"

export async function GET() {
  try {
    // Test básico de configuración
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    // Test de importaciones
    const importCheck = {
      simplewebauthn: false,
      supabase: false,
    }

    try {
      await import("@simplewebauthn/server")
      importCheck.simplewebauthn = true
    } catch (e) {
      console.error("SimpleWebAuthn import error:", e)
    }

    try {
      await import("@supabase/supabase-js")
      importCheck.supabase = true
    } catch (e) {
      console.error("Supabase import error:", e)
    }

    // Test de conexión a Supabase
    const dbCheck = { connected: false, error: null }

    if (envCheck.supabaseUrl && envCheck.supabaseKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        const { error } = await supabase.from("users").select("count").limit(1)
        if (!error) {
          dbCheck.connected = true
        } else {
          dbCheck.error = error.message
        }
      } catch (e: any) {
        dbCheck.error = e.message
      }
    }

    return NextResponse.json({
      status: "ok",
      environment: envCheck,
      imports: importCheck,
      database: dbCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { config } = body

    // Usar configuración enviada o variables de entorno como fallback
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (config?.supabaseUrl && config?.serviceRoleKey) {
      supabaseUrl = config.supabaseUrl
      serviceRoleKey = config.serviceRoleKey
    }

    // Test básico de configuración
    const envCheck = {
      supabaseUrl: !!supabaseUrl,
      supabaseKey: !!serviceRoleKey,
      source: config ? "localStorage" : "environment",
    }

    // Test de importaciones
    const importCheck = {
      simplewebauthn: false,
      supabase: false,
    }

    try {
      await import("@simplewebauthn/server")
      importCheck.simplewebauthn = true
    } catch (e) {
      console.error("SimpleWebAuthn import error:", e)
    }

    try {
      await import("@supabase/supabase-js")
      importCheck.supabase = true
    } catch (e) {
      console.error("Supabase import error:", e)
    }

    // Test de conexión a Supabase
    const dbCheck = { connected: false, error: null }

    if (envCheck.supabaseUrl && envCheck.supabaseKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(supabaseUrl!, serviceRoleKey!)

        const { error } = await supabase.from("users").select("count").limit(1)
        if (!error) {
          dbCheck.connected = true
        } else {
          dbCheck.error = error.message
        }
      } catch (e: any) {
        dbCheck.error = e.message
      }
    }

    return NextResponse.json({
      status: "ok",
      environment: envCheck,
      imports: importCheck,
      database: dbCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
