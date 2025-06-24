import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';

import { Navbar } from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import HomeRoute from './components/HomeRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import Profile from './pages/Profile';
import Chatbot from './pages/Chatbot';
import Goals from './pages/Goals';
import Financials from './pages/Financials';
import Onboarding from './pages/Onboarding';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Main gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30"></div>
      
      {/* Secondary overlay gradient */}
      <div className="fixed inset-0 bg-gradient-to-tr from-primary-50/20 via-transparent to-secondary-50/20"></div>
      
      {/* Mesh gradient overlay */}
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 25%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 25% 75%, rgba(245, 158, 11, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
          `
        }}
      ></div>

      {/* Animated floating elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-gradient-to-br from-primary-100/40 to-primary-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute top-1/3 right-1/6 w-80 h-80 bg-gradient-to-br from-secondary-100/40 to-secondary-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-br from-accent-100/30 to-accent-200/15 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-gradient-to-br from-purple-100/30 to-pink-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-6000"></div>
      </div>

      <AuthProvider>
        <ChatProvider>
          <div className="relative z-10">
              <Navbar />
            
            {/* Main content with enhanced backdrop and proper spacing for mobile */}
            <main className="min-h-screen relative pt-16 md:pt-16 pb-16 md:pb-0">
              {/* Additional mobile spacing for mobile nav */}
              <div className="h-14 md:hidden"></div>
              
              {/* Content backdrop */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/20 backdrop-blur-sm"></div>
              
              <div className="relative z-10">
                <Routes>
                  <Route path="/" element={<HomeRoute />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route 
                    path="/onboarding" 
                    element={
                      <PrivateRoute>
                        <Onboarding />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/dashboard" 
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/chatbot" 
                    element={
                      <PrivateRoute>
                        <Chatbot />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/goals" 
                    element={
                      <PrivateRoute>
                        <Goals />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/financials" 
                    element={
                      <PrivateRoute>
                        <Financials />
                      </PrivateRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    } 
                  />
                </Routes>
              </div>
            </main>
          </div>
        </ChatProvider>
      </AuthProvider>
    </div>
  );
}

export default App; 