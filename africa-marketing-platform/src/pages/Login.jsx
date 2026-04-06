import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../lib/supabase'

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
    const { error } = await signIn(email, password)
    if (error) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
    } else {
      navigate('/hub')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ width: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: '#CC2200', borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)', marginBottom: 10 }}>MA</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Africa Marketing Platform</div>
          <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--mono)', marginTop: 2 }}>Motul Africa — Declic Agency</div>
        </div>

        <div className="card card-pad">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Email professionnel</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="form-label">Mot de passe</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 12, padding: '8px 10px', background: '#fee2e2', borderRadius: 6 }}>{error}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '9px' }} disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 16 }}>
          Problème de connexion ? Contactez votre administrateur.
        </p>
      </div>
    </div>
  )
}
