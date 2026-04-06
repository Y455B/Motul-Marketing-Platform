import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast, Toast } from '../lib/useToast'
import { supabase } from '../lib/supabase'

const BUCKET = 'platform-files'

const EXT_COLORS = {
  pdf: { bg: '#FDECEA', color: '#CC2200' },
  mp4: { bg: '#E8F5E9', color: '#2E7D32' },
  mov: { bg: '#E8F5E9', color: '#2E7D32' },
  zip: { bg: '#F3E5F5', color: '#6A1B9A' },
  ai: { bg: '#FFF3E0', color: '#E65100' },
  psd: { bg: '#FFF3E0', color: '#E65100' },
  xlsx: { bg: '#E8F5E0', color: '#2E6B1C' },
  csv: { bg: '#E8F5E0', color: '#2E6B1C' },
  png: { bg: '#E8F0FE', color: '#1A56C4' },
  jpg: { bg: '#E8F0FE', color: '#1A56C4' },
  jpeg: { bg: '#E8F0FE', color: '#1A56C4' },
  pptx: { bg: '#FEF3C7', color: '#92400E' },
  docx: { bg: '#E8F0FE', color: '#1A56C4' },
}

export default function Hub() {
  const [folders, setFolders] = useState([])
  const [activeFolder, setActiveFolder] = useState(null)
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showShare, setShowShare] = useState(null)
  const [shareUrl, setShareUrl] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const fileInputRef = useRef()
  const { toast, showToast } = useToast()

  const loadFolders = async () => {
    const { data } = await supabase.storage.from(BUCKET).list('', { limit: 100 })
    if (data) setFolders(data.filter(f => !f.id))
  }

  const loadFiles = async (folder) => {
    setLoading(true)
    const path = folder ? folder + '/' : ''
    const { data, error } = await supabase.storage.from(BUCKET).list(path, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
    if (error) showToast(error.message, 'error')
    else setFiles((data || []).filter(f => f.id))
    setLoading(false)
  }

  useEffect(() => {
    loadFolders()
  }, [])

  useEffect(() => {
    if (activeFolder !== null) loadFiles(activeFolder)
    else setFiles([])
  }, [activeFolder])

  const handleUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files)
    if (!selectedFiles.length) return
    if (!activeFolder) { showToast('Sélectionnez d\'abord un dossier', 'error'); return }
    setUploading(true)
    for (const file of selectedFiles) {
      const path = `${activeFolder}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file)
      if (error) showToast(`Erreur: ${file.name}`, 'error')
    }
    showToast(`${selectedFiles.length} fichier(s) uploadé(s)`)
    loadFiles(activeFolder)
    setUploading(false)
    e.target.value = ''
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    const path = `${newFolderName.trim()}/.keep`
    const { error } = await supabase.storage.from(BUCKET).upload(path, new Blob(['']))
    if (error) showToast(error.message, 'error')
    else { showToast('Dossier créé'); setNewFolderName(''); setShowNewFolder(false); loadFolders() }
  }

  const getShareLink = async (file) => {
    const path = `${activeFolder}/${file.name}`
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 604800)
    if (error) showToast(error.message, 'error')
    else { setShareUrl(data.signedUrl); setShowShare(file) }
  }

  const downloadFile = async (file) => {
    const path = `${activeFolder}/${file.name}`
    const { data, error } = await supabase.storage.from(BUCKET).download(path)
    if (error) { showToast(error.message, 'error'); return }
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url; a.download = file.name; a.click()
    URL.revokeObjectURL(url)
  }

  const confirmDelete = async () => {
    const path = `${activeFolder}/${deleteTarget.name}`
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) showToast(error.message, 'error')
    else { showToast('Fichier supprimé'); loadFiles(activeFolder) }
    setDeleteTarget(null)
  }

  const getExt = (name) => name.split('.').pop().toLowerCase()
  const getColor = (name) => EXT_COLORS[getExt(name)] || { bg: '#f3f4f6', color: '#6b7280' }
  const formatSize = (bytes) => bytes < 1024*1024 ? `${Math.round(bytes/1024)} Ko` : `${(bytes/1024/1024).toFixed(1)} Mo`

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">Hub Fichiers</div>
          <div className="page-sub">Assets et documents Motul Africa · Supabase Storage</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setShowNewFolder(true)}>+ Dossier</button>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={!activeFolder || uploading}>
            {uploading ? 'Upload...' : '⬆ Upload'}
          </button>
          <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
        </div>
      </div>

      {showNewFolder && (
        <div className="card card-pad" style={{ marginBottom: 16, maxWidth: 400 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Nouveau dossier</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Nom du dossier" onKeyDown={e => e.key === 'Enter' && createFolder()} />
            <button className="btn btn-primary" onClick={createFolder}>Créer</button>
            <button className="btn" onClick={() => setShowNewFolder(false)}>✕</button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Dossiers</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 10, marginBottom: 20 }}>
        {folders.length === 0 && <div style={{ fontSize: 12, color: '#9ca3af', gridColumn: '1/-1' }}>Aucun dossier. Créez-en un.</div>}
        {folders.map(f => (
          <div key={f.name} onClick={() => setActiveFolder(activeFolder === f.name ? null : f.name)} className="card" style={{ padding: 14, cursor: 'pointer', borderColor: activeFolder === f.name ? '#CC2200' : '', background: activeFolder === f.name ? '#FFF0ED' : '' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>📁</div>
            <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
          </div>
        ))}
      </div>

      {activeFolder && (
        <>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Fichiers — {activeFolder}</div>
          <div className="table-card">
            <div className="table-head" style={{ gridTemplateColumns: '2fr 70px 80px 80px' }}>
              {['Nom', 'Type', 'Taille', 'Actions'].map(h => <span key={h} className="th">{h}</span>)}
            </div>
            {loading ? <div className="empty-state">Chargement...</div>
              : files.length === 0 ? <div className="empty-state">Aucun fichier. Uploadez des fichiers dans ce dossier.</div>
              : files.map(f => {
                const tc = getColor(f.name)
                return (
                  <div key={f.name} className="table-row" style={{ gridTemplateColumns: '2fr 70px 80px 80px' }}>
                    <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name.replace(/^\d+_/, '')}
                    </span>
                    <span style={{ display: 'inline-flex', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: 'monospace', background: tc.bg, color: tc.color }}>
                      {getExt(f.name).toUpperCase()}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{f.metadata?.size ? formatSize(f.metadata.size) : '—'}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn" style={{ width: 26, height: 26, padding: 0, fontSize: 12 }} onClick={() => getShareLink(f)} title="Lien">⊹</button>
                      <button className="btn" style={{ width: 26, height: 26, padding: 0, fontSize: 12 }} onClick={() => downloadFile(f)} title="Télécharger">↓</button>
                      <button className="btn" style={{ width: 26, height: 26, padding: 0, fontSize: 12, color: '#dc2626' }} onClick={() => setDeleteTarget(f)} title="Supprimer">✕</button>
                    </div>
                  </div>
                )
              })
            }
          </div>
        </>
      )}

      {showShare && (
        <div className="modal-overlay" onClick={() => setShowShare(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Lien de partage</div>
            <div className="modal-sub">Valable 7 jours · lecture seule</div>
            <div style={{ background: '#f9fafb', border: '0.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 11, fontFamily: 'monospace', color: '#6b7280', wordBreak: 'break-all', marginBottom: 4 }}>{shareUrl}</div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowShare(null)}>Fermer</button>
              <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(shareUrl); showToast('Lien copié !'); setShowShare(null) }}>Copier le lien</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Supprimer le fichier"
        message={`Confirmez-vous la suppression de "${deleteTarget?.name.replace(/^\d+_/, '')}" ?`}
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </Layout>
  )
}
