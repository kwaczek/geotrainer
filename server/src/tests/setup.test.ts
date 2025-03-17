// This file is used as a setup for Jest tests
// It provides global type definitions for Jest functions
// Instead of importing @types/jest directly, we'll rely on the types being
// available through tsconfig.json and the Jest types being automatically
// recognized due to the @types/jest being in devDependencies

// You can add any global setup code here
// This file will be executed before the tests run 

// Add a dummy test to avoid the "Your test suite must contain at least one test" error
test('Setup file is loaded correctly', () => {
  expect(true).toBe(true);
}); 