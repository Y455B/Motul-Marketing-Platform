import { useState } from 'react'
import Layout from '../components/Layout'

const REQUESTS = [
  { name: 'Karim Tazi', email: 'k.tazi@casaevents.ma', entreprise: 'Casablanca Events SA', poste: 'Directeur Marketing', date: '05 avr 2025', access: true },
  { name: 'Sara Benali', email: 's.benali@automarche.ma', entreprise: 'Auto-Marché Distribution', poste: 'Responsable Com', date: '03 avr 2025', access: true },
  { name: 'Mehdi Chraibi', email: 'm.chraibi@motoprestige.ma', entreprise: 'Moto Prestige SARL', poste: 'Gérant', date: '01 avr 2025', access: false },
  { name: 'Fatima Ouali', email: 'f.ouali@digitalauto.ma', entreprise: 'Digital Auto MA', poste: 'Digital Manager', date: '28 mar 2025', access: false },
  { name: 'Hassan Fassi', email: 'h.fassi@garagefassi.ma', entreprise: 'Garage Fassi & Fils', poste: 'Propriétaire', date: '25 mar 2025', access: true },
]

export default function Library() {
  const [submitted, setSubmitted] = useState(false)
  const [requests, setRequests] = useState(REQUESTS)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', entreprise: '', poste: '' })

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const grantAccess = (email) => {
    setRequests(prev => prev.map(r => r.email === email ? { ...r, access: true } : r))
    showToast('Accès accordé — email d\'invitation envoyé')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 500 }}>Motul Library</h2>
          <p style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 2 }}>Gestion des accès · Notifications → f.hadjnassar@ma.motul.com · M.FilaliAnsary@ma.motul.com</p>
        </div>
        <button className="btn btn-primary" onClick={() => showToast('Export CSV téléchargé')}>Export CSV ↓</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Formulaire partenaire */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Formulaire demande d'accès — vue partenaire</div>

          {submitted ? (
            <div className="alert-success">
              <div className="alert-success-icon">✓</div>
              <div className="alert-success-txt">Votre demande a été transmise avec succès. Vous recevrez un email d'invitation dans les plus brefs délais (pensez à vérifier également vos courriels indésirables).</div>
            </div>
          ) : (
            <div className="card card-pad">
              {/* Guide PDF */}
              <div onClick={() => showToast('Téléchargement du guide PDF...')} style={{ background: '#FFF0ED', border: '0.5px solid #FECACA', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#CC2200'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#FECACA'}>
                <div style={{ width: 28, height: 28, background: '#CC2200', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, flexShrink: 0 }}>↓</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#A01A00' }}>Guide d'accès à la Motul Library</div>
                  <div style={{ fontSize: 10, color: '#CC2200', opacity: .7, fontFamily: 'monospace' }}>Pensez à télécharger le guide · PDF</div>
                </div>
              </div>

              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>Pour obtenir l'accès à la Motul Library, complétez les champs suivants :</p>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label className="form-label">Nom <span className="form-req">*</span></label><input required value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Votre nom" /></div>
                  <div><label className="form-label">Prénom <span className="form-req">*</span></label><input required value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} placeholder="Votre prénom" /></div>
                  <div style={{ gridColumn: '1/-1' }}><label className="form-label">Email professionnel <span className="form-req">*</span></label><input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@entreprise.com" /></div>
                  <div><label className="form-label">Entreprise <span className="form-req">*</span></label><input required value={form.entreprise} onChange={e => setForm(p => ({ ...p, entreprise: e.target.value }))} placeholder="Nom de l'entreprise" /></div>
                  <div><label className="form-label">Poste <span className="form-req">*</span></label><input required value={form.poste} onChange={e => setForm(p => ({ ...p, poste: e.target.value }))} placeholder="Votre poste" /></div>
                </div>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12, marginBottom: 4 }}>Vous avez déjà un accès ?</p>
                <a href="#" style={{ fontSize: 11, color: '#CC2200' }} onClick={e => e.preventDefault()}>Se connecter à la Motul Library</a>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <button type="submit" className="btn btn-primary">Envoyer la demande</button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Back-office */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Demandes reçues — Back-office</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Total demandes', val: requests.length },
              { label: 'Accès accordés', val: requests.filter(r => r.access).length, color: '#16a34a' },
              { label: 'En attente', val: requests.filter(r => !r.access).length, color: '#D97706' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: s.color || '#111827' }}>{s.val}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px', padding: '7px 14px', background: '#f9fafb', borderBottom: '0.5px solid #e5e7eb' }}>
              {['Demandeur', 'Date', 'Statut'].map(h => <span key={h} style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{h}</span>)}
            </div>
            {requests.map((r, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px', padding: '10px 14px', borderBottom: '0.5px solid #f3f4f6', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'monospace' }}>{r.email}</div>
                </div>
                <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{r.date}</span>
                {r.access
                  ? <span style={{ fontSize: 10, fontWeight: 500, background: '#dcfce7', color: '#166534', borderRadius: 10, padding: '2px 8px', fontFamily: 'monospace' }}>✓ Accordé</span>
                  : <button className="btn btn-primary" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => grantAccess(r.email)}>Accorder</button>
                }
              </div>
            ))}
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
