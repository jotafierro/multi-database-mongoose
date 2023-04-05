'use strict';

const _ = {
    get: require('lodash').get,
    isPlainObject: require('lodash').isPlainObject,
    isUndefined: require('lodash').isUndefined,
    some: require('lodash').some,
};

module.exports = (array, ObjectId) => _.some(array, (a) => {
    let valueArray,
        valueObjectId;

    if (_.isPlainObject(a)) valueArray = _.get(a, '_id');
    else valueArray = a;
    if (_.isUndefined(valueArray)) return false;

    if (_.isPlainObject(ObjectId)) valueObjectId = _.get(ObjectId, '_id');
    else valueObjectId = ObjectId;
    if (_.isUndefined(valueObjectId)) return false;

    return valueArray.equals(valueObjectId);
});
