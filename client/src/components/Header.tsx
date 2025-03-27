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
    <header className="bg-blue-500 text-white p-3 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold hover:text-blue-100 transition-colors">
            GeoPrep
          </Link>
          <p className="ml-2 text-xs text-blue-100 hidden md:block">Quiz and Preparation for GeoGuessr</p>
        </div>
        <nav>
          <ul className="flex items-center space-x-6">
            <li className="relative group">
              <span className="hover:text-blue-100 transition-colors cursor-pointer flex items-center text-sm" onClick={toggleMenu}>
                Learn
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className={`absolute ${isMenuOpen ? 'block' : 'hidden'} group-hover:block bg-blue-600 p-2 rounded shadow-lg left-0 w-40 z-10`}>
                <Link to="/countries" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  Countries
                </Link>
                <Link to="/bollards" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  Bollards
                </Link>
                <Link to="/plates" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  Plates
                </Link>
                <Link to="/roadsigns" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  Road Signs
                </Link>
              </div>
            </li>
            
            {isAuthenticated && isAdmin && (
              <li className="relative group">
                <span className="hover:text-blue-100 transition-colors cursor-pointer text-sm">
                  Admin
                </span>
                <div className="absolute hidden group-hover:block bg-blue-600 p-2 rounded shadow-lg right-0 w-40 z-10">
                  <Link to="/admin/countries" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                    Country Admin
                  </Link>
                  <Link to="/admin/bollards" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                    Bollard Admin
                  </Link>
                  <Link to="/admin/licenseplates" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                    License Plate Admin
                  </Link>
                  <Link to="/admin/roadsigns" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                    Road Sign Admin
                  </Link>
                  <Link to="/admin/data-migration" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                    Data Migration
                  </Link>
                </div>
              </li>
            )}
            
            <li>
              {isAuthenticated ? (
                <button 
                  onClick={handleLogout}
                  className="hover:text-blue-100 transition-colors text-sm"
                >
                  Logout
                </button>
              ) : (
                <button 
                  onClick={handleLoginClick}
                  className="hover:text-blue-100 transition-colors text-sm"
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
