'use strict';

const _ = {
    get: require('lodash').get,
    isBoolean: require('lodash').isBoolean,
    isString: require('lodash').isString,
    isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
};

module.exports = (opts) => {
    return (cb) => {
        opts.path = _.get(opts, 'path');
        if (_.isUndefinedOrNull(opts.path) || !_.isString(opts.path))
            return cb(null);
        cb(opts.path);
    };
};
