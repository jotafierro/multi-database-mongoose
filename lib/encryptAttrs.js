'use strict';

const _ = {
        each: require('lodash').each,
        get: require('lodash').get,
        isBoolean: require('lodash').isBoolean,
        isString: require('lodash').isString,
        isStringNotEmpty: require('lodash-extends').isStringNotEmpty,
        propsMatchFunction: require('lodash-extends').propsMatchFunction,
        set: require('lodash').set,
    },
    encryptAes256 = $DBPath.include('/utils', 'encryptAes256.js'),
    encryptBcrypt = $DBPath.include('/utils', 'encryptBcrypt.js');

module.exports = (schema, attrs, settings) => {
    const encryptTypes = {
        bcrypt: (schema, prop) => {
            schema.pre('save', function(cb) {
                let item = this;
                // si no es un nuevo objecto no se encrypta
                if (_.isBoolean(item.wasNew) && !item.wasNew) return cb();
                if (!_.isStringNotEmpty(_.get(item, prop))) return cb();
                encryptBcrypt(_.get(item, prop), (err, hash) => {
                    if (err) return cb(err);
                    _.set(item, prop, hash);
                    cb();
                });
            });
        },
        aes256: (schema, prop) => {
            // @t: resolve subdocuments encrypt
            schema.pre('save', function(cb) {
                if (!_.isStringNotEmpty(_.get(this, prop))) return cb();
                if (_.isBoolean(this.wasNew) && this.wasNew)
                    _.set(this, prop, encryptAes256(_.get(this, prop), settings.aes256));
                cb();
            });
        },
    };

    let propsEncrypt = _.propsMatchFunction(attrs, (obj) => _.isString(_.get(obj, 'encrypt')), 'lodash');
    _.each(propsEncrypt, (prop) => encryptTypes[_.get(attrs, prop + '.encrypt')](schema, prop));
};
