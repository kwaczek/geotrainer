# Adding a New Quiz Type to GeoTrainer

This documentation outlines the step-by-step process for adding a new quiz type to the GeoTrainer application. The application follows a consistent pattern for implementing quiz types, making it relatively straightforward to add new ones.

## Overview

Adding a new quiz type involves changes to both the client and server sides of the application. Here's a high-level overview of the steps:

1. Define the quiz type in TypeScript types
2. Create quiz configuration
3. Create a question generator on the server
4. Add API endpoints
5. Update the client-side code to handle the new quiz type
6. Add the quiz to the homepage
7. Test the new quiz type

## Detailed Steps

### 1. Define the Quiz Type

First, add your new quiz type to the `QuizType` type definition in `client/src/types/quiz.ts`:

```typescript
export type QuizType = 'flags' | 'capitals' | 'bollards' | 'licenseplates' | 'roadsigns' | 'languages' | 'cars' | 'poles' | 'domains' | 'your-new-quiz-type';
```

### 2. Create Quiz Configuration

Add your new quiz type to the `QUIZ_CONFIGS` object in `client/src/config/quizConfig.ts`:

```typescript
export const QUIZ_CONFIGS: Record<QuizType, QuizConfig> = {
  // ... existing quiz types ...
  
  'your-new-quiz-type': {
    type: 'your-new-quiz-type',
    title: 'Your New Quiz',
    description: 'Description of your new quiz type.',
    hasImages: true, // Set to true if your quiz includes images
    questionTemplate: "Your question template here?",
    timeLimit: 30,
    questionsPerQuiz: 10,
    dataSource: {
      endpoint: '/api/quiz-questions/your-new-quiz-type',
      imageField: 'imageUrl', // Only needed if hasImages is true
      correctAnswerField: 'countryName'
    }
  },
};
```

### 3. Create a Question Generator on the Server

Create a new file in `server/src/controllers/quiz/generators/yourNewQuizTypeQuestions.ts`:

```typescript
import mongoose from 'mongoose';
import YourModel from '../../../models/YourModel';
import { QuizFilters, QuizQuestion } from '../types';

/**
 * Generate a random question for your new quiz type
 */
export async function getRandomYourNewQuizTypeQuestion(filters?: QuizFilters, previousEntityIds: string[] = []): Promise<QuizQuestion> {
  // Define your base query
  let baseQuery: any = {};
  
  // Apply filters if provided
  if (filters) {
    if (filters.continent && filters.continent !== 'all') {
      baseQuery.continent = filters.continent;
    }
    
    if (filters.in_geoguessr) {
      baseQuery.in_geoguessr = true;
    }
    
    // Add any custom filters specific to your quiz type
  }
  
  // Create a query for the correct answer that excludes previously seen entities
  let correctAnswerQuery = { ...baseQuery };
  
  // Filter out entities that were used in previous questions
  if (previousEntityIds.length > 0) {
    const objectIds = previousEntityIds.map(id => {
      try {
        return new mongoose.Types.ObjectId(id);
      } catch (e) {
        return id;
      }
    });
    correctAnswerQuery._id = { $nin: objectIds };
  }
  
  // Get a random entity for the correct answer
  const correctEntityCandidates = await YourModel.aggregate([
    { $match: correctAnswerQuery },
    { $sample: { size: 1 } }
  ]);
  
  // Handle case where no entities are available with exclusion filter
  let correctEntity;
  if (!correctEntityCandidates || correctEntityCandidates.length === 0) {
    if (previousEntityIds.length > 0) {
      console.log('No entities found with exclusion filter for correct answer, retrying without excluding previous entities');
      const fallbackEntities = await YourModel.aggregate([
        { $match: baseQuery },
        { $sample: { size: 1 } }
      ]);
      
      if (!fallbackEntities || fallbackEntities.length === 0) {
        throw new Error('No entities found with the specified filters');
      }
      
      correctEntity = fallbackEntities[0];
    } else {
      throw new Error('No entities found with the specified filters');
    }
  } else {
    correctEntity = correctEntityCandidates[0];
  }
  
  // Get random entities for incorrect options
  const incorrectOptionsQuery = { 
    ...baseQuery,
    _id: { $ne: correctEntity._id }
  };
  
  const incorrectEntities = await YourModel.aggregate([
    { $match: incorrectOptionsQuery },
    { $sample: { size: 3 } }
  ]);
  
  // Handle case where not enough incorrect options are available
  if (incorrectEntities.length < 3) {
    console.log(`Only found ${incorrectEntities.length} incorrect entities with filters, getting more with relaxed filters`);
    
    // Simplified query that just excludes the correct entity
    const fallbackQuery: any = { 
      _id: { $ne: correctEntity._id }
    };
    
    // Keep any in_geoguessr filter if it was specified
    if (filters?.in_geoguessr) {
      fallbackQuery.in_geoguessr = true;
    }
    
    const additionalEntities = await YourModel.aggregate([
      { $match: fallbackQuery },
      { $sample: { size: 3 - incorrectEntities.length } }
    ]);
    
    incorrectEntities.push(...additionalEntities);
  }
  
  // Combine correct and incorrect options
  const allOptions = [
    {
      id: correctEntity._id.toString(),
      text: correctEntity.name, // Adjust field name as needed
      isCorrect: true
    },
    ...incorrectEntities.map(entity => ({
      id: entity._id.toString(),
      text: entity.name, // Adjust field name as needed
      isCorrect: false
    }))
  ];
  
  // Shuffle the options
  for (let i = allOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
  }
  
  return {
    id: new mongoose.Types.ObjectId().toString(),
    question: `Your question text here?`, // Customize based on your quiz type
    imageUrl: correctEntity.imageUrl, // Include if your quiz has images
    options: allOptions,
    metadata: {
      entityId: correctEntity._id.toString(), // Important for tracking previous questions
      // Add any other metadata needed for your quiz type
    }
  };
}
```

