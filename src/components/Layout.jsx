import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase, isAdmin } from '../lib/supabase'

const NAV_USER = [
  { label: 'Accueil', path: '/home', icon: '🏠' },
  { label: 'Actions Marketing', path: '/dmp', icon: '📋' },
  { label: 'Motul Library', path: '/library', icon: '📚' },
  { label: 'Actualités', path: '/news', icon: '📰' },
  { label: 'Mon compte', path: '/account', icon: '👤' },
]

const NAV_ADMIN = [
  { label: 'Accueil', path: '/home', icon: '🏠' },
  { divider: true, label: 'Modules' },
  { label: 'Actions Marketing', path: '/dmp', icon: '📋' },
  { label: 'Motul Library', path: '/library', icon: '📚' },
  { label: 'Actualités', path: '/news', icon: '📰' },
  { divider: true, label: 'Back-office' },
  { label: 'Sliders', path: '/sliders', icon: '🖼️' },
  { label: 'Newsletter', path: '/newsletter', icon: '✉️' },
  { label: 'Utilisateurs', path: '/users', icon: '👥' },
  { label: 'Entreprises', path: '/companies', icon: '🏢' },
  { divider: true, label: 'Compte' },
  { label: 'Mon compte', path: '/account', icon: '👤' },
]

const TYPE_ICONS = {
  'BIENVENUE': '👋',
  'DMP_SOUMISE': '📋',
  'DMP_VALIDÉE': '✅',
  'DMP_REJETÉE': '❌',
  'LIBRARY_ACCORDÉ': '📚',
  'LIBRARY_REFUSÉ': '🚫',
  'ANNONCE': '📢',
}

export default function Layout({ children, user }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [dbOnline, setDbOnline] = useState(null)
  const admin = isAdmin(user)
  const nav = admin ? NAV_ADMIN : NAV_USER
  const unread = notifs.filter(n => !n.read).length

  useEffect(() => {
    supabase.from('news').select('id', { count: 'exact', head: true })
      .then(({ error }) => setDbOnline(!error))
  }, [])

  useEffect(() => {
    if (!user) return
    loadNotifs()
    const channel = supabase
      .channel('notifications-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => loadNotifs())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const loadNotifs = async () => {
    const { data } = await supabase
      .from('notifications').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(20)
    setNotifs(data || [])
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      {/* TOPBAR NOIRE */}
      <header className="topbar">
        {/* Logo Motul — fond blanc pour lisibilité sur topbar noire */}
        <div style={{ background: '#fff', borderRadius: 4, padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
          <img
            src="/logo-motul.png"
            alt="Motul Africa Marketing Platform"
            style={{ height: 32, objectFit: 'contain', display: 'block' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          {/* Indicateur BDD */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span className={`db-dot ${dbOnline === null ? 'checking' : dbOnline ? 'online' : 'offline'}`} />
            <span style={{ fontSize: 10, color: '#6B7280', fontFamily: "'Roboto Mono', monospace", letterSpacing: .3 }}>
              {dbOnline === null ? 'Connexion...' : dbOnline ? 'Connecté à la BDD' : 'BDD hors ligne'}
            </span>
          </div>

          {/* Cloche */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowNotifs(v => !v); if (!showNotifs && unread > 0) markAllRead() }}
              style={{ background: 'none', border: '1px solid #2A2A2A', borderRadius: 4, padding: '5px 8px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', position: 'relative' }}
            >
              🔔
              {unread > 0 && (
                <span style={{ position: 'absolute', top: -5, right: -5, background: '#CC2200', color: '#fff', fontSize: 9, borderRadius: 8, padding: '1px 4px', fontFamily: 'monospace', fontWeight: 700, lineHeight: 1.4 }}>{unread}</span>
              )}
            </button>

            {showNotifs && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowNotifs(false)} />
                <div style={{ position: 'absolute', right: 0, top: 42, width: 320, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 6, zIndex: 50, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,.5)' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #2A2A2A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#fff', letterSpacing: 1 }}>NOTIFICATIONS</span>
                    {unread > 0 && <span style={{ fontSize: 10, color: '#CC2200', cursor: 'pointer', fontFamily: 'monospace' }} onClick={markAllRead}>Tout marquer lu</span>}
                  </div>
                  {notifs.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: '#4B5563' }}>Aucune notification</div>
                  ) : (
                    <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                      {notifs.map(n => (
                        <div key={n.id} style={{ padding: '10px 16px', borderBottom: '1px solid #111', background: n.read ? 'transparent' : 'rgba(204,34,0,.05)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{TYPE_ICONS[n.type] || '📢'}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, color: '#4B5563', fontFamily: 'monospace', marginBottom: 2, letterSpacing: .5 }}>{n.type}</div>
                            <div style={{ fontSize: 12, color: '#D1D5DB', lineHeight: 1.4 }}>{n.message}</div>
                            <div style={{ fontSize: 9, color: '#4B5563', marginTop: 3, fontFamily: 'monospace' }}>{new Date(n.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CC2200', flexShrink: 0, marginTop: 4 }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* User pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: '#1A1A1A', borderRadius: 4, border: '1px solid #2A2A2A' }}>
            <div style={{ width: 24, height: 24, borderRadius: 3, background: admin ? '#CC2200' : '#2A5FA8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <span style={{ fontSize: 11, color: '#9CA3AF', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{user?.email}</span>
            <span style={{ fontSize: 9, background: admin ? '#CC2200' : '#2A5FA8', color: '#fff', borderRadius: 3, padding: '2px 6px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: .5 }}>
              {admin ? 'ADMIN' : 'USER'}
            </span>
          </div>

          <button onClick={handleSignOut} className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 8px', color: '#6B7280' }}>
            Déconnexion
          </button>
        </div>
      </header>

      <div className="body-wrap">
        {/* SIDEBAR NOIRE */}
        <aside className="sidebar">
          <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #2A2A2A', marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: '#4B5563', fontFamily: 'monospace', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
              {admin ? 'Administrateur' : 'Espace partenaire'}
            </div>
            <div style={{ width: 24, height: 2, background: '#CC2200', borderRadius: 1 }} />
          </div>

          {nav.map((item, i) => {
            if (item.divider) return (
              <div key={i}>
                <div className="sidebar-divider" />
                <div className="sidebar-label">{item.label}</div>
              </div>
            )
            const active = location.pathname === item.path || (item.path !== '/home' && location.pathname.startsWith(item.path))
            return (
              <Link key={item.path} to={item.path} className={`sidebar-item ${active ? 'active' : ''}`} onClick={() => setShowNotifs(false)}>
                <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}

          {/* Footer sidebar */}
          <div className="sidebar-footer">
            <div className="sidebar-social">
              <a href="https://www.instagram.com/motulafrica/" target="_blank" rel="noopener noreferrer" title="Instagram Motul Africa">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2" fill="none" style={{color:'#9CA3AF'}}/>
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none" style={{color:'#9CA3AF'}}/>
                  <circle cx="17.5" cy="6.5" r="1" fill="#9CA3AF"/>
                </svg>
              </a>
              <a href="https://www.facebook.com/MotulAfrica" target="_blank" rel="noopener noreferrer" title="Facebook Motul Africa">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </div>
            <div className="sidebar-copy">
              © 2026 Motul Africa<br/>
              Powered by Declic Agency
            </div>
          </div>
        </aside>

        <main className="main">{children}</main>
      </div>
    </div>
  )
}
