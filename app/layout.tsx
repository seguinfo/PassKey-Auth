import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PassKey Auth Demo",
  description: "Demostración de autenticación con PassKeys usando WebAuthn",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {/* Permisos para WebAuthn - Múltiples formatos para compatibilidad */}
        <meta httpEquiv="Permissions-Policy" content="publickey-credentials-create=*, publickey-credentials-get=*" />
        <meta httpEquiv="Feature-Policy" content="publickey-credentials-create *; publickey-credentials-get *" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Script para verificar y habilitar permisos */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Verificar y configurar permisos de WebAuthn
              if (typeof navigator !== 'undefined' && navigator.permissions) {
                navigator.permissions.query({name: 'publickey-credentials-create'}).then(function(result) {
                  console.log('WebAuthn create permission:', result.state);
                }).catch(function(error) {
                  console.log('WebAuthn permission check failed:', error);
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
