import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase, isAdmin, signOut } from '../lib/supabase'

const NAV_ADMIN = [
  { label: 'Hub Fichiers', path: '/hub', icon: '⊞' },
  { label: 'Actions Marketing', path: '/dmp', icon: '◈', badge: '5' },
  { label: 'Motul Library', path: '/library', icon: '📚' },
  { label: 'Actualités', path: '/news', icon: '📰' },
  { label: 'Sliders', path: '/sliders', icon: '▤' },
  { label: 'Newsletter', path: '/newsletter', icon: '✉' },
  { label: 'Utilisateurs', path: '/users', icon: '◉' },
  { label: 'Entreprises', path: '/companies', icon: '⊡' },
]

const NAV_USER = [
  { label: 'Accueil', path: '/home', icon: '⌂' },
  { label: 'Actions Marketing', path: '/dmp/new', icon: '◈' },
  { label: 'Motul Library', path: '/library/request', icon: '📚' },
  { label: 'Actualités', path: '/news/list', icon: '📰' },
  { label: 'Mes favoris', path: '/favorites', icon: '♡' },
  { label: 'Mon compte', path: '/account', icon: '◎' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [notifs, setNotifs] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      // Notif de bienvenue si première connexion
      const seen = localStorage.getItem('notif_welcome')
      if (!seen) {
        setNotifs([{ type: 'BIENVENUE', msg: 'Bienvenue sur Africa Marketing Platform', time: 'maintenant' }])
        localStorage.setItem('notif_welcome', '1')
      }
    })
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const admin = isAdmin(user)
  const nav = admin ? NAV_ADMIN : NAV_USER

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#CC2200', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)' }}>MA</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Africa Marketing Platform</div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--mono)' }}>Motul Africa — Declic Agency</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
          {/* Cloche notifs */}
          <button
            onClick={() => setShowNotifs(v => !v)}
            style={{ background: 'none', border: '0.5px solid #e5e7eb', borderRadius: 6, padding: 6, cursor: 'pointer', position: 'relative', fontSize: 15 }}
            title="Mes notifications"
          >
            🔔
            {notifs.length > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#CC2200', color: '#fff', fontSize: 9, borderRadius: 8, padding: '1px 4px', fontFamily: 'var(--mono)' }}>
                {notifs.length}
              </span>
            )}
          </button>
          {showNotifs && (
            <div style={{ position: 'absolute', right: 0, top: 40, width: 280, background: '#fff', border: '0.5px solid #d1d5db', borderRadius: 10, zIndex: 50, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #e5e7eb', fontSize: 12, fontWeight: 500 }}>Mes notifications</div>
              {notifs.length === 0 ? (
                <div style={{ padding: '12px 14px', fontSize: 12, color: '#9ca3af' }}>Aucune notification</div>
              ) : notifs.map((n, i) => (
                <div key={i} style={{ padding: '10px 14px', borderBottom: '0.5px solid #f3f4f6', fontSize: 12 }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--mono)', marginBottom: 2 }}>{n.type}</div>
                  <div>{n.msg}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{n.time}</div>
                </div>
              ))}
            </div>
          )}
          <span style={{ fontSize: 12, color: '#6b7280' }}>{user?.email}</span>
          <span style={{ fontSize: 10, background: admin ? '#CC2200' : '#e5e7eb', color: admin ? '#fff' : '#6b7280', borderRadius: 10, padding: '2px 8px', fontFamily: 'var(--mono)' }}>
            {admin ? 'admin' : 'user'}
          </span>
          <button onClick={handleSignOut} style={{ fontSize: 11, color: '#6b7280', padding: '4px 8px', border: '0.5px solid #e5e7eb', borderRadius: 4, background: 'none', cursor: 'pointer' }}>
            Déconnexion
          </button>
        </div>
      </header>

      <div className="body-wrap">
        {/* Sidebar */}
        <aside className="sidebar">
          {nav.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
              {item.badge && <span className="sidebar-badge" style={{ background: '#fef3c7', color: '#92400e' }}>{item.badge}</span>}
            </Link>
          ))}
        </aside>

        {/* Main content */}
        <main className="main">{children}</main>
      </div>
    </div>
  )
}
