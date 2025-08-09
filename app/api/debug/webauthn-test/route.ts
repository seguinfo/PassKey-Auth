import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { credential } = body

    console.log("=== WEBAUTHN DEBUG TEST ===")
    console.log("Received credential:", {
      id: credential?.id,
      idType: typeof credential?.id,
      idLength: credential?.id?.length,
      rawId: credential?.rawId ? "present" : "missing",
      response: credential?.response ? Object.keys(credential.response) : "missing",
    })

    // Test de validación base64url
    if (credential?.id) {
      const base64urlRegex = /^[A-Za-z0-9_-]+$/
      const isValidBase64Url = base64urlRegex.test(credential.id)

      console.log("credential.id validation:", {
        value: credential.id.substring(0, 50) + "...",
        length: credential.id.length,
        isValidBase64Url,
        containsPlus: credential.id.includes("+"),
        containsSlash: credential.id.includes("/"),
        containsEquals: credential.id.includes("="),
      })

      // Intentar conversión si no es válido
      if (!isValidBase64Url) {
        const converted = credential.id.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
        const isValidAfterConversion = base64urlRegex.test(converted)

        console.log("Conversion attempt:", {
          original: credential.id.substring(0, 50) + "...",
          converted: converted.substring(0, 50) + "...",
          isValidAfterConversion,
        })
      }
    }

    // Test con SimpleWebAuthn
    let simpleWebAuthnError = null
    try {
      const { verifyRegistrationResponse } = await import("@simplewebauthn/server")

      // Crear un challenge dummy para test
      const dummyChallenge = "dGVzdC1jaGFsbGVuZ2U"
      const dummyOrigin = "http://localhost:3000"
      const dummyRPID = "localhost"

      console.log("Testing with SimpleWebAuthn...")

      await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: dummyChallenge,
        expectedOrigin: dummyOrigin,
        expectedRPID: dummyRPID,
      })

      console.log("SimpleWebAuthn test passed!")
    } catch (error: any) {
      simpleWebAuthnError = {
        message: error.message,
        name: error.name,
        stack: error.stack?.split("\n").slice(0, 5).join("\n"),
      }
      console.log("SimpleWebAuthn test failed:", simpleWebAuthnError)
    }

    return NextResponse.json({
      success: true,
      credential: {
        id: credential?.id?.substring(0, 50) + "...",
        idType: typeof credential?.id,
        idLength: credential?.id?.length,
        isValidBase64Url: credential?.id ? /^[A-Za-z0-9_-]+$/.test(credential.id) : false,
      },
      simpleWebAuthnError,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Debug test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
