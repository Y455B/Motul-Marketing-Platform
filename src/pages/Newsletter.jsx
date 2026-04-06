import { useState } from 'react'
import Layout from '../components/Layout'

const INIT_SUBS = [
  { email: 'k.tazi@casaevents.ma', nom: 'Tazi', prenom: 'Karim', entreprise: 'Casablanca Events SA', date: '05 avr 2025' },
  { email: 's.benali@automarche.ma', nom: 'Benali', prenom: 'Sara', entreprise: 'Auto-Marché Distribution', date: '03 avr 2025' },
  { email: 'm.chraibi@motoprestige.ma', nom: 'Chraibi', prenom: 'Mehdi', entreprise: 'Moto Prestige SARL', date: '01 avr 2025' },
  { email: 'f.ouali@digitalauto.ma', nom: 'Ouali', prenom: 'Fatima', entreprise: 'Digital Auto MA', date: '28 mar 2025' },
  { email: 'h.fassi@garagefassi.ma', nom: 'Fassi', prenom: 'Hassan', entreprise: 'Garage Fassi & Fils', date: '25 mar 2025' },
]

export default function Newsletter() {
  const [subs, setSubs] = useState(INIT_SUBS)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', entreprise: '' })
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubs(prev => [{ ...form, date: '06 avr 2026' }, ...prev])
    setSubmitted(true)
  }

  const removeSub = (email) => {
    setSubs(prev => prev.filter(s => s.email !== email))
    showToast('Abonné retiré de la liste')
  }

  const exportCSV = () => {
    const headers = 'Email,Nom,Prénom,Entreprise,Date\n'
    const rows = subs.map(s => `${s.email},${s.nom},${s.prenom},${s.entreprise},${s.date}`).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'newsletter_subscribers.csv'
    a.click()
    showToast(`Export CSV — ${subs.length} abonnés téléchargé`)
  }

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 500 }}>Newsletter</h2>
          <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 2 }}>Abonnés partenaires · Export disponible</p>
        </div>
        <button className="btn btn-primary" onClick={exportCSV}>Export CSV ↓</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Formulaire partenaire */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Formulaire inscription — vue partenaire</div>
          {submitted ? (
            <div className="alert-success">
              <div className="alert-success-icon">✓</div>
              <div className="alert-success-txt">Nous vous remercions de votre inscription à la newsletter.</div>
            </div>
          ) : (
            <div className="card card-pad">
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>Restez informé des dernières actualités Motul Africa.</p>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label className="form-label">Nom <span className="form-req">*</span></label><input required value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Votre nom" /></div>
                  <div><label className="form-label">Prénom <span className="form-req">*</span></label><input required value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} placeholder="Votre prénom" /></div>
                  <div style={{ gridColumn: '1/-1' }}><label className="form-label">Email <span className="form-req">*</span></label><input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@entreprise.com" /></div>
                  <div style={{ gridColumn: '1/-1' }}><label className="form-label">Entreprise</label><input value={form.entreprise} onChange={e => setForm(p => ({ ...p, entreprise: e.target.value }))} placeholder="Optionnel" /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <button type="submit" className="btn btn-primary">S'inscrire</button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Back-office */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Abonnés — Back-office</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Total abonnés', val: subs.length },
              { label: 'Ce mois', val: '+' + subs.filter(s => s.date.includes('2026')).length || '+18', color: '#16a34a' },
              { label: 'Taux ouverture', val: '34%' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: s.color || '#111827' }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 60px', padding: '7px 14px', background: '#f9fafb', borderBottom: '0.5px solid #e5e7eb' }}>
              {['Email', 'Date', ''].map((h, i) => <span key={i} style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{h}</span>)}
            </div>
            {subs.slice(0, 8).map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 60px', padding: '9px 14px', borderBottom: '0.5px solid #f3f4f6', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.prenom} {s.nom} · {s.entreprise}</div>
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{s.date}</span>
                <button className="btn" style={{ fontSize: 10, padding: '3px 6px', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => removeSub(s.email)}>Retirer</button>
              </div>
            ))}
            {subs.length > 8 && (
              <div style={{ padding: '8px 14px', fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>
                ... {subs.length - 8} autres abonnés · Exportez le CSV pour voir tous
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#fff', border: '0.5px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, zIndex: 200 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
          {toast}
        </div>
      )}
    </Layout>
  )
}
