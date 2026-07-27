import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
    level: 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new transports.Console({
            format: combine(colorize(), logFormat)
        }),
        new DailyRotateFile({
            filename: '/app/logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '7d',   // auto-deletes anything older than 7 days
            zippedArchive: true // gzips rotated files to save space
        }),
        new DailyRotateFile({
            filename: '/app/logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',   // keep errors a bit longer than general logs
            zippedArchive: true
        }),
    ]
});

export default logger;