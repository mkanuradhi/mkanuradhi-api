import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../utils/async-error-handler";
import * as statService from "../services/stat-service";

export const getSummaryStats = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const result = await statService.getSummaryStats();
  res.status(200).json(result);
});
