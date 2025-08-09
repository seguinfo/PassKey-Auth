import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Agregar headers de permisos para WebAuthn
  const response = NextResponse.next()

  response.headers.set("Permissions-Policy", "publickey-credentials-create=*, publickey-credentials-get=*")

  response.headers.set("Feature-Policy", "publickey-credentials-create *; publickey-credentials-get *")

  return response
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
}
