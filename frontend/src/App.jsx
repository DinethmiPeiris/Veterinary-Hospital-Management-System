import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import DoctorDashboardPage from './pages/DoctorDashboardPage'
import PetManagementPage from './pages/PetManagementPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/doctor" element={<DoctorDashboardPage />} />
      <Route path="/pets" element={<PetManagementPage />} />
    </Routes>
  )
}

export default App
