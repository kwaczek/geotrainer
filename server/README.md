# Server

## Testing

### Running Tests Manually

- Run all tests: `npm test`
- Run tests in watch mode (for development): `npm run test:watch`
- Run tests for specific files: `npm test path/to/test.ts`
- Run tests with coverage reports: `npm run test:coverage`

### Current Testing Status

Currently, 4 out of 5 test suites are passing:

- ✅ setup.test.ts
- ✅ capitalQuestions.test.ts
- ✅ capitalQuizEndpoint.test.ts
- ✅ capitalQuizFlow.test.ts
- ❌ quizResultController.test.ts (needs fixing, skipped in CI)

The quizResultController.test.ts file has mocking issues that will be fixed in future updates.

### Automatic Testing Before Commits

The project is configured with Husky and lint-staged to run tests on changed files before each commit.
This ensures that only code that passes tests can be committed.

- Pre-commit hook: The `.husky/pre-commit` file contains a script that runs `lint-staged` before each commit.
- lint-staged: The `lint-staged` configuration in `package.json` runs tests only on changed TypeScript files.
- If tests fail, the commit will be aborted.

### Continuous Integration

The project has GitHub Actions set up to automatically run tests on each push to main/master and on pull requests:

1. The workflow is defined in `.github/workflows/test.yml`
2. It runs all tests with coverage reports
3. Coverage reports are uploaded as artifacts for inspection

### Test Structure

Tests are organized in the `src/tests` directory. Current test files include:

- `setup.test.ts`: Verifies that the test environment is correctly set up.
- `capitalQuestions.test.ts`: Tests the generation of capital quiz questions.
- `capitalQuizEndpoint.test.ts`: Tests the API endpoints for the capitals quiz.
- `capitalQuizFlow.test.ts`: Tests the complete flow of the capitals quiz.
- `quizResultController.test.ts`: Tests the quiz result controller functions.

### Adding New Tests

When implementing new functionality, please add appropriate tests:

- Unit tests: Test individual functions and components in isolation.
- API tests: Test API endpoints using supertest.
- Flow tests: Test complete user flows from start to finish.
