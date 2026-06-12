import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ComingSoon from './pages/ComingSoon';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"        element={<ComingSoon />} />
        <Route path="/about"   element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms"   element={<Terms />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
