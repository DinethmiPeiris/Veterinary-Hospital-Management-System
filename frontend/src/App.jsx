import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DoctorLayout from './pages/doctor/layout/DoctorLayout'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import PetMedicalHistory from './pages/doctor/workflow/PetMedicalHistory'
import ConsultationPage from './pages/doctor/workflow/ConsultationPage'
import PetOwnerLayout from './pages/petowner/layout/PetOwnerLayout'
import PetOwnerDashboard from './pages/petowner/PetOwnerDashboard'
import PetOwnerConsultations from './pages/petowner/PetOwnerConsultations'
import PetOwnerMedicalHistory from './pages/petowner/PetOwnerMedicalHistory'
import AdminLayout from './pages/admin/layout/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminConsultationList from './pages/admin/AdminConsultationList'
import AdminReports from './pages/admin/AdminReports'
import AdminServiceManagement from './pages/admin/AdminServiceManagement'
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

      {/* Pet Owner Routes */}
      <Route path="/pet-owner" element={<PetOwnerLayout />}>
        <Route path="dashboard" element={<PetOwnerDashboard />} />
        <Route path="consultations" element={<PetOwnerConsultations />} />
        <Route path="medical-history" element={<PetOwnerMedicalHistory />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="consultations" element={<AdminConsultationList />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="services" element={<AdminServiceManagement />} />
      </Route>
    </Routes>
  )
}

export default App
