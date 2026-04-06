// Supabase désactivé en mode démo
// Remplacer par les vraies clés quand Supabase est configuré

export const supabase = null
export const signIn = async () => ({ error: null })
export const signOut = async () => {}
export const getUser = async () => ({ data: { user: { email: 'admin@motul.ma', user_metadata: { role: 'admin' } } } })
export const isAdmin = () => true
export const uploadFile = async () => ({ data: null, error: null })
export const getPublicUrl = () => ''
export const createShareLink = async () => ({ url: '#', error: null })
