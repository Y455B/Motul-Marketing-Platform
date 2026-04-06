import { useState } from 'react'
import Layout from '../components/Layout'

const INIT_SLIDERS = [
  { id: 1, title: 'Motul 8100 — Performance extrême', subtitle: 'Découvrez la nouvelle gamme premium', btn: 'En savoir plus', visible: true, color: '#CC2200' },
  { id: 2, title: 'Ramadan 2025 — Offres spéciales', subtitle: 'Profitez des promotions partenaires', btn: 'Voir les offres', visible: true, color: '#1976D2' },
  { id: 3, title: 'Motul Racing — Partenaire officiel MotoGP', subtitle: 'La technologie de la piste sur la route', btn: 'Découvrir', visible: false, color: '#1B5E20' },
]

export default function Sliders() {
  const [sliders, setSliders] = useState(INIT_SLIDERS)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const toggleVisible = (id) => setSliders(prev => prev.map(s => s.id === id ? { ...s, visible: !s.visible } : s))

  const saveEdit = (e) => {
    e.preventDefault()
    setSliders(prev => prev.map(s => s.id === editing.id ? editing : s))
    setEditing(null)
    showToast('Slider mis à jour')
  }

  const addSlider = () => {
    const newSlider = { id: Date.now(), title: 'Nouveau slider', subtitle: 'Sous-titre du slider', btn: 'En savoir plus', visible: false, color: '#CC2200' }
    setSliders(prev => [...prev, newSlider])
    setEditing(newSlider)
  }

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 500 }}>Sliders homepage</h2>
          <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 2 }}>Gestion des bannières · {sliders.filter(s => s.visible).length} slider(s) actif(s)</p>
        </div>
        <button className="btn btn-primary" onClick={addSlider}>+ Nouveau slider</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editing ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sliders.map(s => (
            <div key={s.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{s.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => toggleVisible(s.id)} style={{ width: 36, height: 20, background: s.visible ? '#16a34a' : '#d1d5db', borderRadius: 10, position: 'relative', cursor: 'pointer', border: 'none' }}>
                    <span style={{ position: 'absolute', width: 16, height: 16, background: '#fff', borderRadius: '50%', top: 2, left: s.visible ? 18 : 2, transition: 'left .15s' }} />
                  </button>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{s.visible ? 'Visible' : 'Masqué'}</span>
                </div>
              </div>

              {/* Prévisualisation */}
              <div style={{ background: s.color + '22', border: `0.5px solid ${s.color}44`, borderRadius: 8, height: 80, position: 'relative', marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: 8, left: 10, right: 80 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>{s.title}</div>
                  <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500 }}>{s.subtitle}</div>
                </div>
                <div style={{ position: 'absolute', bottom: 8, right: 10, background: s.color, color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{s.btn}</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setEditing({ ...s })}>Modifier</button>
                <button className="btn" style={{ fontSize: 11, padding: '4px 10px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => { setSliders(prev => prev.filter(x => x.id !== s.id)); showToast('Slider supprimé') }}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>

        {editing && (
          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Modifier le slider</div>
            <form onSubmit={saveEdit}>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Titre <span className="form-req">*</span></label>
                <input required value={editing.title} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Descriptif <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>(sous-titre en gras)</span></label>
                <input value={editing.subtitle} onChange={e => setEditing(p => ({ ...p, subtitle: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Titre du bouton</label>
                <input value={editing.btn} onChange={e => setEditing(p => ({ ...p, btn: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label className="form-label">Image <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>1920×600px · max 2 Mo</span></label>
                <input type="file" accept="image/*" />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setEditing(null)}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>Enregistrer</button>
              </div>
            </form>
          </div>
        )}
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
