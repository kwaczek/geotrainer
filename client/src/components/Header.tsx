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
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
