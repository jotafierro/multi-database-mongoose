'use strict';

const _ = {
        isUndefined: require('lodash').isUndefined,
    },
    countries = require('i18n-iso-countries');

module.exports = (language) => {
    if (_.isUndefined(language)) language = 'en';
    return countries.getNames(language);
};
