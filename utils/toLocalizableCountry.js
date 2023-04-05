'use strict';

const _ = {
        isUndefined: require('lodash').isUndefined,
    },
    countries = {
        getName: require('i18n-iso-countries').getName,
    };

module.exports = (code) => {
    if (!_.isUndefined(countries.getName(code, 'en'))) {
        let country = {
            code: code,
            name: {
                original: countries.getName(code, 'en'),
                es: countries.getName(code, 'es'),
                pt: countries.getName(code, 'pt'),
                zh: countries.getName(code, 'zh'),
                de: countries.getName(code, 'de'),
                it: countries.getName(code, 'it'),
            },
        };
        return country;
    }
    return undefined;
};
