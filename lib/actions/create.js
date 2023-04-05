'use strict';

const _ = {
        assign: require('lodash').assign,
        cloneDeep: require('lodash').cloneDeep,
        each: require('lodash').each,
        get: require('lodash').get,
        isEmpty: require('lodash').isEmpty,
        isUndefinedSet: require('lodash-extends').isUndefinedSet,
        set: require('lodash').set,
    },
    loop = (newDocs, result, opts, cb) => {
        if (_.isEmpty(newDocs)) return cb(null, result);
        let index = newDocs.length - 1,
            newDoc = newDocs.pop(),
            doc;
        if (_.get(newDocs, '__v')) _.set(newDocs, '__v', undefined);
        doc = new opts.model(newDoc);
        doc.save((err) => {
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
            loop(newDocs, result, opts, cb);
        });
    };

module.exports = (model, newDocs, opts, cb) => {
    opts = _.assign(opts, {model: model});
    loop(newDocs, {}, opts, (err, result) => {
        if (err) return cb(err);
        cb(null, result);
    });
};