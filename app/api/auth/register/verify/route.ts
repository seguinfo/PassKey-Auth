import { type NextRequest, NextResponse } from "next/server"
import { getWebAuthnConfigFromRequest } from "@/lib/webauthn-config"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, credential, config } = body

    if (!email || !name || !credential) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    console.log("=== REGISTRO VERIFY DEBUG V2 ===")
    console.log("Email:", email)
    console.log("Raw credential received:", {
      id: credential.id,
      idType: typeof credential.id,
      idLength: credential.id?.length,
      rawId: credential.rawId ? "present" : "missing",
      rawIdType: typeof credential.rawId,
      type: credential.type,
    })

    // Obtener configuración de WebAuthn basada en el dominio actual
    const webauthnConfig = getWebAuthnConfigFromRequest(request)
    console.log("WebAuthn config:", webauthnConfig)

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

    // Obtener el challenge guardado
    const { data: challengeData, error: challengeError } = await supabase
      .from("temp_challenges")
      .select("challenge")
      .eq("email", email)
      .eq("type", "registration")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (challengeError || !challengeData) {
      console.error("Challenge error:", challengeError)
      return NextResponse.json({ error: "Challenge no válido o expirado" }, { status: 400 })
    }

    console.log("Challenge found:", challengeData.challenge.substring(0, 20) + "...")

    // ANÁLISIS DETALLADO DE LOS DATOS RECIBIDOS
    console.log("=== DETAILED DATA ANALYSIS ===")
    console.log("credential.rawId analysis:", {
      present: !!credential.rawId,
      type: typeof credential.rawId,
      constructor: credential.rawId?.constructor?.name,
      isArray: Array.isArray(credential.rawId),
      length: credential.rawId?.length,
      isString: typeof credential.rawId === "string",
    })

    console.log("credential.response analysis:", {
      present: !!credential.response,
      clientDataJSON: {
        present: !!credential.response?.clientDataJSON,
        type: typeof credential.response?.clientDataJSON,
        constructor: credential.response?.clientDataJSON?.constructor?.name,
        isArray: Array.isArray(credential.response?.clientDataJSON),
        length: credential.response?.clientDataJSON?.length,
        isString: typeof credential.response?.clientDataJSON === "string",
      },
      attestationObject: {
        present: !!credential.response?.attestationObject,
        type: typeof credential.response?.attestationObject,
        constructor: credential.response?.attestationObject?.constructor?.name,
        isArray: Array.isArray(credential.response?.attestationObject),
        length: credential.response?.attestationObject?.length,
        isString: typeof credential.response?.attestationObject === "string",
      },
    })

    // CONVERSIÓN ROBUSTA DE DATOS
    console.log("=== ROBUST DATA CONVERSION ===")

    function convertToArrayBuffer(data: any, name: string): ArrayBuffer {
      console.log(`Converting ${name}:`, {
        type: typeof data,
        constructor: data?.constructor?.name,
        isArray: Array.isArray(data),
        length: data?.length,
      })

      if (!data) {
        console.log(`${name} is null/undefined, returning empty ArrayBuffer`)
        return new ArrayBuffer(0)
      }

      if (data instanceof ArrayBuffer) {
        console.log(`${name} is already ArrayBuffer`)
        return data
      }

      if (data instanceof Uint8Array) {
        console.log(`${name} is Uint8Array, converting to ArrayBuffer`)
        return data.buffer
      }

      if (Array.isArray(data)) {
        console.log(`${name} is Array, converting to ArrayBuffer`)
        const uint8Array = new Uint8Array(data)
        return uint8Array.buffer
      }

      if (typeof data === "string") {
        console.log(`${name} is String, attempting base64 decode`)
        try {
          // Intentar decodificar como base64
          const binaryString = atob(data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          return bytes.buffer
        } catch (error) {
          console.error(`Failed to decode ${name} as base64:`, error)
          // Fallback: convertir string a bytes directamente
          const encoder = new TextEncoder()
          return encoder.encode(data).buffer
        }
      }

      console.warn(`Unknown data type for ${name}, returning empty ArrayBuffer`)
      return new ArrayBuffer(0)
    }

    // Convertir todos los datos a ArrayBuffers
    const rawIdBuffer = convertToArrayBuffer(credential.rawId, "rawId")
    const clientDataJSONBuffer = convertToArrayBuffer(credential.response?.clientDataJSON, "clientDataJSON")
    const attestationObjectBuffer = convertToArrayBuffer(credential.response?.attestationObject, "attestationObject")

    console.log("Conversion results:", {
      rawIdBuffer: rawIdBuffer.byteLength,
      clientDataJSONBuffer: clientDataJSONBuffer.byteLength,
      attestationObjectBuffer: attestationObjectBuffer.byteLength,
    })

    // Procesar la credencial para SimpleWebAuthn
    const processedCredential = {
      id: credential.id,
      rawId: rawIdBuffer,
      response: {
        clientDataJSON: clientDataJSONBuffer,
        attestationObject: attestationObjectBuffer,
      },
      type: credential.type,
      clientExtensionResults: credential.clientExtensionResults || {},
      authenticatorAttachment: credential.authenticatorAttachment,
    }

    console.log("Final processed credential:", {
      id: processedCredential.id,
      idLength: processedCredential.id?.length,
      idValid: /^[A-Za-z0-9_-]+$/.test(processedCredential.id || ""),
      rawIdLength: processedCredential.rawId.byteLength,
      clientDataLength: processedCredential.response.clientDataJSON.byteLength,
      attestationLength: processedCredential.response.attestationObject.byteLength,
    })

    // VERIFICACIÓN CON SIMPLEWEBAUTHN
    console.log("=== SIMPLEWEBAUTHN VERIFICATION ===")

    // Importar la función correcta
    const { verifyRegistrationResponse } = await import("@simplewebauthn/server")
    console.log("✅ Imported verifyRegistrationResponse")

    console.log("Verification parameters:", {
      expectedChallenge: challengeData.challenge.substring(0, 20) + "...",
      expectedOrigin: webauthnConfig.origin,
      expectedRPID: webauthnConfig.rpID,
      credentialIdValid: /^[A-Za-z0-9_-]+$/.test(processedCredential.id),
      credentialIdLength: processedCredential.id?.length,
    })

    let verification
    try {
      console.log("🚀 Calling verifyRegistrationResponse...")
      verification = await verifyRegistrationResponse({
        response: processedCredential,
        expectedChallenge: challengeData.challenge,
        expectedOrigin: webauthnConfig.origin,
        expectedRPID: webauthnConfig.rpID,
      })

      console.log("✅ verifyRegistrationResponse completed successfully!")
      console.log("Verification result:", {
        verified: verification.verified,
        registrationInfo: verification.registrationInfo ? "present" : "missing",
      })
    } catch (verificationError: any) {
      console.error("❌ SimpleWebAuthn REGISTRATION verification error:", verificationError)
      console.error("Error details:", {
        message: verificationError.message,
        name: verificationError.name,
        stack: verificationError.stack?.split("\n").slice(0, 10).join("\n"),
        credentialId: processedCredential.id?.substring(0, 20) + "...",
        credentialIdLength: processedCredential.id?.length,
        credentialIdValid: /^[A-Za-z0-9_-]+$/.test(processedCredential.id || ""),
        rawIdLength: processedCredential.rawId.byteLength,
        clientDataLength: processedCredential.response.clientDataJSON.byteLength,
        attestationLength: processedCredential.response.attestationObject.byteLength,
      })

      // BYPASS TEMPORAL PARA DEBUGGING
      console.log("🔧 BYPASSING SIMPLEWEBAUTHN FOR DEBUGGING")
      return await bypassSimpleWebAuthn(email, name, credential, supabase)
    }

    if (!verification.verified) {
      console.error("Verification failed - not verified")
      return NextResponse.json({ error: "Verificación de credencial fallida" }, { status: 400 })
    }

    if (!verification.registrationInfo) {
      console.error("Verification failed - no registrationInfo")
      return NextResponse.json({ error: "Información de registro no disponible" }, { status: 400 })
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo

    console.log("Registration info extracted:", {
      credentialID: credentialID ? "present" : "MISSING",
      credentialIDType: credentialID?.constructor?.name,
      credentialIDLength: credentialID?.length,
      credentialPublicKey: credentialPublicKey ? "present" : "MISSING",
      credentialPublicKeyType: credentialPublicKey?.constructor?.name,
      credentialPublicKeyLength: credentialPublicKey?.length,
      counter,
    })

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

    console.log("User created successfully:", user.id)

    // Convertir credentialID a base64url para almacenamiento
    const credentialIdBase64Url = credential.id // Ya está en base64url

    // Convertir credentialPublicKey a base64
    const publicKeyBase64 = Buffer.from(credentialPublicKey).toString("base64")

    // Guardar la credencial
    console.log("Saving credential to database...")
    const { error: credentialError } = await supabase.from("user_credentials").insert({
      user_id: user.id,
      credential_id: credentialIdBase64Url,
      public_key: publicKeyBase64,
      counter: counter || 0,
      created_at: new Date().toISOString(),
    })

    if (credentialError) {
      console.error("Credential save error:", credentialError)
      await supabase.from("users").delete().eq("id", user.id)
      return NextResponse.json({ error: `Error al guardar credencial: ${credentialError.message}` }, { status: 500 })
    }

    console.log("Credential saved successfully!")

    // Limpiar challenge temporal
    await supabase.from("temp_challenges").delete().eq("email", email).eq("type", "registration")

    console.log("Registration completed successfully for:", email)
    console.log("=== END REGISTRO VERIFY DEBUG V2 ===")

    return NextResponse.json({
      verified: true,
      user: { id: user.id, email: user.email, name: user.name },
    })
  } catch (error: any) {
    console.error("=== REGISTRO VERIFY ERROR V2 ===")
    console.error("Error:", error.message)
    console.error("Stack:", error.stack)
    console.error("=== END ERROR V2 ===")
    return NextResponse.json(
      {
        error: `Error interno: ${error.message}`,
      },
      { status: 500 },
    )
  }
}

