CREATE TABLE IF NOT EXISTS equipos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  precio_alquiler INTEGER NOT NULL CHECK (precio_alquiler >= 0),
  disponible BOOLEAN NOT NULL DEFAULT true
);