import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Esta ruta simula la configuración de una base de datos de demo
    // En un entorno real, esto configuraría automáticamente Supabase

    const demoConfig = {
      supabaseUrl: "https://demo-passkey-auth.supabase.co",
      message: "Demo database configured successfully",
      tables: ["users", "user_credentials", "temp_challenges"],
      sampleData: {
        users: 0,
        credentials: 0,
      },
    }

    return NextResponse.json({
      success: true,
      config: demoConfig,
      instructions: [
        "1. Crea un proyecto en Supabase.com",
        "2. Ejecuta el script SQL proporcionado",
        "3. Copia las variables de entorno",
        "4. Reinicia el servidor de desarrollo",
      ],
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
