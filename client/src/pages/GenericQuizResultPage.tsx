import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { QuizType, QuestionAttempt, QuizResult } from '../types/quiz';
import { QUIZ_CONFIGS } from '../config/quizConfig';
import * as quizService from '../services/quizService';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface LocationState {
  score: number;
  total: number;
  quizType: QuizType;
  quizId: string;
  attempts: QuestionAttempt[];
}

// Enhanced QuestionAttempt with option text
interface EnhancedQuestionAttempt extends QuestionAttempt {
  selectedOptionText?: string;
  correctOptionText?: string;
}

const GenericQuizResultPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | undefined;
  
  const [score, setScore] = useState<number>(state?.score || 0);
  const [total, setTotal] = useState<number>(state?.total || 0);
  const [quizType, setQuizType] = useState<QuizType | null>(state?.quizType as QuizType || null);
  const [attempts, setAttempts] = useState<EnhancedQuestionAttempt[]>(
    state?.attempts.map(attempt => enhanceAttempt(attempt)) || []
  );
  const [loading, setLoading] = useState<boolean>(!state);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Anonymous');
  const [copied, setCopied] = useState<boolean>(false);
  
  // Set the document title for the quiz results page
  useDocumentTitle(`Quiz Results`, true);
  
  // Function to enhance attempts with option text
  function enhanceAttempt(attempt: QuestionAttempt): EnhancedQuestionAttempt {
    // This function will be called when we receive attempts from the server
    // or when we load them from state
    const enhanced: EnhancedQuestionAttempt = { ...attempt };
    
    // If we have the option text from the server, use it
    if (attempt.selectedCountryName) {
      enhanced.selectedOptionText = attempt.selectedCountryName;
    }
    
    if (attempt.correctCountryName) {
      enhanced.correctOptionText = attempt.correctCountryName;
    }
    
    return enhanced;
  }
  
  // Fetch quiz results if not provided in location state
  useEffect(() => {
    const fetchQuizResults = async () => {
      if (!quizId) {
        setError('No quiz ID provided');
        setLoading(false);
        return;
      }
      
      if (state) {
        // If we have state from navigation, use it
        console.log('Using quiz results from navigation state:', state);
        console.log('Attempts from state:', state.attempts.length);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching quiz results for ID:', quizId);
        
        const quizResult = await quizService.getQuizResult(quizId);
        console.log('Received quiz result:', quizResult);
        
        if (!quizResult) {
          setError('Quiz result not found');
          setLoading(false);
          return;
        }
        
        setQuizType(quizResult.quizType);
        setScore(quizResult.score);
        setTotal(quizResult.total);
        setUserName(quizResult.userName);
        
        // Transform server attempts to client format if needed
        const enhancedAttempts = quizResult.attempts.map(attempt => enhanceAttempt(attempt));
        console.log('Enhanced attempts:', enhancedAttempts.length);
        setAttempts(enhancedAttempts);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching quiz results:', err);
        setError('Failed to fetch quiz results');
        setLoading(false);
      }
    };
    
    fetchQuizResults();
  }, [quizId, state]);
  
  const handleCopyQuizId = () => {
    if (quizId) {
      const url = `${window.location.origin}/quiz-result/${quizId}`;
      navigator.clipboard.writeText(url)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy:', err);
        });
    }
  };
  
  const handleTryAgain = () => {
    if (quizType) {
      navigate(`/quiz/${quizType}/settings`);
    } else {
      navigate('/');
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading quiz results...</div>;
  }
  
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          Return Home
        </button>
      </div>
    );
  }
  
  const quizConfig = quizType ? QUIZ_CONFIGS[quizType] : null;
  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
  const totalTimeMs = attempts.reduce((sum, attempt) => sum + attempt.timeSpentMs, 0);
  const averageTimeMs = attempts.length > 0 ? Math.round(totalTimeMs / attempts.length) : 0;
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">
          {quizConfig?.title || 'Quiz'} Results
        </h1>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Player:</span>
            <span className="font-semibold">{userName}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Score:</span>
            <span className="font-semibold">{score} / {total}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Accuracy:</span>
            <span className="font-semibold">{accuracy}%</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700">Average Time:</span>
            <span className="font-semibold">{(averageTimeMs / 1000).toFixed(1)} seconds</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Quiz ID:</span>
            <div className="flex items-center">
              <span className="font-mono text-sm mr-2">{quizId}</span>
              <button 
                onClick={handleCopyQuizId}
                className="text-blue-600 hover:text-blue-800"
                title="Copy share link"
              >
                {copied ? '✓ Copied!' : '📋'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleTryAgain}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
          >
            New Quiz
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg"
          >
            Home
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Question Details</h2>
        
        {attempts.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No question attempts found. This could be because the quiz was not completed.
          </div>
        ) : (
          <div className="space-y-6">
            {attempts.map((attempt, index) => (
              <div key={attempt.questionId || index} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start mb-2">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-2 ${attempt.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {attempt.isCorrect ? '✓' : '✗'}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {index + 1}. {attempt.questionText}
                    </h3>
                    <div className="text-sm text-gray-600 mt-1">
                      Time: {(attempt.timeSpentMs / 1000).toFixed(1)} seconds
                    </div>
                  </div>
                </div>
                
                {attempt.imageUrl && (
                  <div className="mb-2 flex justify-center">
                    <img 
                      src={attempt.imageUrl} 
                      alt="Question" 
                      className="max-h-48 object-contain rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                
                <div className="ml-8">
                  <div className="text-sm">
                    <span className="text-gray-700">Your answer: </span>
                    <span className={attempt.isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {attempt.selectedOptionText || attempt.selectedOptionId || 'No answer'}
                    </span>
                  </div>
                  
                  {!attempt.isCorrect && (
                    <div className="text-sm">
                      <span className="text-gray-700">Correct answer: </span>
                      <span className="text-green-600 font-medium">{attempt.correctOptionText || attempt.correctOptionId}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericQuizResultPage; 