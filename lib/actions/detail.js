'use strict';

const _ = {
    get: require('lodash').get,
    isNull: require('lodash').isNull,
    isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
};

module.exports = (model, opts, cb) => {
    let query,
        find = _.get(opts, 'find') || {},
        populate = _.get(opts, 'populate'),
        select = _.get(opts, 'select') || '';

    query = model.findOne(find, select);
    if (!_.isUndefinedOrNull(populate)) query = query.populate(populate);
    query.lean().exec((err, doc) => {
        if (err) return cb(err);
        if (_.isNull(doc)) return cb(null, null, null);
        // doc.toJson((err, docJson) => {
        //     if (err) return cb(err);
        cb(null, doc, doc);
        // });
    });
};