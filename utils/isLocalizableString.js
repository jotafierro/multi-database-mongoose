'use strict';

const _  = {
    get: require('lodash').get,
    isPlainObject: require('lodash').isPlainObject,
    isString: require('lodash').isString,
    isUndefined: require('lodash').isUndefined,
    some: require('lodash').some,
};

module.exports = function(languages) {
    if (!_.isPlainObject(languages)) return false;
    if (_.isUndefined(_.get(languages, 'original'))) return false;
    if (!_.isString(_.get(languages, 'original'))) return false;

    // ISO 639-1 -> lenguajes 2 caracteres
    return _.some(languages, (language, languageKey) => {
        if (languageKey == 'original') return true;
        // @t: validar que sea un key valido
        // if (!languageKey.length != 2) return false;
        return true;
    });
};
