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
  },
  roadsigns: {
    type: 'roadsigns',
    title: 'Road Signs Quiz',
    description: 'Test your knowledge of road signs from around the world.',
    hasImages: true,
    questionTemplate: "In which country can you find this road sign?",
    timeLimit: 30,
    questionsPerQuiz: 10,
    dataSource: {
      endpoint: '/api/quiz-questions/roadsigns',
      imageField: 'imageUrl',
      correctAnswerField: 'countryName'
    }
  },
  languages: {
    type: 'languages',
    title: 'Languages Quiz',
    description: 'Identify the country associated with a given language/script.',
    hasImages: true,
    questionTemplate: "Which country is primarily associated with this language/script?",
    timeLimit: 30,
    questionsPerQuiz: 10,
    dataSource: {
      endpoint: '/api/quiz-questions/languages',
      imageField: 'imageUrl',
      correctAnswerField: 'countryName'
    }
  },
  cars: {
    type: 'cars',
    title: 'Google Cars Quiz',
    description: 'Identify countries by the Google Street View car.',
    hasImages: true,
    questionTemplate: "In which country can you find this Google Street View car?",
    timeLimit: 30,
    questionsPerQuiz: 10,
    dataSource: {
      endpoint: '/api/quiz-questions/cars',
      imageField: 'imageUrl',
      correctAnswerField: 'countryName'
    }
  },
  poles: {
    type: 'poles',
    title: 'Poles Quiz',
    description: 'Test your knowledge of utility poles from around the world.',
    hasImages: true,
    questionTemplate: "In which country can you find this utility pole?",
    timeLimit: 30,
    questionsPerQuiz: 10,
    dataSource: {
      endpoint: '/api/quiz-questions/poles',
      imageField: 'imageUrl',
      correctAnswerField: 'countryName'
    }
  },
  domains: {
    type: 'domains',
    title: 'Domains Quiz',
    description: 'Test your knowledge of country domain names (TLDs).',
    hasImages: false,
    questionTemplate: "Which country uses this domain?",
    timeLimit: 30,
    questionsPerQuiz: 10,
    dataSource: {
      endpoint: '/api/quiz-questions/domains',
      correctAnswerField: 'countryName'
    }
  },
  currencies: {
    type: 'currencies',
    title: 'Currencies Quiz',
    description: 'Test your knowledge of currencies used around the world.',
    hasImages: false,
    questionTemplate: "Which country uses this currency?",
    timeLimit: 30,
    questionsPerQuiz: 10,
    dataSource: {
      endpoint: '/api/quiz-questions/currencies',
      correctAnswerField: 'countryName'
    }
  },
  phoneprefixes: {
    type: 'phoneprefixes',
    title: 'Phone Prefixes Quiz',
    description: 'Test your knowledge of country phone prefixes from around the world.',
    hasImages: false,
    questionTemplate: "Which country uses this phone prefix?",
    timeLimit: 30,
    questionsPerQuiz: 10,
    dataSource: {
      endpoint: '/api/quiz-questions/phoneprefixes',
      correctAnswerField: 'countryName'
    }
  }
};