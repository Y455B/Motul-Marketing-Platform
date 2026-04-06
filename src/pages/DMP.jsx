import { useState, useEffect } from 'react'
import Layout from '../components/Layout'

const CATEGORIES = ['Activation terrain', 'Merchandising', 'Événement', 'Digital', 'Co-branding', 'Autre']

const MOCK = [
  { id: 'DMP-2025-012', title: 'Activation garage Ramadan', company: 'Casablanca Events SA', demandeur: 'Karim Tazi', category: 'Activation terrain', budget: 85000, launch_date: '2025-04-15', status: 'pending', comment: 'Activation dans 12 garages Casablanca', motif: '', created_at: '2025-04-05' },
  { id: 'DMP-2025-011', title: 'Kit Merchandising Été', company: 'Auto-Marché Distribution', demandeur: 'Sara Benali', category: 'Merchandising', budget: 42500, launch_date: '2025-05-01', status: 'pending', comment: 'Kit 200 points de vente', motif: '', created_at: '2025-04-03' },
  { id: 'DMP-2025-010', title: 'Événement Moto Show Rabat', company: 'Moto Prestige SARL', demandeur: 'Mehdi Chraibi', category: 'Événement', budget: 120000, launch_date: '2025-04-20', status: 'approved', comment: '', motif: '', created_at: '2025-04-01' },
  { id: 'DMP-2025-009', title: 'Co-branding digital Q2', company: 'Digital Auto MA', demandeur: 'Fatima Ouali', category: 'Digital', budget: 35000, launch_date: '2025-04-10', status: 'approved', comment: '', motif: '', created_at: '2025-03-28' },
  { id: 'DMP-2025-008', title: 'Démo huile 5100 Nord', company: 'Garage Fassi & Fils', demandeur: 'Hassan Fassi', category: 'Activation terrain', budget: 28000, launch_date: '2025-04-05', status: 'rejected', comment: '', motif: 'Budget dépasse le plafond régional autorisé.', created_at: '2025-03-25' },
]

const STATUS_LABELS = { pending: 'En attente', approved: 'Validée', rejected: 'Rejetée', archived: 'Archive' }
const STATUS_CLASS = { pending: 'badge-pending', approved: 'badge-ok', rejected: 'badge-ko', archived: 'badge-arch' }

