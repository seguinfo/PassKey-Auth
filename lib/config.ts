// Utilidad para obtener la configuración desde localStorage o variables de entorno
export function getSupabaseConfig() {
  // Primero intentar variables de entorno
  if (typeof window === "undefined") {
    // Servidor: usar variables de entorno
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      source: "environment",
    }
  }

  // Cliente: intentar localStorage primero, luego variables de entorno
  try {
    const savedConfig = localStorage.getItem("passkey-env-config")
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      return {
        url: parsed.supabaseUrl,
        serviceRoleKey: parsed.serviceRoleKey,
        source: "localStorage",
      }
    }
  } catch (error) {
    console.error("Error loading config from localStorage:", error)
  }

  // Fallback a variables de entorno
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    source: "environment",
  }
}
