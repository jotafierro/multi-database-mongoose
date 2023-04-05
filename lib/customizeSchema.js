'use strict';

const _ = {
        assign: require('lodash').assign,
        assignNotRewrite: require('lodash-extends').assignNotRewrite,
        concat: require('lodash').concat,
        each: require('lodash').each,
        get: require('lodash').get,
        cloneDeep: require('lodash').cloneDeep,
        isBoolean: require('lodash').isBoolean,
        isNull: require('lodash').isNull,
        isPlainObject: require('lodash').isPlainObject,
        isString: require('lodash').isString,
        isUndefined: require('lodash').isUndefined,
        isArray: require('lodash').isArray,
        map: require('lodash').map,
        set: require('lodash').set,
        toLower: require('lodash').toLower,
        propsMatchFunction: require('lodash-extends').propsMatchFunction,
    },
    mongoose = {
        Schema: require('mongoose').Schema,
        arrayToObjectIds: $DBPath.include('/mongoose', 'arrayToObjectIds.js'),
        toObjectId: $DBPath.include('/mongoose', 'toObjectId.js'),
    },
    uniqueValidator = require('mongoose-unique-validator'),
    moment = require('moment'),
    encryptAttrs = $DBPath.include(__dirname, 'encryptAttrs.js'),
    actions = $DBPath.include('/lib/actions'),
    isLocalizableString = $DBPath.include('/utils', 'isLocalizableString.js'),
    isLocalizableCountry = $DBPath.include('/utils', 'isLocalizableCountry.js'),
    toLocalizableCountry = $DBPath.include('/utils', 'toLocalizableCountry.js'),
    encryptAes256 = $DBPath.include('/utils', 'encryptAes256.js'),
    decryptAes256 = $DBPath.include('/utils', 'decryptAes256.js');

