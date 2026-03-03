import { createClient } from '@supabase/supabase-js'

// Cliente de Supabase para autenticación y acceso desde el navegador
// NEXT_PUBLIC_ es visible en el frontend (es seguro, es la clave anónima)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
