import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';

const BollardsPage: React.FC = () => {
  useDocumentTitle('Bollards', true);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Bollards</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <p className="text-gray-600 text-center text-lg">
          This page will contain information about bollards from different countries.
        </p>
        <p className="text-gray-600 text-center mt-4">
          Coming soon!
        </p>
      </div>
    </div>
  );
};

export default BollardsPage; 