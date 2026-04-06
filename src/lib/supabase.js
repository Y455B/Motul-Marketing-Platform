import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getUser = () => supabase.auth.getUser()

export const isAdmin = (user) =>
  user?.user_metadata?.role === 'admin'

export const uploadFile = async (bucket, path, file) =>
  supabase.storage.from(bucket).upload(path, file, { upsert: true })

export const getPublicUrl = (bucket, path) =>
  supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl

export const createShareLink = async (bucket, path, expiresIn = 604800) =>
  supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
