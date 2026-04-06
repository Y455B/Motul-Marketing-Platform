import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { useToast, Toast } from '../lib/useToast.jsx'
import { supabase, isAdmin } from '../lib/supabase'

const EMPTY_FORM = { nom: '', prenom: '', email: '', entreprise: '', poste: '' }

export default function Library({ user }) {
  const [requests, setRequests] = useState([])
  const [myRequest, setMyRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [libraryDocs, setLibraryDocs] = useState([])
  const { toast, showToast } = useToast()
  const admin = isAdmin(user)

  const load = async () => {
    setLoading(true)
    if (admin) {
      const { data } = await supabase.from('library_requests').select('*').order('created_at', { ascending: false })
      setRequests(data || [])
    } else {
      const { data } = await supabase.from('library_requests').select('*').eq('email', user?.email).single()
      setMyRequest(data || null)
      if (data?.access_granted) {
        const { data: docs } = await supabase.storage.from('platform-files').list('library/', { limit: 100 })
        setLibraryDocs((docs || []).filter(f => f.id))
      }
    }
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user, admin])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('library_requests').insert({ ...form, email: user?.email || form.email })
    if (error) showToast(error.message, 'error')
    else { setSubmitted(true); load() }
    setSubmitting(false)
  }

  const grantAccess = async (id) => {
    const { error } = await supabase.from('library_requests').update({ access_granted: true }).eq('id', id)
    if (error) showToast(error.message, 'error')
    else { showToast('Accès accordé'); load() }
  }

  const revokeAccess = async (id) => {
    const { error } = await supabase.from('library_requests').update({ access_granted: false }).eq('id', id)
    if (error) showToast(error.message, 'error')
    else { showToast('Accès révoqué'); load() }
  }

  const exportCSV = () => {
    const rows = ['Nom,Prénom,Email,Entreprise,Poste,Accès,Date', ...requests.map(r => `${r.nom},${r.prenom},${r.email},${r.entreprise},${r.poste},${r.access_granted ? 'Oui' : 'Non'},${new Date(r.created_at).toLocaleDateString('fr-FR')}`)].join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'library_requests.csv'; a.click()
  }

  const downloadDoc = async (name) => {
    const { data, error } = await supabase.storage.from('platform-files').download(`library/${name}`)
    if (error) { showToast(error.message, 'error'); return }
    const a = document.createElement('a'); a.href = URL.createObjectURL(data); a.download = name; a.click()
  }

  // VUE ADMIN
  if (admin) return (
    <Layout user={user}>
      <div className="page-header">
        <div>
          <div className="page-title">Motul Library</div>
          <div className="page-sub">Gestion des accès · Notifications → f.hadjnassar@ma.motul.com · M.FilaliAnsary@ma.motul.com</div>
        </div>
        <button className="btn btn-primary" onClick={exportCSV}>Export CSV ↓</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">Total demandes</div><div className="stat-val">{requests.length}</div></div>
        <div className="stat-card"><div className="stat-label">Accès accordés</div><div className="stat-val" style={{ color: '#16a34a' }}>{requests.filter(r => r.access_granted).length}</div></div>
        <div className="stat-card"><div className="stat-label">En attente</div><div className="stat-val" style={{ color: '#D97706' }}>{requests.filter(r => !r.access_granted).length}</div></div>
      </div>

      <div className="table-card">
        <div className="table-head" style={{ gridTemplateColumns: '2fr 1fr 1fr 100px' }}>
          {['Demandeur', 'Entreprise', 'Date', 'Accès'].map(h => <span key={h} className="th">{h}</span>)}
        </div>
        {loading ? <div className="empty-state">Chargement...</div>
          : requests.length === 0 ? <div className="empty-state">Aucune demande reçue.</div>
          : requests.map(r => (
            <div key={r.id} className="table-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 100px' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{r.nom} {r.prenom}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{r.email}</div>
              </div>
              <span className="td">{r.entreprise}</span>
              <span className="td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
              <div>
                {r.access_granted
                  ? <button className="btn" style={{ fontSize: 10, padding: '3px 8px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => revokeAccess(r.id)}>Révoquer</button>
                  : <button className="btn btn-primary" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => grantAccess(r.id)}>Accorder</button>
                }
              </div>
            </div>
          ))
        }
      </div>
      <Toast toast={toast} />
    </Layout>
  )

  // VUE PARTENAIRE — ACCÈS ACCORDÉ
  if (myRequest?.access_granted) return (
    <Layout user={user}>
      <div className="page-header">
        <div>
          <div className="page-title">Motul Library</div>
          <div className="page-sub">Ressources et documents Motul Africa</div>
        </div>
      </div>
      <div style={{ background: '#f0fdf4', border: '0.5px solid #86efac', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#166534' }}>Vous avez accès à la Motul Library</div>
          <div style={{ fontSize: 12, color: '#16a34a' }}>Retrouvez ci-dessous l'ensemble des ressources disponibles</div>
        </div>
      </div>
      {libraryDocs.length === 0
        ? <div className="empty-state"><div className="empty-state-icon">📚</div>Aucun document disponible pour le moment.</div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 10 }}>
            {libraryDocs.map(f => (
              <div key={f.name} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => downloadDoc(f.name)}>
                <span style={{ fontSize: 24 }}>📄</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Cliquer pour télécharger</div>
                </div>
              </div>
            ))}
          </div>
        )
      }
      <Toast toast={toast} />
    </Layout>
  )

  // VUE PARTENAIRE — EN ATTENTE
  if (myRequest && !myRequest.access_granted) return (
    <Layout user={user}>
      <div className="page-header">
        <div><div className="page-title">Motul Library</div></div>
      </div>
      <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Demande en cours de traitement</div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>Votre demande d'accès a bien été reçue. Vous recevrez une notification une fois l'accès accordé.</div>
      </div>
      <Toast toast={toast} />
    </Layout>
  )

  // VUE PARTENAIRE — FORMULAIRE
  return (
    <Layout user={user}>
      <div className="page-header">
        <div><div className="page-title">Motul Library</div><div className="page-sub">Demandez l'accès aux ressources Motul</div></div>
      </div>

      {submitted ? (
        <div className="alert-success" style={{ maxWidth: 560 }}>
          <div className="alert-success-icon">✓</div>
          <div className="alert-success-txt">Votre demande a été transmise avec succès. Vous recevrez un email d'invitation dans les plus brefs délais (pensez à vérifier vos courriels indésirables).</div>
        </div>
      ) : (
        <div className="card card-pad" style={{ maxWidth: 560 }}>
          <div onClick={() => showToast('Téléchargement du guide...')} style={{ background: '#FFF0ED', border: '0.5px solid #FECACA', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, background: '#CC2200', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, flexShrink: 0 }}>↓</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#A01A00' }}>Guide d'accès à la Motul Library</div>
              <div style={{ fontSize: 11, color: '#CC2200', opacity: .7, fontFamily: 'monospace' }}>Pensez à télécharger le guide · PDF</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Pour obtenir l'accès à la Motul Library, complétez les champs suivants :</p>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div><label className="form-label">Nom <span className="form-req">*</span></label><input required value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} /></div>
              <div><label className="form-label">Prénom <span className="form-req">*</span></label><input required value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} /></div>
              <div className="form-full"><label className="form-label">Email professionnel <span className="form-req">*</span></label><input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder={user?.email} /></div>
              <div><label className="form-label">Entreprise <span className="form-req">*</span></label><input required value={form.entreprise} onChange={e => setForm(p => ({ ...p, entreprise: e.target.value }))} /></div>
              <div><label className="form-label">Poste <span className="form-req">*</span></label><input required value={form.poste} onChange={e => setForm(p => ({ ...p, poste: e.target.value }))} /></div>
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 16, marginBottom: 4 }}>Vous avez déjà un accès ?</p>
            <a href="#" style={{ fontSize: 12, color: '#CC2200' }} onClick={e => e.preventDefault()}>Se connecter directement à la Motul Library</a>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Envoi...' : 'Envoyer la demande'}</button>
            </div>
          </form>
        </div>
      )}
      <Toast toast={toast} />
    </Layout>
  )
}
