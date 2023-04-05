'use strict';

const _ = {
        each: require('lodash').each,
        find: require('lodash').find,
        get: require('lodash').get,
        isEmpty: require('lodash').isEmpty,
        isUndefinedSet: require('lodash-extends').isUndefinedSet,
        set: require('lodash').set,
    },
    mongoose = {
        toObjectId: $DBPath.include('/mongoose', 'toObjectId.js'),
    },
    loop = (docs, result, cb) => {
        if (_.isEmpty(docs)) return cb(null, result);
        let doc = docs.pop();

        if (doc) {
            doc.restoreAction((err) => {
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
                loop(docs, result, cb);
            });
        } else {
            let index = docs.length;
            _.isUndefinedSet(result, 'errors', {});
            _.set(result.errors, index, 'Not exist');
            loop(docs, result, cb);
        }
    };

module.exports = (model, restoreIds, cb) => {
    let query,
        find = {_id: {$in: restoreIds}};

    _.set(find, '$and', [{deleted: {$exists: true}}, {deleted: true}]);

    query = model.find(find);
    query.exec((err, docs) => {
        if (err) return cb(err);

        let validDocs = (docs, restoreIds) => {
            let result = [];
            _.each(restoreIds, (restoreId) => {
                let doc = _.find(docs, (doc) => doc._id.equals(mongoose.toObjectId(restoreId)));
                if (doc) result.push(doc);
                else result.push(null);
            });
            return result;
        };
        docs = validDocs(docs, restoreIds);

        loop(docs, {}, (err, result) => {
            if (err) return cb(err);
            cb(null, result);
        });
    });
};