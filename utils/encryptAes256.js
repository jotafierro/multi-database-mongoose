'use strict';

const crypto = {
    createCipher: require('crypto').createCipher,
};

module.exports = (str, aes256) => {
    let cipher = crypto.createCipher('aes256', aes256),
        encrypted = cipher.update(str, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};