### 4. Export the Question Generator

Add your new question generator to the index file in `server/src/controllers/quiz/generators/index.ts`:

```typescript
// ... existing imports ...
import { getRandomYourNewQuizTypeQuestion } from './yourNewQuizTypeQuestions';

export {
  // ... existing exports ...
  getRandomYourNewQuizTypeQuestion
};
```

### 5. Update the Question Controller

Add your new quiz type to the question controller in `server/src/controllers/quiz/questionController.ts`:

```typescript
// In the getNextQuestion function, add your quiz type to the switch statement:
switch (quizType.toLowerCase()) {
  // ... existing cases ...
  case QuizType.YOUR_NEW_QUIZ_TYPE:
    question = await getRandomYourNewQuizTypeQuestion(session.filters, previousEntityIds);
    break;
  // ...
}
```

### 6. Add API Endpoints

Create a new controller file for your quiz type in `server/src/controllers/yourNewQuizTypeController.ts`:

```typescript
import { Request, Response } from 'express';
import YourModel from '../models/YourModel';

/**
 * Get count of entities for your new quiz type
 * @route GET /api/your-new-quiz-type/count
 */
export const getCount = async (req: Request, res: Response) => {
  try {
    // Build query based on request filters
    const query: any = {};
    
    // Apply continent filter if provided
    if (req.query.continent && req.query.continent !== 'all') {
      query.continent = req.query.continent;
    }
    
    // Apply in_geoguessr filter if provided
    if (req.query.in_geoguessr === 'true') {
      query.in_geoguessr = true;
    }
    
    // Add any other filters specific to your quiz type
    
    // Get count of entities matching the query
    const count = await YourModel.countDocuments(query);
    
    return res.json({
      success: true,
      count
    });
  } catch (error: any) {
    console.error('Error getting count:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get count',
      error: error.message
    });
  }
};

/**
 * Get all entities for your new quiz type
 * @route GET /api/your-new-quiz-type
 */
export const getAll = async (req: Request, res: Response) => {
  try {
    // Build query based on request filters
    const query: any = {};
    
    // Apply continent filter if provided
    if (req.query.continent && req.query.continent !== 'all') {
      query.continent = req.query.continent;
    }
    
    // Apply in_geoguessr filter if provided
    if (req.query.in_geoguessr === 'true') {
      query.in_geoguessr = true;
    }
    
    // Add any other filters specific to your quiz type
    
    // Get entities matching the query
    const entities = await YourModel.find(query);
    
    return res.json({
      success: true,
      entities
    });
  } catch (error: any) {
    console.error('Error getting entities:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get entities',
      error: error.message
    });
  }
};

// Add any other controller functions needed for your quiz type
```

