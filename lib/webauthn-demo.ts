// Simulador de WebAuthn para entornos donde no está disponible
export class WebAuthnDemo {
  static isEnabled(): boolean {
    if (typeof window === "undefined") return false
    return localStorage.getItem("webauthn-demo-mode") === "true"
  }

  static async simulateRegistration(options: any): Promise<any> {
    // Simular el delay de interacción biométrica
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Generar una credencial simulada pero realista
    const credentialId = this.generateRandomBase64Url(32) // Usar base64url
    const publicKeyBytes = this.generateRandomBytesArray(65) // Clave pública típica
    const attestationBytes = this.generateRandomBytesArray(200)
    const clientDataBytes = this.generateClientDataJSON(options.challenge, "webauthn.create")

    console.log("Generated credential ID:", credentialId)
    console.log("Credential ID contains +:", credentialId.includes("+"))
    console.log("Credential ID contains /:", credentialId.includes("/"))
    console.log("Credential ID contains =:", credentialId.includes("="))

    return {
      id: credentialId,
      rawId: this.base64UrlToArrayBuffer(credentialId),
      response: {
        clientDataJSON: clientDataBytes,
        attestationObject: attestationBytes,
        publicKey: publicKeyBytes, // Agregar public key como ArrayBuffer
        publicKeyAlgorithm: -7,
      },
      type: "public-key",
      clientExtensionResults: {},
      authenticatorAttachment: "platform",
    }
  }

  static async simulateAuthentication(options: any): Promise<any> {
    // Simular el delay de autenticación biométrica
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Usar el primer credential permitido
    const allowedCredential = options.allowCredentials?.[0]
    if (!allowedCredential) {
      throw new Error("No se encontró credencial para autenticación")
    }

    console.log("Using credential ID for auth:", allowedCredential.id)

    const clientDataBytes = this.generateClientDataJSON(options.challenge, "webauthn.get")
    const authenticatorDataBytes = this.generateRandomBytesArray(37)
    const signatureBytes = this.generateRandomBytesArray(64)

    return {
      id: allowedCredential.id,
      rawId: this.base64UrlToArrayBuffer(allowedCredential.id),
      response: {
        clientDataJSON: clientDataBytes,
        authenticatorData: authenticatorDataBytes,
        signature: signatureBytes,
        userHandle: null,
      },
      type: "public-key",
      clientExtensionResults: {},
      authenticatorAttachment: "platform",
    }
  }

  // Generar string base64url (no base64 regular) - CORREGIDO
  private static generateRandomBase64Url(length: number): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)

    // Convertir bytes a string binaria
    let binaryString = ""
    for (let i = 0; i < array.length; i++) {
      binaryString += String.fromCharCode(array[i])
    }

    // Convertir a base64 y luego a base64url
    const base64 = btoa(binaryString)

    // Convertir base64 a base64url
    const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") // Remover todo el padding al final

    console.log("Original base64:", base64)
    console.log("Converted base64url:", base64url)

    return base64url
  }

  private static generateRandomBytesArray(length: number): ArrayBuffer {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return array.buffer
  }

  private static generateClientDataJSON(challenge: string, type: string): ArrayBuffer {
    const clientData = {
      type,
      challenge,
      origin: window.location.origin,
      crossOrigin: false,
    }
    const jsonString = JSON.stringify(clientData)
    const encoder = new TextEncoder()
    return encoder.encode(jsonString).buffer
  }

  private static base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
    try {
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
    } catch (error) {
      console.error("Error converting base64url to ArrayBuffer:", error)
      // Fallback: generar ArrayBuffer vacío
      return new ArrayBuffer(0)
    }
  }

  // Método para convertir ArrayBuffer a base64url
  static arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binaryString = ""
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binaryString)
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  }

  // Método para validar que un string es base64url válido
  static isValidBase64Url(str: string): boolean {
    // Base64url solo debe contener: A-Z, a-z, 0-9, -, _
    const base64urlRegex = /^[A-Za-z0-9_-]+$/
    return base64urlRegex.test(str)
  }
}
