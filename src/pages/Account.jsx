import { useState } from 'react'
import Layout from '../components/Layout'
import { useToast, Toast } from '../lib/useToast.jsx'
import { supabase, isAdmin } from '../lib/supabase'

export default function Account({ user }) {
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const { toast, showToast } = useToast()
  const admin = isAdmin(user)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.newPassword) { showToast('Saisissez un nouveau mot de passe', 'error'); return }
    if (form.newPassword !== form.confirmPassword) { showToast('Les mots de passe ne correspondent pas', 'error'); return }
    if (form.newPassword.length < 6) { showToast('Minimum 6 caractères', 'error'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: form.newPassword })
    if (error) showToast(error.message, 'error')
    else { showToast('Mot de passe mis à jour ✓'); setForm({ newPassword: '', confirmPassword: '' }) }
    setSaving(false)
  }

  return (
    <Layout user={user}>
      <div className="page-header">
        <div><div className="page-title">Mon compte</div><div className="page-sub">Informations de connexion</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 700 }}>
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 16 }}>Informations</div>
          <div style={{ marginBottom: 12 }}>
            <label className="form-label">Email</label>
            <input value={user?.email || ''} disabled style={{ opacity: .6, cursor: 'not-allowed' }} />
          </div>
          <div>
            <label className="form-label">Rôle</label>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: admin ? '#FFF0ED' : '#EFF6FF', border: `0.5px solid ${admin ? '#FECACA' : '#BFDBFE'}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: admin ? '#CC2200' : '#2A5FA8' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: admin ? '#CC2200' : '#2A5FA8', fontFamily: 'monospace' }}>{admin ? 'Administrateur' : 'Partenaire'}</span>
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 16 }}>Changer le mot de passe</div>
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Nouveau mot de passe</label>
              <input type="password" value={form.newPassword} onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Minimum 6 caractères" />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="form-label">Confirmer</label>
              <input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Répétez le mot de passe" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Mettre à jour'}</button>
            </div>
          </form>
        </div>
      </div>

      <Toast toast={toast} />
    </Layout>
  )
}
