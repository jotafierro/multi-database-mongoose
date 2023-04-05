'use strict';

const _ = {
        isString: require('lodash').isString,
    },
    slug = require('simple-slug');

module.exports = (str) => {
    if (!_.isString(str)) return null;
    return slug(str);
};
