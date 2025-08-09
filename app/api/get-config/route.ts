import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Esta ruta devuelve la configuración desde variables de entorno o indica que use localStorage
    const hasEnvConfig = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

    if (hasEnvConfig) {
      return NextResponse.json({
        source: "environment",
        config: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      })
    }

    return NextResponse.json({
      source: "none",
      message: "No environment variables found. Use localStorage config.",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    )
  }
}
