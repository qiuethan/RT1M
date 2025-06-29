import { Link } from 'react-router-dom';
import { Logo } from './ui';

const Footer = () => {
  return (
    <footer className="bg-surface-900 text-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Link to="/" className="hover:opacity-80 transition-opacity cursor-pointer">
              <Logo size="sm" />
            </Link>
          </div>
          
          <div className="flex space-x-6 text-sm text-surface-400">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <a href="mailto:support@rt1m.app" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        
        <div className="border-t border-surface-800 mt-8 pt-8 text-center text-sm text-surface-400">
          <p>&copy; 2025 RT1M.app. All rights reserved. Build your wealth, secure your future.</p>
          <p className="mt-2 text-xs text-surface-500">Alpha Test Version 0.1.0</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 