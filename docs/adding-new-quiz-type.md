# Adding a New Quiz Type to GeoTrainer

This documentation outlines the step-by-step process for adding a new quiz type to the GeoTrainer application. The application follows a consistent pattern for implementing quiz types, making it relatively straightforward to add new ones.

## Overview

Adding a new quiz type involves changes to both the client and server sides of the application. Here's a high-level overview of the steps:

1. Define the quiz type in TypeScript types
2. Create quiz configuration
3. Create a question generator on the server
4. Add API endpoints
5. Update the client-side code to handle the new quiz type
6. Update settings storage for the new quiz type
7. Add the quiz to the homepage
8. Test the new quiz type

**IMPORTANT**: Make sure to follow ALL steps in this guide. Missing any step can lead to errors or unexpected behavior.

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

#### 10.1. Update the App.tsx

Add your new quiz type to the validation checks in `client/src/App.tsx`:

```typescript
// Update both instances of isValidQuizType in App.tsx
const isValidQuizType = id && ['capitals', 'flags', 'bollards', 'licenseplates', 'roadsigns', 'languages', 'cars', 'poles', 'domains', 'your-new-quiz-type'].includes(id);
```

#### 10.2. Update the GenericQuizPage.tsx

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

#### 10.3. Update the QuizSettingsPage.tsx

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

#### 10.4. Update the fetchMaxQuestionCount function in QuizSettingsPage.tsx

Add your new quiz type to the endpoint selection in the fetchMaxQuestionCount function:

```typescript
let endpoint = '';
if (quizType === 'flags' || quizType === 'capitals' || quizType === 'domains' || quizType === 'your-new-quiz-type') {
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
}
```

#### 10.5. Add Special Filters to QuizSettingsPage.tsx

If your quiz type needs special filters (like `has_domain` for domains or `has_currency` for currencies), add them to the params object in the fetchMaxQuestionCount function:

```typescript
// Add special filter for your quiz type
if (quizType === 'your-new-quiz-type') {
  params.has_your_special_property = true;
}
```

Also update the handleStartQuiz function to include your special filter:

```typescript
// Add special filter for your quiz type
if (quizType === 'your-new-quiz-type') {
  filters.has_your_special_property = true;
}
```

#### 10.6. Update the Header Icon in QuizSettingsPage.tsx

Add your quiz type to the emoji display in the header:

```typescript
{quizConfig.type === 'capitals' ? '🏙️' :
 quizConfig.type === 'flags' ? '🏳️' :
 // ... other quiz types ...
 quizConfig.type === 'your-new-quiz-type' ? '🆕' : '❓'}
```

### 11. Update Settings Storage

Update the settings storage in `client/src/utils/settingsStorage.ts` to include your new quiz type:

```typescript
// 1. Add your quiz type to the DEFAULT_SETTINGS object
const DEFAULT_SETTINGS: Record<QuizType, QuizSettings> = {
  // ... existing quiz types ...
  'your-new-quiz-type': {
    timerEnabled: true,
    timerDuration: 30,
    questionCount: 10,
    writeMode: false,
    continent: 'all',
    in_geoguessr: false,
    blurred: false,
    blurIntensity: 15,
    types: []
  }
};

// 2. Update the getAllSettings function to include your quiz type
const mergedSettings = {
  // ... existing quiz types ...
  'your-new-quiz-type': { ...DEFAULT_SETTINGS['your-new-quiz-type'], ...(parsedSettings['your-new-quiz-type'] || {}) }
};
```

This step is **CRITICAL** - if you miss it, you'll get TypeScript errors and the quiz settings page won't work correctly.

### 12. Add the Quiz to the Homepage

Update the HomePage.tsx file to include your new quiz type:

