import { Request, Response, NextFunction } from 'express';
import { validateDocId } from "../validators/common-validator";

const validateObjectId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  // Check if the provided ID is a valid MongoDB ObjectId
  try {
    validateDocId(id);
  } catch (err) {
    return next(err);
  }

  next();
};

export default validateObjectId;