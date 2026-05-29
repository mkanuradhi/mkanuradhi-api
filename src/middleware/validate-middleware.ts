import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import AppError from '../errors/app-error';

export const validate = (schema: z.ZodType) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // format all zod errors into one readable message
      const message = result.error.issues
        .map(e => {
          const field = e.path.join('.');
          return field ? `${field}: ${e.message}` : e.message;
        })
        .join(' | ');

      return next(new AppError(message, 400));
    }

    // replace req.body with validated + coerced data (trims, defaults applied)
    req.body = result.data;
    next();
  };
};