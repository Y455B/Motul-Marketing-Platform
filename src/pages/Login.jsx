import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.session) navigate('/home')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: '#CC2200', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 17, fontWeight: 700, fontFamily: 'monospace', marginBottom: 12 }}>MA</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Africa Marketing Platform</div>
          <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace', marginTop: 4 }}>Motul Africa — Declic Agency</div>
        </div>
        <div className="card card-pad">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required autoFocus />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 14, padding: '10px 12px', background: '#fee2e2', borderRadius: 8 }}>{error}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 10, justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 18 }}>
          Problème de connexion ? Contactez votre administrateur.
        </p>
      </div>
    </div>
  )
}
