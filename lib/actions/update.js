'use strict';

const _ = {
        assign: require('lodash').assign,
        cloneDeep: require('lodash').cloneDeep,
        concat: require('lodash').concat,
        each: require('lodash').each,
        find: require('lodash').find,
        get: require('lodash').get,
        isEmpty: require('lodash').isEmpty,
        isUndefinedSet: require('lodash-extends').isUndefinedSet,
        existInArray: require('lodash-extends').existInArray,
        map: require('lodash').map,
        set: require('lodash').set,
        keys: require('lodash').keys,
        toLower: require('lodash').toLower,
    },
    privateKeys = ['__v', '_id', '_seed'],
    mongoose = {
        toObjectId: $DBPath.include('/mongoose', 'toObjectId.js'),
    },
    loop = (docs, result, opts, cb) => {
        if (_.isEmpty(docs)) return cb(null, result);
        let doc = docs.pop();

        if (doc) {
            doc.updateAction((err) => {
                let index = docs.length;
                if (err) {
                    _.isUndefinedSet(result, 'errors', {});
                    let errors = {};
                    if (_.get(err, 'errors')) {
                        _.each(_.get(err, 'errors'), (object, key) => {
                            _.isUndefinedSet(errors, key, []);
                            _.get(errors, key).push(_.get(object, 'message'));
                        });
                    } else errors = err;
                    _.set(result.errors, index, errors);
                } else {
                    _.isUndefinedSet(result, 'items', {});
                    _.set(result.items, index, doc._id);
                }
                loop(docs, result, opts, cb);
            });
        } else {
            let index = docs.length;
            _.isUndefinedSet(result, 'errors', {});
            _.set(result.errors, index, 'Not exist');
            loop(docs, result, opts, cb);
        }
    };

module.exports = (model, updateDocs, opts, cb) => {
    let query,
        find = {_id: {$in: _.map(updateDocs, '_id')}},
        method = _.get(opts, 'method') || 'PATCH',
        switchMethod = {
            patch: (docs, updateDocs) => {
                let result = [];
                _.each(updateDocs, (updateDoc) => {
                    let doc = _.find(
                        docs, (doc) => doc._id.equals(mongoose.toObjectId(updateDoc._id))
                    );
                    if (doc) {
                        let strict = _.get(opts, 'strict');
                        _.each(_.keys(updateDoc), (key) => {
                            // @r: que hacer en los casos de objetos o arreglos (merge) @t: aplicar solucion
                            if (!_.existInArray(key, privateKeys))
                                doc.set(key, updateDoc[key], {strict: strict});
                        });
                        result.push(doc);
                    } else result.push(null);
                });
                return result;
            },
            put: (docs, updateDocs) => {
                let result = [];
                _.each(updateDocs, (updateDoc) => {
                    let doc = _.find(
                        docs, (doc) => doc._id.equals(mongoose.toObjectId(updateDoc._id))
                    );
                    if (doc) {
                        let strict = _.get(opts, 'strict'),
                            updateDockeys = _.keys(updateDoc),
                            notUndefined = _.concat(updateDockeys, privateKeys);
                        _.each(_.keys(_.get(doc, '_doc')), (key) => {
                            if (!_.existInArray(key, notUndefined))
                                doc.set(key, undefined, {strict: strict});
                        });
                        _.each(updateDockeys, (key) => {
                            if (!_.existInArray(key, privateKeys))
                                doc.set(key, updateDoc[key], {strict: strict});
                        });
                        result.push(doc);
                    } else result.push(null);
                });
                return result;
            },
        };

    query = model.find(find);
    query.exec((err, docs) => {
        if (err) return cb(err);

        docs = switchMethod[_.toLower(method)](docs, updateDocs);

        loop(docs, {}, opts, (err, result) => {
            if (err) return cb(err);
            cb(null, result);
        });
    });
};