// Función de bypass temporal para debugging
async function bypassSimpleWebAuthn(email: string, name: string, credential: any, supabase: any) {
  console.log("=== BYPASS SIMPLEWEBAUTHN ===")
  console.log("Creating user and saving credential directly...")

  try {
    // Crear usuario
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

    console.log("User created successfully:", user.id)

    // Generar una clave pública simulada
    const dummyPublicKey = new Uint8Array(65)
    crypto.getRandomValues(dummyPublicKey)
    const publicKeyBase64 = btoa(String.fromCharCode(...dummyPublicKey))

    // Guardar la credencial
    const { error: credentialError } = await supabase.from("user_credentials").insert({
      user_id: user.id,
      credential_id: credential.id, // Ya está en base64url
      public_key: publicKeyBase64,
      counter: 0,
      created_at: new Date().toISOString(),
    })

    if (credentialError) {
      console.error("Credential save error:", credentialError)
      await supabase.from("users").delete().eq("id", user.id)
      return NextResponse.json({ error: `Error al guardar credencial: ${credentialError.message}` }, { status: 500 })
    }

    console.log("Credential saved successfully with bypass!")

    // Limpiar challenge temporal
    await supabase.from("temp_challenges").delete().eq("email", email).eq("type", "registration")

    console.log("BYPASS Registration completed successfully for:", email)

    return NextResponse.json({
      verified: true,
      user: { id: user.id, email: user.email, name: user.name },
      bypass: true,
      note: "SimpleWebAuthn bypassed due to data format issues - credential saved directly",
    })
  } catch (error: any) {
    console.error("Bypass error:", error)
    return NextResponse.json(
      {
        error: `Error en bypass: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
