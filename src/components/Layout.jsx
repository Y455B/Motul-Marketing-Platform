import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase, isAdmin } from '../lib/supabase'

const NAV_USER = [
  { label: 'Accueil', path: '/home', icon: '⌂' },
  { label: 'Actions Marketing', path: '/dmp', icon: '◈' },
  { label: 'Motul Library', path: '/library', icon: '📚' },
  { label: 'Actualités', path: '/news', icon: '📰' },
  { label: 'Mon compte', path: '/account', icon: '◎' },
]

const NAV_ADMIN = [
  { label: 'Accueil', path: '/home', icon: '⌂' },
  { divider: true, label: 'Contenu' },
  { label: 'Actions Marketing', path: '/dmp', icon: '◈' },
  { label: 'Motul Library', path: '/library', icon: '📚' },
  { label: 'Actualités', path: '/news', icon: '📰' },
  { divider: true, label: 'Back-office' },
  { label: 'Sliders', path: '/sliders', icon: '▤' },
  { label: 'Newsletter', path: '/newsletter', icon: '✉' },
  { label: 'Utilisateurs', path: '/users', icon: '◉' },
  { label: 'Entreprises', path: '/companies', icon: '⊡' },
  { divider: true, label: 'Moi' },
  { label: 'Mon compte', path: '/account', icon: '◎' },
]

export default function Layout({ children, user }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [dbOnline, setDbOnline] = useState(null)

  const admin = isAdmin(user)
  const nav = admin ? NAV_ADMIN : NAV_USER

  useEffect(() => {
    // Vérifier connexion BDD
    supabase.from('news').select('id', { count: 'exact', head: true })
      .then(({ error }) => setDbOnline(!error))
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: '#CC2200', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1 }}>MA</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Africa Marketing Platform</div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>Motul Africa — Declic Agency</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          {/* Indicateur BDD */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9ca3af' }}>
            <span className={`db-dot ${dbOnline === null ? '' : dbOnline ? 'online' : 'offline'}`} style={{ background: dbOnline === null ? '#d1d5db' : undefined }} />
            <span style={{ fontFamily: 'monospace' }}>{dbOnline === null ? 'BDD...' : dbOnline ? 'BDD connectée' : 'BDD hors ligne'}</span>
          </div>

          {/* Notifs */}
          <button onClick={() => setShowNotifs(v => !v)} style={{ background: 'none', border: '0.5px solid #e5e7eb', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', fontSize: 14, position: 'relative' }} title="Mes notifications">
            🔔
          </button>
          {showNotifs && (
            <div style={{ position: 'absolute', right: 0, top: 44, width: 300, background: '#fff', border: '0.5px solid #d1d5db', borderRadius: 12, zIndex: 50, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.1)' }} onClick={() => setShowNotifs(false)}>
              <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f3f4f6', fontSize: 13, fontWeight: 500 }}>Mes notifications</div>
              <div style={{ padding: '12px 16px', fontSize: 12 }}>
                <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 3 }}>BIENVENUE</div>
                <div style={{ color: '#374151' }}>Bienvenue sur Africa Marketing Platform</div>
              </div>
            </div>
          )}

          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: '#f9fafb', borderRadius: 8, border: '0.5px solid #e5e7eb' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: admin ? '#CC2200' : '#2A5FA8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <span style={{ fontSize: 11, color: '#374151', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
            <span style={{ fontSize: 10, background: admin ? '#CC2200' : '#2A5FA8', color: '#fff', borderRadius: 6, padding: '1px 7px', fontFamily: 'monospace' }}>
              {admin ? 'admin' : 'user'}
            </span>
          </div>

          <button onClick={handleSignOut} className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>
            Déconnexion
          </button>
        </div>
      </header>

      <div className="body-wrap">
        <aside className="sidebar">
          {nav.map((item, i) => {
            if (item.divider) return (
              <div key={i}>
                <div className="sidebar-divider" />
                <div className="sidebar-label">{item.label}</div>
              </div>
            )
            const active = location.pathname === item.path || (item.path !== '/home' && location.pathname.startsWith(item.path))
            return (
              <Link key={item.path} to={item.path} className={`sidebar-item ${active ? 'active' : ''}`}>
                <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
                {item.badge && <span className="sidebar-badge">{item.badge}</span>}
              </Link>
            )
          })}
        </aside>

        <main className="main">{children}</main>
      </div>
    </div>
  )
}
