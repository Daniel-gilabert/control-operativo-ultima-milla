import { Pool } from 'pg'

// Supabase proporciona una URL de conexión PostgreSQL estándar.
// Encuéntrala en: Supabase Dashboard → Settings → Database → Connection string → URI
// Formato: postgresql://postgres:[TU-PASSWORD]@db.[ID-PROYECTO].supabase.co:5432/postgres

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined
}

const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Requerido por Supabase
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

if (process.env.NODE_ENV !== 'production') {
  global._pgPool = pool
}

export default pool
