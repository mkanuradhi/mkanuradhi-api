import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger-config';

const MAX_USER_AGENT_LENGTH = 300;

const RequestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // 1) On arrival
    logger.info(`--> ${getIpAddress(req)} ${req.method} ${req.originalUrl} UA: ${getUserAgent(req)}`);

    // 2) On completion
    res.on('finish', () => {
        const ms = Date.now() - start;
        const line = `<-- ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`;

        if (res.statusCode >= 500) {
            logger.error(line);
        } else if (res.statusCode >= 400) {
            logger.warn(line);
        } else {
            logger.info(line);
        }
    });

    next();
}

const getHeader = (req: Request, name: string): string | undefined => {
    const value = req.headers[name];
    return Array.isArray(value) ? value[0] : value;
}

const getIpAddress = (req: Request) => {
    const ipAddress =
        getHeader(req, 'cf-connecting-ip')?.trim() ||
        getHeader(req, 'x-forwarded-for')?.split(',').shift()?.trim() ||
        req.ip ||
        req.socket?.remoteAddress ||
        '';
    
    return ipAddress.replace(/^::ffff:/i, '');
}

const getUserAgent = (req: Request): string => {
    // Remove control characters (newlines, tabs, etc.) so a request can't inject fake log lines
    const raw = (getHeader(req, 'user-agent') || '-').replace(/[\x00-\x1f\x7f]/g, ' ').trim();

    return raw.length <= MAX_USER_AGENT_LENGTH ? raw : raw.slice(0, MAX_USER_AGENT_LENGTH) + '...';
}

export default RequestLogger;