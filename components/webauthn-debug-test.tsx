"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Bug, Play } from "lucide-react"
import { startRegistration } from "@simplewebauthn/browser"

export default function WebAuthnDebugTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const runDebugTest = async () => {
    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      console.log("=== STARTING DEBUG TEST ===")

      // Verificar soporte básico primero
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn no está disponible en este navegador")
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      if (!available) {
        throw new Error("No hay autenticadores biométricos disponibles")
      }

      // Crear opciones de registro mínimas pero válidas
      const options = {
        challenge: "dGVzdC1jaGFsbGVuZ2UtZm9yLWRlYnVnZ2luZw", // base64url encoded
        rp: {
          name: "Debug Test",
          id: window.location.hostname === "localhost" ? "localhost" : window.location.hostname,
        },
        user: {
          id: "dGVzdC11c2VyLWlk", // base64url encoded "test-user-id"
          name: "test@example.com",
          displayName: "Test User",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" as const }, // ES256
          { alg: -257, type: "public-key" as const }, // RS256
        ],
        timeout: 60000,
        attestation: "none" as const,
        authenticatorSelection: {
          authenticatorAttachment: "platform" as const,
          userVerification: "preferred" as const,
        },
      }

      console.log("Creating WebAuthn credential with options:", {
        challenge: options.challenge,
        rpId: options.rp.id,
        rpName: options.rp.name,
        userId: options.user.id,
        userName: options.user.name,
      })

      const credential = await startRegistration(options)
      console.log("Credential created successfully!")

      // Análisis seguro de la credencial
      const credentialAnalysis = {
        id: credential.id || "missing",
        idType: typeof credential.id,
        idLength: credential.id?.length || 0,
        idValid: credential.id ? /^[A-Za-z0-9_-]+$/.test(credential.id) : false,
        rawId: {
          present: !!credential.rawId,
          type: typeof credential.rawId,
          constructor: credential.rawId?.constructor?.name || "unknown",
          length: credential.rawId?.byteLength || credential.rawId?.length || 0,
        },
        response: {
          present: !!credential.response,
          clientDataJSON: {
            present: !!credential.response?.clientDataJSON,
            type: typeof credential.response?.clientDataJSON,
            constructor: credential.response?.clientDataJSON?.constructor?.name || "unknown",
            length: credential.response?.clientDataJSON?.byteLength || credential.response?.clientDataJSON?.length || 0,
          },
          attestationObject: {
            present: !!credential.response?.attestationObject,
            type: typeof credential.response?.attestationObject,
            constructor: credential.response?.attestationObject?.constructor?.name || "unknown",
            length:
              credential.response?.attestationObject?.byteLength || credential.response?.attestationObject?.length || 0,
          },
        },
        type: credential.type || "missing",
      }

      console.log("Credential analysis:", credentialAnalysis)

      // Serializar para envío (manejo seguro de errores)
      let serializedCredential
      try {
        serializedCredential = {
          id: credential.id,
          rawId: credential.rawId ? Array.from(new Uint8Array(credential.rawId)) : null,
          response: {
            clientDataJSON: credential.response?.clientDataJSON
              ? Array.from(new Uint8Array(credential.response.clientDataJSON))
              : null,
            attestationObject: credential.response?.attestationObject
              ? Array.from(new Uint8Array(credential.response.attestationObject))
              : null,
          },
          type: credential.type,
        }
      } catch (serializationError: any) {
        console.error("Serialization error:", serializationError)
        throw new Error(`Error serializando credencial: ${serializationError.message || "Error desconocido"}`)
      }

      console.log("Sending credential to debug endpoint...")

      const response = await fetch("/api/debug/webauthn-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: serializedCredential }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      setResult({
        success: true,
        credential: credentialAnalysis,
        serverResponse: data,
      })

      console.log("Debug test completed successfully:", data)
    } catch (err: any) {
      console.error("Debug test error:", err)

      // Manejo seguro del error
      const errorMessage = err?.message || err?.toString?.() || "Error desconocido"
      const safeErrorMessage = typeof errorMessage === "string" ? errorMessage : "Error no serializable"

      setError(safeErrorMessage)
      setResult({
        success: false,
        error: safeErrorMessage,
        errorType: err?.name || "UnknownError",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bug className="h-5 w-5 mr-2" />
          WebAuthn Debug Test
        </CardTitle>
        <CardDescription>Prueba la creación de credenciales y validación de formato de forma segura</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Bug className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            <strong>Nota:</strong> Este test creará una credencial real en tu dispositivo para propósitos de debugging.
            La credencial no se guardará en la base de datos.
          </AlertDescription>
        </Alert>

        <Button onClick={runDebugTest} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Play className="mr-2 h-4 w-4 animate-spin" />
              Ejecutando Test...
            </>
          ) : (
            <>
              <Bug className="mr-2 h-4 w-4" />
              Ejecutar Debug Test
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription>
                <strong>Test Result:</strong> {result.success ? "Success" : "Failed"}
              </AlertDescription>
            </Alert>

            {result.success && result.credential && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Credential Analysis:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>ID Length:</span>
                    <Badge variant="outline">{result.credential.idLength}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>ID Type:</span>
                    <Badge variant="outline">{result.credential.idType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid Base64URL:</span>
                    <Badge variant={result.credential.idValid ? "default" : "destructive"}>
                      {result.credential.idValid ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>RawID Present:</span>
                    <Badge variant={result.credential.rawId.present ? "default" : "destructive"}>
                      {result.credential.rawId.present ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Response Present:</span>
                    <Badge variant={result.credential.response.present ? "default" : "destructive"}>
                      {result.credential.response.present ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    <strong>ID Preview:</strong> {result.credential.id.substring(0, 50)}...
                  </div>
                </div>
              </div>
            )}

            {result.serverResponse?.simpleWebAuthnError && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 className="font-medium text-red-800 mb-2">SimpleWebAuthn Error:</h4>
                <div className="text-sm text-red-700 space-y-1">
                  <div>
                    <strong>Message:</strong> {result.serverResponse.simpleWebAuthnError.message}
                  </div>
                  <div>
                    <strong>Name:</strong> {result.serverResponse.simpleWebAuthnError.name}
                  </div>
                  {result.serverResponse.simpleWebAuthnError.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Stack Trace</summary>
                      <pre className="text-xs mt-1 whitespace-pre-wrap">
                        {result.serverResponse.simpleWebAuthnError.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {result.success && !result.serverResponse?.simpleWebAuthnError && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-700">
                  ✅ Debug test completed successfully! The credential format appears to be correct.
                </AlertDescription>
              </Alert>
            )}

            {!result.success && result.error && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 className="font-medium text-red-800 mb-2">Test Error:</h4>
                <div className="text-sm text-red-700">
                  <div>
                    <strong>Type:</strong> {result.errorType}
                  </div>
                  <div>
                    <strong>Message:</strong> {result.error}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
