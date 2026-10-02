import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DoctorRecommendPage from './pages/DoctorRecommendPage'
import DoctorHospitalizedPetsPage from './pages/DoctorHospitalizedPetsPage'
import PetOwnerAdmissionsPage from './pages/PetOwnerAdmissionsPage'
import AdminAdmissionRequestsPage from './pages/AdminAdmissionRequestsPage'
import AdminHospitalizedPetsPage from './pages/AdminHospitalizedPetsPage'
import AdminMedicineRequestsPage from './pages/AdminMedicineRequestsPage'
import AdminInventoryPage from './pages/AdminInventoryPage'
import AdminCageOccupancyPage from './pages/AdminCageOccupancyPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Pet Admission, Hospitalization & Inventory Management Routes */}
      <Route path="/doctor/recommend-admission" element={<DoctorRecommendPage />} />
      <Route path="/doctor/hospitalized-pets" element={<DoctorHospitalizedPetsPage />} />
      <Route path="/pet-owner/admissions" element={<PetOwnerAdmissionsPage />} />
      <Route path="/admin/admission-requests" element={<AdminAdmissionRequestsPage />} />
      <Route path="/admin/hospitalized-pets" element={<AdminHospitalizedPetsPage />} />
      <Route path="/admin/medicine-requests" element={<AdminMedicineRequestsPage />} />
      <Route path="/admin/inventory" element={<AdminInventoryPage />} />
      <Route path="/admin/cage-occupancy" element={<AdminCageOccupancyPage />} />
    </Routes>
  )
}

export default App
