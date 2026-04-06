import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase, isAdmin } from '../lib/supabase'

const NAV = [
  { label: 'Hub Fichiers', path: '/hub', icon: '⊞' },
  { label: 'Actions Marketing', path: '/dmp', icon: '◈' },
  { label: 'Motul Library', path: '/library', icon: '📚' },
  { label: 'Actualités', path: '/news', icon: '📰' },
  { label: 'Sliders', path: '/sliders', icon: '▤' },
  { label: 'Newsletter', path: '/newsletter', icon: '✉' },
  { label: 'Utilisateurs', path: '/users', icon: '◉' },
  { label: 'Entreprises', path: '/companies', icon: '⊡' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (!session) navigate('/login')
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const admin = isAdmin(user)

  return (
    <div className="app-shell">
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#CC2200', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>MA</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Africa Marketing Platform</div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>Motul Africa — Declic Agency</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          <button onClick={() => setShowNotifs(v => !v)} style={{ background: 'none', border: '0.5px solid #e5e7eb', borderRadius: 6, padding: 6, cursor: 'pointer', fontSize: 15 }}>
            🔔
          </button>
          {showNotifs && (
            <div style={{ position: 'absolute', right: 0, top: 40, width: 280, background: '#fff', border: '0.5px solid #d1d5db', borderRadius: 10, zIndex: 50, overflow: 'hidden' }} onClick={() => setShowNotifs(false)}>
              <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #e5e7eb', fontSize: 12, fontWeight: 500 }}>Mes notifications</div>
              <div style={{ padding: '10px 14px', fontSize: 12 }}>
                <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 2 }}>BIENVENUE</div>
                <div>Bienvenue sur Africa Marketing Platform</div>
              </div>
            </div>
          )}
          <span style={{ fontSize: 12, color: '#6b7280' }}>{user?.email}</span>
          <span style={{ fontSize: 10, background: admin ? '#CC2200' : '#e5e7eb', color: admin ? '#fff' : '#6b7280', borderRadius: 10, padding: '2px 8px', fontFamily: 'monospace' }}>
            {admin ? 'admin' : 'user'}
          </span>
          <button onClick={handleSignOut} style={{ fontSize: 11, color: '#6b7280', padding: '4px 8px', border: '0.5px solid #e5e7eb', borderRadius: 4, background: 'none', cursor: 'pointer' }}>
            Déconnexion
          </button>
        </div>
      </header>
      <div className="body-wrap">
        <aside className="sidebar">
          {NAV.map(item => (
            <Link key={item.path} to={item.path} className={`sidebar-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </aside>
        <main className="main">{children}</main>
      </div>
    </div>
  )
}
