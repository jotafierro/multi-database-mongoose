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
    async = {
        waterfall: require('async').waterfall,
    },
    create = (seed, cb) => {
        let newDocs = {},
            model = _.get(seed, '_model'),
            waterfallCreate = [],
            insert = (newDoc, keyNewDoc, result, callback) => {
                model.findOne(newDoc).exec((err, doc) => {
                    if (err) return callback(err);
                    if (!_.isNull(doc)) {
                        _.set(newDoc, '_id', _.get(doc, '_id'));
                        _.set(result, keyNewDoc, newDoc);
                        return callback(null, result);
                    }

                    newDoc = new model(newDoc);
                    newDoc.save((err) => {
                        if (err) {
                            let errors = {};
                            if (_.get(err, 'errors')) {
                                _.each(_.get(err, 'errors'), (object, key) => {
                                    _.isUndefinedSet(errors, keyNewDoc, {});
                                    _.isUndefinedSet(errors[keyNewDoc], key, []);
                                    errors[keyNewDoc][key].push(_.get(object, 'message'));
                                });
                            } else {
                                _.isUndefinedSet(errors, keyNewDoc, {});
                                errors[keyNewDoc] = err;
                            }
                            return callback(errors);
                        }
                        _.set(result, keyNewDoc, newDoc);
                        callback(null, result);
                    });
                });
            };

        _.each(seed, (value, key) => {
            if (key != '_model') {
                _.set(value, '_seed', true);
                return _.set(newDocs, key, value);
            }
        });

        _.each(newDocs, (newDoc, keyNewDoc) => {
            if (_.isEmpty(waterfallCreate))
                return waterfallCreate = [
                    (callback) => insert(newDoc, keyNewDoc, {}, callback),
                ];
            waterfallCreate.push(
                (previusResult, callback) => {
                    return insert(newDoc, keyNewDoc, previusResult, callback);
                }
            );
        });


        async.waterfall(waterfallCreate, (err, result) => {
            if (err) return cb(err);
            cb(null, result);
        });
    },
    loop = (seedKeys, seed, cb) => {
        let seedKey;
        if (_.isEmpty(seedKeys)) return cb(null, true);
        seedKey = seedKeys.shift();

        if (_.get(seed, '_model')) {
            return cb('not exist attribute "_model" model in seed :"' + seedKey + '"');
        }

        let propRefs = _.propsMatchFunction(
            seed[seedKey], (obj) => _.includes(obj, '->'), 'lodash'
        );
        _.each(propRefs, (prop) => {
            if (_.includes(_.get(seed[seedKey], prop), '->'))
                _.set(
                    seed[seedKey], prop, _.get(
                        seed, _.get(seed[seedKey], prop).substr(2) + '._id'
                    )
                );
        });

        create(seed[seedKey], (err, result) => {
            if (err) return cb(err);
            _.assign(seed[seedKey], result);
            loop(seedKeys, seed, cb);
        });
    };

module.exports = (opts) => {
    let fn = (seed, nameFile, cb) => {
        if (_.isUndefinedOrNull(opts.pathSeeders) || !_.isPlainObject(seed)) {
            return cb('not valid object in seed');
        }

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

        if (_.isUndefinedOrNull(seed)) {
            return cb('not exist file to seed');
        }

        seed = _.get(require(opts.pathSeeders + seed), 'seed');

        if (_.isFunction(seed))
            seed((err, result) => {
                if (err) return cb(err);
                fn(result, nameFile, cb);
            });
        else fn(seed, nameFile, cb);
    };
};