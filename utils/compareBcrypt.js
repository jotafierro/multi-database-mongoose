'use strict';

const bcrypt = {
    compare: require('bcrypt-nodejs').compare,
};

module.exports = (str, strBcrypt, cb) => bcrypt.compare(str, strBcrypt, cb);
