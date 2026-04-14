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

// Sanitiser un nom : supprime les caractères interdits par Supabase Storage
const sanitize = (str) =>
  str.trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire accents
    .replace(/[^a-zA-Z0-9._\-]/g, '_') // remplace tout sauf alphanum/._- par _
    .replace(/_+/g, '_') // collapse underscores multiples
    .replace(/^_|_$/g, '') // retire _ en début/fin

export default function Library({ user }) {
  const [requests, setRequests] = useState([])
  const [myRequest, setMyRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  // Navigation : tableau de segments ex: [] = racine, ['Catalogues'] = 1 niveau, ['Catalogues', 'Motul_2025'] = 2 niveaux
  const [pathSegments, setPathSegments] = useState([])
  const [folders, setFolders] = useState([])
  const [docs, setDocs] = useState([])
  const [uploading, setUploading] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [preview, setPreview] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef()
  const { toast, showToast } = useToast()
  const admin = isAdmin(user)

  // Chemin storage courant
  const currentStoragePath = () =>
    pathSegments.length === 0 ? BASE : `${BASE}/${pathSegments.join('/')}`

  const getExt = (name) => name.split('.').pop().toLowerCase()
  const getIcon = (name) => EXT_ICONS[getExt(name)] || '📎'

  const listCurrentLevel = async () => {
    const path = currentStoragePath()
    const { data, error } = await supabase.storage.from(BUCKET).list(path, {
      limit: 200,
      sortBy: { column: 'name', order: 'asc' }
    })
    if (error) { showToast('Erreur de chargement', 'error'); return }
    const items = data || []
    // Dossiers = pas d'id (ou id null), Fichiers = ont un id
    setFolders(items.filter(f => !f.id && f.name !== '.emptyFolderPlaceholder'))
    setDocs(items.filter(f => f.id && f.name !== '.keep'))
  }

  const load = async () => {
    setLoading(true)
    if (admin) {
      const { data } = await supabase.from('library_requests').select('*').order('created_at', { ascending: false })
      setRequests(data || [])
    } else {
      const { data } = await supabase.from('library_requests').select('*').eq('email', user?.email).maybeSingle()
      setMyRequest(data || null)
    }
    await listCurrentLevel()
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user, admin])
  useEffect(() => { listCurrentLevel() }, [pathSegments])

  const navigateTo = (segments) => setPathSegments(segments)
  const goInto = (folderName) => setPathSegments(prev => [...prev, folderName])
  const goUp = () => setPathSegments(prev => prev.slice(0, -1))

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
    if (rejectTarget.user_id) await createNotification(rejectTarget.user_id, 'LIBRARY_REFUSÉ', `Votre demande a été refusée. Motif : ${rejectReason || 'Demande non retenue'}`)
    showToast('Demande refusée'); setRejectTarget(null); setRejectReason(''); load()
  }

  const createFolder = async () => {
    const clean = sanitize(newFolderName)
    if (!clean) { showToast('Nom de dossier invalide', 'error'); return }
    const path = `${currentStoragePath()}/${clean}/.keep`
    const { error } = await supabase.storage.from(BUCKET).upload(path, new Blob(['']), { upsert: true })
    if (error) { showToast(error.message, 'error'); return }
    showToast(`Dossier "${clean}" créé`)
    setNewFolderName(''); setShowNewFolder(false)
    await listCurrentLevel()
    goInto(clean)
  }

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    let success = 0
    for (const file of files) {
      const safeName = sanitize(file.name.replace(/\.[^/.]+$/, '')) + '.' + getExt(file.name)
      const filePath = `${currentStoragePath()}/${Date.now()}_${safeName}`
      const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, { upsert: false })
      if (error) showToast(`Erreur: ${file.name} — ${error.message}`, 'error')
      else success++
    }
    if (success > 0) showToast(`${success} fichier(s) ajouté(s)`)
    await listCurrentLevel()
    setUploading(false); e.target.value = ''
  }

  const deleteDoc = async (name) => {
    const { error } = await supabase.storage.from(BUCKET).remove([`${currentStoragePath()}/${name}`])
    if (error) { showToast(error.message, 'error'); return }
    showToast('Document supprimé'); listCurrentLevel()
  }


  // Supprimer un dossier et tout son contenu récursivement
  const deleteFolder = async (folderName) => {
    const folderPath = `${currentStoragePath()}/${folderName}`
    const collectAllFiles = async (path) => {
      const { data } = await supabase.storage.from(BUCKET).list(path, { limit: 500 })
      if (!data) return []
      let files = []
      for (const item of data) {
        if (item.id) {
          files.push(`${path}/${item.name}`)
        } else {
          const sub = await collectAllFiles(`${path}/${item.name}`)
          files = [...files, ...sub]
        }
      }
      return files
    }
    const allFiles = await collectAllFiles(folderPath)
    const toRemove = allFiles.length > 0 ? allFiles : []
    toRemove.push(`${folderPath}/.keep`)
    const { error } = await supabase.storage.from(BUCKET).remove(toRemove)
    if (error) { showToast(error.message, 'error'); return }
    showToast(`Dossier supprimé`)
    listCurrentLevel()
  }

  const getSignedUrl = async (name) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(`${currentStoragePath()}/${name}`, 3600)
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

  const downloadFile = async (name) => {
    const url = await getSignedUrl(name)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = name.replace(/^\d+_/, '')
    a.click()
  }

  // Filtrer dossiers et fichiers par recherche
  const filteredFolders = searchQuery
    ? folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : folders
  const filteredDocs = searchQuery
    ? docs.filter(f => f.name.replace(/^\d+_/, '').toLowerCase().includes(searchQuery.toLowerCase()))
    : docs

  // Breadcrumb (rendu inline, pas un composant)
  const breadcrumb = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginBottom: 12, flexWrap: 'wrap' }}>
      <span style={{ cursor: 'pointer', color: pathSegments.length === 0 ? '#CC2200' : '#6b7280', fontWeight: pathSegments.length === 0 ? 600 : 400 }} onClick={() => navigateTo([])}>
        📚 Motul Library
      </span>
      {pathSegments.map((seg, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#d1d5db' }}>/</span>
          <span
            style={{ cursor: i < pathSegments.length - 1 ? 'pointer' : 'default', color: i === pathSegments.length - 1 ? '#CC2200' : '#6b7280', fontWeight: i === pathSegments.length - 1 ? 600 : 400 }}
            onClick={() => i < pathSegments.length - 1 && navigateTo(pathSegments.slice(0, i + 1))}
          >{seg}</span>
        </span>
      ))}
    </div>
  )

  // Rendu du contenu dossier (fonction, pas composant React)
  const renderFolderContent = (canUpload) => (
    <div>
      {breadcrumb}
      {/* Barre de recherche + actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {pathSegments.length > 0 && (
          <button className="btn" onClick={goUp}>← Retour</button>
        )}
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher un fichier ou dossier..."
          style={{ flex: 1, minWidth: 180, maxWidth: 320 }}
        />
        {canUpload && (
          <>
            <button className="btn" onClick={() => setShowNewFolder(true)}>📁 Nouveau sous-dossier</button>
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Upload...' : '⬆ Ajouter fichiers'}
            </button>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
          </>
        )}
      </div>

      {/* Création dossier inline */}
      {showNewFolder && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="Nom du sous-dossier"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && createFolder()}
            style={{ maxWidth: 300 }}
          />
          <button className="btn btn-primary" onClick={createFolder}>Créer</button>
          <button className="btn" onClick={() => { setShowNewFolder(false); setNewFolderName('') }}>Annuler</button>
        </div>
      )}

      {/* Liste dossiers */}
      {filteredFolders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 8, marginBottom: 12 }}>
          {filteredFolders.map(f => (
            <div key={f.name} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, transition: 'border-color .15s', position: 'relative' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#CC2200'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>
              <span style={{ fontSize: 22, cursor: 'pointer' }} onClick={() => goInto(f.name)}>📁</span>
              <div style={{ flex: 1, overflow: 'hidden', cursor: 'pointer' }} onClick={() => goInto(f.name)}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>Ouvrir →</div>
              </div>
              {canUpload && (
                <button
                  className="btn"
                  style={{ width: 24, height: 24, padding: 0, fontSize: 11, color: '#dc2626', flexShrink: 0 }}
                  title="Supprimer le dossier"
                  onClick={e => { e.stopPropagation(); if (window.confirm(`Supprimer le dossier "${f.name}" et tout son contenu ?`)) deleteFolder(f.name) }}
                >✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Liste fichiers */}
      {filteredDocs.length === 0 && filteredFolders.length === 0 && (
        <div style={{ padding: 28, textAlign: 'center', fontSize: 12, color: '#9ca3af', background: '#f9fafb', borderRadius: 10, border: '0.5px dashed #e5e7eb' }}>
          {searchQuery ? 'Aucun résultat pour cette recherche.' : canUpload ? 'Dossier vide · Ajoutez des fichiers ou créez un sous-dossier' : 'Aucun document disponible dans ce dossier.'}
        </div>
      )}
      {filteredDocs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredDocs.map(f => (
            <div key={f.id || f.name} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{getIcon(f.name)}</span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name.replace(/^\d+_/, '')}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{getExt(f.name).toUpperCase()}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="btn" style={{ height: 28, padding: '0 8px', fontSize: 13 }} onClick={() => openPreview(f)} title="Aperçu">👁</button>
                <button className="btn" style={{ height: 28, padding: '0 8px', fontSize: 13 }} onClick={() => downloadFile(f.name)} title="Télécharger">⬇</button>
                <button className="btn" style={{ height: 28, padding: '0 8px', fontSize: 13 }} onClick={() => copyLink(f.name)} title="Copier lien">🔗</button>
                {canUpload && <button className="btn" style={{ height: 28, padding: '0 8px', fontSize: 13, color: '#dc2626' }} onClick={() => deleteDoc(f.name)} title="Supprimer">✕</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const PreviewModal = () => !preview ? null : (
    <div className="modal-overlay" onClick={() => setPreview(null)}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, maxWidth: '82vw', maxHeight: '88vh', overflow: 'auto', minWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{preview.name}</div>
          <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af', lineHeight: 1 }}>✕</button>
        </div>
        {preview.type === 'image'
          ? <img src={preview.url} alt={preview.name} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8, display: 'block' }} />
          : <iframe src={preview.url} style={{ width: '75vw', height: '70vh', border: 'none', borderRadius: 8 }} title={preview.name} />
        }
      </div>
    </div>
  )

  // ===== VUE ADMIN =====
  if (admin) return (
    <Layout user={user}>
      <div className="page-header">
        <div><div className="page-title">Motul Library</div><div className="page-sub">Gestion des accès · Bibliothèque de contenu</div></div>
        <button className="btn btn-primary" onClick={() => {
          const rows = ['Nom,Email,Entreprise,Statut,Date', ...requests.map(r =>
            `${r.nom} ${r.prenom},${r.email},${r.entreprise},${r.access_granted ? 'Accordé' : r.rejected ? 'Refusé' : 'En attente'},${new Date(r.created_at).toLocaleDateString('fr-FR')}`)].join('\n')
          const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' })); a.download = 'library.csv'; a.click()
        }}>Export CSV ↓</button>
      </div>

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
          <div className="section-title">Contenu de la bibliothèque</div>
          {renderFolderContent(true)}
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
      {renderFolderContent(false)}
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
          <div style={{ background: '#FFF0ED', border: '0.5px solid #FECACA', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
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
