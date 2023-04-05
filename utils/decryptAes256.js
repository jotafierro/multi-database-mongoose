'use strict';

const crypto = {
    createDecipher: require('crypto').createDecipher,
};

module.exports = (str, aes256) => {
    let decipher = crypto.createDecipher('aes256', aes256),
        decrypted = decipher.update(str, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
