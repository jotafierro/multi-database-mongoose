'use strict';

const crypto = {
    createHash: require('crypto').createHash,
};

module.exports = (str) => {
    let hash = crypto.createHash('sha1');
    hash = hash.update(str);
    hash = hash.digest('hex');
    return hash;
};
