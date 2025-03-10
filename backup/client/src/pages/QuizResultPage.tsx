import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface QuizResultPageProps {
  // Props can be empty as we'll get data from location state or URL params
}

interface QuestionAttempt {
  questionId: string;
  question: string;
  options?: any[];
  selectedOptionId: string | null;
  selectedCountryName?: string;
  correctCountryName?: string;
  isCorrect: boolean;
  timeSpentMs: number;
  imageUrl?: string;
}

interface LocationState {
  score: number;
  total: number;
  quizType: string;
  quizId: string;
  attempts: QuestionAttempt[];
}

const QuizResultPage: React.FC<QuizResultPageProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quizId: urlQuizId } = useParams<{ quizId: string }>();
  const dataFetchedRef = useRef(false);
  
  // Get state from location or initialize empty
  const locationState = location.state as LocationState | null;
  
  const [quizId, setQuizId] = useState<string | null>(locationState?.quizId || urlQuizId || null);
  const [score, setScore] = useState<number>(locationState?.score || 0);
  const [total, setTotal] = useState<number>(locationState?.total || 0);
  const [quizType, setQuizType] = useState<string>(locationState?.quizType || 'capitals');
  const [attempts, setAttempts] = useState<QuestionAttempt[]>(locationState?.attempts || []);
  const [loading, setLoading] = useState<boolean>(!locationState && !!urlQuizId);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Fetch quiz results if we have a quizId from URL but no state
  useEffect(() => {
    const fetchQuizResults = async () => {
      if (!urlQuizId || dataFetchedRef.current || locationState) return;
      
      try {
        setLoading(true);
        dataFetchedRef.current = true;
        
        console.log('Fetching quiz results for ID:', urlQuizId);
        const response = await axios.get(`/api/quiz-results/${urlQuizId}`);
        console.log('Raw server response:', response.data);
        
        if (response.data && response.data.result) {
          const quizData = response.data.result;
          console.log('Quiz data:', quizData);
          
          setQuizId(quizData.quizId);
          setScore(quizData.score || quizData.totalScore || 0);
          setTotal(quizData.total || quizData.totalQuestions || 0);
          setQuizType(quizData.type || 'capitals');
          
          // Transform server attempts to client format if available
          if (quizData.questionAttempts && quizData.questionAttempts.length > 0) {
            console.log('Server questionAttempts:', quizData.questionAttempts);
            const clientAttempts = quizData.questionAttempts.map((attempt: any) => ({
              questionId: attempt.questionId,
              question: attempt.questionText,
              selectedOptionId: attempt.selectedCountryId,
              selectedCountryName: attempt.selectedCountryName,
              correctCountryName: attempt.correctCountryName,
              isCorrect: attempt.isCorrect,
              timeSpentMs: attempt.timeSpentMs,
              imageUrl: attempt.imageUrl
            }));
            
            console.log('Transformed client attempts:', clientAttempts);
            setAttempts(clientAttempts);
          } else {
            console.log('No attempts found in response');
            setAttempts([]);
            if (!quizData.isCompleted) {
              setError('This quiz has not been completed yet.');
            } else {
              setError('No question attempts found for this quiz.');
            }
          }
        } else {
          console.error('Invalid response format:', response.data);
          setError('Quiz results not found');
        }
      } catch (err) {
        console.error('Failed to fetch quiz results:', err);
        setError('Failed to load quiz results. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizResults();
  }, [urlQuizId, locationState]);

  // Add debug logging for render
  console.log('Current quiz type:', quizType);
  console.log('Current attempts:', attempts);

  const handleCopyQuizId = () => {
    if (!quizId) return;
    
    navigator.clipboard.writeText(quizId)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy quiz ID:', err);
      });
  };

  const handleTryAgain = () => {
    navigate(`/quiz/${quizType}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={handleTryAgain}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          Start New Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Quiz Results</h1>
        
        <div className="mb-6">
          <div className="text-xl">
            Final Score: <span className="font-bold">{score}</span> / {total}
          </div>
          <div className="text-lg mt-2">
            Percentage: <span className="font-bold">{Math.round((score / total) * 100)}%</span>
          </div>
        </div>
        
        {quizId && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Quiz ID:</div>
                <div className="font-mono text-sm">{quizId}</div>
              </div>
              <button
                onClick={handleCopyQuizId}
                className={`px-4 py-2 rounded-md text-sm ${
                  copySuccess 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copySuccess ? 'Copied!' : 'Copy ID'}
              </button>
            </div>
          </div>
        )}
        
        <button
          onClick={handleTryAgain}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          Try Again
        </button>
      </div>
      
      {attempts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Question Summary</h2>
          
          <div className="space-y-4">
            {attempts.map((attempt, index) => (
              <div 
                key={`${attempt.questionId}-${index}`}
                className={`p-4 rounded-md ${
                  attempt.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold">Question {index + 1}</div>
                  <div className={`text-sm ${attempt.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {attempt.isCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                </div>
                <div className="mb-2">{attempt.question}</div>
                {(quizType === 'flags' || quizType === 'bollards') && attempt.imageUrl && (
                  <div className="mb-3">
                    <img 
                      src={attempt.imageUrl} 
                      alt={quizType === 'flags' ? "Country Flag" : "Bollard"} 
                      className={`${
                        quizType === 'flags' 
                          ? 'h-16 w-24 object-cover' 
                          : 'h-24 w-auto max-w-full object-contain'
                      } border border-gray-300 rounded-md shadow-sm`}
                    />
                  </div>
                )}
                <div className="text-sm space-y-1">
                  <div>
                    Your answer: <span className={attempt.isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {attempt.selectedCountryName || 'No answer'}
                    </span>
                  </div>
                  {!attempt.isCorrect && (
                    <div>
                      Correct answer: <span className="text-green-600">{attempt.correctCountryName}</span>
                    </div>
                  )}
                  <div className="text-gray-500">
                    Time spent: {Math.round(attempt.timeSpentMs / 1000)} seconds
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizResultPage;
