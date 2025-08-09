"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, Info, Play } from "lucide-react"

interface WebAuthnStatus {
  isAvailable: boolean
  canCreate: boolean
  canGet: boolean
  platform: boolean
  https: boolean
  environment: "production" | "development" | "sandboxed" | "restricted"
  permissionError: boolean
  domain: string
  error?: string
}

export default function WebAuthnDetector() {
  const [status, setStatus] = useState<WebAuthnStatus | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  const detectEnvironment = (): WebAuthnStatus["environment"] => {
    if (typeof window === "undefined") return "production"

    const hostname = window.location.hostname
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1"
    const isV0 = hostname.includes("v0.dev") || hostname.includes("vercel.app")
    const isVercel = hostname.includes("vercel.app")

    if (isV0 || isVercel) return "sandboxed"
    if (isLocalhost) return "development"
    return "production"
  }

  const testWebAuthnCapabilities = async (): Promise<WebAuthnStatus> => {
    const environment = detectEnvironment()
    const https = window.location.protocol === "https:" || window.location.hostname === "localhost"
    const domain = window.location.hostname

    let isAvailable = false
    let canCreate = false
    let canGet = false
    let platform = false
    let permissionError = false
    let error: string | undefined

    try {
      console.log("🔍 Testing WebAuthn capabilities (non-intrusive)...")

      // Test básico de WebAuthn - SIN DISPARAR PROMPTS
      isAvailable = !!window.PublicKeyCredential

      if (isAvailable) {
        console.log("✅ WebAuthn API is available")

        // Test de autenticador de plataforma - ESTE ES SEGURO
        try {
          platform = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          console.log("✅ Platform authenticator check completed:", platform)
        } catch (e) {
          console.warn("⚠️ Platform authenticator test failed:", e)
        }

        // VERIFICACIÓN DE PERMISOS SIN CREAR CREDENCIALES REALES
        try {
          // Solo verificar si la API está disponible y los permisos básicos
          if (navigator.credentials && navigator.credentials.create) {
            console.log("✅ navigator.credentials.create is available")
            canCreate = true
            canGet = true

            // Verificar permisos de forma no intrusiva
            if (navigator.permissions) {
              try {
                const permissionStatus = await navigator.permissions.query({
                  name: "publickey-credentials-create" as any,
                })
                console.log("🔐 Permission status:", permissionStatus.state)

                if (permissionStatus.state === "denied") {
                  permissionError = true
                  error = "Permisos de WebAuthn denegados"
                  canCreate = false
                  canGet = false
                }
              } catch (permError) {
                console.log("ℹ️ Permission query not supported, assuming OK")
                // Si no se puede verificar permisos, asumir que están OK
              }
            }
          } else {
            console.log("❌ navigator.credentials.create not available")
            canCreate = false
            canGet = false
          }
        } catch (e: any) {
          console.error("❌ Error checking WebAuthn capabilities:", e)
          error = e.message
          if (e.message && e.message.includes("publickey-credentials-create")) {
            permissionError = true
          }
        }
      } else {
        console.log("❌ WebAuthn API not available")
      }
    } catch (e: any) {
      console.error("❌ General WebAuthn test error:", e)
      error = e.message
    }

    // Si hay error de permisos, forzar como "restricted"
    const finalEnvironment = permissionError ? "restricted" : environment

    const result = {
      isAvailable,
      canCreate,
      canGet,
      platform,
      https,
      environment: finalEnvironment,
      permissionError,
      domain,
      error,
    }

    console.log("🏁 WebAuthn capabilities test completed:", result)
    return result
  }

  useEffect(() => {
    console.log("🚀 WebAuthnDetector: Starting non-intrusive capability test...")
    testWebAuthnCapabilities().then(setStatus)

    // Verificar si ya está en modo demo
    const isDemoMode = localStorage.getItem("webauthn-demo-mode") === "true"
    setDemoMode(isDemoMode)

    console.log("🎭 WebAuthnDetector: Demo mode is", isDemoMode)
  }, [])

  const enableDemoMode = () => {
    console.log("🎭 Enabling demo mode")
    setDemoMode(true)
    localStorage.setItem("webauthn-demo-mode", "true")
    window.dispatchEvent(new CustomEvent("webauthn-mode-changed", { detail: { demoMode: true } }))
  }

  const disableDemoMode = () => {
    console.log("🎭 Disabling demo mode")
    setDemoMode(false)
    localStorage.removeItem("webauthn-demo-mode")
    window.dispatchEvent(new CustomEvent("webauthn-mode-changed", { detail: { demoMode: false } }))
  }

  if (!status) {
    return (
      <div className="animate-pulse">
        <Alert className="border-gray-200 bg-gray-50">
          <AlertTriangle className="h-4 w-4 text-gray-400" />
          <AlertDescription>
            <div className="text-gray-600">Verificando capacidades de WebAuthn...</div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const isFullySupported =
    status.isAvailable && status.canCreate && status.platform && status.https && !status.permissionError
  const needsDemo = status.environment === "sandboxed" || status.environment === "restricted" || status.permissionError

  return (
    <div className="space-y-4">
      <Alert className={isFullySupported ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
        {isFullySupported ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        )}
        <AlertDescription>
          <div className="space-y-3">
            <div className="font-medium">Estado de WebAuthn:</div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={status.isAvailable ? "default" : "destructive"} className="text-xs">
                {status.isAvailable ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                WebAuthn API
              </Badge>
              <Badge
                variant={status.canCreate && !status.permissionError ? "default" : "destructive"}
                className="text-xs"
              >
                {status.canCreate && !status.permissionError ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                Crear Credenciales
              </Badge>
              <Badge variant={status.platform ? "default" : "destructive"} className="text-xs">
                {status.platform ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                Autenticador
              </Badge>
              <Badge variant={status.https ? "default" : "destructive"} className="text-xs">
                {status.https ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                Contexto Seguro
              </Badge>
            </div>

            <div className="text-sm space-y-1">
              <div>
                <strong>Dominio:</strong> {status.domain}
              </div>
              <div>
                <strong>Entorno:</strong>{" "}
                {status.environment === "sandboxed"
                  ? "Sandboxed (v0/Vercel)"
                  : status.environment === "development"
                    ? "Desarrollo Local"
                    : status.environment === "restricted"
                      ? "Restringido (Permisos Bloqueados)"
                      : "Producción"}
              </div>
            </div>

            {status.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                <strong>Error:</strong> {status.error}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Mostrar alerta de demo si es necesario */}
      {needsDemo && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <strong>WebAuthn Restringido Detectado</strong>
              </div>
              <p className="text-sm text-blue-700">
                {status.permissionError
                  ? "Los permisos de WebAuthn están bloqueados por políticas de seguridad. Esto es común en entornos embebidos o con restricciones de seguridad."
                  : "Estás en un entorno donde WebAuthn puede no funcionar completamente."}{" "}
                Puedes activar el modo demo para ver cómo funcionaría el sistema.
              </p>
              <div className="flex gap-2">
                {!demoMode ? (
                  <Button onClick={enableDemoMode} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Play className="h-4 w-4 mr-2" />
                    Activar Modo Demo
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Badge className="bg-purple-100 text-purple-800">
                      <Play className="h-3 w-3 mr-1" />
                      Modo Demo Activo
                    </Badge>
                    <Button onClick={disableDemoMode} size="sm" variant="outline">
                      Desactivar Demo
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta para entornos que deberían funcionar pero no lo hacen */}
      {!isFullySupported && !needsDemo && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <strong>WebAuthn no está completamente disponible</strong>
              <div className="text-sm space-y-1">
                {!status.isAvailable && <div>• Tu navegador no soporta WebAuthn</div>}
                {!status.canCreate && <div>• No se pueden crear credenciales</div>}
                {!status.platform && <div>• No hay autenticadores biométricos disponibles</div>}
                {!status.https && <div>• Necesitas HTTPS o localhost</div>}
                {status.permissionError && <div>• Permisos de WebAuthn bloqueados</div>}
              </div>
              <div className="mt-3">
                <Button onClick={enableDemoMode} size="sm" variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Usar Modo Demo
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {demoMode && (
        <Alert className="border-purple-200 bg-purple-50">
          <Play className="h-4 w-4 text-purple-600" />
          <AlertDescription>
            <strong>Modo Demo Activo:</strong> El sistema simulará el comportamiento de WebAuthn para fines de
            demostración. Todos los registros y logins serán simulados pero funcionales.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
