import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import './App.css';

// Import actual components
import HomePage from './pages/HomePage';
import GenericQuizPage from './pages/GenericQuizPage';
import GenericQuizResultPage from './pages/GenericQuizResultPage';
import QuizSettingsPage from './pages/QuizSettingsPage';
import BollardAdmin from './pages/BollardAdmin';
import LicensePlateAdmin from './pages/LicensePlateAdmin';
import CountryAdmin from './pages/CountryAdmin';
import RoadSignAdmin from './pages/RoadSignAdmin';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { QuizType } from './types/quiz';

// New learning pages
import CountriesPage from './pages/CountriesPage';
import CountryDetailPage from './pages/CountryDetailPage';
import BollardsPage from './pages/BollardsPage';
import PlatesPage from './pages/PlatesPage';
import RoadSignsPage from './pages/RoadSignsPage';
import ContributePage from './pages/ContributePage';

// Placeholder components for now
const Footer = () => <div className="bg-blue-500 p-2 text-white text-xs text-center">© {new Date().getFullYear()} GeoPrep</div>;
const RegisterPage = () => <div className="p-4">Register Page Placeholder</div>;
const ProfilePage = () => <div className="p-4">Profile Page Placeholder</div>;
const NotFoundPage = () => <div className="p-4">404 - Page Not Found</div>;

// Generic quiz router component
const QuizRouter: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Validate that the quiz type is supported
  const isValidQuizType = id && ['capitals', 'flags', 'bollards', 'licenseplates', 'roadsigns'].includes(id);
  
  // For roadsigns, immediately navigate to a session URL to ensure consistency
  useEffect(() => {
    if (isValidQuizType) {
      // Generate a UUID for the session - using a consistent method
      const uuid = crypto.randomUUID ? crypto.randomUUID() : 
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      
      // Navigate to the session URL with the state preserved
      navigate(`/quiz/${id}/session/${uuid}`, { 
        replace: true,
        state: location.state
      });
    }
  }, [id, navigate, location.state, isValidQuizType]);
  
  if (isValidQuizType) {
    return <GenericQuizPage quizType={id as QuizType} />;
  }
  
  return <div className="p-4">Quiz type "{id}" not found or not yet implemented.</div>;
};

// Quiz session router component
const QuizSessionRouter: React.FC = () => {
  const { type, sessionId } = useParams<{ type: string; sessionId: string }>();
  
  // Validate that the quiz type is supported
  const isValidQuizType = type && ['capitals', 'flags', 'bollards', 'licenseplates', 'roadsigns'].includes(type);
  
  if (isValidQuizType && sessionId) {
    return <GenericQuizPage quizType={type as QuizType} sessionId={sessionId} />;
  }
  
  return <div className="p-4">Quiz session not found or not yet implemented.</div>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-indigo-100 to-blue-100">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/contribute" element={<ContributePage />} />
              
              {/* Learning Pages */}
              <Route path="/countries" element={<CountriesPage />} />
              <Route path="/countries/:id" element={<CountryDetailPage />} />
              <Route path="/bollards" element={<BollardsPage />} />
              <Route path="/plates" element={<PlatesPage />} />
              <Route path="/roadsigns" element={<RoadSignsPage />} />
              
              {/* Quiz Routes */}
              <Route path="/quiz/:id" element={<QuizRouter />} />
              <Route path="/quiz/:quizType/settings" element={<QuizSettingsPage />} />
              <Route path="/quiz/:type/session/:sessionId" element={<QuizSessionRouter />} />
              <Route path="/quiz/result" element={<GenericQuizResultPage />} />
              <Route path="/quiz-result/:quizId" element={<GenericQuizResultPage />} />
              
              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute requireAdmin={true} />}>
                <Route path="/admin/bollards" element={<BollardAdmin />} />
                <Route path="/admin/licenseplates" element={<LicensePlateAdmin />} />
                <Route path="/admin/countries" element={<CountryAdmin />} />
                <Route path="/admin/roadsigns" element={<RoadSignAdmin />} />
              </Route>
              
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
