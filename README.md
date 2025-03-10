# GeoTrainer - Unified Quiz System - By Miro

## Overview

GeoTrainer is a geography quiz application that tests users' knowledge of flags, capitals, bollards, and more. This repository contains a unified quiz system that makes it easy to add new quiz types without duplicating code.

## Architecture

The unified quiz system consists of:

1. **Client-side components**:
   - `types/quiz.ts`: Core types for the quiz system
   - `config/quizConfig.ts`: Configuration for each quiz type
   - `services/quizService.ts`: API service for quiz operations
   - `components/Quiz/GenericQuizComponent.tsx`: Reusable quiz UI component
   - `pages/GenericQuizPage.tsx`: Unified quiz page for all quiz types
   - `pages/GenericQuizResultPage.tsx`: Unified quiz result page

2. **Server-side components**:
   - `controllers/unifiedQuizController.ts`: Unified controller for all quiz types
   - `routes/unifiedQuiz.ts`: Routes for the unified quiz system

## How to Add a New Quiz Type

To add a new quiz type, follow these steps:

1. **Update the QuizType enum** in `client/src/types/quiz.ts`:
   ```typescript
   export type QuizType = 'flags' | 'capitals' | 'bollards' | 'your-new-type';
   ```

2. **Add a new configuration** in `client/src/config/quizConfig.ts`:
   ```typescript
   'your-new-type': {
     type: 'your-new-type',
     title: 'Your New Quiz',
     description: 'Description of your new quiz type.',
     hasImages: true, // or false
     questionTemplate: "Your question template?",
     timeLimit: 30,
     questionsPerQuiz: 10,
     dataSource: {
       endpoint: '/api/quizzes/your-new-type',
       imageField: 'imageUrl', // if hasImages is true
       correctAnswerField: 'correctAnswer'
     }
   }
   ```

3. **Add a helper function** in `server/src/controllers/unifiedQuizController.ts`:
   ```typescript
   async function getRandomYourNewTypeQuestion(filters?: QuizFilters) {
     // Your implementation here
     // Return a question object with id, question, options, and imageUrl (if applicable)
   }
   ```

4. **Update the getNextQuestion switch statement** in `server/src/controllers/unifiedQuizController.ts`:
   ```typescript
   switch (quizType.toLowerCase()) {
     // ... existing cases
     case QuizType.YOUR_NEW_TYPE:
       question = await getRandomYourNewTypeQuestion(session.filters);
       break;
     // ...
   }
   ```

5. **Update the QuizType enum** in `server/src/models/QuizResult.ts`:
   ```typescript
   export enum QuizType {
     FLAGS = 'flags',
     CAPITALS = 'capitals',
     BOLLARDS = 'bollards',
     YOUR_NEW_TYPE = 'your-new-type'
   }
   ```

6. **Add a new link** in the `HomePage` component.

## Integration

To integrate the unified quiz system into the existing application:

1. **Register the unified quiz routes** in your server's main file:
   ```typescript
   import unifiedQuizRoutes from './routes/unifiedQuiz';
   
   // ...
   
   app.use('/api', unifiedQuizRoutes);
   ```

2. **Update the App.tsx** to use the generic components:
   ```typescript
   // ... existing imports
   import GenericQuizPage from './pages/GenericQuizPage';
   import GenericQuizResultPage from './pages/GenericQuizResultPage';
   import { QuizType } from './types/quiz';
   
   // ... existing code
   
   // In your routes:
   <Route path="/quiz/:id" element={<QuizRouter />} />
   <Route path="/quiz/:type/session/:sessionId" element={<QuizSessionRouter />} />
   <Route path="/quiz-result/:quizId" element={<GenericQuizResultPage />} />
   
   // ... existing code
   
   // Update your router components:
   const QuizRouter: React.FC = () => {
     const { id } = useParams<{ id: string }>();
     
     // Validate that the quiz type is supported
     const isValidQuizType = id && ['capitals', 'flags', 'bollards', 'your-new-type'].includes(id);
     
     if (isValidQuizType) {
       return <GenericQuizPage quizType={id as QuizType} />;
     }
     
     return <div className="p-4">Quiz type "{id}" not found or not yet implemented.</div>;
   };
   ```

## Benefits of the Unified System

1. **Single source of truth** for quiz configuration
2. **Reusable components and logic** across quiz types
3. **Easier to add new quiz types** (just add a new config)
4. **Consistent behavior** across quiz types
5. **Centralized state management**
6. **Easier testing and maintenance**

## Migration Plan

To migrate existing quiz types to the unified system:

1. Start by adding the new unified components and routes
2. Test the unified system with a new quiz type
3. Gradually migrate each existing quiz type to use the unified system
4. Remove the old, duplicated code once all quiz types are migrated
