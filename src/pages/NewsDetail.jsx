import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

export default function NewsDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase.from('news').select('*').eq('id', id).maybeSingle()
      setArticle(data || null)
      // Suggestions : 3 autres articles visibles, les plus récents
      const { data: others } = await supabase
        .from('news')
        .select('*')
        .eq('visible', true)
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(3)
      setSuggestions(others || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <Layout user={user}><div className="empty-state">Chargement...</div></Layout>
  if (!article) return (
    <Layout user={user}>
      <div style={{ maxWidth: 560, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Article introuvable</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Cet article n'existe plus ou n'est plus disponible.</div>
        <button className="btn" onClick={() => navigate('/news')}>← Retour aux actualités</button>
      </div>
    </Layout>
  )

  // Temps de lecture estimé (~200 mots/min)
  const words = (article.content || '').split(/\s+/).length
  const readTime = Math.max(1, Math.ceil(words / 200))

  return (
    <Layout user={user}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <button className="btn" onClick={() => navigate('/news')} style={{ marginBottom: 20, fontSize: 12 }}>← Toutes les actualités</button>

        {/* Image hero */}
        {article.image_url && (
          <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 28, aspectRatio: '16 / 9', background: '#f3f4f6' }}>
            <img src={article.image_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* Titre + méta */}
        <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, color: '#111827', marginBottom: 14, letterSpacing: -0.5 }}>{article.title}</h1>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 30, paddingBottom: 20, borderBottom: '0.5px solid #e5e7eb' }}>
          <span>{new Date(article.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          <span>·</span>
          <span>{readTime} min de lecture</span>
        </div>

        {/* Contenu */}
        {article.content && (
          <div style={{ fontSize: 16, lineHeight: 1.8, color: '#1f2937', whiteSpace: 'pre-wrap', marginBottom: 50 }}>
            {article.content}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div style={{ paddingTop: 30, borderTop: '0.5px solid #e5e7eb' }}>
            <div className="section-title" style={{ marginBottom: 16 }}>À lire également</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(suggestions.length, 3)}, 1fr)`, gap: 14 }}>
              {suggestions.map(s => (
                <Link key={s.id} to={`/news/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform .15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.title} style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', aspectRatio: '16 / 9', background: 'linear-gradient(135deg, #CC2200, #A01A00)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📰</div>
                    )}
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>{s.title}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginTop: 4 }}>{new Date(s.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
