import { createClient } from '@supabase/supabase-js'

// Cliente com a service role key — bypassa RLS inteiramente. Só pra uso
// em contextos de sistema sem sessão de usuário (ex: cron jobs), nunca
// em código que atende requisições de um usuário autenticado — para
// esses, sempre usar '@/lib/supabase/server' (cookie-based, respeita RLS).
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
