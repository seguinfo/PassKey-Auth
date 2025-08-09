"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, User, Key, Clock } from "lucide-react"

export default function DebugUser() {
  const [email, setEmail] = useState("")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const searchUser = async () => {
    if (!email) return

    setIsLoading(true)
    try {
      const config = localStorage.getItem("passkey-env-config")
      const parsedConfig = config ? JSON.parse(config) : null

      const response = await fetch("/api/debug/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, config: parsedConfig }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Error searching user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Debug Usuario
        </CardTitle>
        <CardDescription>Busca un usuario para ver sus datos en la base de datos</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="search-email">Email del usuario</Label>
            <Input
              id="search-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ejemplo.com"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={searchUser} disabled={isLoading || !email}>
              {isLoading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-4">
            {/* Usuario */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <User className="h-4 w-4 mr-2" />
                <h3 className="font-medium">Usuario</h3>
                <Badge variant={result.user.data ? "default" : "destructive"} className="ml-2">
                  {result.user.data ? "Encontrado" : "No encontrado"}
                </Badge>
              </div>
              {result.user.data ? (
                <div className="text-sm space-y-1">
                  <div>ID: {result.user.data.id}</div>
                  <div>Email: {result.user.data.email}</div>
                  <div>Nombre: {result.user.data.name}</div>
                  <div>Creado: {new Date(result.user.data.created_at).toLocaleString()}</div>
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  {result.user.error ? `Error: ${result.user.error.message}` : "Usuario no existe"}
                </div>
              )}
            </div>

            {/* Credenciales */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Key className="h-4 w-4 mr-2" />
                <h3 className="font-medium">Credenciales</h3>
                <Badge variant={result.credentials?.data?.length > 0 ? "default" : "destructive"} className="ml-2">
                  {result.credentials?.data?.length || 0} credenciales
                </Badge>
              </div>
              {result.credentials?.data?.length > 0 ? (
                <div className="space-y-2">
                  {result.credentials.data.map((cred: any, index: number) => (
                    <div key={cred.id} className="text-sm bg-gray-50 p-2 rounded">
                      <div>Credencial #{index + 1}</div>
                      <div>ID: {cred.credential_id.substring(0, 20)}...</div>
                      <div>Contador: {cred.counter}</div>
                      <div>Creado: {new Date(cred.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  {result.credentials?.error
                    ? `Error: ${result.credentials.error.message}`
                    : "No hay credenciales registradas"}
                </div>
              )}
            </div>

            {/* Challenges */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="h-4 w-4 mr-2" />
                <h3 className="font-medium">Challenges Temporales</h3>
                <Badge variant="secondary" className="ml-2">
                  {result.challenges?.data?.length || 0} challenges
                </Badge>
              </div>
              {result.challenges?.data?.length > 0 ? (
                <div className="space-y-2">
                  {result.challenges.data.map((challenge: any) => (
                    <div key={challenge.id} className="text-sm bg-gray-50 p-2 rounded">
                      <div>Tipo: {challenge.type}</div>
                      <div>Expira: {new Date(challenge.expires_at).toLocaleString()}</div>
                      <div>
                        Estado:{" "}
                        {new Date(challenge.expires_at) > new Date() ? (
                          <span className="text-green-600">Válido</span>
                        ) : (
                          <span className="text-red-600">Expirado</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">No hay challenges activos</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
