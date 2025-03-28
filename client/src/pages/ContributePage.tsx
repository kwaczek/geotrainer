import React from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';

const ContributePage: React.FC = () => {
  // Set the document title
  useDocumentTitle('Contribute to GeoTrainer', true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Help Expand GeoTrainer!</h1>
        
        <p className="text-gray-700 mb-4">
          Want to contribute content to our growing collection of quizzes? I've made it super easy!
        </p>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Easy-to-Use Admin Pages</h2>
          <p className="text-blue-700">
            You don't need any coding skills. Our admin pages allow you to add new quiz items simply by uploading a screenshot (or image) and adding a short description or answer. That's it!
          </p>
          <img 
            src="/admin-screenshot.png" 
            alt="Screenshot of the GeoTrainer admin page for adding content" 
            className="mt-4 rounded-lg shadow-md border border-gray-200"
          />
        </div>

        <p className="text-gray-700 mb-4">
          My focus is on the coding and technical side of GeoTrainer, building new features and improving the platform. By contributing content, you help the site grow faster and allow me to focus on development.
        </p>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-6">
          <h2 className="text-xl font-semibold text-green-800 mb-2">Get in Touch!</h2>
          <p className="text-green-700 mb-2">
            If you're interested in helping out, please reach out:
          </p>
          <ul className="list-disc list-inside text-green-700 space-y-1">
            <li>
              Discord: <span className="font-semibold">kwaczek</span>
            </li>
            <li>
              Reddit: Discuss on the <a href="https://www.reddit.com/r/geoguessr/comments/1jcm67f/yet_another_bollard_and_more_quiz_test_it_if_you/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">GeoGuessr subreddit post</a>
            </li>
          </ul>
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/" 
            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ContributePage; 