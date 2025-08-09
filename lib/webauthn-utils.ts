// Utilidades para manejo seguro de datos WebAuthn
export class WebAuthnUtils {
  /**
   * Convierte cualquier formato a base64url de forma robusta
   */
  static toBase64Url(input: any): string {
    if (typeof input === "string") {
      // Si ya es string, verificar formato
      if (input.includes("-") || input.includes("_")) {
        // Ya es base64url, validar y retornar
        return input.replace(/=/g, "") // Remover padding si existe
      } else if (input.includes("+") || input.includes("/")) {
        // Es base64, convertir a base64url
        return input.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
      } else {
        // Asumir que es base64 sin caracteres especiales
        return input
      }
    }

    // Para otros tipos, convertir a bytes primero
    let bytes: Uint8Array

    if (input instanceof ArrayBuffer) {
      bytes = new Uint8Array(input)
    } else if (input instanceof Uint8Array) {
      bytes = input
    } else if (Array.isArray(input)) {
      bytes = new Uint8Array(input)
    } else if (Buffer.isBuffer(input)) {
      bytes = new Uint8Array(input)
    } else {
      throw new Error(`Tipo no soportado para conversión: ${input?.constructor?.name}`)
    }

    // Convertir bytes a string binaria
    let binaryString = ""
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i])
    }

    // Convertir a base64 y luego a base64url
    const base64 = btoa(binaryString)
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  }

  /**
   * Convierte base64url a ArrayBuffer
   */
  static base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
    // Convertir base64url a base64 regular
    let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/")
    // Agregar padding si es necesario
    while (base64.length % 4) {
      base64 += "="
    }

    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * Convierte ArrayBuffer o Uint8Array a base64 regular
   */
  static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer
    let binaryString = ""
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i])
    }
    return btoa(binaryString)
  }

  /**
   * Valida que un string sea base64url válido
   */
  static isValidBase64Url(str: string): boolean {
    const base64urlRegex = /^[A-Za-z0-9_-]+$/
    return base64urlRegex.test(str)
  }

  /**
   * Procesa una credencial WebAuthn para asegurar tipos correctos
   */
  static processCredentialForVerification(credential: any): any {
    const processed = { ...credential }

    // Procesar credential.id a base64url
    if (credential.id) {
      processed.id = this.toBase64Url(credential.id)
    }

    // Procesar rawId
    if (credential.rawId && Array.isArray(credential.rawId)) {
      processed.rawId = new Uint8Array(credential.rawId)
    }

    // Procesar response
    if (credential.response) {
      const response = { ...credential.response }

      // Procesar clientDataJSON
      if (credential.response.clientDataJSON && Array.isArray(credential.response.clientDataJSON)) {
        response.clientDataJSON = new Uint8Array(credential.response.clientDataJSON)
      }

      // Procesar attestationObject (para registro)
      if (credential.response.attestationObject && Array.isArray(credential.response.attestationObject)) {
        response.attestationObject = new Uint8Array(credential.response.attestationObject)
      }

      // Procesar authenticatorData (para autenticación)
      if (credential.response.authenticatorData && Array.isArray(credential.response.authenticatorData)) {
        response.authenticatorData = new Uint8Array(credential.response.authenticatorData)
      }

      // Procesar signature (para autenticación)
      if (credential.response.signature && Array.isArray(credential.response.signature)) {
        response.signature = new Uint8Array(credential.response.signature)
      }

      processed.response = response
    }

    return processed
  }

  /**
   * Convierte datos de credencial almacenados a formato Buffer
   */
  static convertStoredCredentialData(
    credentialId: string,
    publicKey: string,
  ): {
    credentialIDBuffer: Buffer
    credentialPublicKeyBuffer: Buffer
  } {
    // Convertir credential_id de base64url a Buffer
    let base64 = credentialId.replace(/-/g, "+").replace(/_/g, "/")
    while (base64.length % 4) {
      base64 += "="
    }
    const credentialIDBuffer = Buffer.from(base64, "base64")

    // Convertir public_key de base64 a Buffer
    const credentialPublicKeyBuffer = Buffer.from(publicKey, "base64")

    return { credentialIDBuffer, credentialPublicKeyBuffer }
  }
}
