// Global Jest type definitions for all test files
import 'jest';

declare global {
  namespace jest {
    interface Mock<T = any, Y extends any[] = any[]> {
      (...args: Y): T;
      mockImplementation: (fn: (...args: Y) => T) => Mock<T, Y>;
      mockReturnValue: (val: T) => Mock<T, Y>;
      mockReturnThis: () => Mock<T, Y>;
      mockClear: () => void;
      mockReset: () => void;
      mockRestore: () => void;
    }
  }

  function describe(name: string, fn: () => void): void;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function beforeAll(fn: () => void): void;
  function afterAll(fn: () => void): void;
  function test(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function expect(actual: any): any;

  namespace jest {
    function fn<T = any>(): Mock<T>;
    function mock(moduleName: string, factory?: any): any;
    function clearAllMocks(): void;
    function requireActual(moduleName: string): any;
    function spyOn(object: any, methodName: string): any;
  }
} 