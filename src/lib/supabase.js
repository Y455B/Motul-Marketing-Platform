import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export const isAdmin = (user) => user?.user_metadata?.role === 'admin'

export const createNotification = async (userId, type, message) => {
  if (!userId) return
  await supabase.from('notifications').insert({ user_id: userId, type, message })
}
