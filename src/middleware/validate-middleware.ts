import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import AppError from '../errors/app-error';

type ValidateTarget = "body" | "params" | "query";

export const validate = (schema: z.ZodType, target: ValidateTarget = "body") => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      // format all zod errors into one readable message
      const message = result.error.issues
        .map(e => {
          const field = e.path.join('.');
          return field ? `${field}: ${e.message}` : e.message;
        })
        .join(' | ');

      next(new AppError(message, 400));
      return;
    }

    // replace req.body with validated + coerced data (trims, defaults applied)
    req[target] = result.data;
    next();
  };
}
