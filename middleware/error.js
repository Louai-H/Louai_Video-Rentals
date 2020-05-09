const winston = require('winston');

module.exports = function (err, req, res, next) {
    // log errors
    winston.error(err.message, {
        meta: {
            message: err.message,
            name: err.name,
            stack: err.stack
        }
    });
    res.status(500).send('Something failed.');
}