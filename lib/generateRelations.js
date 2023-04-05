'use strict';

const _ = {
        concat: require('lodash').concat,
        each: require('lodash').each,
        get: require('lodash').get,
        isArray: require('lodash').isArray,
        isBoolean: require('lodash').isBoolean,
        isEmpty: require('lodash').isEmpty,
        isPlainObject: require('lodash').isPlainObject,
        set: require('lodash').set,
    },
    async = {each: require('async').each},
    arrayContentObjectId = $DBPath.include('/mongoose', 'arrayContentObjectId.js');

// @t: relacion entre multiples db
module.exports = (nameModel, relations, type, opts) => {
    const switchType = {
        belongToChildren: {origin: '__belong', destination: '__children'},
        childrenToBelong: {origin: '__children', destination: '__belong'},
    };

    type = switchType[type];
    _.each(relations, (object, modelReference) => {
        if (_.isBoolean(_.get(object, 'relation')) && _.get(object, 'relation')) {
            opts.schema.post('save', function(doc, next) {
                let Model = _.get(opts.connection, 'models.' + modelReference),
                    relationIds = _.get(doc, type.origin + '.' + modelReference) || [],
                    find = {_id: {$in: []}};

                if (_.isEmpty(relationIds)) return next();

                if (!_.isArray(relationIds)) relationIds = [relationIds];

                while (!_.isEmpty(relationIds)) {
                    let relationId = relationIds.pop();
                    if (_.isPlainObject(relationId)) {
                        find._id['$in'].push(_.get(relationId, '_id'));
                        continue;
                    }
                    find._id['$in'].push(relationId);
                }

                Model.find(find).exec((err, referenceDocs) => {
                    if (err) return next(err);
                    if (_.isEmpty(referenceDocs)) return next();
                    let prop = type.destination + '.' + nameModel,
                        actionToReference = (referenceDoc, cb) => {
                            let references = _.get(referenceDoc, prop) || [];
                            if (_.isArray(references) && arrayContentObjectId(references, doc._id))
                                return cb();
                            _.set(referenceDoc, prop, _.concat(references, doc._id));
                            // @n: como las relaciones __belong y __children son de tipo MIXED, es necesario
                            // marcar el atributo modificado
                            referenceDoc.markModified(prop);
                            referenceDoc.save((err) => {
                                if (err) return cb(err);
                                cb();
                            });
                        };

                    async.each(referenceDocs, actionToReference, (err) => {
                        if (err) return next(err);
                        next();
                    });
                });
            });
        }
    });
};
