# Testing the Unified Quiz System

## Setup

1. **Start the server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Start the client**:
   ```bash
   cd client
   npm start
   ```

## Testing Steps

1. **Test the API endpoints directly**:
   ```bash
   # Initialize a quiz session
   curl -X POST http://localhost:3002/api/quiz-sessions -H "Content-Type: application/json" -d '{"type":"capitals","userName":"TestUser","filters":{"continent":"all","in_geoguessr":false}}'
   
   # Get a question (replace SESSION_ID with the ID from the previous response)
   curl -X GET "http://localhost:3002/api/quiz-questions/capitals?sessionId=SESSION_ID"
   
   # Submit an answer (replace SESSION_ID, QUESTION_ID, and OPTION_ID with actual values)
   curl -X POST http://localhost:3002/api/quiz-answers/capitals -H "Content-Type: application/json" -d '{"sessionId":"SESSION_ID","questionId":"QUESTION_ID","selectedOptionId":"OPTION_ID","isCorrect":true,"timeSpentMs":5000}'
   
   # Complete a quiz (replace SESSION_ID with the actual value)
   curl -X POST http://localhost:3002/api/quiz-sessions/SESSION_ID/complete -H "Content-Type: application/json" -d '{"type":"capitals"}'
   ```

2. **Test the UI**:
   - Navigate to http://localhost:3002
   - Click on "Capitals" or any other quiz type
   - Verify that the quiz loads correctly
   - Answer questions and verify that the answers are recorded
   - Complete the quiz and verify that the results page displays correctly

## Troubleshooting

If you encounter 404 errors, make sure:

1. The server is running on port 3002
2. The unified quiz routes are registered in `server/src/routes/index.ts`
3. The API endpoints match those in `client/src/services/quizService.ts`

If you encounter TypeScript errors:

1. Make sure the controller functions have the correct type signatures
2. Make sure the route handlers are properly typed

## Next Steps

Once the unified quiz system is working:

1. Test each quiz type thoroughly
2. Migrate the existing quiz types one by one
3. Remove the old, duplicated code
4. Add new quiz types using the unified system 