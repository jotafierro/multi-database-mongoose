'use strict';

const _  = {
        get: require('lodash').get,
        isPlainObject: require('lodash').isPlainObject,
        isString: require('lodash').isString,
        isUndefined: require('lodash').isUndefined,
    },
    countries = {
        getName: require('i18n-iso-countries').getName,
    };

module.exports = function(country) {
    let code;
    if (_.isPlainObject(country)) {
        if (_.isUndefined(_.get(country, 'code'))) return false;
        country = _.get(country, 'code');
    }
    if (_.isString(country)) {
        if (country.length != 2) return false;
        code = country;
    }
    // ISO 3166-1 Alpha-2 -> countries 2 caracteres
    // console.log(countries.getName('CL', 'en'));
    return _.isString(countries.getName(code, 'en'));
};
