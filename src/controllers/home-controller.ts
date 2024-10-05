import { NextFunction, Request, Response } from "express";
import * as homeService from "../services/home-service";
import asyncErrorHandler from "../utils/async-error-handler";

const init = asyncErrorHandler( async (req: Request, res: Response, next: NextFunction) => {
  const homeResp = await homeService.init();
  res.status(200).json(homeResp);
});

export { init };
