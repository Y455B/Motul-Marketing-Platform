import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast, Toast } from '../lib/useToast'
import { supabase } from '../lib/supabase'

const EMPTY_FORM = { title: '', content: '', visible: true }

export default function News() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { toast, showToast } = useToast()

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false })
    if (error) showToast(error.message, 'error')
    else setNews(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }

  const openEdit = (item) => {
    setForm({ title: item.title, content: item.content || '', visible: item.visible })
    setEditId(item.id)
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    if (editId) {
      const { error } = await supabase.from('news').update({ title: form.title, content: form.content, visible: form.visible }).eq('id', editId)
      if (error) showToast(error.message, 'error')
      else { showToast('Article mis à jour'); setShowForm(false); load() }
    } else {
      const { error } = await supabase.from('news').insert({ title: form.title, content: form.content, visible: form.visible })
      if (error) showToast(error.message, 'error')
      else { showToast('Article publié'); setShowForm(false); load() }
    }
    setSaving(false)
  }

  const toggleVisible = async (item) => {
    const { error } = await supabase.from('news').update({ visible: !item.visible }).eq('id', item.id)
    if (error) showToast(error.message, 'error')
    else { setNews(prev => prev.map(n => n.id === item.id ? { ...n, visible: !n.visible } : n)) }
  }

  const confirmDelete = async () => {
    const { error } = await supabase.from('news').delete().eq('id', deleteTarget.id)
    if (error) showToast(error.message, 'error')
    else { showToast('Article supprimé'); setNews(prev => prev.filter(n => n.id !== deleteTarget.id)) }
    setDeleteTarget(null)
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">Actualités</div>
          <div className="page-sub">Back-office éditorial · {news.filter(n => n.visible).length} article(s) visible(s)</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nouvel article</button>
      </div>

      {showForm && (
        <div className="card card-pad" style={{ marginBottom: 16, maxWidth: 560 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>{editId ? 'Modifier l\'article' : 'Nouvel article'}</div>
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Titre <span className="form-req">*</span></label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre de l'article" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Contenu</label>
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Contenu de l'article..." rows={4} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <button type="button" className={`toggle ${form.visible ? 'on' : ''}`} onClick={() => setForm(p => ({ ...p, visible: !p.visible }))} />
              <span style={{ fontSize: 12, color: '#6b7280' }}>{form.visible ? 'Visible' : 'Masqué'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Publier'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Chargement...</div>
      ) : news.length === 0 ? (
        <div className="empty-state">Aucun article. Créez votre premier article.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {news.map(n => (
            <div key={n.id} className="card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, background: '#f3f4f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📰</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 6 }}>{new Date(n.created_at).toLocaleDateString('fr-FR')}</div>
                {n.content && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{n.content}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button className={`toggle ${n.visible ? 'on' : ''}`} onClick={() => toggleVisible(n)} />
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{n.visible ? 'Visible' : 'Masqué'}</span>
                  </div>
                  <button className="btn" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => openEdit(n)}>Modifier</button>
                  <button className="btn" style={{ fontSize: 11, padding: '3px 10px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => setDeleteTarget(n)}>Supprimer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Supprimer l'article"
        message={`Confirmez-vous la suppression de "${deleteTarget?.title}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </Layout>
  )
}
