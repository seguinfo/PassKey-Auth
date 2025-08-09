-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de credenciales de usuario (esquema básico)
CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(credential_id)
);

-- Crear tabla temporal para challenges
CREATE TABLE IF NOT EXISTS temp_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  challenge TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'registration' o 'authentication'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_credential_id ON user_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_temp_challenges_email ON temp_challenges(email);
CREATE INDEX IF NOT EXISTS idx_temp_challenges_expires_at ON temp_challenges(expires_at);

-- Función para limpiar challenges expirados (opcional)
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM temp_challenges WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
