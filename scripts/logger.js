const winston = require("winston");

function getFileName() {
    const date = new Date();
    return "logs/" +
        date.getDate() + "-" + 
        date.getMonth() + "-" + 
        date.getFullYear() + " @ " + 
        date.getHours() + "-" + 
        date.getMinutes() + "-" + 
        date.getSeconds() + 
        ".log";
}

module.exports = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({format: "DD/MM/YYYY @ HH:mm:ss"}),
        winston.format.errors({ stack: true }),
        winston.format.printf(info => `[${info.timestamp}] ${info.message}`)
    ),
    defaultMeta: { service: "user-service" },
    transports: [
        new winston.transports.Console({ handleExceptions: true }),
        new winston.transports.File({ filename: getFileName(), handleExceptions: true })
    ],
});

