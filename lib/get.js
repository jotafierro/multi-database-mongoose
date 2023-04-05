'use strict';

const _ = {
    get: require('lodash').get,
    isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
};

module.exports = (opts, connections) => {
    return (modelName, dbName) => {
        let model;
        if (_.isUndefinedOrNull(dbName)) dbName = opts.defaultDbName;
        model = _.get(connections[dbName], 'models.' + modelName);
        if (_.isUndefinedOrNull(model)) return $DBLog.error('not exist model "' + modelName + '"');
        return model;
    };
};
