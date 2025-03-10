# Migration Plan for Unified Quiz System

## What We've Created

1. **Core Types and Interfaces**:
   - `client/src/types/quiz.ts`: Defines all the types used in the quiz system
   - `client/src/config/quizConfig.ts`: Configuration for each quiz type

2. **Client-Side Components**:
   - `client/src/services/quizService.ts`: Unified API service for all quiz operations
   - `client/src/components/Quiz/GenericQuizComponent.tsx`: Reusable quiz UI component
   - `client/src/pages/GenericQuizPage.tsx`: Unified quiz page for all quiz types
   - `client/src/pages/GenericQuizResultPage.tsx`: Unified quiz result page

3. **Server-Side Components**:
   - `server/src/controllers/unifiedQuizController.ts`: Unified controller for all quiz types
   - `server/src/routes/unifiedQuiz.ts`: Routes for the unified quiz system

4. **Documentation**:
   - `README.md`: Overview of the unified quiz system and how to integrate it

## Migration Steps

### Phase 1: Setup and Testing

1. **Register the unified routes** in the server's main file
2. **Update the App.tsx** to use the generic components alongside existing ones
3. **Test the unified system** with a new quiz type or by duplicating an existing one

### Phase 2: Migrate Existing Quiz Types

1. **Flags Quiz**:
   - Update the HomePage to link to the unified flags quiz
   - Test thoroughly to ensure all functionality works
   - Remove the old FlagsQuizPage once confirmed working

2. **Capitals Quiz**:
   - Update the HomePage to link to the unified capitals quiz
   - Test thoroughly to ensure all functionality works
   - Remove the old CapitalsQuizPage once confirmed working

3. **Bollards Quiz**:
   - Update the HomePage to link to the unified bollards quiz
   - Test thoroughly to ensure all functionality works
   - Remove the old BollardsQuizPage once confirmed working

### Phase 3: Cleanup and Optimization

1. **Remove old controllers**:
   - `quizController.ts`
   - `bollardQuizController.ts`
   - Any other quiz-specific controllers

2. **Remove old routes**:
   - Any quiz-specific routes that are now handled by the unified system

3. **Update models** if necessary to align with the unified system

4. **Optimize the unified controller** based on performance testing

### Phase 4: Add New Quiz Types

Once the migration is complete, adding new quiz types becomes much simpler:

1. Add the new quiz type to the QuizType enum
2. Add a new configuration in quizConfig.ts
3. Add a helper function in unifiedQuizController.ts to generate questions
4. Update the switch statement in getNextQuestion
5. Add a new link in the HomePage

## Testing Strategy

For each quiz type migration:

1. **Functional Testing**:
   - Quiz initialization
   - Question fetching
   - Answer submission
   - Quiz completion
   - Result display

2. **Edge Cases**:
   - Session restoration
   - Error handling
   - Filter application

3. **Performance Testing**:
   - Load time
   - Response time
   - Memory usage

## Rollback Plan

If issues are encountered during migration:

1. Keep both systems running in parallel
2. Use feature flags to control which system is used
3. If major issues are found, revert to the old system until fixed

## Timeline

- **Phase 1**: 1-2 days
- **Phase 2**: 3-5 days (1-2 days per quiz type)
- **Phase 3**: 1-2 days
- **Phase 4**: Ongoing as new quiz types are added 