"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import SetupGuide from "@/components/setup-guide"

export default function SetupPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 pt-8">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Demo
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración del Sistema</h1>
          <p className="text-gray-600">Configura tu base de datos y variables de entorno para usar PassKey Auth</p>
        </div>

        <SetupGuide />
      </div>
    </div>
  )
}
