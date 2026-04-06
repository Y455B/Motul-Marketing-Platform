import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles/global.css'

import Login from './pages/Login'
import DMP from './pages/DMP'

const Placeholder = ({ title }) => (
  <div style={{ padding: 20 }}>
    <h2 style={{ fontSize: 15, fontWeight: 500 }}>{title}</h2>
    <p style={{ color: '#9ca3af', marginTop: 8, fontSize: 13 }}>Module en cours de développement.</p>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dmp" replace />} />
        <Route path="/dmp" element={<DMP isAdmin={true} />} />
        <Route path="/hub" element={<Placeholder title="Hub Fichiers" />} />
        <Route path="/library" element={<Placeholder title="Motul Library" />} />
        <Route path="/news" element={<Placeholder title="Actualités" />} />
        <Route path="/sliders" element={<Placeholder title="Sliders" />} />
        <Route path="/newsletter" element={<Placeholder title="Newsletter" />} />
        <Route path="/users" element={<Placeholder title="Utilisateurs" />} />
        <Route path="/companies" element={<Placeholder title="Entreprises" />} />
      </Routes>
    </BrowserRouter>
  )
}
