import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-blue-200 transition-colors">
          GeoTrainer
        </Link>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link to="/practice" className="hover:text-blue-200 transition-colors">
                Practice
              </Link>
            </li>
            <li>
              <Link to="/stats" className="hover:text-blue-200 transition-colors">
                Stats
              </Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-blue-200 transition-colors">
                Profile
              </Link>
            </li>
            
            {isAuthenticated && isAdmin && (
              <li className="relative group">
                <span className="hover:text-blue-200 transition-colors cursor-pointer">
                  Admin
                </span>
                <div className="absolute hidden group-hover:block bg-blue-700 p-2 rounded shadow-lg right-0 w-48 z-10">
                  <Link to="/admin/countries" className="block py-1 px-2 hover:bg-blue-600 rounded transition-colors">
                    Country Admin
                  </Link>
                  <Link to="/admin/bollards" className="block py-1 px-2 hover:bg-blue-600 rounded transition-colors">
                    Bollard Admin
                  </Link>
                  <Link to="/admin/licenseplates" className="block py-1 px-2 hover:bg-blue-600 rounded transition-colors">
                    License Plate Admin
                  </Link>
                </div>
              </li>
            )}
            
            <li>
              {isAuthenticated ? (
                <button 
                  onClick={handleLogout}
                  className="hover:text-blue-200 transition-colors"
                >
                  Logout
                </button>
              ) : (
                <button 
                  onClick={handleLoginClick}
                  className="hover:text-blue-200 transition-colors"
                >
                  Login
                </button>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
