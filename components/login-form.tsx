"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Fingerprint, Loader2, Play } from "lucide-react"
import { startAuthentication } from "@simplewebauthn/browser"
import { WebAuthnDemo } from "@/lib/webauthn-demo"

interface LoginFormProps {
  onBack: () => void
  onSuccess: (user: any) => void
}

export default function LoginForm({ onBack, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [config, setConfig] = useState<any>(null)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    const savedConfig = localStorage.getItem("passkey-env-config")
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.error("Error loading config:", error)
      }
    }

    setDemoMode(WebAuthnDemo.isEnabled())

    const handleModeChange = (event: CustomEvent) => {
      setDemoMode(event.detail.demoMode)
    }

    window.addEventListener("webauthn-mode-changed", handleModeChange as EventListener)
    return () => window.removeEventListener("webauthn-mode-changed", handleModeChange as EventListener)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (demoMode) {
        return await handleDemoLogin()
      } else {
        return await handleRealLogin()
      }
    } catch (err: any) {
      console.error("Error en login:", err)
      setError(err.message || "Error desconocido durante el login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setSuccess("🎭 Modo Demo: Consultando usuario en la base de datos...")

    // Primero, obtener las credenciales reales de la base de datos
    const optionsResponse = await fetch("/api/auth/login/begin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, config }),
    })

    if (!optionsResponse.ok) {
      const contentType = optionsResponse.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await optionsResponse.json()
        throw new Error(errorData.error || "Error al iniciar login demo")
      } else {
        const errorText = await optionsResponse.text()
        console.error("Server error:", errorText)
        throw new Error("Error del servidor durante el login demo.")
      }
    }

    const options = await optionsResponse.json()

    setSuccess("🎭 Usa tu dispositivo biométrico (simulado)...")

    // Simular autenticación con las credenciales reales de la BD
    const credential = await WebAuthnDemo.simulateAuthentication(options)

    setSuccess("🎭 Verificando credenciales en la base de datos...")

    // Verificar con la base de datos real usando el endpoint demo
    const verificationResponse = await fetch("/api/auth/login/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        credential,
        config,
      }),
    })

    if (!verificationResponse.ok) {
      const contentType = verificationResponse.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await verificationResponse.json()
        throw new Error(errorData.error || "Error al verificar login demo")
      } else {
        const errorText = await verificationResponse.text()
        console.error("Server error:", errorText)
        throw new Error("Error del servidor durante la verificación demo.")
      }
    }

    const result = await verificationResponse.json()
    setSuccess("🎭 ¡Login demo exitoso! Datos consultados de la base de datos real.")

    setTimeout(() => {
      onSuccess(result.user)
    }, 1500)
  }

  const handleRealLogin = async () => {
    if (!window.PublicKeyCredential) {
      throw new Error("Tu navegador no soporta WebAuthn/PassKeys")
    }

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    if (!available) {
      throw new Error("No hay autenticadores biométricos disponibles en este dispositivo")
    }

    // Paso 1: Obtener opciones de autenticación del servidor
    const optionsResponse = await fetch("/api/auth/login/begin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, config }),
    })

    if (!optionsResponse.ok) {
      const contentType = optionsResponse.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await optionsResponse.json()
        throw new Error(errorData.error || "Error al iniciar login")
      } else {
        const errorText = await optionsResponse.text()
        console.error("Server error:", errorText)
        throw new Error("Error del servidor. Verifica la configuración.")
      }
    }

    const options = await optionsResponse.json()

    // Paso 2: Autenticar con el dispositivo del usuario
    setSuccess("Usa tu dispositivo biométrico para iniciar sesión...")
    const credential = await startAuthentication(options)

    // Paso 3: Verificar credencial en el servidor
    const verificationResponse = await fetch("/api/auth/login/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        credential,
        config,
      }),
    })

    if (!verificationResponse.ok) {
      const contentType = verificationResponse.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const errorData = await verificationResponse.json()
        throw new Error(errorData.error || "Error al verificar login")
      } else {
        const errorText = await verificationResponse.text()
        console.error("Server error:", errorText)
        throw new Error("Error del servidor durante la verificación.")
      }
    }

    const result = await verificationResponse.json()
    setSuccess("¡Login exitoso! Bienvenido...")

    setTimeout(() => {
      onSuccess(result.user)
    }, 1500)
  }

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
                {demoMode ? <Play className="h-5 w-5 mr-2" /> : <Fingerprint className="h-5 w-5 mr-2" />}
                {demoMode ? "Demo: Login con PassKey" : "Login con PassKey"}
              </CardTitle>
              <CardDescription>
                {demoMode
                  ? "Simulación de WebAuthn + Consulta de base de datos real"
                  : "Inicia sesión usando tu autenticación biométrica"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!config && !demoMode && (
            <Alert className="mb-4">
              <AlertDescription>
                No se encontró configuración. Ve a la página principal y configura las variables de entorno primero.
              </AlertDescription>
            </Alert>
          )}

          {demoMode && (
            <Alert className="mb-4 border-purple-200 bg-purple-50">
              <Play className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-700">
                <strong>Modo Demo Activo:</strong> WebAuthn será simulado pero se consultarán los datos reales de la
                base de datos.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || (!config && !demoMode)}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {demoMode ? "Simulando..." : "Autenticando..."}
                </>
              ) : (
                <>
                  {demoMode ? <Play className="mr-2 h-4 w-4" /> : <Fingerprint className="mr-2 h-4 w-4" />}
                  {demoMode ? "Simular Login con PassKey" : "Iniciar Sesión con PassKey"}
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>
              {demoMode
                ? "Se consultarán los datos del usuario registrado en la base de datos"
                : "Usa la misma credencial que creaste durante el registro"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
