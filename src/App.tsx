import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import BookSlot from './pages/BookSlot';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import MyBooking from './pages/MyBooking';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { Toaster } from 'react-hot-toast';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
}

/** Redirect unauthenticated users away from admin routes */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

/** Admin pages — no Navbar/Footer */
function AdminLayout() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    </Routes>
  );
}

/** Public pages — with Navbar/Footer */
function AppLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ScrollToTop />
      <Navbar />
      <div style={{ flex: 1, paddingTop: '0' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/book" element={<BookSlot />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/my-booking" element={<MyBooking />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            fontFamily: 'var(--font-body)',
          },
        }}
      />
    </div>
  );
}

/** Root router — splits admin vs public based on pathname */
function RootRouter() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  return isAdmin ? <AdminLayout /> : <AppLayout />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <RootRouter />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
