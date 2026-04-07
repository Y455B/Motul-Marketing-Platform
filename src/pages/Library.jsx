import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { useToast, Toast } from '../lib/useToast.jsx'
import { supabase, isAdmin, createNotification } from '../lib/supabase'

const EMPTY_FORM = { nom: '', prenom: '', email: '', entreprise: '', poste: '' }
const BUCKET = 'platform-files'
const BASE = 'library'
const IMG_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp']
const PDF_EXTS = ['pdf']
const EXT_ICONS = {
  pdf: '📄', docx: '📝', doc: '📝', xlsx: '📊', xls: '📊',
  pptx: '📑', ppt: '📑', png: '🖼️', jpg: '🖼️', jpeg: '🖼️',
  mp4: '🎬', zip: '🗜️', ai: '🎨', psd: '🎨'
}

export default function Library({ user }) {
  const [requests, setRequests] = useState([])
  const [myRequest, setMyRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [folders, setFolders] = useState([])
  const [activeFolder, setActiveFolder] = useState(null)
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const [newFolder, setNewFolder] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [preview, setPreview] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const fileInputRef = useRef()
  const { toast, showToast } = useToast()
  const admin = isAdmin(user)

  const getExt = (name) => name.split('.').pop().toLowerCase()
  const getIcon = (name) => EXT_ICONS[getExt(name)] || '📎'

  // Chemin storage : library/ ou library/NomDossier/
  const storagePath = (folder) => folder ? `${BASE}/${folder}` : BASE

  const loadFolders = async () => {
    const { data, error } = await supabase.storage.from(BUCKET).list(BASE, { limit: 100 })
    if (error) { console.error('loadFolders error:', error); return }
    // Dossiers = items sans id (pas de métadonnées de fichier)
    setFolders((data || []).filter(f => !f.id && f.name !== '.emptyFolderPlaceholder'))
  }

  const loadDocs = async (folder) => {
    const path = storagePath(folder)
    const { data, error } = await supabase.storage.from(BUCKET).list(path, {
      limit: 200,
      sortBy: { column: 'created_at', order: 'desc' }
    })
    if (error) { console.error('loadDocs error:', error); return }
    // Fichiers uniquement (avec id), on exclut .keep
    setDocs((data || []).filter(f => f.id && f.name !== '.keep'))
  }

  const load = async () => {
    setLoading(true)
    if (admin) {
      const { data } = await supabase.from('library_requests').select('*').order('created_at', { ascending: false })
      setRequests(data || [])
      await loadFolders()
      if (activeFolder !== null) await loadDocs(activeFolder)
    } else {
      const { data } = await supabase.from('library_requests').select('*').eq('email', user?.email).maybeSingle()
      setMyRequest(data || null)
      if (data?.access_granted) {
        await loadFolders()
        if (activeFolder !== null) await loadDocs(activeFolder)
      }
    }
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user, admin])

  useEffect(() => {
    if (activeFolder !== null) loadDocs(activeFolder)
    else setDocs([])
  }, [activeFolder])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('library_requests').insert({ ...form, email: user?.email || form.email })
    if (error) showToast(error.message, 'error')
    else { setSubmitted(true); load() }
    setSubmitting(false)
  }

  const grantAccess = async (r) => {
    const { error } = await supabase.from('library_requests').update({ access_granted: true, rejected: false, reject_reason: null }).eq('id', r.id)
    if (error) { showToast(error.message, 'error'); return }
    if (r.user_id) await createNotification(r.user_id, 'LIBRARY_ACCORDÉ', 'Votre accès à la Motul Library a été accordé.')
    showToast('Accès accordé ✓'); load()
  }

  const confirmReject = async () => {
    const { error } = await supabase.from('library_requests').update({
      access_granted: false, rejected: true,
      reject_reason: rejectReason || 'Demande non retenue'
    }).eq('id', rejectTarget.id)
    if (error) { showToast(error.message, 'error'); return }
    if (rejectTarget.user_id) await createNotification(rejectTarget.user_id, 'LIBRARY_REFUSÉ', `Votre demande d'accès a été refusée. Motif : ${rejectReason || 'Demande non retenue'}`)
    showToast('Demande refusée'); setRejectTarget(null); setRejectReason(''); load()
  }

  const createFolder = async () => {
    if (!newFolder.trim()) return
    // Créer un fichier .keep dans le sous-dossier pour matérialiser le dossier
    const path = `${BASE}/${newFolder.trim()}/.keep`
    const { error } = await supabase.storage.from(BUCKET).upload(path, new Blob(['']), { upsert: true })
    if (error) { showToast(error.message, 'error'); return }
    showToast('Dossier créé')
    setNewFolder(''); setShowNewFolder(false)
    await loadFolders()
    // Sélectionner automatiquement le dossier créé
    setActiveFolder(newFolder.trim())
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    if (activeFolder === null) { showToast('Sélectionnez un dossier avant d\'uploader', 'error'); return }
    setUploading(true)
    let success = 0
    for (const file of files) {
      const filePath = `${BASE}/${activeFolder}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, { upsert: false })
      if (error) showToast(`Erreur: ${file.name} — ${error.message}`, 'error')
      else success++
    }
    if (success > 0) showToast(`${success} fichier(s) ajouté(s)`)
    await loadDocs(activeFolder)
    setUploading(false)
    e.target.value = ''
  }

  const deleteDoc = async (name) => {
    const filePath = `${BASE}/${activeFolder}/${name}`
    const { error } = await supabase.storage.from(BUCKET).remove([filePath])
    if (error) { showToast(error.message, 'error'); return }
    showToast('Document supprimé'); loadDocs(activeFolder)
  }

  const getSignedUrl = async (name) => {
    const filePath = activeFolder ? `${BASE}/${activeFolder}/${name}` : `${BASE}/${name}`
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, 3600)
    if (error) { showToast(error.message, 'error'); return null }
    return data.signedUrl
  }

  const openPreview = async (f) => {
    const ext = getExt(f.name)
    const url = await getSignedUrl(f.name)
    if (!url) return
    if (IMG_EXTS.includes(ext) || PDF_EXTS.includes(ext)) {
      setPreview({ url, name: f.name.replace(/^\d+_/, ''), type: IMG_EXTS.includes(ext) ? 'image' : 'pdf' })
    } else {
      const a = document.createElement('a'); a.href = url; a.download = f.name.replace(/^\d+_/, ''); a.click()
    }
  }

  const copyLink = async (name) => {
    const url = await getSignedUrl(name)
    if (url) { navigator.clipboard.writeText(url); showToast('Lien copié (valable 1h)') }
  }

  const PreviewModal = () => !preview ? null : (
    <div className="modal-overlay" onClick={() => setPreview(null)}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, maxWidth: '80vw', maxHeight: '85vh', overflow: 'auto', minWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{preview.name}</div>
          <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af' }}>✕</button>
        </div>
        {preview.type === 'image'
          ? <img src={preview.url} alt={preview.name} style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: 8, display: 'block' }} />
          : <iframe src={preview.url} style={{ width: '70vw', height: '65vh', border: 'none', borderRadius: 8 }} title={preview.name} />
        }
      </div>
    </div>
  )

  // ===== VUE ADMIN =====
  if (admin) return (
    <Layout user={user}>
      <div className="page-header">
        <div>
          <div className="page-title">Motul Library</div>
          <div className="page-sub">Gestion des accès · Bibliothèque de contenu</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setShowNewFolder(true)}>📁 Nouveau dossier</button>
          {activeFolder !== null && (
            <>
              <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? 'Upload...' : '⬆ Ajouter fichiers'}
              </button>
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
            </>
          )}
          <button className="btn" onClick={() => {
            const rows = ['Nom,Email,Entreprise,Statut,Date', ...requests.map(r =>
              `${r.nom} ${r.prenom},${r.email},${r.entreprise},${r.access_granted ? 'Accordé' : r.rejected ? 'Refusé' : 'En attente'},${new Date(r.created_at).toLocaleDateString('fr-FR')}`)].join('\n')
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' })); a.download = 'library.csv'; a.click()
          }}>Export CSV ↓</button>
        </div>
      </div>

      {showNewFolder && (
        <div className="card card-pad" style={{ marginBottom: 16, maxWidth: 420 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Nouveau dossier</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newFolder} onChange={e => setNewFolder(e.target.value)} placeholder="Ex: Catalogues 2025" autoFocus onKeyDown={e => e.key === 'Enter' && createFolder()} />
            <button className="btn btn-primary" onClick={createFolder}>Créer</button>
            <button className="btn" onClick={() => setShowNewFolder(false)}>✕</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Demandes */}
        <div>
          <div className="section-title">Demandes d'accès</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
            <div className="stat-card"><div className="stat-label">Total</div><div className="stat-val">{requests.length}</div></div>
            <div className="stat-card"><div className="stat-label">Accordés</div><div className="stat-val" style={{ color: '#16a34a' }}>{requests.filter(r => r.access_granted).length}</div></div>
            <div className="stat-card"><div className="stat-label">En attente</div><div className="stat-val" style={{ color: '#D97706' }}>{requests.filter(r => !r.access_granted && !r.rejected).length}</div></div>
          </div>
          <div className="table-card">
            <div className="table-head" style={{ gridTemplateColumns: '2fr 1fr 130px' }}>
              {['Demandeur', 'Date', 'Action'].map(h => <span key={h} className="th">{h}</span>)}
            </div>
            {loading ? <div className="empty-state">Chargement...</div>
              : requests.length === 0 ? <div className="empty-state">Aucune demande.</div>
              : requests.map(r => (
                <div key={r.id} className="table-row" style={{ gridTemplateColumns: '2fr 1fr 130px' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{r.nom} {r.prenom}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{r.email}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{r.entreprise}</div>
                    {r.rejected && r.reject_reason && <div style={{ fontSize: 10, color: '#dc2626' }}>↳ {r.reject_reason}</div>}
                  </div>
                  <span className="td" style={{ fontFamily: 'monospace', fontSize: 11 }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {r.access_granted
                      ? <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', borderRadius: 8, padding: '2px 8px', fontFamily: 'monospace' }}>✓ Accordé</span>
                      : r.rejected
                        ? <button className="btn" style={{ fontSize: 10, padding: '2px 7px' }} onClick={() => grantAccess(r)}>Reconsidérer</button>
                        : <>
                            <button className="btn btn-success" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => grantAccess(r)}>✓</button>
                            <button className="btn btn-danger" style={{ fontSize: 10, padding: '2px 8px' }} onClick={() => { setRejectTarget(r); setRejectReason('') }}>✕</button>
                          </>
                    }
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Bibliothèque */}
        <div>
          <div className="section-title">
            Bibliothèque
            {activeFolder !== null && <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginLeft: 8 }}>/ {activeFolder}</span>}
          </div>

          {/* Tabs dossiers */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {folders.length === 0
              ? <div style={{ fontSize: 12, color: '#9ca3af' }}>Aucun dossier — créez-en un</div>
              : folders.map(f => (
                <button key={f.name} className="btn" onClick={() => setActiveFolder(activeFolder === f.name ? null : f.name)}
                  style={activeFolder === f.name ? { background: '#FFF0ED', color: '#CC2200', borderColor: '#CC2200' } : {}}>
                  📁 {f.name}
                </button>
              ))
            }
          </div>

          {activeFolder === null
            ? <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#9ca3af', background: '#f9fafb', borderRadius: 10, border: '0.5px dashed #e5e7eb' }}>
                Sélectionnez un dossier pour voir son contenu
              </div>
            : docs.length === 0
              ? <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#9ca3af', background: '#f9fafb', borderRadius: 10, border: '0.5px dashed #e5e7eb' }}>
                  Dossier vide · Cliquez sur "Ajouter fichiers" pour uploader
                </div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {docs.map(f => (
                    <div key={f.id} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{getIcon(f.name)}</span>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name.replace(/^\d+_/, '')}</div>
                        <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{getExt(f.name).toUpperCase()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button className="btn" style={{ width: 26, height: 26, padding: 0, fontSize: 13 }} onClick={() => openPreview(f)} title="Aperçu">👁</button>
                        <button className="btn" style={{ width: 26, height: 26, padding: 0, fontSize: 13 }} onClick={() => copyLink(f.name)} title="Copier lien">🔗</button>
                        <button className="btn" style={{ width: 26, height: 26, padding: 0, fontSize: 13, color: '#dc2626' }} onClick={() => deleteDoc(f.name)} title="Supprimer">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
          }
        </div>
      </div>

      {/* Modal refus */}
      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Refuser la demande</div>
            <div className="modal-sub">{rejectTarget.nom} {rejectTarget.prenom} — {rejectTarget.email}</div>
            <label className="form-label">Motif du refus</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Motif du refus (optionnel)..." rows={3} style={{ marginBottom: 4 }} />
            <div className="modal-footer">
              <button className="btn" onClick={() => setRejectTarget(null)}>Annuler</button>
              <button className="btn btn-danger" onClick={confirmReject}>Refuser</button>
            </div>
          </div>
        </div>
      )}

      <PreviewModal />
      <Toast toast={toast} />
    </Layout>
  )

  // ===== VUE PARTENAIRE — ACCORDÉ =====
  if (myRequest?.access_granted) return (
    <Layout user={user}>
      <div className="page-header">
        <div><div className="page-title">Motul Library</div><div className="page-sub">Ressources et documents Motul Africa</div></div>
      </div>
      <div style={{ background: '#f0fdf4', border: '0.5px solid #86efac', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span>✅</span>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#166534' }}>Vous avez accès à la Motul Library</div>
      </div>

      {/* Tabs dossiers */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {folders.map(f => (
          <button key={f.name} className="btn" onClick={() => setActiveFolder(activeFolder === f.name ? null : f.name)}
            style={activeFolder === f.name ? { background: '#FFF0ED', color: '#CC2200', borderColor: '#CC2200' } : {}}>
            📁 {f.name}
          </button>
        ))}
      </div>

      {activeFolder === null
        ? <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>Sélectionnez un dossier pour voir les documents disponibles.</div>
        : loading ? <div className="empty-state">Chargement...</div>
        : docs.length === 0
          ? <div className="empty-state"><div className="empty-state-icon">📂</div>Ce dossier est vide.</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
              {docs.map(f => (
                <div key={f.id} className="card" style={{ padding: '14px 16px', cursor: 'pointer', transition: 'border-color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#CC2200'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 26 }}>{getIcon(f.name)}</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name.replace(/^\d+_/, '')}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{getExt(f.name).toUpperCase()}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-primary" style={{ flex: 1, fontSize: 11, padding: '5px', justifyContent: 'center' }} onClick={() => openPreview(f)}>
                      {IMG_EXTS.includes(getExt(f.name)) || PDF_EXTS.includes(getExt(f.name)) ? '👁 Aperçu' : '↓ Télécharger'}
                    </button>
                    <button className="btn" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => copyLink(f.name)} title="Copier lien">🔗</button>
                  </div>
                </div>
              ))}
            </div>
      }

      <PreviewModal />
      <Toast toast={toast} />
    </Layout>
  )

  // ===== REFUSÉ =====
  if (myRequest?.rejected) return (
    <Layout user={user}>
      <div className="page-header"><div><div className="page-title">Motul Library</div></div></div>
      <div style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>❌</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Demande refusée</div>
        {myRequest.reject_reason && <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, padding: '10px 16px', background: '#fee2e2', borderRadius: 8 }}>Motif : {myRequest.reject_reason}</div>}
        <div style={{ fontSize: 13, color: '#9ca3af' }}>Contactez votre responsable Motul Africa pour plus d'informations.</div>
      </div>
      <Toast toast={toast} />
    </Layout>
  )

  // ===== EN ATTENTE =====
  if (myRequest && !myRequest.access_granted && !myRequest.rejected) return (
    <Layout user={user}>
      <div className="page-header"><div><div className="page-title">Motul Library</div></div></div>
      <div style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 14 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Demande en cours de traitement</div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>Votre demande a été reçue. Vous recevrez une notification une fois l'accès accordé.</div>
      </div>
      <Toast toast={toast} />
    </Layout>
  )

  // ===== FORMULAIRE =====
  return (
    <Layout user={user}>
      <div className="page-header">
        <div><div className="page-title">Motul Library</div><div className="page-sub">Demandez l'accès aux ressources Motul</div></div>
      </div>
      {submitted ? (
        <div className="alert-success" style={{ maxWidth: 560 }}>
          <div className="alert-success-icon">✓</div>
          <div className="alert-success-txt">Votre demande a été transmise avec succès. Vous recevrez un email d'invitation dans les plus brefs délais.</div>
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
