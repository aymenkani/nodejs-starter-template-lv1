import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';

import { getConfig } from '../config/config';
import logger from '../utils/logger';
import ApiError from '../utils/ApiError';

const config = getConfig(process.env);

/**
 * Middleware to convert any error to an instance of ApiError.
 * If the error is not an instance of ApiError, it's converted.
 * ZodErrors are converted into a 400 Bad Request ApiError.
 * Other errors are converted into a 500 Internal Server Error ApiError,
 * hiding internal details in production.
 *
 * @param {any} err - The error object.
 * @param {Request} _req - The Express request object.
 * @param {Response} _res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const errorConverter = (err: any, _req: Request, _res: Response, next: NextFunction) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message =
      statusCode === httpStatus.INTERNAL_SERVER_ERROR
        ? httpStatus[httpStatus.INTERNAL_SERVER_ERROR]
        : error.message || httpStatus[statusCode as keyof typeof httpStatus];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

/**
 * Middleware to handle ApiErrors and send a formatted JSON response.
 * It logs the error and sends a response with a status code and message.
 * In development, the response includes the error stack.
 * In production, for non-operational errors, it sends a generic 500 error message
 * to avoid leaking implementation details.
 *
 * @param {ApiError} err - The ApiError object.
 * @param {Request} _req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} _next - The next middleware function (unused).
 */

export const errorHandler = (err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR] as string;
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development' || (err.statusCode >= 500 && !err.isOperational)) {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};
