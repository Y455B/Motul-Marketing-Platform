import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { ConfirmModal } from '../components/ConfirmModal'
import { useToast, Toast } from '../lib/useToast.jsx'
import { supabase } from '../lib/supabase'

const EMPTY = { title: '', subtitle: '', btn_label: '', visible: true }

export default function Sliders({ user }) {
  const [sliders, setSliders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { toast, showToast } = useToast()

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('sliders').select('*').order('sort_order')
    setSliders(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openEdit = (s) => {
    setForm({ title: s.title, subtitle: s.subtitle || '', btn_label: s.btn_label || '', visible: s.visible })
    setEditId(s.id); setImageFile(null); setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    let image_url = editId ? sliders.find(s => s.id === editId)?.image_url : null
    if (imageFile) {
      const path = `sliders/${Date.now()}.${imageFile.name.split('.').pop()}`
      const { error: upErr } = await supabase.storage.from('platform-files').upload(path, imageFile, { upsert: true })
      if (upErr) { showToast(upErr.message, 'error'); setSaving(false); return }
      image_url = supabase.storage.from('platform-files').getPublicUrl(path).data.publicUrl
    }
    const payload = { ...form, image_url }
    if (editId) {
      const { error } = await supabase.from('sliders').update(payload).eq('id', editId)
      if (error) { showToast(error.message, 'error'); setSaving(false); return }
    } else {
      const { error } = await supabase.from('sliders').insert({ ...payload, sort_order: sliders.length })
      if (error) { showToast(error.message, 'error'); setSaving(false); return }
    }
    showToast(editId ? 'Slider mis à jour' : 'Slider créé')
    setShowForm(false); setEditId(null); setSaving(false); load()
  }

  const toggleVisible = async (s) => {
    await supabase.from('sliders').update({ visible: !s.visible }).eq('id', s.id)
    setSliders(prev => prev.map(x => x.id === s.id ? { ...x, visible: !x.visible } : x))
  }

  const confirmDelete = async () => {
    await supabase.from('sliders').delete().eq('id', deleteTarget.id)
    showToast('Slider supprimé')
    setSliders(prev => prev.filter(x => x.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <Layout user={user}>
      <div className="page-header">
        <div>
          <div className="page-title">Sliders homepage</div>
          <div className="page-sub">Bannières affichées sur la page d'accueil · {sliders.filter(s => s.visible).length} actif(s)</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }}>+ Nouveau slider</button>
      </div>

      {showForm && (
        <div className="card card-pad" style={{ marginBottom: 16, maxWidth: 560 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{editId ? 'Modifier le slider' : 'Nouveau slider'}</div>
          <form onSubmit={handleSave}>
            <div className="form-grid">
              <div className="form-full">
                <label className="form-label">Titre <span className="form-req">*</span></label>
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-full">
                <label className="form-label">Descriptif</label>
                <input value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Sous-titre affiché sur le slider" />
              </div>
              <div>
                <label className="form-label">Titre du bouton</label>
                <input value={form.btn_label} onChange={e => setForm(p => ({ ...p, btn_label: e.target.value }))} placeholder="Ex: En savoir plus" />
              </div>
              <div>
                <label className="form-label">Image <span style={{ fontSize: 10, color: '#9ca3af' }}>1920×600px · max 2Mo</span></label>
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" className={`toggle ${form.visible ? 'on' : ''}`} onClick={() => setForm(p => ({ ...p, visible: !p.visible }))} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>{form.visible ? 'Visible sur homepage' : 'Masqué'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn" onClick={() => setShowForm(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="empty-state">Chargement...</div>
        : sliders.length === 0
          ? <div className="empty-state"><div className="empty-state-icon">▤</div>Aucun slider. Créez votre premier slider pour qu'il apparaisse sur la homepage.</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sliders.map(s => (
              <div key={s.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className={`toggle ${s.visible ? 'on' : ''}`} onClick={() => toggleVisible(s)} />
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{s.visible ? 'Visible' : 'Masqué'}</span>
                  </div>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: 8, height: 90, marginBottom: 10, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.image_url
                    ? <img src={s.image_url} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 12, color: '#9ca3af' }}>Aucune image · sera visible sur la homepage</span>
                  }
                  {s.btn_label && <div style={{ position: 'absolute', bottom: 8, right: 10, background: '#CC2200', color: '#fff', fontSize: 10, padding: '3px 10px', borderRadius: 4, fontFamily: 'monospace' }}>{s.btn_label}</div>}
                </div>
                {s.subtitle && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>{s.subtitle}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ fontSize: 11, padding: '4px 12px' }} onClick={() => openEdit(s)}>Modifier</button>
                  <button className="btn" style={{ fontSize: 11, padding: '4px 12px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => setDeleteTarget(s)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
      }

      <ConfirmModal open={!!deleteTarget} title="Supprimer le slider" message={`Confirmez-vous la suppression de "${deleteTarget?.title}" ?`} confirmLabel="Supprimer" danger onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
      <Toast toast={toast} />
    </Layout>
  )
}
