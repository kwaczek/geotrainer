import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLearnMenuOpen, setIsLearnMenuOpen] = useState(false);
  const [isSourcesMenuOpen, setIsSourcesMenuOpen] = useState(false);

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

  const openLearnMenu = () => {
    setIsLearnMenuOpen(true);
    setIsSourcesMenuOpen(false); // Close other menu
  };

  const closeLearnMenu = () => {
    setIsLearnMenuOpen(false);
  };

  const openSourcesMenu = () => {
    setIsSourcesMenuOpen(true);
    setIsLearnMenuOpen(false); // Close other menu
  };

  const closeSourcesMenu = () => {
    setIsSourcesMenuOpen(false);
  };

  return (
    <header className="bg-blue-500 text-white p-3 shadow-md relative z-30">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold hover:text-blue-100 transition-colors">
            GeoPrep
          </Link>
          <p className="ml-2 text-xs text-blue-100 hidden md:block">Quiz and Preparation for GeoGuessr</p>
        </div>
        <nav>
          <ul className="flex items-center space-x-6">
            <li className="relative" onMouseEnter={openLearnMenu} onMouseLeave={closeLearnMenu}>
              <span className="hover:text-blue-100 transition-colors cursor-pointer flex items-center text-sm">
                Learn
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className={`absolute ${isLearnMenuOpen ? 'block' : 'hidden'} bg-blue-600 p-2 rounded shadow-lg left-0 w-40 z-50`}>
                <Link to="/countries" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  Countries
                </Link>
                <Link to="/bollards" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  Bollards
                </Link>
                <Link to="/poles" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  Poles
                </Link>
                <Link to="/google-cars" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  Google Cars
                </Link>
                <Link to="/plates" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  Plates
                </Link>
                <Link to="/roadsigns" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  Road Signs
                </Link>
                <Link to="/languages" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  Languages
                </Link>
              </div>
            </li>
            
            <li className="relative" onMouseEnter={openSourcesMenu} onMouseLeave={closeSourcesMenu}>
              <span className="hover:text-blue-100 transition-colors cursor-pointer flex items-center text-sm">
                Sources
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
              <div className={`absolute ${isSourcesMenuOpen ? 'block' : 'hidden'} bg-blue-600 p-3 rounded shadow-lg left-0 w-64 z-50`}>
                <p className="text-xs text-blue-200 mb-2">
                  Much of the quiz content, including images and descriptions, is based on information gathered from these invaluable community resources. Thank you to all contributors!
                </p>
                <a href="https://geohints.com/" target="_blank" rel="noopener noreferrer" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  GeoHints <span className="text-xs text-blue-300 block">Comprehensive GeoGuessr meta guide.</span>
                </a>
                <a href="https://www.plonkit.net/" target="_blank" rel="noopener noreferrer" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  Plonk It <span className="text-xs text-blue-300 block">GeoGuessr community site with guides & leaderboards.</span>
                </a>
                <a href="https://learnablemeta.com/" target="_blank" rel="noopener noreferrer" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                  LearnableMeta <span className="text-xs text-blue-300 block">Learn GeoGuessr meta with guides and maps.</span>
                </a>
                <hr className="border-blue-500 my-2" />
                <div className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-200">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.317 4.3698C18.699 3.5048 16.919 2.8898 15 2.5098C15 2.5098 14.919 2.6298 14.85 2.7398C13.439 4.0598 12.43 5.7398 11.999 7.5098C10.02 7.5098 8.04 6.4198 6.45 4.7198C6.45 4.7198 6.35 4.6098 6.25 4.6098C4.149 5.3198 2.3 6.4198 0.75 7.9998C0.75 7.9998 0.63 8.1498 0.75 8.3098C2.45 10.7698 4.77 12.4198 7.5 13.4198C7.5 13.4198 7.62 13.5298 7.75 13.4198C8.07 13.1798 8.37 12.9098 8.65 12.6198C8.65 12.6198 8.62 12.5698 8.5 12.4698C8.27 12.3098 8.04 12.1498 7.83 11.9798C7.83 11.9798 7.75 11.9198 7.75 11.7898C7.72 11.7298 7.7 11.6598 7.68 11.5998C4.23 11.7998 1.5 10.1498 1.5 10.1498C1.5 10.0198 1.62 9.9198 1.75 9.9198C4.13 9.1498 6.25 9.5998 6.25 9.5998C6.37 9.6298 6.45 9.7298 6.43 9.8498C6.07 11.0398 5.55 12.5998 5.55 12.5998C5.55 12.7198 5.63 12.8298 5.75 12.8298C6.99 13.3098 8.25 13.5598 9.48 13.6198C9.48 13.6198 9.6 13.6198 9.64 13.5098C10.15 11.6598 11.08 9.5598 11.08 9.5598C11.08 9.4398 11.18 9.3298 11.3 9.3298C11.43 9.3298 11.52 9.4398 11.52 9.5598C11.52 9.5598 12.45 11.6598 12.96 13.5098C13 13.6198 13.13 13.6198 13.13 13.6198C14.38 13.5598 15.63 13.3098 16.88 12.8298C17 12.8298 17.08 12.7198 17.08 12.5998C17.08 12.5998 16.56 11.0398 16.2 9.8498C16.18 9.7298 16.25 9.6298 16.38 9.5998C16.38 9.5998 18.5 9.1498 20.88 9.9198C21 9.9198 21.13 10.0198 21.13 10.1498C21.13 10.1498 18.39 11.7998 14.94 11.5998C14.91 11.6598 14.89 11.7198 14.88 11.7898C14.88 11.9198 14.8 11.9798 14.8 11.9798C14.59 12.1498 14.36 12.3098 14.13 12.4698C14.01 12.5698 13.98 12.6198 13.98 12.6198C14.26 12.9098 14.56 13.1798 14.88 13.4198C15 13.5298 15.13 13.4198 15.13 13.4198C17.86 12.4198 20.18 10.7698 21.88 8.3098C22 8.1498 21.88 7.9998 21.88 7.9998C20.33 6.4198 18.54 5.3198 16.43 4.6098C16.33 4.6098 16.23 4.7198 16.23 4.7198C14.64 6.4198 12.66 7.5098 10.69 7.5098C10.26 5.7398 9.249 4.0598 7.839 2.7398C7.77 2.6298 7.689 2.5098 7.689 2.5098C9.479 2.8898 11.259 3.5048 12.879 4.3698C12.999 4.4198 13.049 4.5498 13.019 4.6598C12.789 5.4898 12.479 6.5898 12.019 7.9198C12.019 7.9198 11.899 8.0398 11.739 8.0398C11.629 8.0398 11.519 7.9898 11.449 7.8998C11.049 7.4198 10.629 6.9198 10.189 6.4198C10.189 6.4198 10.039 6.2598 9.829 6.2598C9.619 6.2598 9.469 6.4198 9.469 6.4198C8.989 7.0098 8.479 7.6598 8.049 8.3298C8.049 8.3298 7.969 8.4798 7.829 8.5098C7.689 8.5398 7.559 8.4798 7.489 8.3698C7.079 7.7998 6.719 7.1698 6.399 6.4798C6.399 6.4798 6.239 6.1598 5.919 6.1598C5.719 6.1598 5.529 6.3298 5.529 6.5398C5.529 6.7498 5.569 6.9598 5.629 7.1698C6.249 9.7198 8.869 10.4198 8.869 10.4198C8.999 10.4498 9.089 10.5698 9.069 10.6898C8.979 11.1698 8.829 11.8098 8.829 11.8098C8.829 11.9298 8.709 12.0298 8.579 12.0298C8.519 12.0298 8.449 12.0098 8.399 11.9498C7.569 11.0698 6.529 10.3098 5.399 9.7398C5.269 9.6798 5.109 9.7398 5.029 9.8698C4.949 9.9998 4.979 10.1698 5.099 10.2698C5.129 10.2998 5.149 10.3198 5.179 10.3398C6.159 11.0298 7.129 11.5398 8.069 11.8698C8.189 11.9198 8.239 12.0498 8.199 12.1598C7.939 12.8698 7.649 13.6998 7.339 14.6298C7.339 14.6298 7.219 14.7798 7.019 14.7798C6.819 14.7798 6.669 14.6298 6.669 14.6298C6.149 13.6098 5.689 12.6298 5.309 11.7398C5.309 11.7398 5.189 11.4398 4.859 11.3898C4.529 11.3398 4.249 11.5598 4.209 11.8898C4.169 12.2198 4.379 12.5098 4.709 12.5598C4.919 12.5898 5.129 12.5398 5.309 12.4298C5.389 12.5498 5.459 12.6698 5.519 12.7798C6.039 13.9498 6.709 14.9598 7.519 15.7798C9.189 17.3398 11.429 18.1398 13.539 18.1898C13.539 18.1898 13.629 18.3098 13.509 18.4198C12.939 18.9198 12.299 19.3498 11.609 19.6998C11.609 19.6998 11.489 19.8098 11.609 19.9298C12.869 20.6198 14.189 20.9898 15.549 21.0698C16.909 20.9898 18.229 20.6198 19.489 19.9298C19.609 19.8098 19.489 19.6998 19.489 19.6998C18.799 19.3498 18.159 18.9198 17.589 18.4198C17.479 18.3098 17.569 18.1898 17.569 18.1898C19.679 18.1398 21.919 17.3398 23.599 15.7798C24.399 14.9598 25.069 13.9498 25.599 12.7798C25.649 12.6698 25.719 12.5498 25.809 12.4298C25.979 12.5398 26.189 12.5898 26.399 12.5598C26.739 12.5098 26.949 12.2198 26.909 11.8898C26.869 11.5598 26.589 11.3398 26.259 11.3898C25.929 11.4398 25.809 11.7398 25.809 11.7398C25.429 12.6298 24.969 13.6098 24.449 14.6298C24.449 14.6298 24.329 14.7798 24.129 14.7798C23.929 14.7798 23.779 14.6298 23.779 14.6298C23.469 13.6998 23.179 12.8698 22.919 12.1598C22.879 12.0498 22.929 11.9198 23.049 11.8698C23.989 11.5398 24.959 11.0298 25.939 10.3398C25.969 10.3198 25.989 10.2998 26.019 10.2698C26.139 10.1698 26.169 9.9998 26.089 9.8698C25.969 9.7398 25.809 9.6798 25.679 9.7398C24.549 10.3098 23.509 11.0698 22.679 11.9498C22.629 12.0098 22.559 12.0298 22.499 12.0298C22.369 12.0298 22.249 11.9298 22.249 11.8098C22.249 11.8098 22.109 11.1698 22.019 10.6898C21.999 10.5698 22.089 10.4498 22.219 10.4198C22.219 10.4198 24.839 9.7198 25.459 7.1698C25.519 6.9598 25.559 6.7498 25.559 6.5398C25.559 6.3298 25.369 6.1598 25.169 6.1598C24.849 6.1598 24.689 6.4798 24.689 6.4798C24.369 7.1698 24.009 7.7998 23.599 8.3698C23.529 8.4798 23.399 8.5398 23.259 8.5098C23.119 8.4798 23.039 8.3298 23.039 8.3298C22.609 7.6598 22.099 7.0098 21.619 6.4198C21.619 6.4198 21.469 6.2598 21.259 6.2598C21.049 6.2598 20.899 6.4198 20.899 6.4198C20.459 6.9198 20.039 7.4198 19.639 7.8998C19.569 7.9898 19.459 8.0398 19.349 8.0398C19.189 8.0398 19.069 7.9198 19.069 7.9198C18.609 6.5898 18.299 5.4898 18.069 4.6598C18.039 4.5498 18.089 4.4198 18.209 4.3698Z"/>
                  </svg>
                  <span>Thanks to evevemue for content contributions.</span>
                </div>
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
                  <Link to="/admin/poles" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                    Pole Admin
                  </Link>
                  <Link to="/admin/licenseplates" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                    License Plate Admin
                  </Link>
                  <Link to="/admin/roadsigns" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                    Road Signs Admin
                  </Link>
                  <Link to="/admin/languages" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                    Language Admin
                  </Link>
                  <Link to="/admin/google-cars" className="block py-1 px-2 hover:bg-blue-700 rounded transition-colors text-sm">
                    Google Car Admin
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
