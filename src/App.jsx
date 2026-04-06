import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './styles/global.css'

import Login from './pages/Login'
import DMP from './pages/DMP'

// Placeholder pages — à développer
const Hub = () => <div style={{padding:20}}><h2>Hub Fichiers</h2><p style={{color:'#9ca3af',marginTop:8,fontSize:13}}>Module Phase 1 — Gestion des fichiers et assets Motul Africa.</p></div>
const Library = () => <div style={{padding:20}}><h2>Motul Library</h2><p style={{color:'#9ca3af',marginTop:8,fontSize:13}}>Formulaire de demande d'accès et back-office.</p></div>
const News = () => <div style={{padding:20}}><h2>Actualités</h2><p style={{color:'#9ca3af',marginTop:8,fontSize:13}}>Gestion des articles et publication.</p></div>
const Sliders = () => <div style={{padding:20}}><h2>Sliders</h2><p style={{color:'#9ca3af',marginTop:8,fontSize:13}}>Gestion des bannières homepage.</p></div>
const Newsletter = () => <div style={{padding:20}}><h2>Newsletter</h2><p style={{color:'#9ca3af',marginTop:8,fontSize:13}}>Abonnés et export CSV.</p></div>
const Users = () => <div style={{padding:20}}><h2>Utilisateurs</h2><p style={{color:'#9ca3af',marginTop:8,fontSize:13}}>Gestion des comptes et droits.</p></div>
const Companies = () => <div style={{padding:20}}><h2>Entreprises</h2><p style={{color:'#9ca3af',marginTop:8,fontSize:13}}>Référentiel entreprises partenaires.</p></div>

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
  setAdmin(true)
}, [])

  if (user === undefined) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontSize:13,color:'#9ca3af'}}>Chargement...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [admin, setAdmin] = useState(false)

  useEffect(() => {
  setAdmin(true)
}, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/hub" replace />} />
        <Route path="/hub" element={<ProtectedRoute><Hub /></ProtectedRoute>} />
        <Route path="/dmp" element={<ProtectedRoute><DMP isAdmin={admin} /></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
        <Route path="/sliders" element={<ProtectedRoute><Sliders /></ProtectedRoute>} />
        <Route path="/newsletter" element={<ProtectedRoute><Newsletter /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
