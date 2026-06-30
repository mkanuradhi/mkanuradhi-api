// middleware/validate-uuid.ts
import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/app-error';

const validateUuid = (paramName: string) => (req: Request, _res: Response, next: NextFunction) => {
  const value = req.params[paramName]?.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!value || !uuidRegex.test(value)) {
    return next(new AppError(`Invalid ID format for '${paramName}'.`, 400));
  }
  next();
};

export default validateUuid;