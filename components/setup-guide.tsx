"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Copy, ExternalLink, CheckCircle, Settings } from "lucide-react"

export default function SetupGuide() {
  const [copiedStep, setCopiedStep] = useState<string | null>(null)

  const copyToClipboard = (text: string, step: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(step)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  const steps = [
    {
      id: "supabase",
      title: "1. Crear Proyecto en Supabase",
      description: "Crea una cuenta gratuita en Supabase",
      action: (
        <Button variant="outline" size="sm" asChild>
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ir a Supabase
          </a>
        </Button>
      ),
    },
    {
      id: "database",
      title: "2. Ejecutar Script SQL",
      description: "Copia y ejecuta este script en el SQL Editor de Supabase",
      code: `-- Ejecutar en Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_credentials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(credential_id)
);

CREATE TABLE temp_challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  challenge TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,
      action: (
        <Button variant="outline" size="sm" onClick={() => copyToClipboard(steps[1].code!, "database")}>
          <Copy className="h-4 w-4 mr-2" />
          {copiedStep === "database" ? "¡Copiado!" : "Copiar SQL"}
        </Button>
      ),
    },
    {
      id: "env",
      title: "3. Configurar Variables de Entorno",
      description: "Crea un archivo .env.local con tus credenciales de Supabase",
      code: `# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key`,
      action: (
        <Button variant="outline" size="sm" onClick={() => copyToClipboard(steps[2].code!, "env")}>
          <Copy className="h-4 w-4 mr-2" />
          {copiedStep === "env" ? "¡Copiado!" : "Copiar .env"}
        </Button>
      ),
    },
    {
      id: "test",
      title: "4. Probar Configuración",
      description: "Usa el panel de diagnóstico para verificar que todo funcione",
      action: (
        <Badge variant="secondary">
          <CheckCircle className="h-4 w-4 mr-1" />
          Usar Panel de Diagnóstico
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-6 w-6 mr-2" />
            Guía de Configuración
          </CardTitle>
          <CardDescription>Sigue estos pasos para configurar la demo de PassKey Auth</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">{index + 1}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{step.title}</h3>
                    {step.action}
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                  {step.code && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono overflow-x-auto">
                      <pre className="whitespace-pre-wrap">{step.code}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>¿No tienes Supabase?</strong> También puedes usar cualquier base de datos PostgreSQL. Solo asegúrate
          de ajustar la cadena de conexión en las variables de entorno.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuración Rápida para Testing</CardTitle>
          <CardDescription>Si solo quieres probar rápidamente, usa estos valores de ejemplo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Proyecto Supabase de Demo (Solo lectura)</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 mb-2">
                  <strong>Nota:</strong> Este es un proyecto de demostración. Los datos pueden ser eliminados
                  periódicamente.
                </p>
                <div className="font-mono text-sm space-y-1">
                  <div>NEXT_PUBLIC_SUPABASE_URL=https://demo-passkey.supabase.co</div>
                  <div>SUPABASE_SERVICE_ROLE_KEY=demo_key_for_testing</div>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() =>
                copyToClipboard(
                  `NEXT_PUBLIC_SUPABASE_URL=https://demo-passkey.supabase.co
SUPABASE_SERVICE_ROLE_KEY=demo_key_for_testing`,
                  "demo",
                )
              }
            >
              <Copy className="h-4 w-4 mr-2" />
              {copiedStep === "demo" ? "¡Copiado!" : "Copiar Configuración de Demo"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
