'use strict';

const _ = {
        each: require('lodash').each,
        find: require('lodash').find,
        get: require('lodash').get,
        isEmpty: require('lodash').isEmpty,
        isUndefinedSet: require('lodash-extends').isUndefinedSet,
        isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
        set: require('lodash').set,
    },
    mongoose = {
        toObjectId: $DBPath.include('/mongoose', 'toObjectId.js'),
    },
    loop = (docs, result, opts, cb) => {
        if (_.isEmpty(docs)) return cb(null, result);
        let doc = docs.pop();

        if (doc) {
            doc.removeAction(_.get(opts, 'type'), (err) => {
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

module.exports = (model, removeIds, opts, cb) => {
    let query,
        find = {_id: {$in: removeIds}};
    if (_.isUndefinedOrNull(opts)) opts = {};
    _.set(opts, 'type', _.get(opts, 'type') || 'logical');

    if (_.get(opts, 'type') == 'logical')
        _.set(find, 'deleted', {$exists: false});

    query = model.find(find);
    query = query.select('_id');
    query.exec((err, docs) => {
        if (err) return cb(err);
        let validDocs = (docs, removeIds) => {
            let result = [];
            _.each(removeIds, (removeId) => {
                let doc = _.find(docs, (doc) => doc._id.equals(mongoose.toObjectId(removeId)));
                if (doc) result.push(doc);
                else result.push(null);
            });
            return result;
        };

        docs = validDocs(docs, removeIds);
        loop(docs, {}, opts, (err, result) => {
            if (err) return cb(err);
            cb(null, result);
        });
    });
};