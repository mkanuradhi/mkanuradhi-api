import { Request, Response, NextFunction } from 'express';
import logger from "../config/Logger";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Error occurred when accessing ${req.url}`);

    const statusCode = err.statusCode || 500;

    if (statusCode === 404) {
        logger.error(err.message);
    } else {
        logger.error(err.stack);
    }

    const response = {
        message: err.message || 'Internal Server Error',
        status: statusCode,
    };
    
    res.status(statusCode).json(response);
}

export default errorHandler;