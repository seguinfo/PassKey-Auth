-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Eliminar tablas existentes si existen (para reiniciar)
DROP TABLE IF EXISTS temp_challenges CASCADE;
DROP TABLE IF EXISTS user_credentials CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Crear tabla de usuarios
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de credenciales de usuario
CREATE TABLE user_credentials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  device_name VARCHAR(255) DEFAULT 'Unknown Device',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(credential_id)
);

-- Crear tabla temporal para challenges
CREATE TABLE temp_challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  challenge TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX idx_user_credentials_credential_id ON user_credentials(credential_id);
CREATE INDEX idx_user_credentials_last_used ON user_credentials(last_used_at);
CREATE INDEX idx_temp_challenges_email ON temp_challenges(email);
CREATE INDEX idx_temp_challenges_expires_at ON temp_challenges(expires_at);
CREATE INDEX idx_temp_challenges_type ON temp_challenges(type);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Función para limpiar challenges expirados
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM temp_challenges WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de la base de datos
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM users),
        'total_credentials', (SELECT COUNT(*) FROM user_credentials),
        'active_challenges', (SELECT COUNT(*) FROM temp_challenges WHERE expires_at > NOW()),
        'expired_challenges', (SELECT COUNT(*) FROM temp_challenges WHERE expires_at <= NOW())
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insertar datos de ejemplo (opcional para testing)
INSERT INTO users (email, name) VALUES 
('demo@example.com', 'Usuario Demo'),
('test@example.com', 'Usuario Test')
ON CONFLICT (email) DO NOTHING;

-- Comentarios para documentación
COMMENT ON TABLE users IS 'Tabla principal de usuarios del sistema';
COMMENT ON TABLE user_credentials IS 'Credenciales WebAuthn/PassKey de los usuarios';
COMMENT ON TABLE temp_challenges IS 'Challenges temporales para el proceso de autenticación';
COMMENT ON FUNCTION cleanup_expired_challenges() IS 'Limpia challenges expirados de la base de datos';
COMMENT ON FUNCTION get_database_stats() IS 'Retorna estadísticas básicas de la base de datos';
