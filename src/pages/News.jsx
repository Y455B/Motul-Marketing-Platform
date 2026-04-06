import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast, Toast } from '../lib/useToast.jsx'
import { supabase, isAdmin } from '../lib/supabase'

const EMPTY_FORM = { title: '', content: '', visible: true }

export default function News({ user }) {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [imageFile, setImageFile] = useState(null)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { toast, showToast } = useToast()
  const admin = isAdmin(user)

  const load = async () => {
    setLoading(true)
    const query = supabase.from('news').select('*').order('created_at', { ascending: false })
    if (!admin) query.eq('visible', true)
    const { data, error } = await query
    if (error) showToast(error.message, 'error')
    else setNews(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [admin])

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setImageFile(null); setShowForm(true) }
  const openEdit = (item) => { setForm({ title: item.title, content: item.content || '', visible: item.visible }); setEditId(item.id); setImageFile(null); setShowForm(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    let image_url = editId ? news.find(n => n.id === editId)?.image_url : null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `news/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('platform-files').upload(path, imageFile, { upsert: true })
      if (upErr) { showToast(upErr.message, 'error'); setSaving(false); return }
      image_url = supabase.storage.from('platform-files').getPublicUrl(path).data.publicUrl
    }

    const payload = { title: form.title, content: form.content, visible: form.visible, image_url }

    if (editId) {
      const { error } = await supabase.from('news').update(payload).eq('id', editId)
      if (error) showToast(error.message, 'error')
      else { showToast('Article mis à jour'); setShowForm(false); load() }
    } else {
      const { error } = await supabase.from('news').insert(payload)
      if (error) showToast(error.message, 'error')
      else { showToast('Article publié'); setShowForm(false); load() }
    }
    setSaving(false)
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
          <div className="page-sub">{admin ? `Back-office éditorial · ${news.filter(n => n.visible).length} visible(s)` : 'Dernières nouvelles Motul Africa'}</div>
        </div>
        {admin && <button className="btn btn-primary" onClick={openNew}>+ Nouvel article</button>}
      </div>

      {/* Formulaire admin */}
      {admin && showForm && (
        <div className="card card-pad" style={{ marginBottom: 20, maxWidth: 580 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{editId ? 'Modifier l\'article' : 'Nouvel article'}</div>
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
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                {editId && news.find(n => n.id === editId)?.image_url && !imageFile && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#9ca3af' }}>Image actuelle conservée si aucune nouvelle image sélectionnée</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" className={`toggle ${form.visible ? 'on' : ''}`} onClick={() => setForm(p => ({ ...p, visible: !p.visible })) } />
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
        : news.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📰</div>
            {admin ? 'Aucun article. Créez votre premier article.' : 'Aucune actualité disponible.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {news.map(n => (
              <div key={n.id} className="card" style={{ padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', opacity: admin && !n.visible ? .6 : 1 }}>
                {n.image_url
                  ? <img src={n.image_url} alt={n.title} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 72, height: 72, borderRadius: 10, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>📰</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{n.title}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 6 }}>{new Date(n.created_at).toLocaleDateString('fr-FR')}</div>
                  {n.content && <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{n.content}</div>}
                  {admin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
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
        )
      }

      <ConfirmModal open={!!deleteTarget} title="Supprimer l'article" message={`Confirmez-vous la suppression de "${deleteTarget?.title}" ? Cette action est irréversible.`} confirmLabel="Supprimer" danger onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      <Toast toast={toast} />
    </Layout>
  )
}
