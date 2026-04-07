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
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => loadNotifs())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user])

  const loadNotifs = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
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
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: '#CC2200', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>MA</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Africa Marketing Platform</div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>Motul Africa — Declic Agency</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          {/* Indicateur BDD */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: dbOnline === null ? '#d1d5db' : dbOnline ? '#16a34a' : '#dc2626', boxShadow: dbOnline ? '0 0 0 2px #dcfce7' : undefined }} />
            <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>
              {dbOnline === null ? 'Connexion...' : dbOnline ? 'Connecté à la BDD' : 'BDD hors ligne'}
            </span>
          </div>

          {/* Cloche */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowNotifs(v => !v); if (!showNotifs && unread > 0) markAllRead() }}
              style={{ background: 'none', border: '0.5px solid #e5e7eb', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center' }}
            >
              🔔
              {unread > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, background: '#CC2200', color: '#fff', fontSize: 9, borderRadius: 8, padding: '1px 4px', fontFamily: 'monospace', fontWeight: 700 }}>{unread}</span>
              )}
            </button>

            {showNotifs && (
              <div style={{ position: 'absolute', right: 0, top: 40, width: 320, background: '#fff', border: '0.5px solid #d1d5db', borderRadius: 12, zIndex: 50, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.12)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f3f4f6', fontSize: 13, fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Mes notifications</span>
                  {unread > 0 && <span style={{ fontSize: 11, color: '#CC2200', cursor: 'pointer' }} onClick={markAllRead}>Tout marquer lu</span>}
                </div>
                {notifs.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>Aucune notification</div>
                ) : (
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifs.map(n => (
                      <div key={n.id} style={{ padding: '10px 16px', borderBottom: '0.5px solid #f9fafb', background: n.read ? '#fff' : '#fafafa', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{TYPE_ICONS[n.type] || '📢'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 2 }}>{n.type}</div>
                          <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>{new Date(n.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CC2200', flexShrink: 0, marginTop: 4 }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: '#f9fafb', borderRadius: 8, border: '0.5px solid #e5e7eb' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: admin ? '#CC2200' : '#2A5FA8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>
              {user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <span style={{ fontSize: 11, color: '#374151', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
            <span style={{ fontSize: 10, background: admin ? '#CC2200' : '#2A5FA8', color: '#fff', borderRadius: 6, padding: '1px 7px', fontFamily: 'monospace' }}>
              {admin ? 'admin' : 'user'}
            </span>
          </div>

          <button onClick={handleSignOut} className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }}>Déconnexion</button>
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
              <Link key={item.path} to={item.path} className={`sidebar-item ${active ? 'active' : ''}`} onClick={() => setShowNotifs(false)}>
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </aside>
        <main className="main" onClick={() => setShowNotifs(false)}>{children}</main>
      </div>
    </div>
  )
}
