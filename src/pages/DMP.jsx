import Layout from '../components/Layout'

// URL de l'outil officiel Motul International pour les actions marketing
// TODO : remplacer par l'URL définitive fournie par le client
const MOTUL_INTL_DMP_URL = 'https://motul-international-dmp.example.com'

export default function DMP({ user }) {
  return (
    <Layout user={user}>
      <div className="page-header">
        <div>
          <div className="page-title">Actions Marketing</div>
          <div className="page-sub">Accès à l'outil officiel Motul International</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ maxWidth: 560, width: '100%', padding: '48px 40px', textAlign: 'center', overflow: 'hidden', position: 'relative' }}>
          {/* Bandeau rouge décoratif en haut */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #CC2200 0%, #A01A00 100%)' }} />

          <div style={{ fontSize: 52, marginBottom: 18 }}>📋</div>

          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1.5, color: '#1a1a1a', marginBottom: 12 }}>
            OUTIL MARKETING OFFICIEL
          </div>

          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 28, maxWidth: 420, margin: '0 auto 28px' }}>
            La gestion de vos demandes d'actions marketing (DMP) est désormais centralisée sur la plateforme officielle <strong>Motul International</strong>. Toutes vos demandes, validations et archives y sont consultables.
          </p>

          <a
            href={MOTUL_INTL_DMP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, padding: '12px 28px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1.5, textDecoration: 'none' }}
          >
            Accéder à l'outil Motul International
            <span style={{ fontSize: 12 }}>↗</span>
          </a>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '0.5px solid #f3f4f6', fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>
            Besoin d'aide ? Contactez votre responsable Motul Africa.
          </div>
        </div>
      </div>
    </Layout>
  )
}
