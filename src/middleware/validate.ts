import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodObject } from 'zod';
import ApiError from '../utils/ApiError';

const validate =
  (schema: {
    body?: ZodObject<z.ZodRawShape>;
    query?: ZodObject<z.ZodRawShape>;
    params?: ZodObject<z.ZodRawShape>;
    cookies?: ZodObject<z.ZodRawShape>; // Add cookies to the schema
  }) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = await z
        .object({
          body: schema?.body || z.any(),
          query: schema?.query || z.any(),
          params: schema?.params || z.any(),
          cookies: schema?.cookies || z.any(), // Add cookies to the parsing object
        })
        .parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
          cookies: req.cookies, // Pass req.cookies to the parsing object
        });

      Object.assign(req, validatedData);
      return next();
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        const errorMessage = error.issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        const validationError: ApiError = new ApiError(400, errorMessage);
        return next(validationError);
      }
      return next(error);
    }
  };

export default validate;
