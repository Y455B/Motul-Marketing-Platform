import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
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
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{title}</div>
      <p style={{ color: '#9ca3af', fontSize: 13 }}>{sub}</p>
    </div>
  </Layout>
)

function Protected({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 13, color: '#9ca3af' }}>
      Chargement...
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/hub" replace />} />
        <Route path="/hub" element={<Protected><Hub /></Protected>} />
        <Route path="/dmp" element={<Protected><DMP /></Protected>} />
        <Route path="/library" element={<Protected><Library /></Protected>} />
        <Route path="/news" element={<Protected><News /></Protected>} />
        <Route path="/sliders" element={<Protected><Sliders /></Protected>} />
        <Route path="/newsletter" element={<Protected><Newsletter /></Protected>} />
        <Route path="/users" element={<Protected><Placeholder title="Utilisateurs" sub="Gestion des comptes et droits d'accès — à venir." /></Protected>} />
        <Route path="/companies" element={<Protected><Placeholder title="Entreprises" sub="Référentiel des entreprises partenaires — à venir." /></Protected>} />
      </Routes>
    </BrowserRouter>
  )
}
