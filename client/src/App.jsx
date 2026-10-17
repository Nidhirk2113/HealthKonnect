import { Route, Routes, Link } from 'react-router-dom';
import Topbar from './components/Topbar.jsx';
import AuthModal from './components/AuthModal.jsx';
import RequireRole from './components/RequireRole.jsx';
import Home from './pages/Home.jsx';
import MyAppointments from './pages/MyAppointments.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ConsultRoom from './pages/ConsultRoom.jsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/appointments" element={<RequireRole roles={['patient']}><MyAppointments /></RequireRole>} />
        <Route path="/doctor" element={<RequireRole roles={['doctor']}><DoctorDashboard /></RequireRole>} />
        <Route path="/admin" element={<RequireRole roles={['admin']}><AdminDashboard /></RequireRole>} />
        <Route path="/consult/:id" element={<RequireRole roles={['patient', 'doctor']}><ConsultRoom /></RequireRole>} />
        <Route path="*" element={<div className="p-16 text-center"><h1 className="text-2xl font-bold">Page not found</h1><Link className="btn mt-4" to="/">Go home</Link></div>} />
      </Routes>
      <AuthModal />
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        Tulasi HealthConnect · In a mental-health emergency call 112 or Tele-MANAS 14416
      </footer>
    </div>
  );
}