### 7. Add Routes

Create a new route file for your quiz type in `server/src/routes/yourNewQuizTypeRoutes.ts`:

```typescript
import express from 'express';
import * as yourNewQuizTypeController from '../controllers/yourNewQuizTypeController';

const router = express.Router();

// Get count of entities
router.get('/count', yourNewQuizTypeController.getCount);

// Get all entities
router.get('/', yourNewQuizTypeController.getAll);

// Add any other routes needed for your quiz type

export default router;
```

### 8. Register the Routes

Add your new routes to the main routes file in `server/src/routes/index.ts`:

```typescript
import express from 'express';
// ... existing imports ...
import yourNewQuizTypeRoutes from './yourNewQuizTypeRoutes';

const router = express.Router();

// ... existing route registrations ...

// Your new quiz type routes
router.use('/api/your-new-quiz-type', yourNewQuizTypeRoutes);

export default router;
```

### 9. Update the QuizType Enum in the Server

Add your new quiz type to the QuizType enum in `server/src/models/QuizResult.ts`:

```typescript
export enum QuizType {
  FLAGS = 'flags',
  CAPITALS = 'capitals',
  BOLLARDS = 'bollards',
  LICENSEPLATES = 'licenseplates',
  ROADSIGNS = 'roadsigns',
  LANGUAGES = 'languages',
  CARS = 'cars',
  POLES = 'poles',
  DOMAINS = 'domains',
  YOUR_NEW_QUIZ_TYPE = 'your-new-quiz-type'
}
```

### 10. Update the Client-Side Code

#### 10.1. Update the GenericQuizPage.tsx

Add your new quiz type to the entity ID handling in `client/src/pages/GenericQuizPage.tsx`:

```typescript
// In the handleAnswer function, add a case for your new quiz type:
else if (quizType === 'your-new-quiz-type') {
  // For your new quiz type, get the entity ID from metadata
  if (currentQuestion.metadata && currentQuestion.metadata.entityId) {
    const entityId = String(currentQuestion.metadata.entityId);
    if (entityId && !previousEntityIds.includes(entityId)) {
      setPreviousEntityIds(prev => [...prev, entityId]);
      console.log(`Adding entity ID to exclusion list for ${quizType}: ${entityId} (${correctOption.text})`);
    }
  }
}
```

#### 10.2. Update the QuizSettingsPage.tsx

Add your new quiz type to the localStorage settings in `client/src/pages/QuizSettingsPage.tsx`:

```typescript
// In the loadSettingsFromStorage function:
if (quizType === 'flags' || quizType === 'capitals' ||
    quizType === 'bollards' || quizType === 'licenseplates' ||
    quizType === 'roadsigns' || quizType === 'languages' || 
    quizType === 'cars' || quizType === 'poles' || 
    quizType === 'domains' || quizType === 'your-new-quiz-type') {
  // ...
}

// In the saveSettings function:
if (quizType && (quizType === 'flags' || quizType === 'capitals' ||
                 quizType === 'bollards' || quizType === 'licenseplates' ||
                 quizType === 'roadsigns' || quizType === 'languages' || 
                 quizType === 'cars' || quizType === 'poles' || 
                 quizType === 'domains' || quizType === 'your-new-quiz-type')) {
  // ...
}
```

#### 10.3. Update the fetchMaxQuestionCount function in QuizSettingsPage.tsx

Add your new quiz type to the endpoint selection in the fetchMaxQuestionCount function:

