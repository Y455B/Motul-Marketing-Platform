import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast, Toast } from '../lib/useToast'
import { supabase } from '../lib/supabase'

const EMPTY_FORM = { nom: '', prenom: '', email: '', entreprise: '' }

export default function Newsletter() {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { toast, showToast } = useToast()

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false })
    if (error) showToast(error.message, 'error')
    else setSubs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('newsletter_subscribers').insert(form)
    if (error) { showToast(error.message === 'duplicate key value violates unique constraint "newsletter_subscribers_email_key"' ? 'Cet email est déjà inscrit.' : error.message, 'error') }
    else { setSubmitted(true); load() }
    setSubmitting(false)
  }

  const confirmDelete = async () => {
    const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', deleteTarget.id)
    if (error) showToast(error.message, 'error')
    else { showToast('Abonné retiré'); load() }
    setDeleteTarget(null)
  }

  const exportCSV = () => {
    const rows = ['Email,Nom,Prénom,Entreprise,Date', ...subs.map(s => `${s.email},${s.nom || ''},${s.prenom || ''},${s.entreprise || ''},${new Date(s.created_at).toLocaleDateString('fr-FR')}`)].join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'newsletter_subscribers.csv'; a.click()
    showToast(`Export CSV — ${subs.length} abonnés`)
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">Newsletter</div>
          <div className="page-sub">Abonnés partenaires · {subs.length} inscrit(s)</div>
        </div>
        <button className="btn btn-primary" onClick={exportCSV}>Export CSV ↓</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Formulaire inscription</div>
          {submitted ? (
            <div className="alert-success">
              <div className="alert-success-icon">✓</div>
              <div className="alert-success-txt">Nous vous remercions de votre inscription à la newsletter.</div>
            </div>
          ) : (
            <div className="card card-pad">
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>Restez informé des dernières actualités Motul Africa.</p>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label className="form-label">Nom <span className="form-req">*</span></label><input required value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} /></div>
                  <div><label className="form-label">Prénom <span className="form-req">*</span></label><input required value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} /></div>
                  <div style={{ gridColumn: '1/-1' }}><label className="form-label">Email <span className="form-req">*</span></label><input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div style={{ gridColumn: '1/-1' }}><label className="form-label">Entreprise</label><input value={form.entreprise} onChange={e => setForm(p => ({ ...p, entreprise: e.target.value }))} placeholder="Optionnel" /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Inscription...' : 'S\'inscrire'}</button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Abonnés — Back-office</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
            <div className="stat-card"><div className="stat-label">Total abonnés</div><div className="stat-val">{subs.length}</div></div>
            <div className="stat-card"><div className="stat-label">Ce mois</div><div className="stat-val" style={{ color: '#16a34a' }}>+{subs.filter(s => new Date(s.created_at).getMonth() === new Date().getMonth()).length}</div></div>
          </div>
          <div className="table-card">
            <div className="table-head" style={{ gridTemplateColumns: '2fr 1fr 50px' }}>
              {['Email', 'Date', ''].map((h, i) => <span key={i} className="th">{h}</span>)}
            </div>
            {loading ? <div className="empty-state">Chargement...</div>
              : subs.length === 0 ? <div className="empty-state">Aucun abonné.</div>
              : subs.map(s => (
                <div key={s.id} className="table-row" style={{ gridTemplateColumns: '2fr 1fr 50px' }}>
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.prenom} {s.nom} {s.entreprise ? `· ${s.entreprise}` : ''}</div>
                  </div>
                  <span className="td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{new Date(s.created_at).toLocaleDateString('fr-FR')}</span>
                  <button className="btn" style={{ fontSize: 10, padding: '3px 6px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => setDeleteTarget(s)}>✕</button>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Retirer l'abonné"
        message={`Confirmez-vous la suppression de "${deleteTarget?.email}" de la newsletter ?`}
        confirmLabel="Retirer"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </Layout>
  )
}
