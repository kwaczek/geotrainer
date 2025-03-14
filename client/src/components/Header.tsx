import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
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
            <li className="relative group">
              <span className="hover:text-blue-200 transition-colors cursor-pointer">
                Admin
              </span>
              <div className="absolute hidden group-hover:block bg-blue-700 p-2 rounded shadow-lg right-0 w-48 z-10">
                <Link to="/admin/bollards" className="block py-1 px-2 hover:bg-blue-600 rounded transition-colors">
                  Bollard Admin
                </Link>
                <Link to="/admin/licenseplates" className="block py-1 px-2 hover:bg-blue-600 rounded transition-colors">
                  License Plate Admin
                </Link>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
