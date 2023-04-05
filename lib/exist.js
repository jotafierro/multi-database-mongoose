'use strict';

const _ = {
    get: require('lodash').get,
    isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
};

module.exports = (opts, connections) => {
    return (modelName, dbName) => {
        if (_.isUndefinedOrNull(dbName)) dbName = opts.defaultDbName;
        return !_.isUndefinedOrNull(_.get(connections[dbName], 'models.' + modelName));
    };
};
