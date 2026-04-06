import { useState } from 'react'
import Layout from '../components/Layout'

const INIT_NEWS = [
  { id: 1, title: 'Motul lance sa gamme 8100 X-cess en Afrique', date: '04 avr 2025', visible: true, content: 'La nouvelle gamme premium est disponible dans tout le réseau de distribution Motul Africa.' },
  { id: 2, title: 'Résultats Moto GP 2025 — Motul partenaire officiel', date: '01 avr 2025', visible: true, content: 'Motul confirme son partenariat avec le championnat du monde MotoGP pour la saison 2025.' },
  { id: 3, title: 'Formation réseau distributeurs — Casablanca', date: '28 mar 2025', visible: false, content: 'Session de formation technique pour les distributeurs de la région Grand Casablanca.' },
  { id: 4, title: 'Nouvelle gamme lubrifiants industriels disponible', date: '20 mar 2025', visible: true, content: 'La gamme industrielle Motul est désormais accessible via la plateforme de commande en ligne.' },
]

export default function News() {
  const [news, setNews] = useState(INIT_NEWS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '' })
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const toggleVisible = (id) => {
    setNews(prev => prev.map(n => n.id === id ? { ...n, visible: !n.visible } : n))
  }

  const deleteNews = (id) => {
    setNews(prev => prev.filter(n => n.id !== id))
    showToast('Article supprimé')
  }

  const addNews = (e) => {
    e.preventDefault()
    const newItem = { id: Date.now(), title: form.title, date: '06 avr 2026', visible: true, content: form.content }
    setNews(prev => [newItem, ...prev])
    setForm({ title: '', content: '' })
    setShowForm(false)
    showToast('Article publié')
  }

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 500 }}>Actualités</h2>
          <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 2 }}>Gestion des articles · Back-office éditorial</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Nouvelle actualité</button>
      </div>

      {showForm && (
        <div className="card card-pad" style={{ marginBottom: 16, maxWidth: 560 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Nouvel article</div>
          <form onSubmit={addNews}>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Titre <span className="form-req">*</span></label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre de l'article" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Contenu</label>
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Contenu de l'article..." rows={3} style={{ resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary">Publier</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {news.map(n => (
          <div key={n.id} className="card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📰</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, cursor: 'pointer', color: '#111827' }}
                onClick={() => showToast(`Ouverture : ${n.title}`)}
                onMouseEnter={e => e.currentTarget.style.color = '#CC2200'}
                onMouseLeave={e => e.currentTarget.style.color = '#111827'}>
                {n.title}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 6 }}>{n.date}</div>
              {n.content && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{n.content}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => toggleVisible(n.id)} style={{ width: 36, height: 20, background: n.visible ? '#16a34a' : '#d1d5db', borderRadius: 10, position: 'relative', cursor: 'pointer', border: 'none', transition: 'background .15s' }}>
                    <span style={{ position: 'absolute', width: 16, height: 16, background: '#fff', borderRadius: '50%', top: 2, left: n.visible ? 18 : 2, transition: 'left .15s' }} />
                  </button>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{n.visible ? 'Visible' : 'Masqué'}</span>
                </div>
                <button className="btn" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => showToast('Modifier l\'article...')}>Modifier</button>
                <button className="btn" style={{ fontSize: 11, padding: '3px 10px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => deleteNews(n.id)}>Supprimer</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#fff', border: '0.5px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, zIndex: 200 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
          {toast}
        </div>
      )}
    </Layout>
  )
}
