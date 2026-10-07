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
import PetManagementPage from './pages/PetManagementPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import DoctorDashboardPage from './pages/DoctorDashboardPage'
import PortalSwitch from './components/PortalSwitch'
import DoctorRecommendPage from './pages/DoctorRecommendPage'
import DoctorHospitalizedPetsPage from './pages/DoctorHospitalizedPetsPage'
import PetOwnerAdmissionsPage from './pages/PetOwnerAdmissionsPage'
import AdminAdmissionRequestsPage from './pages/AdminAdmissionRequestsPage'
import AdminHospitalizedPetsPage from './pages/AdminHospitalizedPetsPage'
import AdminMedicineRequestsPage from './pages/AdminMedicineRequestsPage'
import AdminInventoryPage from './pages/AdminInventoryPage'
import AdminCageOccupancyPage from './pages/AdminCageOccupancyPage'
import PetOwnerPortal from './pages/epic4/PetOwnerPortal'
import DoctorPortal from './pages/epic4/DoctorPortal'
import AdminHub from './pages/epic4/AdminHub'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Doctor Routes - Unified Layout */}
      <Route path="/doctor/pet/:petId/history" element={<PetMedicalHistory />} />
      <Route path="/doctor/*" element={<DoctorDashboardPage />} />
      <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
      <Route path="/doctor/portal" element={<DoctorDashboardPage />} />

      {/* Pet Owner Routes - Unified Layout */}
      <Route path="/pet-owner/*" element={<PetManagementPage />} />
      <Route path="/pet-owner/dashboard" element={<PetManagementPage />} />
      <Route path="/pet-owner/portal" element={<PetManagementPage />} />

      {/* Admin Routes - Unified Layout */}
      <Route path="/admin/*" element={<AdminDashboardPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/portal" element={<AdminDashboardPage />} />
      
      {/* Fallback redirects for old paths */}
      <Route path="/pets" element={<PetManagementPage />} />
      <Route path="/doctor-portal" element={<DoctorDashboardPage />} />
      <Route path="/admin-portal" element={<AdminDashboardPage />} />
      <Route path="/appointments" element={<PetOwnerPortal />} />
      <Route path="/invoices" element={<PetOwnerPortal />} />
      <Route path="/portal/owner" element={<PetOwnerPortal />} />
      <Route path="/portal/doctor" element={<DoctorPortal />} />
      <Route path="/portal/admin" element={<AdminHub />} />
    </Routes>
  )
}

export default App
