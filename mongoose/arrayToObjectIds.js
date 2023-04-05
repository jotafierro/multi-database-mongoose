'use strict';

const _ = {
        cloneDeep: require('lodash').cloneDeep,
        each: require('lodash').each,
        get: require('lodash').get,
        isEmpty: require('lodash').isEmpty,
        isPlainObject: require('lodash').isPlainObject,
        isUndefined: require('lodash').isUndefined,
        reverse: require('lodash').reverse,
        set: require('lodash').set,
    },
    stringToObjectId = $DBPath.include('/mongoose', 'stringToObjectId.js'),
    arrayContentObjectId = $DBPath.include('/mongoose', 'arrayContentObjectId.js');

module.exports = (array) => {
    let result = [];
    _.each(_.reverse(_.cloneDeep(array)), (obj) => {
        if (_.isPlainObject(obj)) _.set(obj, '_id', stringToObjectId(_.get(obj, '_id')));
        else obj = stringToObjectId(obj);
        if (_.isUndefined(obj)) return;
        if (arrayContentObjectId(result, obj)) return;
        result.push(obj);
    });
    if (_.isEmpty(result)) return undefined;
    return result;
};
