import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import PetOwnerPortal from './pages/epic4/PetOwnerPortal'
import DoctorPortal from './pages/epic4/DoctorPortal'
import AdminHub from './pages/epic4/AdminHub'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* Epic 4: Appointment Scheduling, Billing & Payment Management */}
      <Route path="/appointments" element={<PetOwnerPortal />} />
      <Route path="/invoices" element={<PetOwnerPortal />} />
      <Route path="/portal/owner" element={<PetOwnerPortal />} />
      <Route path="/portal/doctor" element={<DoctorPortal />} />
      <Route path="/portal/admin" element={<AdminHub />} />
    </Routes>
  )
}

export default App
