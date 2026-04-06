import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase, isAdmin } from '../lib/supabase'

export default function Home({ user }) {
  const [sliders, setSliders] = useState([])
  const [news, setNews] = useState([])
  const [stats, setStats] = useState({ dmp: 0, library: 0, newsletter: 0 })
  const [activeSlider, setActiveSlider] = useState(0)
  const admin = isAdmin(user)

  useEffect(() => {
    supabase.from('sliders').select('*').eq('visible', true).order('sort_order').then(({ data }) => setSliders(data || []))
    supabase.from('news').select('*').eq('visible', true).order('created_at', { ascending: false }).limit(3).then(({ data }) => setNews(data || []))
    if (admin) {
      Promise.all([
        supabase.from('dmp_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('library_requests').select('id', { count: 'exact', head: true }).eq('access_granted', false),
        supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
      ]).then(([dmp, lib, nl]) => setStats({ dmp: dmp.count || 0, library: lib.count || 0, newsletter: nl.count || 0 }))
    }
  }, [admin])

  useEffect(() => {
    if (sliders.length <= 1) return
    const t = setInterval(() => setActiveSlider(p => (p + 1) % sliders.length), 5000)
    return () => clearInterval(t)
  }, [sliders.length])

  const SHORTCUTS = [
    { label: 'Actions Marketing', sub: 'Soumettre une demande', path: '/dmp', icon: '◈', color: '#CC2200' },
    { label: 'Motul Library', sub: 'Accéder aux ressources', path: '/library', icon: '📚', color: '#2A5FA8' },
    { label: 'Actualités', sub: 'Voir les dernières news', path: '/news', icon: '📰', color: '#059669' },
  ]

  return (
    <Layout user={user}>
      {/* Slider */}
      {sliders.length > 0 ? (
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 24, height: 220, background: '#111' }}>
          {sliders.map((s, i) => (
            <div key={s.id} style={{ position: 'absolute', inset: 0, opacity: i === activeSlider ? 1 : 0, transition: 'opacity .6s', display: 'flex', alignItems: 'flex-end' }}>
              {s.image_url && <img src={s.image_url} alt={s.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .7 }} />}
              <div style={{ position: 'relative', padding: '20px 28px', background: 'linear-gradient(to top, rgba(0,0,0,.8) 0%, transparent 100%)', width: '100%' }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{s.title}</div>
                {s.subtitle && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', fontWeight: 500, marginBottom: 10 }}>{s.subtitle}</div>}
                {s.btn_label && (
                  <div style={{ display: 'inline-block', background: '#CC2200', color: '#fff', fontSize: 12, padding: '6px 14px', borderRadius: 6, fontWeight: 500 }}>{s.btn_label}</div>
                )}
              </div>
            </div>
          ))}
          {sliders.length > 1 && (
            <div style={{ position: 'absolute', bottom: 12, right: 16, display: 'flex', gap: 5 }}>
              {sliders.map((_, i) => (
                <button key={i} onClick={() => setActiveSlider(i)} style={{ width: i === activeSlider ? 20 : 7, height: 7, borderRadius: 4, background: i === activeSlider ? '#fff' : 'rgba(255,255,255,.4)', border: 'none', cursor: 'pointer', transition: 'all .3s', padding: 0 }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ borderRadius: 14, background: 'linear-gradient(135deg, #CC2200 0%, #A01A00 100%)', marginBottom: 24, height: 180, display: 'flex', alignItems: 'center', padding: '0 32px' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Bienvenue sur Africa Marketing Platform</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.75)' }}>Gérez vos actions marketing Motul Africa</div>
          </div>
        </div>
      )}

      {/* Stats admin */}
      {admin && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Vue d'ensemble</div>
          <div className="stat-grid stat-grid-3">
            <div className="stat-card" style={{ borderLeft: '3px solid #D97706' }}>
              <div className="stat-label">DMP en attente</div>
              <div className="stat-val" style={{ color: '#D97706' }}>{stats.dmp}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid #2A5FA8' }}>
              <div className="stat-label">Demandes Library</div>
              <div className="stat-val" style={{ color: '#2A5FA8' }}>{stats.library}</div>
            </div>
            <div className="stat-card" style={{ borderLeft: '3px solid #059669' }}>
              <div className="stat-label">Abonnés newsletter</div>
              <div className="stat-val" style={{ color: '#059669' }}>{stats.newsletter}</div>
            </div>
          </div>
        </div>
      )}

      {/* Raccourcis */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-title">Accès rapide</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
          {SHORTCUTS.map(s => (
            <Link key={s.path} to={s.path} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '18px 20px', cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 14 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Dernières actualités */}
      {news.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Dernières actualités</div>
            <Link to="/news" style={{ fontSize: 12, color: '#CC2200', textDecoration: 'none' }}>Voir tout →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {news.map(n => (
              <div key={n.id} className="card" style={{ padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {n.image_url
                  ? <img src={n.image_url} alt={n.title} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 56, height: 56, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📰</div>
                }
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#111827', marginBottom: 3 }}>{n.title}</div>
                  {n.content && <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{n.content.slice(0, 120)}{n.content.length > 120 ? '...' : ''}</div>}
                  <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginTop: 5 }}>{new Date(n.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
