import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, serviceRoleKey } = await request.json()

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          status: "error",
          error: "URL y Service Role Key son requeridos",
        },
        { status: 400 },
      )
    }

    // Validar formato de URL
    try {
      new URL(supabaseUrl)
    } catch {
      return NextResponse.json(
        {
          status: "error",
          error: "La URL de Supabase no es válida",
        },
        { status: 400 },
      )
    }

    // Probar conexión con las credenciales proporcionadas
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Probar conexión básica
    const { data, error } = await supabase.from("users").select("count").limit(1)

    if (error) {
      return NextResponse.json({
        status: "error",
        error: `Error de base de datos: ${error.message}`,
        details: "Verifica que las tablas estén creadas y las credenciales sean correctas",
      })
    }

    // Obtener estadísticas si hay función disponible
    let stats = null
    try {
      const { data: statsData } = await supabase.rpc("get_database_stats")
      stats = statsData
    } catch {
      // La función no existe, usar conteos básicos
      const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true })
      const { count: credCount } = await supabase.from("user_credentials").select("*", { count: "exact", head: true })

      stats = {
        total_users: userCount || 0,
        total_credentials: credCount || 0,
      }
    }

    return NextResponse.json({
      status: "success",
      message: "Configuración válida",
      database: {
        connected: true,
        stats,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error testing config:", error)
    return NextResponse.json(
      {
        status: "error",
        error: `Error interno: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