export default function DMP({ isAdmin }) {
  const [view, setView] = useState('list') // list | new
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState(MOCK)
  const [selected, setSelected] = useState(null)
  const [motifInput, setMotifInput] = useState('')
  const [formData, setFormData] = useState({ title: '', company: '', demandeur: '', category: '', budget: '', launch_date: '', comment: '' })
  const [submitted, setSubmitted] = useState(false)

  const filtered = items.filter(d => {
    if (filter !== 'all' && d.status !== filter) return false
    if (search && !d.title.toLowerCase().includes(search) && !d.company.toLowerCase().includes(search)) return false
    return true
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const totalBudget = items.reduce((s, d) => s + d.budget, 0)

  const validate = (id) => {
    setItems(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' } : d))
    setSelected(null)
  }

  const reject = (id) => {
    setItems(prev => prev.map(d => d.id === id ? { ...d, status: 'rejected', motif: motifInput || 'Demande non conforme' } : d))
    setMotifInput('')
    setSelected(null)
  }

  const submitNew = (e) => {
    e.preventDefault()
    const newItem = {
      ...formData,
      id: `DMP-2025-0${items.length + 1}`,
      status: 'pending',
      budget: Number(formData.budget),
      created_at: new Date().toISOString().split('T')[0]
    }
    setItems(prev => [newItem, ...prev])
    setSubmitted(true)
  }

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 500 }}>Actions Marketing — DMP</h2>
          <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--mono)', marginTop: 2 }}>Demandes marketing partenaires · triées par date décroissante</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setView(view === 'list' ? 'new' : 'list')}>
            {view === 'list' ? '+ Nouvelle demande' : '← Retour liste'}
          </button>
          {isAdmin && <button className="btn btn-primary">Export CSV</button>}
        </div>
      </div>

      {view === 'list' ? (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Total', val: items.length },
              { label: 'En attente', val: items.filter(d => d.status === 'pending').length, color: '#D97706' },
              { label: 'Validées', val: items.filter(d => d.status === 'approved').length, color: '#16A34A' },
              { label: 'Budget total', val: `${totalBudget.toLocaleString()} MAD`, small: true },
            ].map((s, i) => (
              <div key={i} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--mono)', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: s.small ? 14 : 18, fontWeight: 500, color: s.color || '#111827' }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
            {['all', 'pending', 'approved', 'rejected', 'archived'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className="btn" style={filter === f ? { background: '#FFF0ED', color: '#CC2200', borderColor: '#CC2200' } : {}}>
                {f === 'all' ? 'Tout' : STATUS_LABELS[f]}
              </button>
            ))}
            <input style={{ marginLeft: 'auto', width: 180 }} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Table */}
          <div className="card" style={{ overflow: 'hidden', position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 90px 100px 90px 80px', padding: '7px 14px', background: '#f9fafb', borderBottom: '0.5px solid #e5e7eb' }}>
              {['Action / Entreprise', 'Catégorie', 'Budget', 'Date lancement', 'Statut', 'Actions'].map(h => (
                <span key={h} style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, fontFamily: 'var(--mono)' }}>{h}</span>
              ))}
            </div>
            {filtered.map(d => (
              <div key={d.id} onClick={() => setSelected(d)} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 90px 100px 90px 80px', padding: '10px 14px', borderBottom: '0.5px solid #f3f4f6', alignItems: 'center', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{d.company} · {d.id}</div>
                </div>
                <span style={{ fontSize: 11, color: '#6b7280' }}>{d.category}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#6b7280' }}>{d.budget.toLocaleString()} MAD</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: '#6b7280' }}>{d.launch_date}</span>
                <span className={`badge ${STATUS_CLASS[d.status]}`}>{STATUS_LABELS[d.status]}</span>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button className="btn" style={{ width: 26, height: 26, padding: 0, fontSize: 12 }} onClick={() => { setSelected(d); validate(d.id) }}>✓</button>
                    <button className="btn" style={{ width: 26, height: 26, padding: 0, fontSize: 12 }} onClick={() => setSelected(d)}>✕</button>
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>Aucune demande trouvée</div>}

            {/* Detail panel */}
            {selected && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.3)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', borderRadius: 12 }}>
                <div style={{ width: 380, background: '#fff', borderRadius: '0 12px 12px 0', height: '100%', overflow: 'auto', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.title}</div>
                    <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9ca3af' }}>✕</button>
                  </div>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--mono)', marginBottom: 14 }}>{selected.id}</div>
                  {[['Entreprise', selected.company], ['Demandeur', selected.demandeur], ['Catégorie', selected.category], ['Date de lancement', selected.launch_date], ['Budget', `${selected.budget.toLocaleString()} MAD`]].map(([k, v]) => (
                    <div key={k} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--mono)', marginBottom: 2 }}>{k.toUpperCase()}</div>
                      <div style={{ fontSize: 12, fontWeight: k === 'Budget' ? 500 : 400 }}>{v}</div>
                    </div>
                  ))}
                  {selected.comment && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--mono)', marginBottom: 2 }}>COMMENTAIRE</div><div style={{ fontSize: 12 }}>{selected.comment}</div></div>}
                  {selected.status === 'rejected' && selected.motif && (
                    <div style={{ background: '#FFF0ED', border: '0.5px solid #FECACA', borderLeft: '2px solid #CC2200', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: '#7f1d1d', marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: '#CC2200', marginBottom: 4 }}>MOTIF DE REFUS</div>
                      {selected.motif}
                    </div>
                  )}
                  {selected.status === 'pending' && isAdmin && (
                    <>
                      <div style={{ height: '0.5px', background: '#f3f4f6', margin: '14px 0' }} />
                      <label className="form-label">Motif de refus (si applicable)</label>
                      <textarea value={motifInput} onChange={e => setMotifInput(e.target.value)} placeholder="Saisissez le motif..." rows={3} style={{ marginBottom: 12 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-success" onClick={() => validate(selected.id)}>✓ Valider</button>
                        <button className="btn btn-danger" onClick={() => reject(selected.id)}>✕ Rejeter</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Formulaire nouvelle demande */
        <div style={{ maxWidth: 560 }}>
          {submitted ? (
            <div className="alert-success">
              <div className="alert-success-icon">✓</div>
              <div className="alert-success-txt">Votre demande a été transmise avec succès. Vous recevrez une notification une fois la demande traitée.</div>
            </div>
          ) : (
            <div className="card card-pad">
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Actions Marketing — Nouvelle demande</div>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 18 }}>Complétez tous les champs obligatoires pour soumettre votre demande.</p>
              <form onSubmit={submitNew}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label className="form-label">Entreprise <span className="form-req">*</span></label><input required value={formData.company} onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} placeholder="Nom de l'entreprise" /></div>
                  <div><label className="form-label">Demandeur <span className="form-req">*</span></label><input required value={formData.demandeur} onChange={e => setFormData(p => ({ ...p, demandeur: e.target.value }))} placeholder="Nom du demandeur" /></div>
                  <div><label className="form-label">Catégorie <span className="form-req">*</span></label>
                    <select required value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                      <option value="">Actions Marketing</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label className="form-label">Date de lancement <span className="form-req">*</span></label><input type="date" required value={formData.launch_date} onChange={e => setFormData(p => ({ ...p, launch_date: e.target.value }))} /></div>
                  <div><label className="form-label">Budget (MAD) <span className="form-req">*</span></label><input type="number" required min="1" value={formData.budget} onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))} placeholder="Ex: 50000" /></div>
                  <div><label className="form-label">Titre de l'action <span className="form-req">*</span></label><input required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Activation Ramadan" /></div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Commentaire</label>
                    <textarea value={formData.comment} onChange={e => setFormData(p => ({ ...p, comment: e.target.value }))} placeholder="Informations complémentaires..." rows={3} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label className="form-label">Documents <span className="form-req">*</span></label>
                    <input type="file" multiple />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                  <button type="button" className="btn" onClick={() => setView('list')}>Annuler</button>
                  <button type="submit" className="btn btn-primary">Soumettre la demande</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