module.exports = (model, settings) => {
    let schema,
        formatDate = _.get(settings, 'formatDate') || 'YYYY-MM-DDTHH:mm:ss[Z]';

    if (_.isUndefined(model.attrs)) model.attrs = {};

    if (!_.isUndefined(_.get(settings, 'attrs')))
        model.attrs = _.assignNotRewrite(model.attrs, settings.attrs);

    // atributos por defecto
    model.attrs = _.assignNotRewrite(model.attrs, {
        // para registrar creacion y actualizacion de items
        _createDate: {type: 'Date', index: true, default: () => moment().utc().format(formatDate)},
        _updateDate: {type: 'Date', index: true, default: () => moment().utc().format(formatDate)},
        // para registar el eliminado logico
        _deleteDate: {type: 'Date', index: true},
        _deleted: {type: 'Boolean', index: true},
        _seed: {type: 'Boolean', index: true},
    });

    if (_.isUndefined(model.strict) || !_.isBoolean(model.strict)) model.strict = true;

    // console.log(model.name);
    // console.log(model.strict);

    // localizable country
    let propLocalizableCountry = _.propsMatchFunction(
        model.attrs, (obj) => _.toLower(_.get(obj, 'type')) == 'localizablecountry'
    );
    _.each(propLocalizableCountry, (prop) => {
        if (_.isUndefined(model.toJson)) model.toJson = {};
        if (_.isUndefined(model.toJson.toLocalizableCountry)) model.toJson.toLocalizableCountry = [];
        model.toJson.toLocalizableCountry.push(prop);
        _.set(_.get(model.attrs, prop), 'type', 'Mixed');
        _.assign(
            _.get(model.attrs, prop),
            {validate: {validator: isLocalizableCountry, message: '{VALUE} is not valid localizable country'}}
        );
    });

    // add validate localizableString
    let propLocalizableString = _.propsMatchFunction(
        model.attrs, (obj) => _.toLower(_.get(obj, 'type')) == 'localizablestring'
    );
    _.each(propLocalizableString, (prop) => {
        _.assign(
            _.get(model.attrs, prop),
            {validate: {validator: isLocalizableString, message: '{VALUE} is not valid localizable string'}}
        );
        _.set(_.get(model.attrs, prop), 'type', 'Mixed');
    });

    // integrar type Available
    let propTypeAvailable = _.propsMatchFunction(model.attrs, (obj) => _.toLower(_.get(obj, 'type')) == 'available');
    _.each(propTypeAvailable, (prop) => _.set(model.attrs, prop, {
        from: {type: 'Date', default: () => moment().utc().format(formatDate)},
        until: {type: 'Date'},
    }));

    schema = new mongoose.Schema(model.attrs, {collection: model.name, strict: model.strict});
    // validar elementos unicos
    schema.plugin(uniqueValidator);

    // determinar al guardar si un elemento es nuevo
    schema.pre('save', function(next) {
        this.wasNew = this.isNew;
        next();
    });

    // transformar las fechas al entregar los resultados
    let propDates = _.propsMatchFunction(model.attrs, (obj) => _.toLower(_.get(obj, 'type')) == 'date');
    schema.post('find', function(docs) {
        _.each(docs, (doc) => {
            _.each(propDates, (prop) => {
                if (_.get(doc, prop))
                    _.set(doc, prop, moment(_.get(doc, prop)).utc().format(formatDate));
            });
        });
    });
    schema.post('findOne', function(doc) {
        _.each(propDates, (prop) => {
            if (_.get(doc, prop))
                _.set(doc, prop, moment(_.get(doc, prop)).utc().format(formatDate));
        });
    });

    // localizable country
    _.each(propLocalizableCountry, (prop) => {
        schema.pre('save', function(next) {
            if (_.isPlainObject(_.get(this, prop)))
                _.set(this, prop, _.get(this, prop + '.code'));
            next();
        });
    });

    if (!_.isUndefined(model.virtual)) _.each(model.virtual, (fn, key) => schema.virtual(key).get(fn));
    if (!_.isUndefined(model.methods)) _.each(model.methods, (fn, key) => _.set(schema.methods, key, fn));
    if (!_.isUndefined(model.pre)) _.each(model.pre, (fn, key) => schema.pre(key, fn));
    if (!_.isUndefined(model.post)) _.each(model.post, (fn, key) => schema.post(key, fn));

    // @t: add validations to opts to actions create,detail,remove,restore,update
    schema.static('createAction', function(newDocs, opts, cb) {
        actions.create(this, newDocs, opts, cb);
    });
    schema.static('detailAction', function(opts, cb) {
        actions.detail(this, opts, cb);
    });
    schema.static('listAction', function(opts, cb) {
        actions.list(this, opts, cb);
    });
    schema.static('removeAction', function(removeIds, opts, cb) {
        actions.remove(this, removeIds, opts, cb);
    });
    schema.static('restoreAction', function(restoreIds, cb) {
        actions.restore(this, restoreIds, cb);
    });
    schema.static('updateAction', function(updateDocs, opts, cb) {
        _.assign(opts, {strict: model.strict});
        actions.update(this, updateDocs, opts, cb);
    });

    schema.methods.removeAction = function(type, cb) {
        if (this._deleted && this._deleteDate) return cb();
        const removeTypes = {
            logical: () => {
                if (!this._deleted) {
                    this._deleteDate = moment().utc().format(formatDate);
                    this._deleted = true;
                    this.save(cb);
                }
            },
            physical: () => this.remove(cb),
        };

        removeTypes[type]();
    };
    schema.methods.restoreAction = function(cb) {
        if (!this._deleted && !this._deleteDate) return cb();
        this._deleteDate = undefined;
        this._deleted = undefined;
        this.save(cb);
    };
    schema.methods.updateAction = function(cb) {
        this._updateDate = moment().utc().format(formatDate);
        this.save(cb);
    };

    // @t: delete methods
    // delete
    schema.methods.delete = function(type) {
        const deleteTypes = {
            logical: () => {
                this._deleteDate = moment().utc().format(formatDate);
                this._deleted = true;
                this.save();
            },
            physical: () => {
                this.remove();
            },
        };

        // @t: return error with undefined select deleteTypes

        deleteTypes[type]();
    };

    // restore
    schema.methods.restore = function() {
        this._deleteDate = undefined;
        this._deleted = undefined;
        this.save();
    };

    // metodo para obtener el nombre del modelo
    schema.static('ModelName', () => model.name);
    schema.static('ModelAttrs', () => model.attrs);

    // varias formas para encriptar
    settings.aes256 = settings.aes256 || 'asdf1234';
    encryptAttrs(schema, model.attrs, {aes256: settings.aes256});

    // para guardar las relaciones __belong y __children como ObjectId de mongo
    schema.pre('validate', function(next) {
        _.each(_.get(this, '__belong'), (references, modelReference) => {
            if (_.isArray(references)) references = mongoose.arrayToObjectIds(references);
            if (_.isString(references)) references = mongoose.toObjectId(references);
            _.set(this, '__belong.' + modelReference, references);
            this.markModified('__belong.' + modelReference);
        });
        _.each(_.get(this, '__children'), (references, modelReference) => {
            if (_.isArray(references)) references = mongoose.arrayToObjectIds(references);
            if (_.isString(references)) references = mongoose.toObjectId(references);
            _.set(this, '__children.' + modelReference, references);
            this.markModified('__children.' + modelReference);
        });
        next();
    });

    // toJson
    schema.static('toJson', (docs) => {
        let remove = _.get(model.toJson, 'remove'),
            removeDefault = ['__v', '_seed', '_deleted'];
        if (_.isUndefined(model.toJson)) model.toJson = {};
        if (_.isUndefined(remove) || !_.isArray(remove)) remove = [];
        remove = _.concat(remove, removeDefault);

        return _.map(docs, (doc) => {
            doc._model = model.name;
            // @t: to json subdocuments validar a lo mongoose .0 in array or [0] in lodash
            // elimina elementos de la respuesta
            _.each(remove, (prop) => _.set(doc, prop, undefined));
            // renombra los atributos en la respuesta
            _.each(_.get(model.toJson, 'rename'), (newProp, oldProp) => {
                _.set(doc, newProp, _.get(doc, oldProp));
                _.set(doc, oldProp, undefined);
            });
            // decrypta los atributos en la respuesta
            _.each(_.get(model.toJson, 'decryptAes256'), (prop) => {
                if (!_.isUndefined(_.get(doc, prop)))
                    _.set(doc, prop, decryptAes256(_.get(doc, prop), settings.aes256));
            });
            // encrypta los atributos en la respuesta
            _.each(_.get(model.toJson, 'encryptAes256'), (prop) => {
                if (!_.isUndefined(_.get(doc, prop)))
                    _.set(doc, prop, encryptAes256(_.get(doc, prop), settings.aes256));
            });
            // localizableCountry los atributos en la respuesta
            _.each(_.get(model.toJson, 'toLocalizableCountry'), (prop) => {
                if (!_.isUndefined(_.get(doc, prop))) _.set(doc, prop, toLocalizableCountry(_.get(doc, prop)));
            });
            return doc;
        });
    });

    // methods to instance
    schema.methods.toJson = function(cb) {
        let remove = _.get(model.toJson, 'remove'),
            removeDefault = ['__v', '_seed', '_deleted'],
            doc = this.toObject();
        if (_.isUndefined(model.toJson)) model.toJson = {};
        if (_.isUndefined(remove) || !_.isArray(remove)) remove = [];
        remove = _.concat(remove, removeDefault);

        doc._model = model.name;

        // @t: to json subdocuments validar a lo mongoose .0 in array or [0] in lodash
        // elimina elementos de la respuesta
        _.each(remove, (prop) => _.set(doc, prop, undefined));
        // renombra los atributos en la respuesta
        _.each(_.get(model.toJson, 'rename'), (newProp, oldProp) => {
            _.set(doc, newProp, _.get(doc, oldProp));
            _.set(doc, oldProp, undefined);
        });
        // decrypta los atributos en la respuesta
        _.each(_.get(model.toJson, 'decryptAes256'), (prop) => {
            if (!_.isUndefined(_.get(doc, prop)))
                _.set(doc, prop, decryptAes256(_.get(doc, prop), settings.aes256));
        });
        // encrypta los atributos en la respuesta
        _.each(_.get(model.toJson, 'encryptAes256'), (prop) => {
            if (!_.isUndefined(_.get(doc, prop)))
                _.set(doc, prop, encryptAes256(_.get(doc, prop), settings.aes256));
        });
        // localizableCountry los atributos en la respuesta
        _.each(_.get(model.toJson, 'toLocalizableCountry'), (prop) => {
            if (!_.isUndefined(_.get(doc, prop))) _.set(doc, prop, toLocalizableCountry(_.get(doc, prop)));
        });
        return cb(null, doc);
    };

    return schema;
};
