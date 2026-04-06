import { useState, useEffect, useRef } from 'react'
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
  const [uploading, setUploading] = useState(false)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const fileInputRef = useRef()
  const { toast, showToast } = useToast()
  const admin = isAdmin(user)

  const load = async () => {
    setLoading(true)
    if (admin) {
      const { data } = await supabase.from('library_requests').select('*').order('created_at', { ascending: false })
      setRequests(data || [])
      const { data: docs } = await supabase.storage.from('platform-files').list('library/', { limit: 100 })
      setLibraryDocs((docs || []).filter(f => f.id && f.name !== '.keep'))
    } else {
      const { data } = await supabase.from('library_requests').select('*').eq('email', user?.email).maybeSingle()
      setMyRequest(data || null)
      if (data?.access_granted) {
        const { data: docs } = await supabase.storage.from('platform-files').list('library/', { limit: 100 })
        setLibraryDocs((docs || []).filter(f => f.id && f.name !== '.keep'))
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
    const { error } = await supabase.from('library_requests').update({ access_granted: true, rejected: false, reject_reason: null }).eq('id', id)
    if (error) showToast(error.message, 'error')
    else { showToast('Accès accordé ✓'); load() }
  }

  const confirmReject = async () => {
    const { error } = await supabase.from('library_requests').update({ access_granted: false, rejected: true, reject_reason: rejectReason || 'Demande non retenue' }).eq('id', rejectTarget.id)
    if (error) showToast(error.message, 'error')
    else { showToast('Demande refusée'); setRejectTarget(null); setRejectReason(''); load() }
  }

  const handleUploadDocs = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const path = `library/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from('platform-files').upload(path, file)
      if (error) showToast(`Erreur: ${file.name}`, 'error')
    }
    showToast(`${files.length} document(s) ajouté(s)`)
    load(); setUploading(false); e.target.value = ''
  }

  const deleteDoc = async (name) => {
    const { error } = await supabase.storage.from('platform-files').remove([`library/${name}`])
    if (error) showToast(error.message, 'error')
    else { showToast('Document supprimé'); load() }
  }

  const downloadDoc = async (name) => {
    const { data, error } = await supabase.storage.from('platform-files').download(`library/${name}`)
    if (error) { showToast(error.message, 'error'); return }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(data)
    a.download = name.replace(/^\d+_/, '')
    a.click()
  }

  // ===== VUE ADMIN =====
  if (admin) return (
    <Layout user={user}>
      <div className="page-header">
        <div>
          <div className="page-title">Motul Library</div>
          <div className="page-sub">Gestion des accès · Documents · Notifications → f.hadjnassar@ma.motul.com · M.FilaliAnsary@ma.motul.com</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Upload...' : '⬆ Ajouter documents'}
          </button>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUploadDocs} />
          <button className="btn btn-primary" onClick={() => {
            const rows = ['Nom,Prénom,Email,Entreprise,Poste,Statut,Date', ...requests.map(r => `${r.nom},${r.prenom},${r.email},${r.entreprise},${r.poste},${r.access_granted ? 'Accordé' : r.rejected ? 'Refusé' : 'En attente'},${new Date(r.created_at).toLocaleDateString('fr-FR')}`)].join('\n')
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' })); a.download = 'library.csv'; a.click()
          }}>Export CSV ↓</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-label">Total demandes</div><div className="stat-val">{requests.length}</div></div>
        <div className="stat-card"><div className="stat-label">Accordés</div><div className="stat-val" style={{ color: '#16a34a' }}>{requests.filter(r => r.access_granted).length}</div></div>
        <div className="stat-card"><div className="stat-label">En attente</div><div className="stat-val" style={{ color: '#D97706' }}>{requests.filter(r => !r.access_granted && !r.rejected).length}</div></div>
        <div className="stat-card"><div className="stat-label">Documents</div><div className="stat-val" style={{ color: '#2A5FA8' }}>{libraryDocs.length}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div className="section-title">Demandes d'accès</div>
          <div className="table-card">
            <div className="table-head" style={{ gridTemplateColumns: '2fr 1fr 120px' }}>
              {['Demandeur', 'Date', 'Action'].map(h => <span key={h} className="th">{h}</span>)}
            </div>
            {loading ? <div className="empty-state">Chargement...</div>
              : requests.length === 0 ? <div className="empty-state">Aucune demande.</div>
              : requests.map(r => (
                <div key={r.id} className="table-row" style={{ gridTemplateColumns: '2fr 1fr 120px' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{r.nom} {r.prenom}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{r.email}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{r.entreprise} · {r.poste}</div>
                    {r.rejected && r.reject_reason && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 2 }}>Refusé : {r.reject_reason}</div>}
                  </div>
                  <span className="td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {r.access_granted
                      ? <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', borderRadius: 8, padding: '2px 8px', fontFamily: 'monospace' }}>✓ Accordé</span>
                      : r.rejected
                        ? <button className="btn" style={{ fontSize: 10, padding: '2px 7px' }} onClick={() => grantAccess(r.id)}>Reconsidérer</button>
                        : <>
                            <button className="btn btn-success" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => grantAccess(r.id)}>✓ Accorder</button>
                            <button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => { setRejectTarget(r); setRejectReason('') }}>✕</button>
                          </>
                    }
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        <div>
          <div className="section-title">Documents de la Library</div>
          {libraryDocs.length === 0
            ? <div className="empty-state" style={{ padding: 28, background: '#f9fafb', borderRadius: 12, border: '0.5px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>Aucun document. Uploadez des fichiers pour les rendre accessibles aux partenaires.</div>
              </div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {libraryDocs.map(f => (
                  <div key={f.name} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>📄</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name.replace(/^\d+_/, '')}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{f.name.split('.').pop().toUpperCase()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button className="btn" style={{ width: 26, height: 26, padding: 0, fontSize: 12 }} onClick={() => downloadDoc(f.name)}>↓</button>
                      <button className="btn" style={{ width: 26, height: 26, padding: 0, fontSize: 12, color: '#dc2626' }} onClick={() => deleteDoc(f.name)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Refuser la demande</div>
            <div className="modal-sub">{rejectTarget.nom} {rejectTarget.prenom} — {rejectTarget.email}</div>
            <label className="form-label">Motif du refus</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Expliquez la raison du refus (optionnel)..." rows={3} style={{ marginBottom: 4 }} />
            <div className="modal-footer">
              <button className="btn" onClick={() => setRejectTarget(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={confirmReject}>Refuser la demande</button>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </Layout>
  )

  // ===== VUE PARTENAIRE — ACCORDÉ =====
  if (myRequest?.access_granted) return (
    <Layout user={user}>
      <div className="page-header">
        <div><div className="page-title">Motul Library</div><div className="page-sub">Ressources et documents Motul Africa</div></div>
      </div>
      <div style={{ background: '#f0fdf4', border: '0.5px solid #86efac', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 20 }}>✅</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#166534' }}>Vous avez accès à la Motul Library</div>
          <div style={{ fontSize: 12, color: '#16a34a' }}>Cliquez sur un document pour le télécharger</div>
        </div>
      </div>
      {loading ? <div className="empty-state">Chargement...</div>
        : libraryDocs.length === 0
          ? <div className="empty-state"><div className="empty-state-icon">📚</div>Aucun document disponible pour le moment.</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
              {libraryDocs.map(f => (
                <div key={f.name} className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'border-color .15s' }}
                  onClick={() => downloadDoc(f.name)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#CC2200'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                  <span style={{ fontSize: 26, flexShrink: 0 }}>📄</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name.replace(/^\d+_/, '')}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Télécharger ↓</div>
                  </div>
                </div>
              ))}
            </div>
      }
      <Toast toast={toast} />
    </Layout>
  )

  // ===== VUE PARTENAIRE — REFUSÉ =====
  if (myRequest?.rejected) return (
    <Layout user={user}>
      <div className="page-header"><div><div className="page-title">Motul Library</div></div></div>
      <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Demande refusée</div>
        {myRequest.reject_reason && <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, padding: '10px 16px', background: '#fee2e2', borderRadius: 8 }}>Motif : {myRequest.reject_reason}</div>}
        <div style={{ fontSize: 13, color: '#6b7280' }}>Pour plus d'informations, contactez votre responsable Motul Africa.</div>
      </div>
      <Toast toast={toast} />
    </Layout>
  )

  // ===== VUE PARTENAIRE — EN ATTENTE =====
  if (myRequest && !myRequest.access_granted && !myRequest.rejected) return (
    <Layout user={user}>
      <div className="page-header"><div><div className="page-title">Motul Library</div></div></div>
      <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Demande en cours de traitement</div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>Votre demande a bien été reçue. Vous serez notifié une fois l'accès accordé.</div>
      </div>
      <Toast toast={toast} />
    </Layout>
  )

  // ===== VUE PARTENAIRE — FORMULAIRE =====
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
