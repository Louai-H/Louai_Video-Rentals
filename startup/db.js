const winston = require('winston');
const mongoose = require('mongoose');
const config = require('config');

module.exports = function() {
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useUnifiedTopology', true);
    mongoose.set('useCreateIndex', true);
    mongoose.set('useFindAndModify', false);

    const db = config.get('db');
    mongoose.connect(db)
        .then(() => winston.info(`Connected to ${db}...`));
}