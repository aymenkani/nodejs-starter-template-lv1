module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFiles: ["<rootDir>/tests/jest.setup.ts"],
  globalTeardown: './tests/globalTeardown.ts',
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.ts'],
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  restoreMocks: true,
  coveragePathIgnorePatterns: ['node_modules', 'src/config', 'src/app.ts', 'tests'],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  testMatch: ['**/tests/**/*.test.(js|ts)'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globalSetup: './tests/globalSetup.js',
};