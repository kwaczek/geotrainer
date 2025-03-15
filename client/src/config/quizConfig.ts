import { QuizConfig, QuizType } from '../types/quiz';

export const QUIZ_CONFIGS: Record<QuizType, QuizConfig> = {
  flags: {
    type: 'flags',
    title: 'Flags Quiz',
    description: 'Test your knowledge of country flags from around the world.',
    hasImages: true,
    questionTemplate: "Which country does this flag belong to?",
    timeLimit: 30,
    questionsPerQuiz: 10,
    dataSource: {
      endpoint: '/api/quiz-questions/flags',
      imageField: 'imageUrl',
      correctAnswerField: 'countryName'
    }
  },
  capitals: {
    type: 'capitals',
    title: 'Capitals Quiz',
    description: 'Test your knowledge of capital cities from around the world.',
    hasImages: false,
    questionTemplate: "What is the capital of {country}?",
    timeLimit: 30,
    questionsPerQuiz: 10,
    dataSource: {
      endpoint: '/api/quiz-questions/capitals',
      correctAnswerField: 'capitalName'
    }
  },
  bollards: {
    type: 'bollards',
    title: 'Bollards Quiz',
    description: 'Test your knowledge of bollards from around the world.',
    hasImages: true,
    questionTemplate: "In which country can you find this bollard?",
    timeLimit: 30,
    questionsPerQuiz: 10,
    dataSource: {
      endpoint: '/api/quiz-questions/bollards',
      imageField: 'imageUrl',
      correctAnswerField: 'countryName'
    }
  },
  licenseplates: {
    type: 'licenseplates',
    title: 'License Plates Quiz',
    description: 'Test your knowledge of license plates from around the world.',
    hasImages: true,
    questionTemplate: "In which country can you find this license plate?",
    timeLimit: 30,
    questionsPerQuiz: 10,
    dataSource: {
      endpoint: '/api/quiz-questions/licenseplates',
      imageField: 'imageUrl',
      correctAnswerField: 'countryName'
    }
  }
}; 