```typescript
let endpoint = '';
if (quizType === 'flags' || quizType === 'capitals' || quizType === 'domains') {
  endpoint = '/api/countries/count';
} else if (quizType === 'bollards') {
  endpoint = '/api/bollards/count';
} else if (quizType === 'licenseplates') {
  endpoint = '/api/licenseplates/count';
} else if (quizType === 'roadsigns') {
  endpoint = '/api/roadsigns/count';
} else if (quizType === 'languages') {
  endpoint = '/api/languages/count';
} else if (quizType === 'cars') {
  endpoint = '/api/google-cars/count';
} else if (quizType === 'poles') {
  endpoint = '/api/poles/count';
} else if (quizType === 'your-new-quiz-type') {
  endpoint = '/api/your-new-quiz-type/count';
}
```

### 11. Add the Quiz to the Homepage

Update the HomePage.tsx file to include your new quiz type:

```typescript
// In the fetchQuizCounts function:
const [countriesRes, bollardsRes, licenseplatesRes, roadsignsRes, languagesRes, carsRes, polesRes, yourNewQuizTypeRes] = await Promise.all([
  axios.get('/api/countries/count'),
  axios.get('/api/bollards/count'),
  axios.get('/api/licenseplates/count'),
  axios.get('/api/roadsigns/count'),
  axios.get('/api/languages/count'),
  axios.get('/api/google-cars/count'),
  axios.get('/api/poles/count'),
  axios.get('/api/your-new-quiz-type/count')
]);

// Add your new quiz type to the quizCards array:
const quizCards = [
  // ... existing quiz cards ...
  {
    title: 'Your New Quiz',
    description: 'Description of your new quiz type.',
    icon: '🆕', // Choose an appropriate emoji
    path: '/quiz/your-new-quiz-type',
    count: yourNewQuizTypeCount
  }
];
```

### 12. Test Your New Quiz Type

1. Start the server: `npm run dev` in the server directory
2. Start the client: `npm start` in the client directory
3. Navigate to your new quiz type from the homepage
4. Test the quiz functionality:
   - Verify that questions are generated correctly
   - Verify that filters work as expected
   - Verify that the quiz remembers settings in localStorage
   - Verify that the quiz doesn't repeat questions

## Troubleshooting

### Common Issues

1. **Quiz doesn't appear on the homepage**: Check that you've added it to the quizCards array in HomePage.tsx.

2. **"Invalid quiz type" error**: Ensure your quiz type is added to the QuizType enum in both client and server code.

3. **No questions generated**: Check your question generator function and ensure your database has data for your quiz type.

4. **Same question repeats**: Ensure you're properly handling previousEntityIds in both the client and server code.

5. **Filters don't work**: Check that your controller properly applies filters to the database query.

## Example: Adding a "Mountains" Quiz Type

Here's a concrete example of adding a "Mountains" quiz type:

1. Add 'mountains' to the QuizType type in client/src/types/quiz.ts
2. Add a mountains configuration to QUIZ_CONFIGS in client/src/config/quizConfig.ts
3. Create a mountainsQuestions.ts file in server/src/controllers/quiz/generators/
4. Add the mountains question generator to the index.ts export
5. Add the mountains case to the switch statement in questionController.ts
6. Create a mountainsController.ts file with getCount and getAll functions
7. Create mountainsRoutes.ts and register the routes
8. Add MOUNTAINS to the QuizType enum in server/src/models/QuizResult.ts
9. Update GenericQuizPage.tsx to handle the mountains quiz type
10. Update QuizSettingsPage.tsx to include mountains in localStorage settings
11. Add mountains to the fetchMaxQuestionCount function
12. Add the mountains quiz to the homepage
13. Test the mountains quiz functionality

## Conclusion

Adding a new quiz type to GeoTrainer involves several steps, but the process is consistent across all quiz types. By following this guide, you can extend the application with new quiz types that follow the same patterns as the existing ones.

Remember to test thoroughly after adding a new quiz type to ensure it works correctly with all the existing functionality.
