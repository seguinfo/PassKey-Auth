# PassKey-Auth
Demo funcional de un proyecto con Passkey basado en FIDO2 y WebAuthn

## **Características Principales**

- **Registro sin contraseñas**: Los usuarios se registran usando biometría
- **Login seguro**: Autenticación con huella dactilar, Face ID o Windows Hello
- **Estándar FIDO2**: Compatible con el estándar WebAuthn
- **Base de datos**: Almacenamiento seguro de usuarios y credenciales
- **Interfaz completa**: UI moderna y responsive


## ️ **Arquitectura del Sistema**

### Frontend:

- **Página principal**: Introducción y navegación
- **Formulario de registro**: Captura datos y crea PassKey
- **Formulario de login**: Autenticación biométrica
- **Dashboard**: Área personal del usuario


### Backend:

- **API de registro**: `/api/auth/register/begin` y `/api/auth/register/verify`
- **API de login**: `/api/auth/login/begin` y `/api/auth/login/verify`
- **Base de datos**: Tablas para usuarios, credenciales y challenges temporales


## **Cómo Probar el Sistema**

1. **Ejecuta el script SQL** para crear las tablas necesarias
2. **Configura Supabase** con las variables de entorno
3. **Inicia la aplicación** y ve a la página principal
4. **Registra un usuario** usando el botón "Registrarse con PassKey"
5. **Inicia sesión** con el mismo email usando biometría

## **Configuración Requerida**

Variables de entorno necesarias:

```plaintext
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

## **Compatibilidad**

- ✅ Chrome 67+
- ✅ Firefox 60+
- ✅ Safari 14+
- ✅ Edge 18+
- ✅ Dispositivos móviles con biometría
- ✅ Windows Hello
- ✅ Touch ID / Face ID


El sistema está completamente funcional y listo para demostrar la potencia de la autenticación sin contraseñas usando el estándar FIDO2.

## CONFIGURACIÓN DEL SISTEMA
Configura tu base de datos y variables de entorno para usar PassKey Auth

## GUÍA DE CONFIGURACIÓN
Sigue estos pasos para configurar la demo de PassKey Auth

### **Cómo Probar el Sistema**

1. **Crear Proyecto en Supabase**

Ir a Supabase: https://www.supabase.co
Crea una cuenta gratuita en Supabase

2. **Ejecutar Script SQL**
  
Copia y ejecuta este script en el SQL Editor de Supabase

```plaintext
-- Ejecutar en Supabase SQL Editor
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
);
```

3. **Configurar Variables de Entorno**

Crea un archivo .env.local con tus credenciales de Supabase

```plaintext
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

4. **Probar Configuración**
Usar Panel de Diagnóstico
Usa el panel de diagnóstico para verificar que todo funcione

### ¿No tienes Supabase?

También puedes usar cualquier base de datos PostgreSQL. Solo asegúrate de ajustar la cadena de conexión en las variables de entorno.

### Configuración Rápida para Testing

```plaintext
NEXT_PUBLIC_SUPABASE_URL=https://demo-passkey.supabase.co
SUPABASE_SERVICE_ROLE_KEY=demo_key_for_testing
```
