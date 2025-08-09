"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Save, Eye, EyeOff, Trash2, CheckCircle, AlertCircle, RotateCcw, AlertTriangle } from "lucide-react"

interface EnvConfig {
  supabaseUrl: string
  serviceRoleKey: string
}

export default function EnvConfig() {
  const [config, setConfig] = useState<EnvConfig>({
    supabaseUrl: "",
    serviceRoleKey: "",
  })
  const [showKey, setShowKey] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [hasErrors, setHasErrors] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Cargar configuración guardada al montar el componente
  useEffect(() => {
    const savedConfig = localStorage.getItem("passkey-env-config")
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
        setIsSaved(true)
      } catch (error) {
        console.error("Error loading saved config:", error)
      }
    }
  }, [])

  const handleSave = async () => {
    if (!config.supabaseUrl || !config.serviceRoleKey) {
      alert("Por favor completa ambos campos")
      return
    }

    // Validar formato de URL
    try {
      new URL(config.supabaseUrl)
    } catch {
      alert("La URL de Supabase no es válida")
      return
    }

    // Guardar en localStorage
    localStorage.setItem("passkey-env-config", JSON.stringify(config))
    setIsSaved(true)

    // Disparar evento para que otros componentes sepan que la config cambió
    window.dispatchEvent(new CustomEvent("config-updated"))

    // Probar la configuración automáticamente
    await testConfiguration()
  }

  const handleClear = () => {
    localStorage.removeItem("passkey-env-config")
    setConfig({ supabaseUrl: "", serviceRoleKey: "" })
    setIsSaved(false)
    setTestResult(null)
  }

  const handleCompleteReset = async () => {
    if (!confirm("⚠️ ADVERTENCIA: Esto eliminará TODA la configuración y datos locales. ¿Estás seguro?")) {
      return
    }

    setIsResetting(true)

    try {
      console.log("🔄 Starting complete reset...")

      // 1. Limpiar localStorage completamente
      const keysToRemove = [
        "passkey-env-config",
        "webauthn-demo-mode",
        "passkey-current-view",
        "passkey-user-session",
        "passkey-auto-login",
        "passkey-redirect",
      ]

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
        console.log(`✅ Removed ${key}`)
      })

      // 2. Resetear estado del componente
      setConfig({ supabaseUrl: "", serviceRoleKey: "" })
      setIsSaved(false)
      setTestResult(null)
      setHasErrors(false)

      // 3. Disparar eventos para resetear otros componentes
      window.dispatchEvent(new CustomEvent("config-updated"))
      window.dispatchEvent(new CustomEvent("webauthn-mode-changed", { detail: { demoMode: false } }))

      // 4. Opcional: Intentar limpiar datos de la base de datos si hay configuración
      // (Esto requeriría una API endpoint específica)

      console.log("✅ Complete reset finished")

      alert("✅ Reset completo realizado. La página se recargará para aplicar todos los cambios.")

      // Recargar la página para asegurar estado limpio
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("❌ Error during reset:", error)
      alert("❌ Error durante el reset. Revisa la consola para más detalles.")
    } finally {
      setIsResetting(false)
    }
  }

  const testConfiguration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      const result = await response.json()
      setTestResult(result)
      setHasErrors(result.status === "error")
    } catch (error) {
      setTestResult({ status: "error", error: "Error al probar configuración" })
      setHasErrors(true)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExampleConfig = () => {
    setConfig({
      supabaseUrl: "https://tu-proyecto.supabase.co",
      serviceRoleKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Configuración de Variables de Entorno</span>
          <div className="flex gap-2">
            {isSaved && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Guardado
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Ingresa tus credenciales de Supabase para configurar la demo sin archivos .env
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabase-url">URL de Supabase</Label>
            <Input
              id="supabase-url"
              type="url"
              placeholder="https://tu-proyecto.supabase.co"
              value={config.supabaseUrl}
              onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              Encuentra esto en tu proyecto de Supabase → Settings → API → Project URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service-role-key">Service Role Key</Label>
            <div className="relative">
              <Input
                id="service-role-key"
                type={showKey ? "text" : "password"}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={config.serviceRoleKey}
                onChange={(e) => setConfig({ ...config, serviceRoleKey: e.target.value })}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Encuentra esto en tu proyecto de Supabase → Settings → API → service_role (¡Mantén esto secreto!)
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Guardar y Probar
          </Button>
          <Button variant="outline" onClick={loadExampleConfig}>
            Ejemplo
          </Button>
          {isSaved && (
            <Button variant="outline" onClick={handleClear}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Botón de Reset Completo */}
        <div className="border-t pt-4">
          <Alert className="border-orange-200 bg-orange-50 mb-4">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="space-y-2">
                <strong className="text-orange-800">Zona de Peligro</strong>
                <p className="text-orange-700 text-sm">
                  El reset completo eliminará toda la configuración, modo demo, y datos locales. Úsalo si quieres
                  empezar completamente desde cero.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <Button onClick={handleCompleteReset} variant="destructive" className="w-full" disabled={isResetting}>
            {isResetting ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                Reseteando...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Completo - Empezar desde Cero
              </>
            )}
          </Button>
        </div>

        {/* Resultado de la prueba */}
        {testResult && (
          <div className="space-y-2">
            {testResult.status === "success" ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>¡Configuración exitosa!</strong> La conexión a Supabase funciona correctamente.
                  {testResult.database?.stats && (
                    <div className="mt-2 text-sm">
                      Estadísticas: {testResult.database.stats.total_users} usuarios,{" "}
                      {testResult.database.stats.total_credentials} credenciales
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error de configuración:</strong> {testResult.error}
                  <div className="mt-2 text-sm">
                    Verifica que las credenciales sean correctas y que las tablas estén creadas.
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {!hasErrors && testResult.status === "ok" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-800">¡Configuración Completa!</h4>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  El sistema está listo para usar PassKeys. Ve al panel de "Diagnóstico" para verificar el estado
                  completo.
                </p>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Probando configuración...</p>
          </div>
        )}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Nota de Seguridad:</strong> Esta configuración se guarda localmente en tu navegador. No la uses con
            credenciales de producción.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
