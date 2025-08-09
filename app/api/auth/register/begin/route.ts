import { type NextRequest, NextResponse } from "next/server"
import { getWebAuthnConfigFromRequest } from "@/lib/webauthn-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, config } = body

    if (!email || !name) {
      return NextResponse.json({ error: "Email y nombre son requeridos" }, { status: 400 })
    }

    // Obtener configuración de WebAuthn basada en el dominio actual
    const webauthnConfig = getWebAuthnConfigFromRequest(request)
    console.log("WebAuthn config for registration:", webauthnConfig)

    // Obtener configuración de Supabase
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Si se proporciona configuración en el request, usarla
    if (config?.supabaseUrl && config?.serviceRoleKey) {
      supabaseUrl = config.supabaseUrl
      serviceRoleKey = config.serviceRoleKey
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error: "Configuración de Supabase incompleta. Configura las variables de entorno.",
        },
        { status: 500 },
      )
    }

    // Importación dinámica para evitar errores de módulo
    const { generateRegistrationOptions } = await import("@simplewebauthn/server")
    const { createClient } = await import("@supabase/supabase-js")

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (checkError) {
      console.error("Database error:", checkError)
      return NextResponse.json(
        {
          error: "Error de base de datos. Verifica que las tablas estén creadas.",
        },
        { status: 500 },
      )
    }

    if (existingUser) {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 })
    }

    // Generar opciones de registro con configuración dinámica
    const options = await generateRegistrationOptions({
      rpName: webauthnConfig.rpName,
      rpID: webauthnConfig.rpID,
      userID: new TextEncoder().encode(email),
      userName: email,
      userDisplayName: name,
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred",
        residentKey: "preferred",
      },
      supportedAlgorithmIDs: [-7, -257],
      timeout: 60000,
    })

    // LIMPIAR CHALLENGES EXISTENTES PRIMERO
    console.log("Cleaning existing challenges for email:", email)
    await supabase.from("temp_challenges").delete().eq("email", email).eq("type", "registration")

    // Guardar el nuevo challenge
    const { error: challengeError } = await supabase.from("temp_challenges").insert({
      email,
      challenge: options.challenge,
      type: "registration",
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })

    if (challengeError) {
      console.error("Challenge save error:", challengeError)
      return NextResponse.json(
        {
          error: "Error guardando challenge. Verifica la tabla temp_challenges.",
        },
        { status: 500 },
      )
    }

    console.log("New challenge saved successfully")

    return NextResponse.json(options)
  } catch (error: any) {
    console.error("Error en registro begin:", error)
    return NextResponse.json(
      {
        error: `Error interno: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
