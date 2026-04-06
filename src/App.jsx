import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles/global.css'

import Login from './pages/Login'
import Hub from './pages/Hub'
import DMP from './pages/DMP'
import Library from './pages/Library'
import News from './pages/News'
import Sliders from './pages/Sliders'
import Newsletter from './pages/Newsletter'
import Layout from './components/Layout'

const Placeholder = ({ title, sub }) => (
  <Layout>
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 15, fontWeight: 500 }}>{title}</h2>
      <p style={{ color: '#9ca3af', marginTop: 8, fontSize: 13 }}>{sub || 'Module en cours de développement.'}</p>
    </div>
  </Layout>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/hub" replace />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/dmp" element={<DMP isAdmin={true} />} />
        <Route path="/library" element={<Library />} />
        <Route path="/news" element={<News />} />
        <Route path="/sliders" element={<Sliders />} />
        <Route path="/newsletter" element={<Newsletter />} />
        <Route path="/users" element={<Placeholder title="Utilisateurs" sub="Gestion des comptes, rôles et droits d'accès." />} />
        <Route path="/companies" element={<Placeholder title="Entreprises" sub="Référentiel des entreprises partenaires." />} />
      </Routes>
    </BrowserRouter>
  )
}
