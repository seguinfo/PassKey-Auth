"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DebugPanel() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const runTest = async () => {
    setIsLoading(true)
    try {
      // Obtener configuración desde localStorage
      const savedConfig = localStorage.getItem("passkey-env-config")
      let config = null

      if (savedConfig) {
        try {
          config = JSON.parse(savedConfig)
        } catch (error) {
          console.error("Error parsing saved config:", error)
        }
      }

      // Hacer la petición con la configuración
      const response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ status: "error", error: "Failed to run test" })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === false) return <XCircle className="h-4 w-4 text-red-600" />
    return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }

  const getStatusBadge = (status: boolean | null) => {
    if (status === true) return <Badge className="bg-green-100 text-green-800">OK</Badge>
    if (status === false) return <Badge variant="destructive">Error</Badge>
    return <Badge variant="secondary">Unknown</Badge>
  }

  const hasErrors =
    testResult &&
    (!testResult.environment?.supabaseUrl ||
      !testResult.environment?.supabaseKey ||
      !testResult.imports?.simplewebauthn ||
      !testResult.imports?.supabase ||
      !testResult.database?.connected)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Panel de Diagnóstico
          <div className="flex gap-2">
            <Button onClick={runTest} disabled={isLoading} size="sm">
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isLoading ? "Probando..." : "Probar"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/setup")}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Verifica la configuración del sistema antes de usar PassKeys</CardDescription>
      </CardHeader>
      <CardContent>
        {testResult && (
          <div className="space-y-4">
            {hasErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">⚠️ Configuración Incompleta</h4>
                <p className="text-sm text-red-700 mb-3">
                  Hay problemas con la configuración. Haz clic en "Configurar" para ver la guía paso a paso.
                </p>
                <Button size="sm" onClick={() => router.push("/setup")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Ver Guía de Configuración
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Variables de Entorno</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SUPABASE_URL</span>
                    {getStatusBadge(testResult.environment?.supabaseUrl)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SUPABASE_KEY</span>
                    {getStatusBadge(testResult.environment?.supabaseKey)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Librerías</h4>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SimpleWebAuthn</span>
                    {getStatusBadge(testResult.imports?.simplewebauthn)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Supabase</span>
                    {getStatusBadge(testResult.imports?.supabase)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Base de Datos</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm">Conexión</span>
                {getStatusBadge(testResult.database?.connected)}
              </div>
              {testResult.database?.error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">Error: {testResult.database.error}</p>
              )}
            </div>

            {testResult.status === "error" && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 text-sm">
                  <strong>Error:</strong> {testResult.error}
                </p>
              </div>
            )}

            {!hasErrors && testResult.status === "ok" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-800">¡Configuración Completa!</h4>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  El sistema está listo para usar PassKeys. Puedes proceder con el registro y login.
                </p>
              </div>
            )}

            <div className="text-xs text-gray-500">Última prueba: {testResult.timestamp}</div>
          </div>
        )}

        {!testResult && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="mb-4">Haz clic en "Probar" para verificar el sistema</p>
            <Button variant="outline" onClick={() => router.push("/setup")}>
              <Settings className="h-4 w-4 mr-2" />
              Ver Guía de Configuración
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
