import { NextFunction, Request, Response } from "express";

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncErrorHandler = (func: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    func(req, res, next).catch(err => next(err));
  }
}

export default asyncErrorHandler;
