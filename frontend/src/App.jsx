import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DoctorLayout from './pages/doctor/layout/DoctorLayout'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import PetMedicalHistory from './pages/doctor/workflow/PetMedicalHistory'
import ConsultationPage from './pages/doctor/workflow/ConsultationPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Doctor Routes */}
      <Route path="/doctor" element={<DoctorLayout />}>
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="pet/:petId/history" element={<PetMedicalHistory />} />
        <Route path="consultation/:appointmentId" element={<ConsultationPage />} />
      </Route>
    </Routes>
  )
}

export default App
