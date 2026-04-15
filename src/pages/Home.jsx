import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase, isAdmin } from '../lib/supabase'

export default function Home({ user }) {
  const [sliders, setSliders] = useState([])
  const [news, setNews] = useState([])
  const [stats, setStats] = useState({ library: 0, newsletter: 0 })
  const [activeSlider, setActiveSlider] = useState(0)
  const [nlEmail, setNlEmail] = useState('')
  const [nlStatus, setNlStatus] = useState(null) // null | 'sending' | 'done' | 'already' | 'error'
  const admin = isAdmin(user)

  useEffect(() => {
    supabase.from('sliders').select('*').eq('visible', true).order('sort_order')
      .then(({ data }) => setSliders(data || []))
    supabase.from('news').select('*').eq('visible', true).order('created_at', { ascending: false }).limit(4)
      .then(({ data }) => setNews(data || []))
    if (admin) {
      Promise.all([
        supabase.from('library_requests').select('id', { count: 'exact', head: true }).eq('access_granted', false).eq('rejected', false),
        supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
      ]).then(([lib, nl]) => setStats({ library: lib.count || 0, newsletter: nl.count || 0 }))
    }
  }, [admin])

  useEffect(() => {
    if (sliders.length <= 1) return
    const t = setInterval(() => setActiveSlider(p => (p + 1) % sliders.length), 5000)
    return () => clearInterval(t)
  }, [sliders.length])

  const SHORTCUTS = [
    { label: 'Actions Marketing', sub: "Outil Motul International", path: '/dmp', icon: '◈', color: '#CC2200' },
    { label: 'Motul Library', sub: 'Accéder aux ressources', path: '/library', icon: '📚', color: '#2A5FA8' },
    { label: 'Actualités', sub: 'Dernières nouvelles', path: '/news', icon: '📰', color: '#059669' },
  ]

  return (
    <Layout user={user}>
      {/* Slider */}
      {sliders.length > 0 ? (
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 24, height: 220, background: '#1a1a1a' }}>
          {sliders.map((s, i) => (
            <div key={s.id} style={{ position: 'absolute', inset: 0, opacity: i === activeSlider ? 1 : 0, transition: 'opacity .7s ease', pointerEvents: i === activeSlider ? 'auto' : 'none' }}>
              {s.image_url
                ? <img src={s.image_url} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #CC2200 0%, #A01A00 100%)' }} />
              }
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.1) 60%, transparent 100%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 28px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4, textShadow: '0 1px 4px rgba(0,0,0,.5)' }}>{s.title}</div>
                {s.subtitle && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', fontWeight: 500, marginBottom: s.btn_label ? 12 : 0 }}>{s.subtitle}</div>}
                {s.btn_label && s.btn_url && (
                  s.btn_url.startsWith('/') ? (
                    <Link to={s.btn_url} style={{ display: 'inline-block', background: '#CC2200', color: '#fff', fontSize: 12, padding: '6px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}>{s.btn_label}</Link>
                  ) : (
                    <a href={s.btn_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#CC2200', color: '#fff', fontSize: 12, padding: '6px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}>{s.btn_label}</a>
                  )
                )}
              </div>
            </div>
          ))}
          {sliders.length > 1 && (
            <div style={{ position: 'absolute', bottom: 14, right: 18, display: 'flex', gap: 5 }}>
              {sliders.map((_, i) => (
                <button key={i} onClick={() => setActiveSlider(i)} style={{ width: i === activeSlider ? 22 : 7, height: 7, borderRadius: 4, background: i === activeSlider ? '#fff' : 'rgba(255,255,255,.4)', border: 'none', cursor: 'pointer', transition: 'all .3s', padding: 0 }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ borderRadius: 14, background: 'linear-gradient(135deg, #CC2200 0%, #A01A00 100%)', marginBottom: 24, height: 180, display: 'flex', alignItems: 'center', padding: '0 32px' }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2, color: '#fff', marginBottom: 8 }}>BIENVENUE SUR AFRICA MARKETING PLATFORM</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', letterSpacing: '.5px' }}>Votre espace partenaire dédié aux activations Motul Africa</div>
          </div>
        </div>
      )}

      {/* Stats admin */}
      {admin && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-title">Vue d'ensemble</div>
          <div className="stat-grid stat-grid-2">
            <Link to="/library" style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ borderLeft: '3px solid #2A5FA8', cursor: 'pointer' }}>
                <div className="stat-label">Demandes Library</div>
                <div className="stat-val" style={{ color: '#2A5FA8' }}>{stats.library}</div>
              </div>
            </Link>
            <Link to="/newsletter" style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ borderLeft: '3px solid #059669', cursor: 'pointer' }}>
                <div className="stat-label">Abonnés newsletter</div>
                <div className="stat-val" style={{ color: '#059669' }}>{stats.newsletter}</div>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Raccourcis */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-title">Accès rapide</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
          {SHORTCUTS.map(s => (
            <Link key={s.path} to={s.path} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ padding: '18px 20px', cursor: 'pointer', transition: 'border-color .15s', display: 'flex', alignItems: 'center', gap: 14 }}
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

      {/* Actualités — cards image-first */}
      {news.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>Dernières actualités</div>
            <Link to="/news" style={{ fontSize: 12, color: '#CC2200', textDecoration: 'none', fontWeight: 500 }}>Voir tout →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {news.slice(0, 4).map(n => (
              <Link key={n.id} to={`/news/${n.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform .15s, box-shadow .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                  {n.image_url ? (
                    <img src={n.image_url} alt={n.title} style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '16 / 9', background: 'linear-gradient(135deg, #CC2200, #A01A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📰</div>
                  )}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.title}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginTop: 6 }}>{new Date(n.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {/* Newsletter — utilisateurs non-admin */}
      {!admin && (
        <div style={{ marginTop: 28 }}>
          <div className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Newsletter Motul Africa</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Recevez les dernières actualités et offres Motul directement dans votre boîte mail.</div>
            </div>
            {nlStatus === 'done' ? (
              <div style={{ fontSize: 12, color: '#166534', background: '#dcfce7', padding: '8px 14px', borderRadius: 6, fontWeight: 500 }}>✓ Inscription confirmée</div>
            ) : nlStatus === 'already' ? (
              <div style={{ fontSize: 12, color: '#D97706', background: '#FEF3C7', padding: '8px 14px', borderRadius: 6, fontWeight: 500 }}>Vous êtes déjà inscrit(e)</div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault()
                setNlStatus('sending')
                const email = nlEmail || user?.email
                if (!email) return
                const { error } = await supabase.from('newsletter_subscribers').insert({
                  email, nom: user?.user_metadata?.nom || '', prenom: user?.user_metadata?.prenom || '', entreprise: user?.user_metadata?.entreprise || ''
                })
                if (error) {
                  if (error.code === '23505') setNlStatus('already')
                  else setNlStatus('error')
                } else setNlStatus('done')
              }} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="email"
                  value={nlEmail}
                  onChange={e => setNlEmail(e.target.value)}
                  placeholder={user?.email || 'votre@email.com'}
                  required
                  style={{ width: 220, fontSize: 12 }}
                />
                <button type="submit" className="btn btn-primary" style={{ fontSize: 12, whiteSpace: 'nowrap' }} disabled={nlStatus === 'sending'}>
                  {nlStatus === 'sending' ? 'Envoi...' : "S'inscrire"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
