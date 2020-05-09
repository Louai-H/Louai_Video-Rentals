const winston = require('winston');
require('winston-mongodb');
require('express-async-errors');

module.exports = function () {
    process.on('unhandledRejection', (ex) => {
        throw ex;
    });

    const myFormat = winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.simple()
    )

    const logger = winston.createLogger({
        transports: [
            winston.add(new winston.transports.File({ filename: 'logfile.log', format: myFormat })),

            winston.add(new winston.transports.MongoDB({ db: 'mongodb://localhost:27017/video_rentals', metaKey: 'meta', options: { useUnifiedTopology: true } })), // <-- { metaKey: "meta" } just makes sure the field is saved under the name 'meta' in the database, probably not necessary.

            winston.add(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.prettyPrint(),
                    myFormat
                )
            }))
        ],
        exceptionHandlers: [
            new winston.transports.File({ filename: 'uncaughtExceptions.log' }),

            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.prettyPrint(),
                    myFormat
                )
            })
        ]
    });
}