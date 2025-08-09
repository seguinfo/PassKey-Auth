"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Shield, Calendar, LogOut, CheckCircle, Play } from "lucide-react"

interface UserDashboardProps {
  user: any
  onLogout: () => void
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  // Verificar si está en modo demo
  const isDemoMode = typeof window !== "undefined" && localStorage.getItem("webauthn-demo-mode") === "true"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pt-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              {isDemoMode && <Play className="h-8 w-8 mr-3 text-purple-600" />}
              Dashboard
            </h1>
            <p className="text-gray-600">
              {isDemoMode ? "Demo: Bienvenido a tu área personal" : "Bienvenido a tu área personal"}
            </p>
          </div>
          <Button onClick={onLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Demo Mode Alert */}
        {isDemoMode && (
          <Card className="mb-6 border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Play className="h-6 w-6 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-purple-800">¡Modo Demo Activo!</h3>
                  <p className="text-purple-700">
                    WebAuthn fue simulado, pero tus datos están guardados en la base de datos real
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h3 className="font-semibold text-green-800">¡Autenticación exitosa!</h3>
                <p className="text-green-700">
                  Has iniciado sesión correctamente usando {isDemoMode ? "PassKey (Demo)" : "PassKey"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Información del Usuario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ID de Usuario</p>
                <p className="font-mono text-sm">{user.id}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Método de autenticación</span>
                <Badge variant="secondary">{isDemoMode ? "PassKey (Demo)" : "PassKey/FIDO2"}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Estado de seguridad</span>
                <Badge className="bg-green-100 text-green-800">Activo</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Credenciales registradas</span>
                <Badge variant="outline">1</Badge>
              </div>
              {isDemoMode && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Modo</span>
                  <Badge className="bg-purple-100 text-purple-800">
                    <Play className="h-3 w-3 mr-1" />
                    Demo
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Información de Sesión
            </CardTitle>
            <CardDescription>Detalles de tu sesión actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Hora de login</p>
                <p className="font-medium">{new Date().toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Navegador</p>
                <p className="font-medium">{navigator.userAgent.split(" ")[0]}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Plataforma</p>
                <p className="font-medium">{navigator.platform}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Info */}
        <Card className={`mt-6 ${isDemoMode ? "bg-purple-50 border-purple-200" : "bg-blue-50 border-blue-200"}`}>
          <CardHeader>
            <CardTitle className={isDemoMode ? "text-purple-800" : "text-blue-800"}>
              {isDemoMode ? "Demo Completada" : "Autenticación Completada"}
            </CardTitle>
            <CardDescription className={isDemoMode ? "text-purple-700" : "text-blue-700"}>
              {isDemoMode
                ? "Has probado exitosamente el sistema de autenticación con PassKeys (modo simulado)"
                : "Has probado exitosamente el sistema de autenticación con PassKeys"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`space-y-2 text-sm ${isDemoMode ? "text-purple-700" : "text-blue-700"}`}>
              <p>
                ✅ {isDemoMode ? "Registro con credencial biométrica (simulado)" : "Registro con credencial biométrica"}
              </p>
              <p>✅ Login sin contraseñas</p>
              <p>✅ Sesión segura establecida</p>
              <p>✅ Compatible con estándar FIDO2/WebAuthn</p>
              {isDemoMode && <p>🎭 Datos guardados en base de datos real</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