```typescript
// 1. Update the QuizCounts interface
interface QuizCounts {
  // ... existing properties ...
  yourNewQuizType: number;
}

// 2. Update the initial state
const [quizCounts, setQuizCounts] = useState<QuizCounts>({
  // ... existing properties ...
  yourNewQuizType: 0
});

// 3. Update the categories array
const categories: QuizCategory[] = [
  // ... existing categories ...
  {
    id: 'your-new-quiz-type',
    name: 'Your New Quiz',
    description: 'Description of your new quiz type.',
    icon: '🆕',
    supportsFilters: true,
    category: 'general' // or 'geoguessr' depending on the category
  }
];

// 4. Update the fetchQuizCounts function
setQuizCounts({
  // ... existing properties ...
  yourNewQuizType: yourNewQuizTypeRes.data.success ? yourNewQuizTypeRes.data.count : 0
});

// 5. Update the getCategoryCount function
const getCategoryCount = (categoryId: string): number => {
  if (categoryId === 'flags' || categoryId === 'capitals' || categoryId === 'domains' || categoryId === 'your-new-quiz-type') {
    return quizCounts.countries;
  } else if (categoryId === 'bollards') {
    return quizCounts.bollards;
  }
  // ... other cases ...
};

// 6. Add styling for your quiz type (optional)
switch(category.id) {
  // ... existing cases ...
  case 'your-new-quiz-type':
    bgGradient = 'from-purple-50 to-purple-100';
    iconBg = 'bg-purple-100';
    buttonBg = 'bg-purple-500';
    buttonHover = 'hover:bg-purple-600';
    break;
}
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

1. **TypeScript errors about missing quiz type in Record<QuizType, QuizSettings>**:
   - You forgot to update the `DEFAULT_SETTINGS` object in `settingsStorage.ts`
   - You forgot to update the `mergedSettings` object in the `getAllSettings` function

2. **"No questions available with current filters" error**:
   - Check that your question generator is working correctly
   - Check that you've added any special filters needed (like `has_currency` or `has_domain`)
   - Check that you've updated the `fetchMaxQuestionCount` function in `QuizSettingsPage.tsx`
   - Verify that your database has data for your quiz type

3. **Quiz doesn't appear on the homepage**:
   - Check that you've added it to the categories array in `HomePage.tsx`
   - Check that you've updated the `QuizCounts` interface and state
   - Check that you've updated the `getCategoryCount` function

4. **"Invalid quiz type" error**:
   - Ensure your quiz type is added to the `QuizType` type in `client/src/types/quiz.ts`
   - Ensure your quiz type is added to the `QuizType` enum in `server/src/models/QuizResult.ts`
   - Check that you've updated the validation in `App.tsx`

5. **No questions generated**:
   - Check your question generator function
   - Ensure your database has data for your quiz type
   - Check the server logs for errors

6. **Same question repeats**:
   - Ensure you're properly handling `previousEntityIds` in both the client and server code
   - Check that your question generator is correctly excluding previously seen entities

7. **Filters don't work**:
   - Check that your controller properly applies filters to the database query
   - Ensure you've added any special filters needed for your quiz type

## Example: Adding a "Currencies" Quiz Type

Here's a concrete example of adding a "Currencies" quiz type that tests users on matching currencies to countries:

1. **Define the Quiz Type**
   - Add 'currencies' to the QuizType type in `client/src/types/quiz.ts`
   - Add CURRENCIES to the QuizType enum in `server/src/models/QuizResult.ts`

2. **Create Quiz Configuration**
   - Add a currencies configuration to QUIZ_CONFIGS in `client/src/config/quizConfig.ts`:
     ```typescript
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
     }
     ```

3. **Create a Question Generator**
   - Create `currencyQuestions.ts` in `server/src/controllers/quiz/generators/`
   - Implement the `getRandomCurrencyQuestion` function that:
     - Queries countries with currency information
     - Applies filters (continent, in_geoguessr)
     - Handles countries with multiple currencies
     - Formats the question with currency name, symbol, and code
     - Returns a properly formatted question object

4. **Export the Question Generator**
   - Add the import and export for the currency question generator in `server/src/controllers/quiz/generators/index.ts`

5. **Update the Question Controller**
   - Add a case for CURRENCIES in the switch statement in `server/src/controllers/quiz/questionController.ts`
   - Update the validation to include the new quiz type

6. **Update the Country Controller**
   - Add a `has_currency` filter to the `getCountryCount` function in `server/src/controllers/countryController.ts`

7. **Update the Client-Side Code**
   - Add 'currencies' to the isValidQuizType check in `App.tsx`
   - Add a case for currencies in the handleAnswer function in `GenericQuizPage.tsx`
   - Update the QuizSettingsPage.tsx:
     - Add 'currencies' to the supported quiz types list
     - Add a special filter for currencies quiz
     - Update the handleStartQuiz function
     - Add the currencies emoji to the header display

8. **Update Settings Storage**
   - Add default settings for currencies in `client/src/utils/settingsStorage.ts`:
     ```typescript
     currencies: {
       timerEnabled: true,
       timerDuration: 30,
       questionCount: 10,
       writeMode: false,
       continent: 'all',
       in_geoguessr: false,
       blurred: false,
       blurIntensity: 15,
       types: []
     }
     ```
   - Update the getAllSettings function to include currencies

9. **Add the Quiz to the Homepage**
   - Add currencies to the QuizCounts interface and state
   - Add the currencies quiz to the categories array
   - Update the fetchQuizCounts function
   - Add currencies to the getCategoryCount function
   - Add styling for the currencies quiz card

10. **Test the Implementation**
    - Verify that the quiz appears on the homepage
    - Test that questions are generated correctly
    - Verify that filters work properly
    - Check that the quiz doesn't repeat questions

## Conclusion

Adding a new quiz type to GeoTrainer involves several steps, but the process is consistent across all quiz types. By following this guide, you can extend the application with new quiz types that follow the same patterns as the existing ones.

**IMPORTANT REMINDERS:**

1. **Follow ALL steps in this guide** - Missing any step can lead to errors or unexpected behavior.

2. **Don't forget to update settings storage** - This is a critical step that's easy to miss. Always update both:
   - The `DEFAULT_SETTINGS` object in `settingsStorage.ts`
   - The `mergedSettings` object in the `getAllSettings` function

3. **Add special filters if needed** - If your quiz type requires special filtering (like `has_currency`), make sure to:
   - Add it to the `fetchMaxQuestionCount` function in `QuizSettingsPage.tsx`
   - Add it to the `handleStartQuiz` function in `QuizSettingsPage.tsx`
   - Add it to the relevant controller on the server side

4. **Test thoroughly** - After adding a new quiz type, test all aspects:
   - Verify it appears on the homepage
   - Test that questions are generated correctly
   - Check that filters work properly
   - Verify that settings are saved and loaded correctly
   - Ensure that questions don't repeat

By carefully following this guide and testing thoroughly, you can successfully add new quiz types to the GeoTrainer application.
