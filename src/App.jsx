import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase, isAdmin } from './lib/supabase'
import './styles/global.css'

import Login from './pages/Login'
import Home from './pages/Home'
import { Hub } from './pages/Hub'
import DMP from './pages/DMP'
import Library from './pages/Library'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import Sliders from './pages/Sliders'
import Newsletter from './pages/Newsletter'
import Account from './pages/Account'
import Layout from './components/Layout'

const Placeholder = ({ title, sub, user }) => (
  <Layout user={user}>
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{title}</div>
      <p style={{ color: '#9ca3af', fontSize: 13 }}>{sub}</p>
    </div>
  </Layout>
)

function Protected({ children, user }) {
  if (user === undefined) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 13, color: '#9ca3af' }}>
      Chargement...
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Ne mettre à jour user QUE si l'identité change réellement
      // Évite les re-renders au retour d'onglet quand Supabase revalide le token
      if (event === 'TOKEN_REFRESHED') return
      setUser(prev => {
        const next = session?.user ?? null
        // Même id = même utilisateur, pas besoin de re-render
        if (prev?.id && next?.id && prev.id === next.id) return prev
        return next
      })
    })
    return () => subscription.unsubscribe()
  }, [])

  const P = ({ children }) => <Protected user={user}>{children}</Protected>
  const admin = isAdmin(user)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user && user !== undefined ? <Navigate to="/home" replace /> : <Login />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<P><Home user={user} /></P>} />
        <Route path="/hub" element={<P><Hub user={user} /></P>} />
        <Route path="/dmp" element={<P><DMP user={user} /></P>} />
        <Route path="/library" element={<P><Library user={user} /></P>} />
        <Route path="/news" element={<P><News user={user} /></P>} />
        <Route path="/news/:id" element={<P><NewsDetail user={user} /></P>} />
        <Route path="/account" element={<P><Account user={user} /></P>} />
        <Route path="/sliders" element={<P>{admin ? <Sliders user={user} /> : <Navigate to="/home" replace />}</P>} />
        <Route path="/newsletter" element={<P>{admin ? <Newsletter user={user} /> : <Navigate to="/home" replace />}</P>} />
        <Route path="/users" element={<P>{admin ? <Placeholder title="Utilisateurs" sub="Gestion des comptes et droits — à venir." user={user} /> : <Navigate to="/home" replace />}</P>} />
        <Route path="/companies" element={<P>{admin ? <Placeholder title="Entreprises" sub="Référentiel partenaires — à venir." user={user} /> : <Navigate to="/home" replace />}</P>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
