import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import JSZip from 'jszip'
import Layout from '../components/Layout'
import { useToast, Toast } from '../lib/useToast.jsx'
import { supabase, isAdmin, createNotification } from '../lib/supabase'

const EMPTY_FORM = { nom: '', prenom: '', email: '', entreprise: '', poste: '' }
const BUCKET = 'platform-files'
const BASE = 'library'
const IMG_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp']
const PDF_EXTS = ['pdf']
const VIDEO_EXTS = ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v']
const AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']
const TEXT_EXTS = ['txt', 'md', 'csv', 'log', 'json', 'xml', 'html', 'css', 'js']
const OFFICE_EXTS = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt']
const EXT_ICONS = {
  pdf: '📄', docx: '📝', doc: '📝', xlsx: '📊', xls: '📊',
  pptx: '📑', ppt: '📑', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', webp: '🖼️', svg: '🖼️',
  mp4: '🎬', mov: '🎬', webm: '🎬', mkv: '🎬', avi: '🎬', m4v: '🎬',
  mp3: '🎵', wav: '🎵', ogg: '🎵', m4a: '🎵', aac: '🎵', flac: '🎵',
  zip: '🗜️', rar: '🗜️', '7z': '🗜️',
  ai: '🎨', psd: '🎨', fig: '🎨',
  txt: '📃', md: '📃', csv: '📊', json: '📃'
}

// Couleurs pastel pour fallback cover (déterministe par nom)
const FOLDER_COLORS = [
  ['#FEE2E2', '#DC2626'], ['#FEF3C7', '#D97706'], ['#D1FAE5', '#059669'],
  ['#DBEAFE', '#2563EB'], ['#EDE9FE', '#7C3AED'], ['#FCE7F3', '#DB2777'],
  ['#E0F2FE', '#0284C7'], ['#FFEDD5', '#EA580C']
]
const hashString = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
const getFolderColor = (name) => FOLDER_COLORS[hashString(name) % FOLDER_COLORS.length]

// Sanitiser un nom : supprime les caractères interdits par Supabase Storage
const sanitize = (str) =>
  str.trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire accents
    .replace(/[^a-zA-Z0-9._\-]/g, '_') // remplace tout sauf alphanum/._- par _
    .replace(/_+/g, '_') // collapse underscores multiples
    .replace(/^_|_$/g, '') // retire _ en début/fin

