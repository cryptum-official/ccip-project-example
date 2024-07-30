const pino = require('pino');
const fs = require("fs")

if (!fs.existsSync("logs")) fs.mkdirSync("logs", { recursive: true })

const fileTransport = pino.transport({
    target: 'pino/file',
    options: { destination: `${__dirname}/logs/app.log` },
});

module.exports = pino(
    {
        level: process.env.PINO_LOG_LEVEL || 'debug',
        formatters: {
            level: (label) => {
                return { level: label.toUpperCase() };
            },
        }
    },
    fileTransport
);
