import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast, Toast } from '../lib/useToast.jsx'
import { supabase, isAdmin, createNotification } from '../lib/supabase'

const CATEGORIES = ['Activation terrain', 'Merchandising', 'Événement', 'Digital', 'Co-branding', 'Autre']
const STATUS_LABELS = { pending: 'En attente', approved: 'Validée', rejected: 'Rejetée', archived: 'Archive' }
const STATUS_CLASS = { pending: 'badge-pending', approved: 'badge-ok', rejected: 'badge-ko', archived: 'badge-arch' }
const EMPTY_FORM = { title: '', company: '', demandeur: '', category: '', budget: '', launch_date: '', comment: '' }

export default function DMP({ user }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [motifInput, setMotifInput] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { toast, showToast } = useToast()
  const admin = isAdmin(user)

  const load = async () => {
    setLoading(true)
    let query = supabase.from('dmp_requests').select('*').order('created_at', { ascending: false })
    if (!admin) query = query.eq('user_id', user?.id)
    const { data, error } = await query
    if (error) showToast(error.message, 'error')
    else setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user, admin])

  const filtered = items.filter(d => {
    if (filter !== 'all' && d.status !== filter) return false
    if (search && !d.title?.toLowerCase().includes(search.toLowerCase()) && !d.company?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalBudget = items.reduce((s, d) => s + (Number(d.budget) || 0), 0)
  const generateId = () => `DMP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`

  const validate = async (d) => {
    const { error } = await supabase.from('dmp_requests').update({ status: 'approved' }).eq('id', d.id)
    if (error) { showToast(error.message, 'error'); return }
    if (d.user_id) await createNotification(d.user_id, 'DMP_VALIDÉE', `Votre demande "${d.title}" a été validée.`)
    showToast('Demande validée ✓'); setSelected(null); load()
  }

  const reject = async (d) => {
    const { error } = await supabase.from('dmp_requests').update({ status: 'rejected', motif: motifInput || 'Demande non conforme' }).eq('id', d.id)
    if (error) { showToast(error.message, 'error'); return }
    if (d.user_id) await createNotification(d.user_id, 'DMP_REJETÉE', `Votre demande "${d.title}" a été rejetée. Motif : ${motifInput || 'Demande non conforme'}`)
    showToast('Demande rejetée'); setMotifInput(''); setSelected(null); load()
  }

  const confirmDelete = async () => {
    const { error } = await supabase.from('dmp_requests').delete().eq('id', deleteTarget.id)
    if (error) showToast(error.message, 'error')
    else { showToast('Demande supprimée'); load() }
    setDeleteTarget(null)
  }

  const submitNew = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('dmp_requests').insert({
      id: generateId(), ...form, budget: Number(form.budget), status: 'pending', user_id: user?.id
    })
    if (error) showToast(error.message, 'error')
    else {
      setSubmitted(true)
      // Notifier les admins — on récupère les admins via auth.users (limitation : on notifie l'utilisateur lui-même pour confirmation)
      await createNotification(user?.id, 'DMP_SOUMISE', `Votre demande "${form.title}" a bien été transmise et est en attente de validation.`)
      load()
    }
    setSubmitting(false)
  }

  if (view === 'new') return (
    <Layout user={user}>
      <div className="page-header">
        <div><div className="page-title">Nouvelle demande marketing</div><div className="page-sub">Complétez tous les champs obligatoires</div></div>
        <button className="btn" onClick={() => { setView('list'); setSubmitted(false); setForm(EMPTY_FORM) }}>← Retour</button>
      </div>
      {submitted ? (
        <div className="alert-success" style={{ maxWidth: 560 }}>
          <div className="alert-success-icon">✓</div>
          <div className="alert-success-txt">Votre demande a été transmise avec succès. Vous recevrez une notification une fois la demande traitée.</div>
        </div>
      ) : (
        <div className="card card-pad" style={{ maxWidth: 560 }}>
          <form onSubmit={submitNew}>
            <div className="form-grid">
              <div><label className="form-label">Entreprise <span className="form-req">*</span></label><input required value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></div>
              <div><label className="form-label">Demandeur <span className="form-req">*</span></label><input required value={form.demandeur} onChange={e => setForm(p => ({ ...p, demandeur: e.target.value }))} /></div>
              <div><label className="form-label">Titre de l'action <span className="form-req">*</span></label><input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div>
                <label className="form-label">Catégorie <span className="form-req">*</span></label>
                <select required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="">Sélectionner...</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="form-label">Budget (MAD) <span className="form-req">*</span></label><input type="number" required min="1" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} placeholder="Ex: 50000" /></div>
              <div><label className="form-label">Date de lancement <span className="form-req">*</span></label><input type="date" required value={form.launch_date} onChange={e => setForm(p => ({ ...p, launch_date: e.target.value }))} /></div>
              <div className="form-full"><label className="form-label">Commentaire</label><textarea value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} rows={3} /></div>
              <div className="form-full"><label className="form-label">Documents <span className="form-req">*</span></label><input type="file" multiple /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button type="button" className="btn" onClick={() => setView('list')}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Envoi...' : 'Soumettre'}</button>
            </div>
          </form>
        </div>
      )}
      <Toast toast={toast} />
    </Layout>
  )

  return (
    <Layout user={user}>
      <div className="page-header">
        <div>
          <div className="page-title">Actions Marketing</div>
          <div className="page-sub">{admin ? 'Back-office DMP · Toutes les demandes' : 'Vos demandes marketing Motul Africa'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => { setView('new'); setSubmitted(false); setForm(EMPTY_FORM) }}>+ Nouvelle demande</button>
          {admin && <button className="btn" onClick={() => showToast('Export en préparation...')}>Export CSV</button>}
        </div>
      </div>

      {admin && (
        <div className="stat-grid stat-grid-4" style={{ marginBottom: 16 }}>
          <div className="stat-card"><div className="stat-label">Total</div><div className="stat-val">{items.length}</div></div>
          <div className="stat-card"><div className="stat-label">En attente</div><div className="stat-val" style={{ color: '#D97706' }}>{items.filter(d => d.status === 'pending').length}</div></div>
          <div className="stat-card"><div className="stat-label">Validées</div><div className="stat-val" style={{ color: '#16A34A' }}>{items.filter(d => d.status === 'approved').length}</div></div>
          <div className="stat-card"><div className="stat-label">Budget total</div><div className="stat-val" style={{ fontSize: 14 }}>{totalBudget.toLocaleString()} MAD</div></div>
        </div>
      )}

      {admin && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {['all', 'pending', 'approved', 'rejected', 'archived'].map(f => (
            <button key={f} className="btn" onClick={() => setFilter(f)} style={filter === f ? { background: '#FFF0ED', color: '#CC2200', borderColor: '#CC2200' } : {}}>
              {f === 'all' ? 'Tout' : STATUS_LABELS[f]}
            </button>
          ))}
          <input style={{ marginLeft: 'auto', width: 200 }} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      <div className="table-card">
        <div className="table-head" style={{ gridTemplateColumns: admin ? '2fr 100px 110px 110px 90px 80px' : '2fr 110px 110px 90px' }}>
          {(admin
            ? ['Action / Entreprise', 'Catégorie', 'Budget', 'Date lancement', 'Statut', 'Actions']
            : ['Action', 'Date lancement', 'Soumis le', 'Statut']
          ).map(h => <span key={h} className="th">{h}</span>)}
        </div>

        {loading ? <div className="empty-state">Chargement...</div>
          : filtered.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">◈</div>{admin ? 'Aucune demande.' : 'Vous n\'avez pas encore soumis de demande.'}</div>
            : filtered.map(d => (
              <div key={d.id} className="table-row"
                style={{ gridTemplateColumns: admin ? '2fr 100px 110px 110px 90px 80px' : '2fr 110px 110px 90px', cursor: admin ? 'pointer' : 'default' }}
                onClick={() => admin && setSelected(d)}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{d.company} · {d.id}</div>
                </div>
                {admin && <span className="td">{d.category}</span>}
                {admin && <span className="td" style={{ fontFamily: 'monospace' }}>{Number(d.budget).toLocaleString()} MAD</span>}
                <span className="td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{d.launch_date}</span>
                {!admin && <span className="td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</span>}
                <span className={`badge ${STATUS_CLASS[d.status] || 'badge-arch'}`}>{STATUS_LABELS[d.status] || d.status}</span>
                {admin && (
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button className="btn btn-success" style={{ width: 26, height: 26, padding: 0, fontSize: 12 }} onClick={() => validate(d)} title="Valider">✓</button>
                    <button className="btn btn-danger" style={{ width: 26, height: 26, padding: 0, fontSize: 12 }} onClick={() => setDeleteTarget(d)} title="Supprimer">✕</button>
                  </div>
                )}
              </div>
            ))
        }

      </div>

      {/* Modale détail DMP */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 600, paddingRight: 10 }}>{selected.title}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af', flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 18 }}>{selected.id}</div>
            <span className={`badge ${STATUS_CLASS[selected.status] || 'badge-arch'}`} style={{ marginBottom: 14, display: 'inline-block' }}>{STATUS_LABELS[selected.status] || selected.status}</span>
            {[['Entreprise', selected.company], ['Demandeur', selected.demandeur], ['Catégorie', selected.category], ['Date de lancement', selected.launch_date], ['Budget', `${Number(selected.budget).toLocaleString()} MAD`]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 3, textTransform: 'uppercase' }}>{k}</div>
                <div style={{ fontSize: 13, fontWeight: k === 'Budget' ? 600 : 400 }}>{v}</div>
              </div>
            ))}
            {selected.comment && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 3 }}>COMMENTAIRE</div><div style={{ fontSize: 13 }}>{selected.comment}</div></div>}
            {selected.status === 'rejected' && selected.motif && (
              <div style={{ background: '#FFF0ED', borderLeft: '3px solid #CC2200', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#CC2200', marginBottom: 4 }}>MOTIF DE REFUS</div>
                {selected.motif}
              </div>
            )}
            {selected.status === 'pending' && (
              <>
                <div style={{ height: '0.5px', background: '#f3f4f6', margin: '16px 0' }} />
                <label className="form-label">Motif de refus (si applicable)</label>
                <textarea value={motifInput} onChange={e => setMotifInput(e.target.value)} placeholder="Saisissez le motif..." rows={3} style={{ marginBottom: 14 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-success" onClick={() => validate(selected)}>✓ Valider</button>
                  <button className="btn btn-danger" onClick={() => reject(selected)}>✕ Rejeter</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal open={!!deleteTarget} title="Supprimer la demande" message={`Confirmez-vous la suppression de "${deleteTarget?.title}" ?`} confirmLabel="Supprimer" danger onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      <Toast toast={toast} />
    </Layout>
  )
}
