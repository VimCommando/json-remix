import { createLogger, format, transports } from 'winston';

const label = (label: any) =>
    createLogger({
        level: process.env.LOG_LEVEL,
        format: format.combine(
            format.colorize(),
            format.label({ label }),
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            format.printf(
                (log: any) =>
                    `${log.timestamp} [${log.level}] \x1B[35m${log.label}\x1B[39m: ${log.message}`
            )
        ),
        transports: [new transports.Console({
            stderrLevels: ['warn', 'error', 'verbose', 'debug', 'silly'],
        })],
    });

export default { label };
