import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, config } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    // Obtener configuración de Supabase
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (config?.supabaseUrl && config?.serviceRoleKey) {
      supabaseUrl = config.supabaseUrl
      serviceRoleKey = config.serviceRoleKey
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 })
    }

    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Buscar usuario
    const { data: user, error: userError } = await supabase.from("users").select("*").eq("email", email).maybeSingle()

    // Buscar credenciales si existe el usuario
    let credentials = null
    if (user) {
      const { data: creds, error: credError } = await supabase
        .from("user_credentials")
        .select("*")
        .eq("user_id", user.id)

      credentials = { data: creds, error: credError }
    }

    // Buscar challenges
    const { data: challenges, error: challengeError } = await supabase
      .from("temp_challenges")
      .select("*")
      .eq("email", email)

    return NextResponse.json({
      email,
      user: { data: user, error: userError },
      credentials,
      challenges: { data: challenges, error: challengeError },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
