import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);

import dotenv from 'dotenv';
import path from 'path';

process.env.NODE_ENV = 'test';
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Mock the 'uuid' module to prevent SyntaxError with ES modules in Jest
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'a-mocked-uuid-string-12345'),
}));
