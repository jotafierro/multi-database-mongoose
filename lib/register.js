'use strict';

const _ = {
        cloneDeep: require('lodash').cloneDeep,
        get: require('lodash').get,
        isPlainObject: require('lodash').isPlainObject,
        isString: require('lodash').isString,
        isFunction: require('lodash').isFunction,
        isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
        set: require('lodash').set,
    },
    customizeSchema = $DBPath.include('/lib', 'customizeSchema.js'),
    generateRelations = $DBPath.include('/lib', 'generateRelations.js');


module.exports = (opts, connections) => {
    let existModel = $DBPath.include('/lib', 'exist.js')(opts, connections);
    return (model, dbName, extra) => {
        if (_.isUndefinedOrNull(dbName) || !_.isString(dbName)) dbName = opts.defaultDbName;

        if (_.isString(model)) {
            let path = _.get(opts.dbs[dbName], 'path') || _.get(opts, 'path');
            if (_.isUndefinedOrNull(path)) return $DBLog.error('not exist path to models');
            model = require(path + model);
        }

        if (_.isFunction(model)) model = model(extra);

        if (!_.isPlainObject(model)) return $DBLog.error('not valid object to model');

        if (existModel(model.name, dbName)) return $DBLog.warn('already exist model "' + model.name + '"');

        let __belong = _.cloneDeep(_.get(model, 'attrs.__belong')),
            __children = _.cloneDeep(_.get(model, 'attrs.__children')),
            schema;

        // @t: validar required or extra params in attr
        _.set(model, 'attrs.__belong', {type: 'Mixed'});
        _.set(model, 'attrs.__children', {type: 'Mixed'});

        schema = customizeSchema(model, _.get(opts.dbs, dbName + '.settings'));

        generateRelations(
            model.name, __belong, 'belongToChildren', {connection: connections[dbName], schema: schema}
        );
        generateRelations(
            model.name, __children, 'childrenToBelong', {connection: connections[dbName], schema: schema}
        );

        connections[dbName].model(model.name, schema);
    };
};
