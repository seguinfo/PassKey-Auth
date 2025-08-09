"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

export default function WebAuthnCheck() {
  const [support, setSupport] = useState<{
    webauthn: boolean
    platform: boolean
    https: boolean
    permissions: string
    userAgent: string
    error?: string
  } | null>(null)

  const [isChecking, setIsChecking] = useState(false)

  const checkSupport = async () => {
    setIsChecking(true)
    try {
      const webauthn = !!window.PublicKeyCredential
      const https = window.location.protocol === "https:" || window.location.hostname === "localhost"
      const userAgent = navigator.userAgent

      let platform = false
      let permissions = "unknown"

      if (webauthn) {
        try {
          platform = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        } catch (error) {
          console.warn("Platform authenticator check failed:", error)
        }

        // Verificar permisos si está disponible
        if (navigator.permissions) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: "publickey-credentials-create" as any })
            permissions = permissionStatus.state
          } catch (error) {
            permissions = "not-supported"
          }
        }
      }

      setSupport({ webauthn, platform, https, permissions, userAgent })
    } catch (error: any) {
      setSupport({
        webauthn: false,
        platform: false,
        https: false,
        permissions: "error",
        userAgent: navigator.userAgent,
        error: error.message,
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkSupport()
  }, [])

  if (!support) return null

  const allGood = support.webauthn && support.platform && support.https && support.permissions !== "denied"

  return (
    <Alert className={allGood ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
      {allGood ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
      )}
      <AlertDescription>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Estado de WebAuthn:</div>
            <Button variant="outline" size="sm" onClick={checkSupport} disabled={isChecking}>
              {isChecking ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={support.webauthn ? "default" : "destructive"} className="text-xs">
              {support.webauthn ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              WebAuthn API
            </Badge>
            <Badge variant={support.platform ? "default" : "destructive"} className="text-xs">
              {support.platform ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              Autenticador Biométrico
            </Badge>
            <Badge variant={support.https ? "default" : "destructive"} className="text-xs">
              {support.https ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              Contexto Seguro
            </Badge>
            <Badge
              variant={
                support.permissions === "granted"
                  ? "default"
                  : support.permissions === "denied"
                    ? "destructive"
                    : "secondary"
              }
              className="text-xs"
            >
              Permisos: {support.permissions}
            </Badge>
          </div>

          {!allGood && (
            <div className="text-sm text-yellow-700 space-y-1">
              {!support.webauthn && <div>• Tu navegador no soporta WebAuthn</div>}
              {!support.platform && <div>• No hay autenticadores biométricos disponibles</div>}
              {!support.https && <div>• Necesitas HTTPS o localhost para usar PassKeys</div>}
              {support.permissions === "denied" && <div>• Los permisos de WebAuthn están denegados</div>}
            </div>
          )}

          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer">Información técnica</summary>
            <div className="mt-2 space-y-1">
              <div>Navegador: {support.userAgent.split(" ")[0]}</div>
              <div>URL: {window.location.href}</div>
              <div>Protocolo: {window.location.protocol}</div>
              {support.error && <div className="text-red-600">Error: {support.error}</div>}
            </div>
          </details>
        </div>
      </AlertDescription>
    </Alert>
  )
}
