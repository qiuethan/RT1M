import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOnboardingProtection } from '../hooks/useOnboardingProtection';
import { Logo, Button } from './ui';
import { getUserProfile } from '../services/firestore';
import type { UserProfile } from '../services/firestore';

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { needsOnboarding } = useOnboardingProtection();
  const [userName, setUserName] = useState<string>('');
  
  // Determine if navigation should be disabled during onboarding
  const isOnboarding = Boolean(needsOnboarding);

  // Fetch user profile to get the proper name
  useEffect(() => {
    const fetchUserName = async () => {
      if (currentUser?.uid) {
        try {
          const profile = await getUserProfile();
          if (profile?.basicInfo?.name) {
            setUserName(profile.basicInfo.name);
          } else {
            // Fallback to displayName or email prefix
            const fallbackName = currentUser.displayName || currentUser.email?.split('@')[0] || '';
            setUserName(fallbackName);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Use fallback on error
          const fallbackName = currentUser.displayName || currentUser.email?.split('@')[0] || '';
          setUserName(fallbackName);
        }
      }
    };

    fetchUserName();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-xl border-b border-white/30 shadow-lg">
      <div className="container-modern">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
                <Link
            to={currentUser ? "/dashboard" : "/"} 
            className="flex items-center space-x-3 interactive-subtle group"
                >
            <div className="transform transition-transform duration-300 group-hover:scale-110">
              <Logo size="sm" />
            </div>
                </Link>

          {/* Navigation Links */}
          {currentUser && (
            <div className="hidden md:flex items-center space-x-1">
              <NavLink to="/dashboard" className="flex items-center space-x-2" disabled={isOnboarding}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
                </svg>
                <span>Dashboard</span>
              </NavLink>
              
              <NavLink to="/chatbot" className="flex items-center space-x-2" disabled={isOnboarding}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chatbot</span>
              </NavLink>

              <NavLink to="/goals" className="flex items-center space-x-2" disabled={isOnboarding}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span>Goals</span>
              </NavLink>

              <NavLink to="/profile" className="flex items-center space-x-2" disabled={isOnboarding}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </NavLink>
              </div>
            )}
          
          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-50/80 to-secondary-50/80 backdrop-blur-sm border border-primary-200/50 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-medium shadow-colored">
                    {currentUser.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-surface-800 truncate max-w-32">
                      {userName || currentUser.displayName || currentUser.email?.split('@')[0]}
                    </div>
                    <div className="text-xs text-surface-500">
                      Member
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="hover:text-error-600 hover:border-error-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                  Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm" className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {currentUser && (
        <div className="md:hidden border-t border-white/30 bg-gradient-to-r from-white/90 to-white/85 backdrop-blur-sm">
          <div className="container-modern py-2">
            <div className="flex justify-around">
              <MobileNavLink to="/dashboard" disabled={isOnboarding}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                <span>Dashboard</span>
              </MobileNavLink>
              
              <MobileNavLink to="/chatbot" disabled={isOnboarding}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chatbot</span>
              </MobileNavLink>

              <MobileNavLink to="/goals" disabled={isOnboarding}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span>Goals</span>
              </MobileNavLink>

              <MobileNavLink to="/profile" disabled={isOnboarding}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </MobileNavLink>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink: React.FC<{ to: string; children: React.ReactNode; className?: string; disabled?: boolean }> = ({
  to,
  children,
  className = "",
  disabled = false
}) => {
  if (disabled) {
    return (
      <div
        className={`px-4 py-2 text-sm font-medium text-surface-400 bg-surface-100/50 backdrop-blur-sm border border-surface-200/30 rounded-xl shadow-soft cursor-not-allowed opacity-60 ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={`px-4 py-2 text-sm font-medium text-surface-600 bg-surface-50/80 backdrop-blur-sm border border-surface-200/50 rounded-xl shadow-soft transition-all duration-300 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 hover:shadow-medium hover:scale-105 active:scale-95 ${className}`}
    >
      {children}
    </Link>
  );
};

const MobileNavLink: React.FC<{ to: string; children: React.ReactNode; disabled?: boolean }> = ({
  to,
  children,
  disabled = false
}) => {
  if (disabled) {
    return (
      <div className="flex flex-col items-center space-y-1 px-3 py-2 text-xs font-medium text-surface-400 cursor-not-allowed opacity-60">
        {children}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className="flex flex-col items-center space-y-1 px-3 py-2 text-xs font-medium text-surface-600 transition-all duration-300 hover:text-primary-600 active:scale-95"
    >
      {children}
    </Link>
  );
}; 