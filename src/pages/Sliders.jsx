import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast, Toast } from '../lib/useToast'
import { supabase } from '../lib/supabase'

const EMPTY_FORM = { title: '', subtitle: '', btn_label: '', visible: true }

export default function Sliders() {
  const [sliders, setSliders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { toast, showToast } = useToast()

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('sliders').select('*').order('sort_order')
    if (error) showToast(error.message, 'error')
    else setSliders(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setImageFile(null); setShowForm(true) }

  const openEdit = (s) => {
    setForm({ title: s.title, subtitle: s.subtitle || '', btn_label: s.btn_label || '', visible: s.visible })
    setEditId(s.id)
    setImageFile(null)
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    let image_url = editId ? sliders.find(s => s.id === editId)?.image_url : null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `sliders/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('platform-files').upload(path, imageFile, { upsert: true })
      if (uploadErr) { showToast(uploadErr.message, 'error'); setSaving(false); return }
      image_url = supabase.storage.from('platform-files').getPublicUrl(path).data.publicUrl
    }

    const payload = { title: form.title, subtitle: form.subtitle, btn_label: form.btn_label, visible: form.visible, image_url }

    if (editId) {
      const { error } = await supabase.from('sliders').update(payload).eq('id', editId)
      if (error) showToast(error.message, 'error')
      else { showToast('Slider mis à jour'); setShowForm(false); load() }
    } else {
      const { error } = await supabase.from('sliders').insert({ ...payload, sort_order: sliders.length })
      if (error) showToast(error.message, 'error')
      else { showToast('Slider créé'); setShowForm(false); load() }
    }
    setSaving(false)
  }

  const toggleVisible = async (s) => {
    const { error } = await supabase.from('sliders').update({ visible: !s.visible }).eq('id', s.id)
    if (error) showToast(error.message, 'error')
    else setSliders(prev => prev.map(x => x.id === s.id ? { ...x, visible: !x.visible } : x))
  }

  const confirmDelete = async () => {
    const { error } = await supabase.from('sliders').delete().eq('id', deleteTarget.id)
    if (error) showToast(error.message, 'error')
    else { showToast('Slider supprimé'); setSliders(prev => prev.filter(x => x.id !== deleteTarget.id)) }
    setDeleteTarget(null)
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div className="page-title">Sliders homepage</div>
          <div className="page-sub">Gestion des bannières · {sliders.filter(s => s.visible).length} slider(s) actif(s)</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nouveau slider</button>
      </div>

      {showForm && (
        <div className="card card-pad" style={{ marginBottom: 16, maxWidth: 560 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>{editId ? 'Modifier le slider' : 'Nouveau slider'}</div>
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Titre <span className="form-req">*</span></label>
              <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre du slider" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Descriptif</label>
              <input value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Sous-titre" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Titre du bouton</label>
              <input value={form.btn_label} onChange={e => setForm(p => ({ ...p, btn_label: e.target.value }))} placeholder="Ex: En savoir plus" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Image <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>1920×600px · max 2 Mo</span></label>
              <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} style={{ background: '#fff' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <button type="button" className={`toggle ${form.visible ? 'on' : ''}`} onClick={() => setForm(p => ({ ...p, visible: !p.visible }))} />
              <span style={{ fontSize: 12, color: '#6b7280' }}>{form.visible ? 'Visible' : 'Masqué'}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="empty-state">Chargement...</div>
      ) : sliders.length === 0 ? (
        <div className="empty-state">Aucun slider. Créez votre premier slider.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sliders.map(s => (
            <div key={s.id} className="card" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{s.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className={`toggle ${s.visible ? 'on' : ''}`} onClick={() => toggleVisible(s)} />
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{s.visible ? 'Visible' : 'Masqué'}</span>
                </div>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: 8, height: 80, marginBottom: 10, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.image_url
                  ? <img src={s.image_url} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 12, color: '#9ca3af' }}>Aucune image</span>
                }
                {s.btn_label && (
                  <div style={{ position: 'absolute', bottom: 8, right: 10, background: '#CC2200', color: '#fff', fontSize: 10, padding: '3px 8px', borderRadius: 4, fontFamily: 'monospace' }}>{s.btn_label}</div>
                )}
              </div>
              {s.subtitle && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{s.subtitle}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => openEdit(s)}>Modifier</button>
                <button className="btn" style={{ fontSize: 11, padding: '3px 10px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => setDeleteTarget(s)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Supprimer le slider"
        message={`Confirmez-vous la suppression de "${deleteTarget?.title}" ?`}
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} />
    </Layout>
  )
}
