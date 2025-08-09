import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, credential, config } = body

    if (!email || !name || !credential) {
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

    // Crear usuario en la base de datos
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        email,
        name,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (userError) {
      console.error("User creation error:", userError)
      return NextResponse.json({ error: `Error al crear usuario: ${userError.message}` }, { status: 500 })
    }

    // Extraer datos de la credencial simulada de forma segura
    let credentialId = credential.id

    // Validar y corregir el formato si es necesario
    console.log("Received credential ID:", credentialId)
    console.log("Contains +:", credentialId.includes("+"))
    console.log("Contains /:", credentialId.includes("/"))
    console.log("Contains =:", credentialId.includes("="))

    // Si el credential ID no está en formato base64url, convertirlo
    if (credentialId.includes("+") || credentialId.includes("/") || credentialId.includes("=")) {
      console.log("Converting credential ID to base64url format")
      credentialId = credentialId.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    }

    console.log("Final credential ID:", credentialId)

    // Importar WebAuthnDemo para validación
    const { WebAuthnDemo } = await import("@/lib/webauthn-demo")
    if (!WebAuthnDemo.isValidBase64Url(credentialId)) {
      console.error("Invalid base64url credential ID:", credentialId)
      return NextResponse.json({ error: "Formato de credencial inválido" }, { status: 400 })
    }

    let publicKeyBase64 = ""

    try {
      // Manejar diferentes formatos de public key de la credencial simulada
      if (credential.response?.publicKey) {
        // Si es ArrayBuffer, convertir a base64 regular (no base64url para public key)
        const publicKeyArray = new Uint8Array(credential.response.publicKey)
        publicKeyBase64 = btoa(String.fromCharCode(...publicKeyArray))
      } else if (credential.response?.attestationObject) {
        // Usar attestationObject como fallback
        const attestationArray = new Uint8Array(credential.response.attestationObject)
        publicKeyBase64 = btoa(String.fromCharCode(...attestationArray))
      } else {
        // Generar una clave pública simulada
        const dummyKey = new Uint8Array(65) // Tamaño típico de clave pública
        crypto.getRandomValues(dummyKey)
        publicKeyBase64 = btoa(String.fromCharCode(...dummyKey))
      }
    } catch (keyError) {
      console.error("Error processing public key:", keyError)
      // Generar una clave pública simulada como fallback
      const dummyKey = new Uint8Array(65)
      crypto.getRandomValues(dummyKey)
      publicKeyBase64 = btoa(String.fromCharCode(...dummyKey))
    }

    console.log("Saving credential with ID:", credentialId, "Length:", credentialId.length)

    // Guardar la credencial en la base de datos
    // IMPORTANTE: credential_id se guarda en formato base64url (como viene de WebAuthn)
    const { error: credentialError } = await supabase.from("user_credentials").insert({
      user_id: user.id,
      credential_id: credentialId, // Ya está en base64url
      public_key: publicKeyBase64, // base64 regular para public key
      counter: 0,
      created_at: new Date().toISOString(),
    })

    if (credentialError) {
      console.error("Credential save error:", credentialError)
      // Si falla guardar la credencial, eliminar el usuario creado
      await supabase.from("users").delete().eq("id", user.id)
      return NextResponse.json({ error: `Error al guardar credencial: ${credentialError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      verified: true,
      user: { id: user.id, email: user.email, name: user.name },
      demo: true,
    })
  } catch (error: any) {
    console.error("Error en registro demo:", error)
    return NextResponse.json(
      {
        error: `Error interno: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
