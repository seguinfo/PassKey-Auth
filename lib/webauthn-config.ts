// Configuración dinámica de WebAuthn basada en el entorno
export function getWebAuthnConfig() {
  if (typeof window === "undefined") {
    // Servidor: usar variables de entorno o detectar desde headers
    const isDevelopment = process.env.NODE_ENV === "development"
    const vercelUrl = process.env.VERCEL_URL
    const customDomain = process.env.NEXT_PUBLIC_DOMAIN

    if (customDomain) {
      return {
        rpID: customDomain,
        origin: `https://${customDomain}`,
        rpName: "PassKey Auth Demo",
      }
    }

    if (vercelUrl) {
      return {
        rpID: vercelUrl,
        origin: `https://${vercelUrl}`,
        rpName: "PassKey Auth Demo",
      }
    }

    if (isDevelopment) {
      return {
        rpID: "localhost",
        origin: "http://localhost:3000",
        rpName: "PassKey Auth Demo",
      }
    }

    // Fallback para producción sin configuración específica
    return {
      rpID: "localhost", // Esto se actualizará dinámicamente en el cliente
      origin: "http://localhost:3000",
      rpName: "PassKey Auth Demo",
    }
  }

  // Cliente: detectar desde window.location
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  const port = window.location.port

  // Casos especiales para desarrollo
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return {
      rpID: "localhost",
      origin: `${protocol}//${hostname}${port ? `:${port}` : ""}`,
      rpName: "PassKey Auth Demo",
    }
  }

  // Producción: usar el hostname actual
  return {
    rpID: hostname,
    origin: `${protocol}//${hostname}`,
    rpName: "PassKey Auth Demo",
  }
}

// Función para obtener configuración desde el request (servidor)
export function getWebAuthnConfigFromRequest(request: Request) {
  const url = new URL(request.url)
  const hostname = url.hostname
  const protocol = url.protocol

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return {
      rpID: "localhost",
      origin: `${protocol}//${hostname}${url.port ? `:${url.port}` : ""}`,
      rpName: "PassKey Auth Demo",
    }
  }

  return {
    rpID: hostname,
    origin: `${protocol}//${hostname}`,
    rpName: "PassKey Auth Demo",
  }
}