export default function Library({ user }) {
  const [searchParams] = useSearchParams()
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
  const [searchResults, setSearchResults] = useState(null) // null = pas de recherche, [] = recherche vide
  const [searching, setSearching] = useState(false)
  const [downloadingFolder, setDownloadingFolder] = useState(null)
  const [folderMetas, setFolderMetas] = useState({}) // { folderName: { coverUrl, fileCount } }
  const searchTimer = useRef(null)
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
  // Lire le query param ?path=... pour naviguer directement dans un dossier (depuis les sliders)
  useEffect(() => {
    const pathParam = searchParams.get('path')
    if (pathParam) setPathSegments(pathParam.split('/').filter(Boolean))
  }, [searchParams])
  // Recharger les métas (cover + count) chaque fois que la liste de dossiers change
  useEffect(() => {
    if (folders.length === 0) { setFolderMetas({}); return }
    loadFolderMetas(folders)
  }, [folders, pathSegments])

  // Calculer la cover image + le nombre de fichiers de chaque dossier
  const loadFolderMetas = async (list) => {
    const base = currentStoragePath()
    const metas = {}
    await Promise.all(list.map(async (f) => {
      const folderPath = `${base}/${f.name}`
      // Chercher récursivement la 1ère image + compter les fichiers
      const files = await collectAllFiles(folderPath)
      const onlyFiles = files.filter(x => x.type === 'file')
      const firstImage = onlyFiles.find(x => IMG_EXTS.includes(getExt(x.name)))
      let coverUrl = null
      if (firstImage) {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(firstImage.path, 3600)
        coverUrl = data?.signedUrl || null
      }
      metas[f.name] = { coverUrl, fileCount: onlyFiles.length }
    }))
    setFolderMetas(metas)
  }

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
    const allFiles = await collectAllFiles(folderPath)
    const toRemove = allFiles.map(f => f.path)
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
    const displayName = f.name.replace(/^\d+_/, '')
    if (IMG_EXTS.includes(ext)) setPreview({ url, name: displayName, type: 'image', ext })
    else if (PDF_EXTS.includes(ext)) setPreview({ url, name: displayName, type: 'pdf', ext })
    else if (VIDEO_EXTS.includes(ext)) setPreview({ url, name: displayName, type: 'video', ext })
    else if (AUDIO_EXTS.includes(ext)) setPreview({ url, name: displayName, type: 'audio', ext })
    else if (TEXT_EXTS.includes(ext)) setPreview({ url, name: displayName, type: 'text', ext })
    else if (OFFICE_EXTS.includes(ext)) {
      // Office docs : utiliser le viewer Office Online
      setPreview({ url, name: displayName, type: 'office', ext, viewerUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}` })
    } else {
      // Type inconnu : téléchargement direct
      const a = document.createElement('a'); a.href = url; a.download = displayName; a.click()
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

  // Télécharger un fichier par chemin complet (pour résultats de recherche)
  const downloadByPath = async (fullPath) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(fullPath, 3600)
    if (error) { showToast(error.message, 'error'); return }
    const fileName = fullPath.split('/').pop().replace(/^\d+_/, '')
    const a = document.createElement('a'); a.href = data.signedUrl; a.download = fileName; a.click()
  }

  // Collecter tous les fichiers récursivement (réutilisable)
  const collectAllFiles = async (path) => {
    const { data } = await supabase.storage.from(BUCKET).list(path, { limit: 500 })
    if (!data) return []
    let files = []
    for (const item of data) {
      if (item.id) {
        if (item.name !== '.keep') files.push({ name: item.name, path: `${path}/${item.name}`, type: 'file' })
      } else if (item.name !== '.emptyFolderPlaceholder') {
        files.push({ name: item.name, path: `${path}/${item.name}`, type: 'folder' })
        const sub = await collectAllFiles(`${path}/${item.name}`)
        files = [...files, ...sub]
      }
    }
    return files
  }

  // Recherche globale récursive avec debounce
  const runGlobalSearch = useCallback(async (query) => {
    if (!query || query.length < 2) { setSearchResults(null); setSearching(false); return }
    setSearching(true)
    const allItems = await collectAllFiles(BASE)
    const q = query.toLowerCase()
    const results = allItems.filter(f => f.name.replace(/^\d+_/, '').toLowerCase().includes(q))
    setSearchResults(results)
    setSearching(false)
  }, [])

  // Debounce la recherche (400ms après la dernière frappe)
  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!val || val.length < 2) { setSearchResults(null); setSearching(false); return }
    setSearching(true)
    searchTimer.current = setTimeout(() => runGlobalSearch(val), 400)
  }

  // Télécharger tout un dossier en ZIP
  const downloadFolderAsZip = async (folderName) => {
    setDownloadingFolder(folderName)
    const folderPath = `${currentStoragePath()}/${folderName}`
    const allFiles = await collectAllFiles(folderPath)
    if (allFiles.length === 0) { showToast('Dossier vide', 'error'); setDownloadingFolder(null); return }
    const zip = new JSZip()
    let downloaded = 0
    for (const file of allFiles) {
      const { data: urlData } = await supabase.storage.from(BUCKET).createSignedUrl(file.path, 300)
      if (!urlData?.signedUrl) continue
      const resp = await fetch(urlData.signedUrl)
      if (!resp.ok) continue
      const blob = await resp.blob()
      // Chemin relatif dans le zip (sans le préfixe storage)
      const relativePath = file.path.replace(folderPath + '/', '').replace(/^\d+_/, '')
      zip.file(relativePath, blob)
      downloaded++
    }
    if (downloaded === 0) { showToast('Impossible de télécharger les fichiers', 'error'); setDownloadingFolder(null); return }
    const content = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(content); a.download = `${folderName}.zip`; a.click()
    URL.revokeObjectURL(a.href)
    showToast(`${downloaded} fichier(s) téléchargés en ZIP`)
    setDownloadingFolder(null)
  }

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
        {pathSegments.length > 0 && !searchResults && (
          <button className="btn" onClick={goUp}>← Retour</button>
        )}
        <input
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Rechercher dans toute la bibliothèque..."
          style={{ flex: 1, minWidth: 180, maxWidth: 320 }}
        />
        {searchQuery && (
          <button className="btn" onClick={() => { setSearchQuery(''); setSearchResults(null) }} style={{ padding: '0 10px', fontSize: 13 }}>✕</button>
        )}
        {canUpload && !searchResults && (
          <>
            <button className="btn" onClick={() => setShowNewFolder(true)}>📁 Nouveau sous-dossier</button>
            <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Upload...' : '⬆ Ajouter fichiers'}
            </button>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleUpload} />
          </>
        )}
      </div>

      {/* Résultats de recherche globale */}
      {searchResults !== null ? (
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
            {searching ? 'Recherche en cours...' : `${searchResults.length} résultat(s) dans toute la bibliothèque`}
          </div>
          {searchResults.length === 0 && !searching && (
            <div style={{ padding: 28, textAlign: 'center', fontSize: 12, color: '#9ca3af', background: '#f9fafb', borderRadius: 10, border: '0.5px dashed #e5e7eb' }}>
              Aucun résultat pour "{searchQuery}".
            </div>
          )}
          {searchResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {searchResults.map(f => (
                <div key={f.path} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{f.type === 'folder' ? '📁' : getIcon(f.name)}</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name.replace(/^\d+_/, '')}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>
                      {f.path.replace(BASE + '/', '').replace('/' + f.name, '')}{f.type === 'folder' ? ' · Dossier' : ` · ${getExt(f.name).toUpperCase()}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {f.type === 'folder' ? (
                      <button className="btn" style={{ height: 28, padding: '0 10px', fontSize: 11 }} onClick={() => {
                        const segments = f.path.replace(BASE + '/', '').split('/')
                        setSearchQuery(''); setSearchResults(null); setPathSegments(segments)
                      }} title="Ouvrir le dossier">Ouvrir →</button>
                    ) : (
                      <button className="btn" style={{ height: 28, padding: '0 8px', fontSize: 13 }} onClick={() => downloadByPath(f.path)} title="Télécharger">⬇</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
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

          {/* Grille de dossiers (tuiles avec cover) */}
          {folders.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
              {folders.map(f => {
                const meta = folderMetas[f.name] || {}
                const [bgColor, accentColor] = getFolderColor(f.name)
                const initial = f.name.charAt(0).toUpperCase()
                return (
                  <div
                    key={f.name}
                    style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', background: meta.coverUrl ? '#1a1a1a' : bgColor, transition: 'transform .2s ease, box-shadow .2s ease', border: '0.5px solid #e5e7eb' }}
                    onClick={() => goInto(f.name)}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,.12)'; e.currentTarget.style.borderColor = '#CC2200' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb' }}
                  >
                    {/* Cover */}
                    {meta.coverUrl ? (
                      <img src={meta.coverUrl} alt={f.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: 80, fontFamily: "'Bebas Neue', sans-serif", color: accentColor, opacity: 0.9, lineHeight: 1 }}>{initial}</div>
                      </div>
                    )}
                    {/* Overlay dégradé */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.8) 0%, rgba(0,0,0,.2) 50%, transparent 100%)' }} />
                    {/* Badge type */}
                    <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,.95)', color: '#1a1a1a', fontSize: 10, padding: '3px 8px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 600, letterSpacing: 0.5 }}>📁 DOSSIER</div>
                    {/* Actions en haut à droite */}
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn"
                        style={{ width: 28, height: 28, padding: 0, fontSize: 12, background: 'rgba(255,255,255,.95)', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                        title="Télécharger le dossier (ZIP)"
                        disabled={downloadingFolder === f.name}
                        onClick={() => downloadFolderAsZip(f.name)}
                      >{downloadingFolder === f.name ? '⏳' : '⬇'}</button>
                      {canUpload && (
                        <button
                          className="btn"
                          style={{ width: 28, height: 28, padding: 0, fontSize: 11, background: 'rgba(255,255,255,.95)', color: '#dc2626', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                          title="Supprimer le dossier"
                          onClick={() => { if (window.confirm(`Supprimer le dossier "${f.name}" et tout son contenu ?`)) deleteFolder(f.name) }}
                        >✕</button>
                      )}
                    </div>
                    {/* Titre + compteur en bas */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px', color: '#fff' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2, textShadow: '0 1px 3px rgba(0,0,0,.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.85)', fontFamily: 'monospace', letterSpacing: 0.3 }}>
                        {meta.fileCount === undefined ? '...' : `${meta.fileCount} fichier${meta.fileCount > 1 ? 's' : ''}`}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Liste fichiers */}
          {docs.length === 0 && folders.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center', fontSize: 12, color: '#9ca3af', background: '#f9fafb', borderRadius: 10, border: '0.5px dashed #e5e7eb' }}>
              {canUpload ? 'Dossier vide · Ajoutez des fichiers ou créez un sous-dossier' : 'Aucun document disponible dans ce dossier.'}
            </div>
          )}
          {docs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {docs.map(f => (
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
        </>
      )}
    </div>
  )

  const PreviewModal = () => !preview ? null : (
    <div className="modal-overlay" onClick={() => setPreview(null)}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, maxWidth: '88vw', maxHeight: '92vh', overflow: 'auto', minWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.name}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <a className="btn" href={preview.url} download={preview.name} style={{ fontSize: 12, padding: '4px 10px', textDecoration: 'none' }}>⬇ Télécharger</a>
            <button onClick={() => setPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af', lineHeight: 1 }}>✕</button>
          </div>
        </div>
        {preview.type === 'image' && (
          <img src={preview.url} alt={preview.name} style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 8, display: 'block', margin: '0 auto' }} />
        )}
        {preview.type === 'pdf' && (
          <iframe src={preview.url} style={{ width: '80vw', height: '75vh', border: 'none', borderRadius: 8 }} title={preview.name} />
        )}
        {preview.type === 'video' && (
          <video src={preview.url} controls style={{ maxWidth: '80vw', maxHeight: '75vh', borderRadius: 8, display: 'block', background: '#000' }}>
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        )}
        {preview.type === 'audio' && (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #CC2200 0%, #A01A00 100%)', borderRadius: 8, minWidth: 500 }}>
            <div style={{ fontSize: 60, marginBottom: 20 }}>🎵</div>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>{preview.name}</div>
            <audio src={preview.url} controls autoPlay style={{ width: '100%' }}>
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        )}
        {preview.type === 'text' && (
          <iframe src={preview.url} style={{ width: '80vw', height: '75vh', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fafafa' }} title={preview.name} />
        )}
        {preview.type === 'office' && (
          <iframe src={preview.viewerUrl} style={{ width: '85vw', height: '78vh', border: 'none', borderRadius: 8 }} title={preview.name} />
        )}
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
