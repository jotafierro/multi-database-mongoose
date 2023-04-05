'use strict';

const _ = {
        assign: require('lodash').assign,
        each: require('lodash').each,
        first: require('lodash').first,
        get: require('lodash').get,
        includes: require('lodash').includes,
        indexOf: require('lodash').indexOf,
        isEmpty: require('lodash').isEmpty,
        isNull: require('lodash').isNull,
        isString: require('lodash').isString,
        isPlainObject: require('lodash').isPlainObject,
        isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
        isUndefinedSet: require('lodash-extends').isUndefinedSet,
        propsMatchFunction: require('lodash-extends').propsMatchFunction,
        keys: require('lodash').keys,
        set: require('lodash').set,
        isFunction: require('lodash').isFunction,
    },
    fs = {
        existsSync: require('fs').existsSync,
        mkdirSync: require('fs').mkdirSync,
        readdirSync: require('fs').readdirSync,
    },
    remove = (seed, cb) => {
        let model = _.get(seed, '_model');
        model.remove({_seed: true}).exec((err) => {
            if (err) return cb(err);
            cb(null);
        });
    },
    loop = (seedKeys, seed, cb) => {
        let seedKey;
        if (_.isEmpty(seedKeys)) return cb(null, true);
        seedKey = seedKeys.shift();

        if (_.get(seed, '_model'))
            return cb('not valid model in seed :"' + seedKey + '"');

        remove(seed[seedKey], (err) => {
            if (err) return cb(err);
            loop(seedKeys, seed, cb);
        });
    };

module.exports = (opts) => {
    let fn = (seed, nameFile, cb) => {
        if (_.isUndefinedOrNull(opts.pathSeeders) || !_.isPlainObject(seed))
            return cb('not valid object in seed');

        loop(_.keys(seed), seed, (err, result) => cb(err, (result) ? opts.pathSeeders + nameFile : null));
    };
    return (nameFile, cb) => {
        opts.pathSeeders = _.get(opts, 'pathSeeders');

        if (_.isUndefinedOrNull(opts.pathSeeders) || !_.isString(opts.pathSeeders))
            return cb('not exist path to seeders');

        // create seeders directory
        if (!fs.existsSync(opts.pathSeeders)) fs.mkdirSync(opts.pathSeeders);

        let seeders = fs.readdirSync(opts.pathSeeders),
            seed = _.get(seeders, _.indexOf(seeders, nameFile));

        if (_.isUndefinedOrNull(seed)) return cb('not exist seed to clean');

        seed = _.get(require(opts.pathSeeders + seed), 'seed');

        if (_.isFunction(seed))
            seed((err, result) => {
                if (err) return cb(err);
                fn(result, nameFile, cb);
            });
        else fn(seed, nameFile, cb);
    };
};