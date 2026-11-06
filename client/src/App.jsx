import { Route, Routes, Link } from 'react-router-dom';
import Topbar from './components/Topbar.jsx';
import AuthModal from './components/AuthModal.jsx';
import RequireRole from './components/RequireRole.jsx';
import Home from './pages/Home.jsx';
import MyAppointments from './pages/MyAppointments.jsx';
import Pause from './pages/Pause.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ConsultRoom from './pages/ConsultRoom.jsx';
import Landing from './pages/Landing.jsx';
import About from './pages/About.jsx';
import Services from './pages/Services.jsx';
import Contact from './pages/Contact.jsx';
import Blogs from './pages/Blogs.jsx';
import BlogPost from './pages/BlogPost.jsx';
import SiteFooter from './components/site/SiteFooter.jsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/doctors" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:slug" element={<BlogPost />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pause" element={<RequireRole roles={["patient"]}><Pause /></RequireRole>} />
        <Route path="/appointments" element={<RequireRole roles={['patient']}><MyAppointments /></RequireRole>} />
        <Route path="/doctor" element={<RequireRole roles={['doctor']}><DoctorDashboard /></RequireRole>} />
        <Route path="/admin" element={<RequireRole roles={['admin']}><AdminDashboard /></RequireRole>} />
        <Route path="/consult/:id" element={<RequireRole roles={['patient', 'doctor']}><ConsultRoom /></RequireRole>} />
        <Route path="*" element={<div className="p-16 text-center"><h1 className="text-2xl font-bold">Page not found</h1><Link className="btn mt-4" to="/">Go home</Link></div>} />
      </Routes>
      <AuthModal />
      <SiteFooter />
    </div>
  );
}
