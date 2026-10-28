import { Request, Response, NextFunction } from 'express';
import logger from "../config/logger-config";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || err.status || 500;

    if (statusCode >= 500) {
        logger.error(`Error occurred when accessing ${req.originalUrl}`);
        logger.error(err.stack || err.message);
    } else {
        // 4xx (404, 400, 401, ...): client problem, log one line at warn level
        logger.warn(`${statusCode} ${err.message} (${req.originalUrl})`);
    }

    const response = {
        message: err.message || 'Internal Server Error',
        status: statusCode,
    };
    
    res.status(statusCode).json(response);
}

export default errorHandler;