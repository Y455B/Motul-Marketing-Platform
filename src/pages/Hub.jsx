import { useState } from 'react'
import Layout from '../components/Layout'

const FOLDERS = [
  { id: 1, name: 'Ramadan 2025', count: 12, size: '340 Mo' },
  { id: 2, name: 'Lancement 5100', count: 8, size: '120 Mo' },
  { id: 3, name: 'Brand Assets', count: 24, size: '1.1 Go' },
  { id: 4, name: 'Social Media Q1', count: 31, size: '780 Mo' },
]

const FILES = [
  { name: 'Brief_Ramadan_2025_Final.pdf', type: 'PDF', size: '2.1 Mo', uploader: 'Yassine', date: '02 avr 2025' },
  { name: 'Motion_Ouverture_30s.mp4', type: 'MP4', size: '87 Mo', uploader: 'Chaimaa', date: '01 avr 2025' },
  { name: 'Visuels_Caroussel_Insta.zip', type: 'ZIP', size: '34 Mo', uploader: 'Yassine', date: '30 mar 2025' },
  { name: 'Maquettes_Stories_V3.ai', type: 'AI', size: '12 Mo', uploader: 'Fatine', date: '28 mar 2025' },
  { name: 'Reporting_Semaine1.xlsx', type: 'XLSX', size: '480 Ko', uploader: 'Yassine', date: '25 mar 2025' },
  { name: 'KV_Principal_HD.png', type: 'PNG', size: '8.4 Mo', uploader: 'Chaimaa', date: '20 mar 2025' },
]

const TYPE_COLORS = {
  PDF: { bg: '#FDECEA', color: '#CC2200' },
  MP4: { bg: '#E8F5E9', color: '#2E7D32' },
  ZIP: { bg: '#F3E5F5', color: '#6A1B9A' },
  AI: { bg: '#FFF3E0', color: '#E65100' },
  XLSX: { bg: '#E8F5E0', color: '#2E6B1C' },
  PNG: { bg: '#E8F0FE', color: '#1A56C4' },
}

export default function Hub() {
  const [activeFolder, setActiveFolder] = useState(1)
  const [showShare, setShowShare] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [files, setFiles] = useState(FILES)
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handleUpload = () => {
    const newFile = { name: 'Nouveau_Fichier.pdf', type: 'PDF', size: '1.2 Mo', uploader: 'Yassine', date: '06 avr 2026' }
    setFiles(prev => [newFile, ...prev])
    setShowUpload(false)
    showToast('Fichier uploadé avec succès !')
  }

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 500 }}>Hub Fichiers</h2>
          <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 2 }}>Assets et documents Motul Africa</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => setShowUpload(true)}>⬆ Upload</button>
          <button className="btn btn-primary" onClick={() => setShowShare(true)}>⊹ Partager un lien</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8, marginBottom: 18 }}>
        {[
          { label: 'Fichiers', val: '75' },
          { label: 'Stockage', val: '2.3 Go' },
          { label: 'Liens actifs', val: '3' },
          { label: 'Membres', val: '4' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Dossiers */}
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Dossiers</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 10, marginBottom: 20 }}>
        {FOLDERS.map(f => (
          <div key={f.id} onClick={() => setActiveFolder(f.id)} className="card" style={{ padding: 14, cursor: 'pointer', borderColor: activeFolder === f.id ? '#CC2200' : '', background: activeFolder === f.id ? '#FFF0ED' : '' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>📁</div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 3 }}>{f.name}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{f.count} fichiers · {f.size}</div>
          </div>
        ))}
        <div onClick={() => showToast('Nouveau dossier créé')} className="card" style={{ padding: 14, cursor: 'pointer' }}>
          <div style={{ fontSize: 22, marginBottom: 8, color: '#9ca3af' }}>+</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Nouveau dossier</div>
        </div>
      </div>

      {/* Fichiers */}
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>
        Fichiers — {FOLDERS.find(f => f.id === activeFolder)?.name}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 100px 100px 80px', padding: '7px 14px', background: '#f9fafb', borderBottom: '0.5px solid #e5e7eb' }}>
          {['Nom', 'Type', 'Taille', 'Uploadé par', 'Date'].map(h => (
            <span key={h} style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{h}</span>
          ))}
        </div>
        {files.map((f, i) => {
          const tc = TYPE_COLORS[f.type] || { bg: '#f3f4f6', color: '#6b7280' }
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 100px 100px 80px', padding: '10px 14px', borderBottom: '0.5px solid #f3f4f6', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = ''}>
              <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <span style={{ display: 'inline-flex', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: 'monospace', background: tc.bg, color: tc.color }}>{f.type}</span>
              <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{f.size}</span>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{f.uploader}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn" style={{ width: 26, height: 26, padding: 0, fontSize: 12 }} onClick={() => setShowShare(true)} title="Partager">⊹</button>
                <button className="btn" style={{ width: 26, height: 26, padding: 0, fontSize: 12 }} onClick={() => showToast(`Téléchargement de ${f.name}`)} title="Télécharger">↓</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Share */}
      {showShare && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Générer un lien de partage</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Lien sécurisé avec expiration automatique</div>
            <div style={{ background: '#f9fafb', border: '0.5px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: '#6b7280', marginBottom: 16 }}>
              hub.declic.ma/share/mtl-xK9p2mRa?exp=7d
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[['7 jours', 'expire auto'], ['30 jours', 'expire auto'], ['Lecture seule', 'téléchargement'], ['Avec upload', 'collaboratif']].map(([l, s], i) => (
                <div key={i} className="card" style={{ padding: '10px 12px', cursor: 'pointer', borderColor: i === 0 || i === 2 ? '#CC2200' : '', background: i === 0 || i === 2 ? '#FFF0ED' : '' }}>
                  <div style={{ fontSize: 11, fontWeight: 500 }}>{l}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{s}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowShare(false)}>Fermer</button>
              <button className="btn btn-primary" onClick={() => { setShowShare(false); showToast('Lien copié !') }}>Copier le lien</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {showUpload && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Uploader des fichiers</div>
            <div onClick={handleUpload} style={{ border: '1.5px dashed #d1d5db', borderRadius: 10, padding: 28, textAlign: 'center', cursor: 'pointer', background: '#f9fafb', marginBottom: 16 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC2200'; e.currentTarget.style.background = '#FFF0ED' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⬆</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Glissez vos fichiers ou cliquez pour parcourir</div>
              <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginTop: 4 }}>PDF · PPTX · MP4 · PNG · PSD · AI · tout format</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setShowUpload(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleUpload}>Uploader</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#fff', border: '0.5px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, zIndex: 200 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
          {toast}
        </div>
      )}
    </Layout>
  )
}
