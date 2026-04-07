import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast, Toast } from '../lib/useToast.jsx'
import { supabase, isAdmin } from '../lib/supabase'

const EMPTY = { title: '', content: '', visible: true }

export default function News({ user }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [currentImageUrl, setCurrentImageUrl] = useState(null)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { toast, showToast } = useToast()
  const admin = isAdmin(user)

  const load = async () => {
    setLoading(true)
    let query = supabase.from('news').select('*').order('created_at', { ascending: false })
    if (!admin) query = query.eq('visible', true)
    const { data, error } = await query
    if (error) showToast(error.message, 'error')
    else setNews(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [admin])

  const openNew = () => {
    setForm(EMPTY)
    setEditId(null)
    setImageFile(null)
    setImagePreview(null)
    setCurrentImageUrl(null)
    setShowForm(true)
  }

  const openEdit = (item) => {
    setForm({ title: item.title, content: item.content || '', visible: item.visible })
    setEditId(item.id)
    setImageFile(null)
    setImagePreview(item.image_url || null)
    setCurrentImageUrl(item.image_url || null)
    setShowForm(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    // image_url = nouvelle image uploadée, ou image existante, ou null
    let image_url = currentImageUrl

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `news/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('platform-files')
        .upload(path, imageFile, { upsert: true })
      if (upErr) {
        showToast(upErr.message, 'error')
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('platform-files').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const payload = {
      title: form.title,
      content: form.content,
      visible: form.visible,
      image_url: image_url || null
    }

    if (editId) {
      const { error } = await supabase.from('news').update(payload).eq('id', editId)
      if (error) { showToast(error.message, 'error'); setSaving(false); return }
      showToast('Article mis à jour')
    } else {
      const { error } = await supabase.from('news').insert(payload)
      if (error) { showToast(error.message, 'error'); setSaving(false); return }
      showToast('Article publié')
    }

    setShowForm(false)
    setSaving(false)
    load()
  }

  const toggleVisible = async (item) => {
    const { error } = await supabase.from('news').update({ visible: !item.visible }).eq('id', item.id)
    if (error) showToast(error.message, 'error')
    else setNews(prev => prev.map(n => n.id === item.id ? { ...n, visible: !n.visible } : n))
  }

  const confirmDelete = async () => {
    const { error } = await supabase.from('news').delete().eq('id', deleteTarget.id)
    if (error) showToast(error.message, 'error')
    else { showToast('Article supprimé'); setNews(prev => prev.filter(n => n.id !== deleteTarget.id)) }
    setDeleteTarget(null)
  }

  return (
    <Layout user={user}>
      <div className="page-header">
        <div>
          <div className="page-title">Actualités</div>
          <div className="page-sub">{admin ? `Back-office · ${news.filter(n => n.visible).length} article(s) visible(s)` : 'Dernières nouvelles Motul Africa'}</div>
        </div>
        {admin && <button className="btn btn-primary" onClick={openNew}>+ Nouvel article</button>}
      </div>

      {admin && showForm && (
        <div className="card card-pad" style={{ marginBottom: 20, maxWidth: 600 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{editId ? "Modifier l'article" : 'Nouvel article'}</div>
          <form onSubmit={handleSave}>
            <div className="form-grid">
              <div className="form-full">
                <label className="form-label">Titre <span className="form-req">*</span></label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre de l'article" />
              </div>
              <div className="form-full">
                <label className="form-label">Contenu</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Contenu de l'article..." rows={4} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-full">
                <label className="form-label">Image <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>· JPG, PNG recommandé</span></label>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {imagePreview && (
                  <div style={{ marginTop: 10 }}>
                    <img src={imagePreview} alt="Aperçu" style={{ width: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'cover', display: 'block' }} />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); setCurrentImageUrl(null) }}
                      style={{ marginTop: 6, fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      ✕ Retirer l'image
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" className={`toggle ${form.visible ? 'on' : ''}`} onClick={() => setForm(p => ({ ...p, visible: !p.visible }))} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>{form.visible ? 'Visible' : 'Masqué'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Publier'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="empty-state">Chargement...</div>
        : news.length === 0
          ? <div className="empty-state"><div className="empty-state-icon">📰</div>{admin ? 'Aucun article. Créez votre premier article.' : 'Aucune actualité disponible.'}</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {news.map(n => (
                <div key={n.id} className="card" style={{ overflow: 'hidden', opacity: admin && !n.visible ? .6 : 1 }}>
                  {n.image_url && (
                    <img src={n.image_url} alt={n.title} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                  )}
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{n.title}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 8 }}>
                      {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    {n.content && <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{n.content}</div>}
                    {admin && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '0.5px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button className={`toggle ${n.visible ? 'on' : ''}`} onClick={() => toggleVisible(n)} />
                          <span style={{ fontSize: 11, color: '#6b7280' }}>{n.visible ? 'Visible' : 'Masqué'}</span>
                        </div>
                        <button className="btn" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => openEdit(n)}>Modifier</button>
                        <button className="btn" style={{ fontSize: 11, padding: '3px 10px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => setDeleteTarget(n)}>Supprimer</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
      }

      <ConfirmModal open={!!deleteTarget} title="Supprimer l'article" message={`Confirmez-vous la suppression de "${deleteTarget?.title}" ?`} confirmLabel="Supprimer" danger onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      <Toast toast={toast} />
    </Layout>
  )
}
