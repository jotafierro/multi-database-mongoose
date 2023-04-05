'use strict';

const bcrypt = {
    genSalt: require('bcrypt-nodejs').genSalt,
    hash: require('bcrypt-nodejs').hash,
};

module.exports = (value, cb) => {
    bcrypt.genSalt(5, (err, salt) => {
        if (err) return cb(err);
        bcrypt.hash(value, salt, null, (err, hash) => {
            if (err) return cb(err);
            cb(null, hash);
        });
    });
};
