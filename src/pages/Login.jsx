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
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0D0D0D' }}>
      {/* Panneau gauche — branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', background: 'linear-gradient(160deg, #0D0D0D 0%, #1A1A1A 50%, #200800 100%)', borderRight: '1px solid #CC2200', position: 'relative', overflow: 'hidden' }}>
        {/* Déco cercle */}
        <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(204,34,0,.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(204,34,0,.05)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          {/* Logo — fond blanc pour lisibilité sur fond sombre */}
          <div style={{ display: 'inline-flex', background: '#fff', borderRadius: 4, padding: '6px 12px', marginBottom: 40 }}>
            <img
              src="/logo-motul.png"
              alt="Motul Africa"
              style={{ height: 44, objectFit: 'contain', display: 'block' }}
            />
          </div>

          <div style={{ width: 40, height: 3, background: '#CC2200', borderRadius: 2, marginBottom: 28 }} />

          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: '#fff', lineHeight: 1.1, letterSpacing: 2, marginBottom: 16 }}>
            AFRICA<br/>MARKETING<br/>PLATFORM
          </div>

          <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, maxWidth: 300, letterSpacing: .3 }}>
            Votre espace partenaire dédié à la gestion des actions marketing Motul Africa.
          </div>

          <div style={{ marginTop: 48, display: 'flex', gap: 12 }}>
            <a href="https://www.instagram.com/motulafrica/" target="_blank" rel="noopener noreferrer"
              style={{ width: 36, height: 36, borderRadius: 4, background: '#1A1A1A', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#CC2200'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2A2A'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="#9CA3AF" strokeWidth="2"/>
                <circle cx="12" cy="12" r="4" stroke="#9CA3AF" strokeWidth="2"/>
                <circle cx="17.5" cy="6.5" r="1.5" fill="#9CA3AF"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/MotulAfrica" target="_blank" rel="noopener noreferrer"
              style={{ width: 36, height: 36, borderRadius: 4, background: '#1A1A1A', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#CC2200'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2A2A2A'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div style={{ width: 440, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 52px', background: '#F2F2F2' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1.5, color: '#0D0D0D', marginBottom: 4 }}>CONNEXION</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 36, fontFamily: 'Roboto Mono', letterSpacing: .3 }}>Saisissez vos identifiants pour accéder à la plateforme</div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 10, color: '#6B7280', display: 'block', marginBottom: 6, fontFamily: 'Roboto Mono', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoFocus
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #E8E8E8', borderRadius: 4, background: '#fff', fontFamily: 'Roboto', fontSize: 13, color: '#0D0D0D', transition: 'border .15s' }}
              onFocus={e => e.target.style.borderColor = '#CC2200'}
              onBlur={e => e.target.style.borderColor = '#E8E8E8'}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 10, color: '#6B7280', display: 'block', marginBottom: 6, fontFamily: 'Roboto Mono', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Mot de passe</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '11px 14px', border: '1px solid #E8E8E8', borderRadius: 4, background: '#fff', fontFamily: 'Roboto', fontSize: 13, color: '#0D0D0D', transition: 'border .15s' }}
              onFocus={e => e.target.style.borderColor = '#CC2200'}
              onBlur={e => e.target.style.borderColor = '#E8E8E8'}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 16, padding: '10px 14px', background: '#fee2e2', borderRadius: 4, borderLeft: '3px solid #dc2626' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? '#9CA3AF' : '#CC2200', color: '#fff', border: 'none', borderRadius: 4, fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background .15s' }}
            onMouseEnter={e => !loading && (e.target.style.background = '#A01A00')}
            onMouseLeave={e => !loading && (e.target.style.background = '#CC2200')}
          >
            {loading ? 'CONNEXION...' : 'SE CONNECTER'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 24, fontFamily: 'Roboto Mono' }}>
          Problème de connexion ? Contactez votre administrateur.
        </p>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #E8E8E8', textAlign: 'center', fontSize: 10, color: '#D1D5DB', fontFamily: 'Roboto Mono', letterSpacing: .5 }}>
          POWERED BY DECLIC AGENCY
        </div>
      </div>
    </div>
  )
}
