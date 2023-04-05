'use strict';

const _ = {
    get: require('lodash').get,
};

module.exports = (obj) => (_.get(obj, 'constructor.name') == 'ObjectID') ? true : false;
