import { createLogger, format, transports } from 'winston';

const label = (label: any) =>
    createLogger({
        level: 'info',
        format: format.combine(
            format.colorize(),
            format.label({ label }),
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
            format.printf(
                (log: any) =>
                    `${log.timestamp} [${log.level}] \x1B[35m${log.label}\x1B[39m: ${log.message}`
            )
        ),
        transports: [new transports.Console()],
    });

export default { label };
