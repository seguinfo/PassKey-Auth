"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Fingerprint, Loader2, AlertTriangle, Play } from "lucide-react"
import { startRegistration } from "@simplewebauthn/browser"
import { WebAuthnDemo } from "@/lib/webauthn-demo"

interface RegisterFormProps {
  onBack: () => void
  onSuccess: () => void
}

// Función para serializar credencial de forma segura - VERSIÓN MEJORADA
function serializeCredential(credential: any) {
  console.log("=== SERIALIZING CREDENTIAL V2 ===")
  console.log("Original credential:", {
    id: credential.id,
    idType: typeof credential.id,
    idLength: credential.id?.length,
    rawId: credential.rawId ? "present" : "missing",
    rawIdType: credential.rawId?.constructor?.name,
    response: credential.response ? Object.keys(credential.response) : "missing",
  })

  // Función auxiliar para detectar y convertir datos
  function detectAndConvert(data: any, name: string) {
    console.log(`Analyzing ${name}:`, {
      present: !!data,
      type: typeof data,
      constructor: data?.constructor?.name,
      isArrayBuffer: data instanceof ArrayBuffer,
      isUint8Array: data instanceof Uint8Array,
      isArray: Array.isArray(data),
      isString: typeof data === "string",
      length: data?.length || data?.byteLength,
    })

    if (!data) {
      console.log(`${name} is null/undefined`)
      return null
    }

    if (data instanceof ArrayBuffer) {
      console.log(`${name} is ArrayBuffer, converting to Array`)
      return Array.from(new Uint8Array(data))
    }

    if (data instanceof Uint8Array) {
      console.log(`${name} is Uint8Array, converting to Array`)
      return Array.from(data)
    }

    if (Array.isArray(data)) {
      console.log(`${name} is already Array`)
      return data
    }

    if (typeof data === "string") {
      console.log(`${name} is String - this is unexpected for WebAuthn data`)
      // Para strings, intentar diferentes enfoques
      try {
        // Intentar como base64
        const binaryString = atob(data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        console.log(`${name} decoded from base64 string`)
        return Array.from(bytes)
      } catch (error) {
        console.log(`${name} failed base64 decode, using as UTF-8`)
        // Fallback: convertir como UTF-8
        const encoder = new TextEncoder()
        return Array.from(encoder.encode(data))
      }
    }

    console.warn(`${name} has unknown type, returning as-is`)
    return data
  }

  const serialized = {
    id: credential.id,
    rawId: detectAndConvert(credential.rawId, "rawId"),
    response: {
      clientDataJSON: detectAndConvert(credential.response?.clientDataJSON, "clientDataJSON"),
      attestationObject: detectAndConvert(credential.response?.attestationObject, "attestationObject"),
    },
    type: credential.type,
    clientExtensionResults: credential.clientExtensionResults || {},
    authenticatorAttachment: credential.authenticatorAttachment,
  }

  console.log("Serialized credential V2:", {
    id: serialized.id,
    idType: typeof serialized.id,
    idLength: serialized.id?.length,
    rawIdLength: serialized.rawId?.length || 0,
    responseClientDataLength: serialized.response.clientDataJSON?.length || 0,
    responseAttestationLength: serialized.response.attestationObject?.length || 0,
  })
  console.log("=== END SERIALIZATION V2 ===")

  return serialized
}

export default function RegisterForm({ onBack, onSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [config, setConfig] = useState<any>(null)
  const [demoMode, setDemoMode] = useState(false)
  const [forceDemo, setForceDemo] = useState(false)

  useEffect(() => {
    const savedConfig = localStorage.getItem("passkey-env-config")
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.error("Error loading config:", error)
      }
    }

    // Verificar si el modo demo está activo
    const isDemoMode = WebAuthnDemo.isEnabled()
    setDemoMode(isDemoMode)

    // Escuchar cambios en el modo demo
    const handleModeChange = (event: CustomEvent) => {
      setDemoMode(event.detail.demoMode)
    }

    window.addEventListener("webauthn-mode-changed", handleModeChange as EventListener)
    return () => window.removeEventListener("webauthn-mode-changed", handleModeChange as EventListener)
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Si está en modo demo o se fuerza demo, usar simulación
      if (demoMode || forceDemo) {
        return await handleDemoRegistration()
      } else {
        return await handleRealRegistration()
      }
    } catch (err: any) {
      console.error("Error en registro:", err)

      // Si el error es de permisos de WebAuthn, ofrecer modo demo
      if (err.message.includes("publickey-credentials-create")) {
        setError("Error de permisos de WebAuthn detectado. ¿Quieres probar en modo demo?")
        setForceDemo(true)
        return
      }

      setError(err.message || "Error desconocido durante el registro")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoRegistration = async () => {
    setSuccess("🎭 Modo Demo: Simulando registro con PassKey...")

    try {
      // Simular llamada al servidor para obtener opciones (como el flujo real)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockOptions = {
        challenge: btoa("demo-challenge-" + Date.now()),
        rp: { name: "PassKey Auth Demo", id: "localhost" },
        user: {
          id: new TextEncoder().encode(email),
          name: email,
          displayName: name,
        },
      }

      setSuccess("🎭 Usa tu dispositivo biométrico (simulado)...")

      // Simular creación de credencial
      const credential = await WebAuthnDemo.simulateRegistration(mockOptions)

      setSuccess("🎭 Guardando usuario en la base de datos...")

      // Llamar al endpoint de registro demo que usa la base de datos real
      const verificationResponse = await fetch("/api/auth/register/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          credential,
          config,
        }),
      })

      if (!verificationResponse.ok) {
        const contentType = verificationResponse.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await verificationResponse.json()
          throw new Error(errorData.error || "Error al verificar registro demo")
        } else {
          const errorText = await verificationResponse.text()
          console.error("Server error:", errorText)
          throw new Error("Error del servidor durante la verificación demo.")
        }
      }

      const result = await verificationResponse.json()
      setSuccess("🎭 ¡Registro demo exitoso! Usuario guardado en la base de datos. Redirigiendo al login...")
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (demoError: any) {
      console.error("Error en registro demo:", demoError)
      throw demoError
    }
  }

  const handleRealRegistration = async () => {
    // Verificar soporte real de WebAuthn
    if (!window.PublicKeyCredential) {
      throw new Error("Tu navegador no soporta WebAuthn/PassKeys")
    }

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    if (!available) {
      throw new Error("No hay autenticadores biométricos disponibles en este dispositivo")
    }

    // Paso 1: Obtener opciones de registro del servidor
    console.log("=== REGISTRO CLIENT DEBUG V2 ===")
    console.log("Requesting registration options for:", email)

    const optionsResponse = await fetch("/api/auth/register/begin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, config }),
    })

    if (!optionsResponse.ok) {
      const contentType = optionsResponse.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await optionsResponse.json()
        throw new Error(errorData.error || "Error al iniciar registro")
      } else {
        const errorText = await optionsResponse.text()
        console.error("Server error:", errorText)
        throw new Error("Error del servidor. Verifica la configuración.")
      }
    }

    const options = await optionsResponse.json()
    console.log("Registration options received:", {
      challenge: options.challenge?.substring(0, 20) + "...",
      rpId: options.rp?.id,
      rpName: options.rp?.name,
      userId: options.user?.id,
      userName: options.user?.name,
    })

    // Paso 2: Crear credencial con el dispositivo del usuario
    setSuccess("Usa tu dispositivo biométrico para completar el registro...")
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Starting WebAuthn registration...")
    let credential
    try {
      credential = await startRegistration(options)
      console.log("WebAuthn registration completed successfully")

      // ANÁLISIS DETALLADO DE LA CREDENCIAL RECIBIDA
      console.log("=== DETAILED CREDENTIAL ANALYSIS ===")
      console.log("Raw credential from WebAuthn:", {
        id: credential.id,
        idType: typeof credential.id,
        idLength: credential.id?.length,
        idSample: credential.id?.substring(0, 20) + "...",
        rawId: {
          present: !!credential.rawId,
          type: typeof credential.rawId,
          constructor: credential.rawId?.constructor?.name,
          isArrayBuffer: credential.rawId instanceof ArrayBuffer,
          isUint8Array: credential.rawId instanceof Uint8Array,
          isString: typeof credential.rawId === "string",
          length: credential.rawId?.length || credential.rawId?.byteLength,
        },
        response: {
          present: !!credential.response,
          clientDataJSON: {
            present: !!credential.response?.clientDataJSON,
            type: typeof credential.response?.clientDataJSON,
            constructor: credential.response?.clientDataJSON?.constructor?.name,
            isArrayBuffer: credential.response?.clientDataJSON instanceof ArrayBuffer,
            isUint8Array: credential.response?.clientDataJSON instanceof Uint8Array,
            isString: typeof credential.response?.clientDataJSON === "string",
            length: credential.response?.clientDataJSON?.length || credential.response?.clientDataJSON?.byteLength,
          },
          attestationObject: {
            present: !!credential.response?.attestationObject,
            type: typeof credential.response?.attestationObject,
            constructor: credential.response?.attestationObject?.constructor?.name,
            isArrayBuffer: credential.response?.attestationObject instanceof ArrayBuffer,
            isUint8Array: credential.response?.attestationObject instanceof Uint8Array,
            isString: typeof credential.response?.attestationObject === "string",
            length:
              credential.response?.attestationObject?.length || credential.response?.attestationObject?.byteLength,
          },
        },
        type: credential.type,
      })

      // Verificar que credential.id sea válido
      if (!credential.id) {
        throw new Error("credential.id is missing from WebAuthn response")
      }

      if (typeof credential.id !== "string") {
        console.warn("credential.id is not a string, type:", typeof credential.id)
      }

      // Verificar si credential.id ya es base64url válido
      const base64urlRegex = /^[A-Za-z0-9_-]+$/
      const isValidBase64Url = base64urlRegex.test(credential.id)
      console.log("credential.id validation:", {
        isString: typeof credential.id === "string",
        length: credential.id.length,
        isValidBase64Url,
        containsPlus: credential.id.includes("+"),
        containsSlash: credential.id.includes("/"),
        containsEquals: credential.id.includes("="),
        sample: credential.id.substring(0, 20) + "...",
      })

      if (!isValidBase64Url) {
        console.log("credential.id is not valid base64url, attempting client-side conversion...")
        // Intentar convertir en el cliente
        if (credential.id.includes("+") || credential.id.includes("/") || credential.id.includes("=")) {
          const convertedId = credential.id.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
          console.log("Converted credential.id:", {
            original: credential.id.substring(0, 20) + "...",
            converted: convertedId.substring(0, 20) + "...",
            isValidAfterConversion: /^[A-Za-z0-9_-]+$/.test(convertedId),
          })
          credential.id = convertedId
        }
      }
    } catch (webauthnError: any) {
      console.error("WebAuthn registration error:", webauthnError)
      console.error("WebAuthn error details:", {
        name: webauthnError.name,
        message: webauthnError.message,
        stack: webauthnError.stack,
      })
      throw new Error(`Error en WebAuthn: ${webauthnError.message}`)
    }

    // Paso 3: Serializar credencial para envío - VERSIÓN MEJORADA
    console.log("Serializing credential for server...")
    let serializedCredential
    try {
      serializedCredential = serializeCredential(credential)
    } catch (serializationError: any) {
      console.error("Serialization error:", serializationError)
      throw new Error(`Error serializando credencial: ${serializationError.message}`)
    }

    // Paso 4: Verificar credencial en el servidor
    console.log("Sending credential for verification...")
    const verificationResponse = await fetch("/api/auth/register/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        credential: serializedCredential,
        config,
      }),
    })

    if (!verificationResponse.ok) {
      const contentType = verificationResponse.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await verificationResponse.json()
        console.error("Server verification error:", errorData)
        throw new Error(errorData.error || "Error al verificar registro")
      } else {
        const errorText = await verificationResponse.text()
        console.error("Server error response:", errorText)
        throw new Error("Error del servidor durante la verificación.")
      }
    }

    const result = await verificationResponse.json()
    console.log("Registration verification successful:", result)
    console.log("=== END REGISTRO CLIENT DEBUG V2 ===")

    if (result.bypass) {
      setSuccess("¡Registro exitoso con bypass! Los datos se guardaron correctamente. Redirigiendo al login...")
    } else {
      setSuccess("¡Registro exitoso! Redirigiendo al login...")
    }

    setTimeout(() => {
      onSuccess()
    }, 2000)
  }

  const switchToDemo = () => {
    setForceDemo(true)
    setError("")
    localStorage.setItem("webauthn-demo-mode", "true")
    window.dispatchEvent(new CustomEvent("webauthn-mode-changed", { detail: { demoMode: true } }))
  }

  const currentMode = demoMode || forceDemo

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center mb-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="flex items-center">
                {currentMode ? <Play className="h-5 w-5 mr-2" /> : <Fingerprint className="h-5 w-5 mr-2" />}
                {currentMode ? "Demo: Registro con PassKey" : "Registro con PassKey"}
              </CardTitle>
              <CardDescription>
                {currentMode
                  ? "Simulación de WebAuthn + Base de datos real"
                  : "Crea tu cuenta usando autenticación biométrica"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!config && !currentMode && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No se encontró configuración. Ve a la página principal y configura las variables de entorno primero.
              </AlertDescription>
            </Alert>
          )}

          {currentMode && (
            <Alert className="mb-4 border-purple-200 bg-purple-50">
              <Play className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-700">
                <strong>Modo Demo Activo:</strong> WebAuthn será simulado pero el usuario se guardará en la base de
                datos real.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {error}
                  {forceDemo && (
                    <div className="mt-2">
                      <Button onClick={switchToDemo} size="sm" variant="outline">
                        <Play className="h-4 w-4 mr-2" />
                        Continuar en Modo Demo
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || (!config && !currentMode)}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentMode ? "Simulando..." : "Registrando..."}
                </>
              ) : (
                <>
                  {currentMode ? <Play className="mr-2 h-4 w-4" /> : <Fingerprint className="mr-2 h-4 w-4" />}
                  {currentMode ? "Simular Registro con PassKey" : "Registrarse con PassKey"}
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              {currentMode
                ? "El usuario se guardará en la base de datos real con credencial simulada"
                : "Al registrarte, se creará una credencial segura en tu dispositivo"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
