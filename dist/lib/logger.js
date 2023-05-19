"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const label = (label) => (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.label({ label }), winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }), winston_1.format.printf((log) => `${log.timestamp} [${log.level}] \x1B[35m${log.label}\x1B[39m: ${log.message}`)),
    transports: [new winston_1.transports.Console()],
});
exports.default = { label };
