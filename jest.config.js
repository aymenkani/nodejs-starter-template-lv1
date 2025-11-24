module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 30000,
  setupFiles: ["<rootDir>/tests/jest.setup.ts"],
  globalTeardown: './tests/globalTeardown.ts',
  setupFilesAfterEnv: ['./tests/prismaSetup.ts'],
  restoreMocks: true,
  testMatch: ['**/tests/**/*.test.(js|ts)'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globalSetup: './tests/globalSetup.js',
};