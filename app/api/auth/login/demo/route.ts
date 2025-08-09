import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, credential, config } = body

    if (!email || !credential) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Obtener configuración de Supabase
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (config?.supabaseUrl && config?.serviceRoleKey) {
      supabaseUrl = config.supabaseUrl
      serviceRoleKey = config.serviceRoleKey
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error: "Configuración de Supabase incompleta",
        },
        { status: 500 },
      )
    }

    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Obtener usuario de la base de datos
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", email)
      .maybeSingle()

    if (userError || !user) {
      console.error("User lookup error:", userError)
      return NextResponse.json({ error: "Usuario no encontrado. ¿Te has registrado?" }, { status: 404 })
    }

    // Obtener credenciales del usuario de la base de datos
    const { data: credentials, error: credError } = await supabase
      .from("user_credentials")
      .select("id, credential_id, public_key, counter")
      .eq("user_id", user.id)

    if (credError || !credentials || credentials.length === 0) {
      console.error("Credentials lookup error:", credError)
      return NextResponse.json(
        {
          error: "No se encontraron credenciales para este usuario. Intenta registrarte de nuevo.",
        },
        { status: 404 },
      )
    }

    // Verificar que la credencial usada existe en la base de datos
    const credentialIdFromResponse = credential.id
    const userCredential = credentials.find((cred: any) => cred.credential_id === credentialIdFromResponse)

    if (!userCredential) {
      console.error("Credential not found for ID:", credentialIdFromResponse)
      console.error(
        "Available credentials:",
        credentials.map((c) => c.credential_id),
      )
      return NextResponse.json({ error: "Credencial específica no encontrada" }, { status: 404 })
    }

    // En modo demo, simplemente actualizamos el contador
    const newCounter = userCredential.counter + 1
    const { error: updateError } = await supabase
      .from("user_credentials")
      .update({
        counter: newCounter,
      })
      .eq("id", userCredential.id)

    if (updateError) {
      console.error("Error updating credential counter:", updateError)
      // No fallar por esto, solo loggearlo
    }

    return NextResponse.json({
      verified: true,
      user: { id: user.id, email: user.email, name: user.name },
      demo: true,
    })
  } catch (error: any) {
    console.error("Error en login demo:", error)
    return NextResponse.json(
      {
        error: `Error interno: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
