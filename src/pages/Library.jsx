import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useToast, Toast } from '../lib/useToast'
import { supabase } from '../lib/supabase'

const EMPTY_FORM = { nom: '', prenom: '', email: '', entreprise: '', poste: '' }

export default function Library() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const { toast, showToast } = useToast()

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('library_requests').select('*').order('created_at', { ascending: false })
    if (error) showToast(error.message, 'error')
    else setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('library_requests').insert(form)
    if (error) showToast(error.message, 'error')
    else setSubmitted(true)
    setSubmitting(false)
  }

  const grantAccess = async (id) => {
    const { error } = await supabase.from('library_requests').update({ access_granted: true }).eq('id', id)
    if (error) showToast(error.message, 'error')
    else { showToast('Accès accordé'); load() }
  }

  const exportCSV = () => {
    const rows = ['Nom,Prénom,Email,Entreprise,Poste,Accès,Date', ...requests.map(r => `${r.nom},${r.prenom},${r.email},${r.entreprise},${r.poste},${r.access_granted ? 'Oui' : 'Non'},${new Date(r.created_at).toLocaleDateString('fr-FR')}`)].join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'library_requests.csv'; a.click()
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">Motul Library</div>
          <div className="page-sub">Notifications → f.hadjnassar@ma.motul.com · M.FilaliAnsary@ma.motul.com</div>
        </div>
        <button className="btn btn-primary" onClick={exportCSV}>Export CSV ↓</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Formulaire demande d'accès</div>
          {submitted ? (
            <div className="alert-success">
              <div className="alert-success-icon">✓</div>
              <div className="alert-success-txt">Votre demande a été transmise avec succès. Vous recevrez un email d'invitation dans les plus brefs délais (pensez à vérifier également vos courriels indésirables).</div>
            </div>
          ) : (
            <div className="card card-pad">
              <div onClick={() => showToast('Téléchargement guide PDF...')} style={{ background: '#FFF0ED', border: '0.5px solid #FECACA', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }}>
                <div style={{ width: 28, height: 28, background: '#CC2200', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, flexShrink: 0 }}>↓</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#A01A00' }}>Guide d'accès à la Motul Library</div>
                  <div style={{ fontSize: 10, color: '#CC2200', opacity: .7, fontFamily: 'monospace' }}>Pensez à télécharger le guide · PDF</div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>Pour obtenir l'accès à la Motul Library, complétez les champs suivants :</p>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label className="form-label">Nom <span className="form-req">*</span></label><input required value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} /></div>
                  <div><label className="form-label">Prénom <span className="form-req">*</span></label><input required value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} /></div>
                  <div style={{ gridColumn: '1/-1' }}><label className="form-label">Email professionnel <span className="form-req">*</span></label><input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div><label className="form-label">Entreprise <span className="form-req">*</span></label><input required value={form.entreprise} onChange={e => setForm(p => ({ ...p, entreprise: e.target.value }))} /></div>
                  <div><label className="form-label">Poste <span className="form-req">*</span></label><input required value={form.poste} onChange={e => setForm(p => ({ ...p, poste: e.target.value }))} /></div>
                </div>
                <p style={{ fontSize: 11, color: '#9ca3af', margin: '12px 0 4px' }}>Vous avez déjà un accès ?</p>
                <a href="#" style={{ fontSize: 11, color: '#CC2200' }} onClick={e => e.preventDefault()}>Se connecter à la Motul Library</a>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Envoi...' : 'Envoyer la demande'}</button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Demandes reçues — Back-office</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
            <div className="stat-card"><div className="stat-label">Total</div><div className="stat-val">{requests.length}</div></div>
            <div className="stat-card"><div className="stat-label">Accordés</div><div className="stat-val" style={{ color: '#16a34a' }}>{requests.filter(r => r.access_granted).length}</div></div>
            <div className="stat-card"><div className="stat-label">En attente</div><div className="stat-val" style={{ color: '#D97706' }}>{requests.filter(r => !r.access_granted).length}</div></div>
          </div>
          <div className="table-card">
            <div className="table-head" style={{ gridTemplateColumns: '2fr 1fr 80px' }}>
              {['Demandeur', 'Date', 'Statut'].map(h => <span key={h} className="th">{h}</span>)}
            </div>
            {loading ? <div className="empty-state">Chargement...</div>
              : requests.length === 0 ? <div className="empty-state">Aucune demande reçue.</div>
              : requests.map(r => (
                <div key={r.id} className="table-row" style={{ gridTemplateColumns: '2fr 1fr 80px' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{r.nom} {r.prenom}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{r.email}</div>
                  </div>
                  <span className="td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                  {r.access_granted
                    ? <span style={{ fontSize: 10, fontWeight: 500, background: '#dcfce7', color: '#166534', borderRadius: 10, padding: '2px 8px', fontFamily: 'monospace' }}>✓ Accordé</span>
                    : <button className="btn btn-primary" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => grantAccess(r.id)}>Accorder</button>
                  }
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <Toast toast={toast} />
    </Layout>
  )
}
