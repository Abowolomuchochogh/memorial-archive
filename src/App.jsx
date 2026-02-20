import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Archive = lazy(() => import('./pages/Archive'));
const MemorialDetail = lazy(() => import('./pages/MemorialDetail'));
const Upload = lazy(() => import('./pages/Upload'));
const Chat = lazy(() => import('./pages/Chat'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CommunityGuidelines = lazy(() => import('./pages/CommunityGuidelines'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Notifications = lazy(() => import('./pages/Notifications'));

// Global loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center">
      <div className="relative w-14 h-14 mb-4">
        <div className="absolute inset-0 border-4 border-forest-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-forest-700 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-forest-700 font-medium text-sm">Loading...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/memorial/:id" element={<MemorialDetail />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/chat/:chatId" element={<Chat />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />

              <Route path="/guidelines" element={<CommunityGuidelines />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
