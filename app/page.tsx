"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Fingerprint, Shield, Smartphone, Key, Settings, Search, Bug } from "lucide-react"
import RegisterForm from "@/components/register-form"
import LoginForm from "@/components/login-form"
import UserDashboard from "@/components/user-dashboard"
import DebugPanel from "@/components/debug-panel"
import EnvConfig from "@/components/env-config"
import WebAuthnDetector from "@/components/webauthn-detector"
import DebugUser from "@/components/debug-user"
import WebAuthnDebugTest from "@/components/webauthn-debug-test"

export default function HomePage() {
  const [currentView, setCurrentView] = useState<"home" | "register" | "login" | "dashboard">("home")
  const [user, setUser] = useState<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Inicialización del componente
  useEffect(() => {
    console.log("=== PAGE INITIALIZATION ===")
    console.log("Initial currentView:", currentView)
    console.log("Initial user:", user)

    // Limpiar cualquier estado persistente problemático
    const cleanupPersistentState = () => {
      // No limpiar la configuración de env, pero sí otros estados que puedan interferir
      const keysToCheck = ["passkey-current-view", "passkey-user-session", "passkey-auto-login", "passkey-redirect"]

      keysToCheck.forEach((key) => {
        const value = localStorage.getItem(key)
        if (value) {
          console.log(`Found persistent state for ${key}:`, value)
          localStorage.removeItem(key)
          console.log(`Cleaned up ${key}`)
        }
      })
    }

    // Verificar si hay algún estado que pueda estar causando redirección automática
    const checkForAutoRedirect = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const autoLogin = urlParams.get("auto-login")
      const redirectTo = urlParams.get("redirect")

      if (autoLogin || redirectTo) {
        console.log("URL params detected:", { autoLogin, redirectTo })
        // Limpiar los parámetros de la URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

    cleanupPersistentState()
    checkForAutoRedirect()

    // Asegurar que siempre iniciemos en home
    setCurrentView("home")
    setUser(null)
    setIsInitialized(true)

    console.log("Page initialization completed - should show home view")
    console.log("=== END PAGE INITIALIZATION ===")
  }, []) // Solo ejecutar una vez al montar

  // Debug: Log cambios de estado
  useEffect(() => {
    if (isInitialized) {
      console.log("View changed to:", currentView)
    }
  }, [currentView, isInitialized])

  const handleLoginSuccess = (userData: any) => {
    console.log("Login successful, user data:", userData)
    setUser(userData)
    setCurrentView("dashboard")
  }

  const handleLogout = () => {
    console.log("User logging out")
    setUser(null)
    setCurrentView("home")

    // Limpiar cualquier estado relacionado con la sesión
    localStorage.removeItem("passkey-user-session")
  }

  const handleRegisterSuccess = () => {
    console.log("Registration successful, redirecting to login")
    setCurrentView("login")
  }

  const handleBackToHome = () => {
    console.log("Navigating back to home")
    setCurrentView("home")
  }

  // No renderizar nada hasta que esté inicializado
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando...</p>
        </div>
      </div>
    )
  }

  // Renderizar vistas específicas
  if (currentView === "dashboard" && user) {
    return <UserDashboard user={user} onLogout={handleLogout} />
  }

  if (currentView === "register") {
    return <RegisterForm onBack={handleBackToHome} onSuccess={handleRegisterSuccess} />
  }

  if (currentView === "login") {
    return <LoginForm onBack={handleBackToHome} onSuccess={handleLoginSuccess} />
  }

  // Vista principal (home)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">PassKey Auth Demo</h1>
          </div>
          <p className="text-xl text-gray-600 mb-4">Autenticación sin contraseñas usando el estándar FIDO</p>
          <Badge variant="secondary" className="text-sm">
            WebAuthn + FIDO2 Ready
          </Badge>
        </div>

        {/* Debug info - solo en desarrollo */}
        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <strong>Debug:</strong> currentView = {currentView}, user = {user ? "logged in" : "null"}, initialized ={" "}
            {isInitialized.toString()}
          </div>
        )}

        {/* WebAuthn Detection */}
        <div className="mb-6">
          <WebAuthnDetector />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="text-center">
              <Fingerprint className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Biométrico</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">Usa tu huella dactilar, Face ID o Windows Hello</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Smartphone className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Multi-dispositivo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">Compatible con móviles, tablets y computadoras</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Key className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Sin contraseñas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 text-center">Máxima seguridad sin recordar contraseñas</p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration and Diagnostic Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="config">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </TabsTrigger>
              <TabsTrigger value="diagnostic">Diagnóstico</TabsTrigger>
              <TabsTrigger value="debug">
                <Search className="h-4 w-4 mr-2" />
                Debug Usuario
              </TabsTrigger>
              <TabsTrigger value="webauthn-test">
                <Bug className="h-4 w-4 mr-2" />
                WebAuthn Test
              </TabsTrigger>
            </TabsList>
            <TabsContent value="config" className="mt-6">
              <EnvConfig />
            </TabsContent>
            <TabsContent value="diagnostic" className="mt-6">
              <DebugPanel />
            </TabsContent>
            <TabsContent value="debug" className="mt-6">
              <DebugUser />
            </TabsContent>
            <TabsContent value="webauthn-test" className="mt-6">
              <WebAuthnDebugTest />
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Actions */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Comenzar Demo</CardTitle>
            <CardDescription>Prueba el registro y login con passkeys</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => {
                console.log("Register button clicked")
                setCurrentView("register")
              }}
              className="w-full"
              size="lg"
            >
              Registrarse con PassKey
            </Button>
            <Button
              onClick={() => {
                console.log("Login button clicked")
                setCurrentView("login")
              }}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Iniciar Sesión
            </Button>
          </CardContent>
        </Card>

        {/* Browser Support Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">Compatibilidad del navegador:</p>
          <div className="flex justify-center space-x-4 text-xs text-gray-400">
            <span>✅ Chrome 67+</span>
            <span>✅ Firefox 60+</span>
            <span>✅ Safari 14+</span>
            <span>✅ Edge 18+</span>
          </div>
        </div>
      </div>
    </div>
  )
}
