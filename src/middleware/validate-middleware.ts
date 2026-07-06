import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import AppError from '../errors/app-error';

type ValidateTarget = "body" | "params" | "query";

const formatPath = (path: (string | number)[]): string => {
  return path
    .map((segment, i) => {
      if (typeof segment === 'number') {
        return `#${segment + 1}`;
      }
      // prepend dot if there's any previous segment
      return i > 0 ? `.${segment}` : segment;
    })
    .join('');
};

export const validate = (schema: z.ZodType, target: ValidateTarget = "body") => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      // format all zod errors into one readable message
      const message = result.error.issues
        .map(e => {
          const field = formatPath(e.path as (string | number)[]);
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
