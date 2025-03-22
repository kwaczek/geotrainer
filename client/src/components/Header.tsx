import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-blue-200 transition-colors">
          GeoPrep
        </Link>
        <nav>
          <ul className="flex space-x-6">
            <li className="relative group">
              <span className="hover:text-blue-200 transition-colors cursor-pointer flex items-center" onClick={toggleMenu}>
                Learn
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className={`absolute ${isMenuOpen ? 'block' : 'hidden'} group-hover:block bg-blue-700 p-2 rounded shadow-lg left-0 w-48 z-10`}>
                <Link to="/countries" className="block py-1 px-2 hover:bg-blue-600 rounded transition-colors">
                  Countries
                </Link>
                <Link to="/bollards" className="block py-1 px-2 hover:bg-blue-600 rounded transition-colors">
                  Bollards
                </Link>
                <Link to="/plates" className="block py-1 px-2 hover:bg-blue-600 rounded transition-colors">
                  Plates
                </Link>
              </div>
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
