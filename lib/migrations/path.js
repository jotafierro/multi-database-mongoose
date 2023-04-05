'use strict';

const _ = {
    get: require('lodash').get,
    isBoolean: require('lodash').isBoolean,
    isString: require('lodash').isString,
    isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
};

module.exports = (opts) => {
    return (cb) => {
        opts.pathMigrations = _.get(opts, 'pathMigrations');
        if (_.isUndefinedOrNull(opts.pathMigrations) || !_.isString(opts.pathMigrations))
            return cb(null);
        cb(opts.pathMigrations);
    };
};
