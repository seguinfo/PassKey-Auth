import { type NextRequest, NextResponse } from "next/server"
import { getWebAuthnConfigFromRequest } from "@/lib/webauthn-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, config } = body

    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    // Obtener configuración de WebAuthn basada en el dominio actual
    const webauthnConfig = getWebAuthnConfigFromRequest(request)
    console.log("WebAuthn config for login:", webauthnConfig)

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
          error: "Configuración de Supabase incompleta",
        },
        { status: 500 },
      )
    }

    // Importación dinámica
    const { generateAuthenticationOptions } = await import("@simplewebauthn/server")
    const { createClient } = await import("@supabase/supabase-js")

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Primero verificar si el usuario existe
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("email", email)
      .maybeSingle()

    if (userError) {
      console.error("User lookup error:", userError)
      return NextResponse.json({ error: `Error buscando usuario: ${userError.message}` }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado. ¿Te has registrado?" }, { status: 404 })
    }

    // Ahora buscar las credenciales del usuario
    const { data: credentials, error: credError } = await supabase
      .from("user_credentials")
      .select("credential_id, public_key, counter")
      .eq("user_id", user.id)

    if (credError) {
      console.error("Credentials lookup error:", credError)
      return NextResponse.json({ error: `Error buscando credenciales: ${credError.message}` }, { status: 500 })
    }

    if (!credentials || credentials.length === 0) {
      return NextResponse.json(
        {
          error: "No se encontraron credenciales para este usuario. Intenta registrarte de nuevo.",
        },
        { status: 404 },
      )
    }

    console.log(`Found ${credentials.length} credentials for user ${email}`)

    // Importar WebAuthnDemo para validación
    const { WebAuthnDemo } = await import("@/lib/webauthn-demo")

    // Preparar allowCredentials - IMPORTANTE: validar y corregir formato si es necesario
    const allowCredentials = credentials.map((cred: any) => {
      let credentialId = cred.credential_id

      console.log("Processing credential ID from DB:", credentialId)

      // Si el credential ID no está en formato base64url, convertirlo
      if (credentialId.includes("+") || credentialId.includes("/") || credentialId.includes("=")) {
        console.log("Converting credential ID to base64url format")
        credentialId = credentialId.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
      }

      // Validar formato
      if (!WebAuthnDemo.isValidBase64Url(credentialId)) {
        console.error("Invalid base64url credential ID after conversion:", credentialId)
        throw new Error(`Credential ID inválido: ${credentialId}`)
      }

      return {
        id: credentialId,
        type: "public-key" as const,
        transports: ["internal", "hybrid"] as AuthenticatorTransport[],
      }
    })

    // Generar opciones de autenticación con configuración dinámica
    const options = await generateAuthenticationOptions({
      rpID: webauthnConfig.rpID,
      allowCredentials,
      userVerification: "required",
    })

    // Guardar el challenge temporalmente
    const { error: challengeError } = await supabase.from("temp_challenges").upsert({
      email,
      challenge: options.challenge,
      type: "authentication",
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })

    if (challengeError) {
      console.error("Challenge save error:", challengeError)
      return NextResponse.json({ error: "Error guardando challenge" }, { status: 500 })
    }

    return NextResponse.json(options)
  } catch (error: any) {
    console.error("Error en login begin:", error)
    return NextResponse.json(
      {
        error: `Error interno: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
