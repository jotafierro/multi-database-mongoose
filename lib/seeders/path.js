'use strict';

const _ = {
    get: require('lodash').get,
    isBoolean: require('lodash').isBoolean,
    isString: require('lodash').isString,
    isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
};

module.exports = (opts) => {
    return (cb) => {
        opts.pathSeeders = _.get(opts, 'pathSeeders');
        if (_.isUndefinedOrNull(opts.pathSeeders) || !_.isString(opts.pathSeeders))
            return cb(null);
        cb(opts.pathSeeders);
    };
};
