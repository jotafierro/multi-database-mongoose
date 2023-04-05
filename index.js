'use strict';

require('wrapper-path').init({pathRoot: __dirname, prefix: '$DB', inGlobal: true});

const _ = {
        each: require('lodash').each,
        findKey: require('lodash').findKey,
        first: require('lodash').first,
        isBoolean: require('lodash').isBoolean,
        isPlainObject: require('lodash').isPlainObject,
        isString: require('lodash').isString,
        isUndefined: require('lodash').isUndefined,
        keys: require('lodash').keys,
    },
    winston = {
        Logger: require('winston').Logger,
        transports: {Console: require('winston').transports.Console},
    },
    mongoose = require('mongoose'),
    functions = (opts) => {
        let dbs = opts.dbs,
            connections = {};

        if (!_.isUndefined(_.findKey(dbs, {default: true}))) {
            opts.defaultDbName = _.findKey(dbs, {default: true});
        } else {
            opts.defaultDbName = _.first(_.keys(dbs));
            $DBLog.warn('default database is "' + opts.defaultDbName + '"');
        }

        _.each(dbs, (db, dbKey) => {
            let uri = 'mongodb://' + db.uri,
                opts = db.opts,
                createConnection = () => mongoose.createConnection(uri, opts);
            connections[dbKey] = createConnection();
            connections[dbKey].on('disconnected', createConnection);
            connections[dbKey].on('close', createConnection);
            connections[dbKey].on('error', createConnection);
        });

        return {
            register: $DBPath.include('/lib', 'register.js')(opts, connections),
            get: $DBPath.include('/lib', 'get.js')(opts, connections),
            exist: $DBPath.include('/lib', 'exist.js')(opts, connections),
            getOrRegister: $DBPath.include('/lib', 'getOrRegister.js')(opts, connections),
            migrations: {
                create: $DBPath.include('/lib/migrations', 'create.js')(opts),
                migrate: $DBPath.include('/lib/migrations', 'migrate.js')(opts, connections),
                path: $DBPath.include('/lib/migrations', 'path.js')(opts),
            },
            models: {
                create: $DBPath.include('/lib/models', 'create.js')(opts),
                path: $DBPath.include('/lib/models', 'path.js')(opts),
            },
            seeders: {
                create: $DBPath.include('/lib/seeders', 'create.js')(opts),
                apply: $DBPath.include('/lib/seeders', 'apply.js')(opts),
                clean: $DBPath.include('/lib/seeders', 'clean.js')(opts),
                path: $DBPath.include('/lib/seeders', 'path.js')(opts),
            },
            utils: {
                getNameCountries: $DBPath.include('/utils', 'getNameCountries.js'),
                encryptBcrypt: $DBPath.include('/utils', 'encryptBcrypt.js'),
                compareBcrypt: $DBPath.include('/utils', 'compareBcrypt.js'),
                decryptAes256: $DBPath.include('/utils', 'decryptAes256.js'),
                encryptAes256: $DBPath.include('/utils', 'encryptAes256.js'),
                encryptSha1: $DBPath.include('/utils', 'encryptSha1.js'),
                isLocalizableString: $DBPath.include('/utils', 'isLocalizableString.js'),
                isLocalizableCountry: $DBPath.include('/utils', 'isLocalizableCountry.js'),
                toLocalizableCountry: $DBPath.include('/utils', 'toLocalizableCountry.js'),
                toSlug: $DBPath.include('/utils', 'toSlug.js'),
            },
            mongoose: {
                arrayContentObjectId: $DBPath.include('/mongoose', 'arrayContentObjectId.js'),
                stringToObjectId: $DBPath.include('/mongoose', 'stringToObjectId.js'),
                arrayToObjectIds: $DBPath.include('/mongoose', 'arrayToObjectIds.js'),
                isValidObjectId: $DBPath.include('/mongoose', 'isValidObjectId.js'),
                isObjectId: $DBPath.include('/mongoose', 'isObjectId.js'),
                toObjectId: $DBPath.include('/mongoose', 'toObjectId.js'),
                newObjectId: $DBPath.include('/mongoose', 'newObjectId.js'),
            },
        };
    };

// para poder hacer log en cualquier parte del proyecto
global.$DBLog = new (winston.Logger)({
    transports: [new (winston.transports.Console)({colorize: true})],
});
$DBLog.level = 'silly';

module.exports.init = (opts) => {
    if (_.isUndefined(opts) || !_.isPlainObject(opts)) return;
    opts.dbs = opts.dbs || opts.databases;
    if (!_.isPlainObject(opts.dbs)) return;
    if (!_.isUndefined(opts.prefix) && !_.isString(opts.prefix)) return;
    if ((_.isUndefined(opts.inGlobal))  || (!_.isUndefined(opts.inGlobal) && !_.isBoolean(opts.inGlobal)))
        opts.inGlobal = true;
    if (_.isUndefined(opts.prefix)) opts.prefix = '$';
    if (opts.debug) mongoose.set('debug', true);
    if (opts.inGlobal) global[opts.prefix + 'Database'] = functions(opts);
    else return functions(opts);
};

module.exports.utils = {
    getNameCountries: $DBPath.include('/utils', 'getNameCountries.js'),
    compareBcrypt: $DBPath.include('/utils', 'compareBcrypt.js'),
    decryptAes256: $DBPath.include('/utils', 'decryptAes256.js'),
    encryptAes256: $DBPath.include('/utils', 'encryptAes256.js'),
    encryptSha1: $DBPath.include('/utils', 'encryptSha1.js'),
    isLocalizableString: $DBPath.include('/utils', 'isLocalizableString.js'),
    isLocalizableCountry: $DBPath.include('/utils', 'isLocalizableCountry.js'),
    toLocalizableCountry: $DBPath.include('/utils', 'toLocalizableCountry.js'),
    toSlug: $DBPath.include('/utils', 'toSlug.js'),
};

module.exports.mongoose = {
    arrayContentObjectId: $DBPath.include('/mongoose', 'arrayContentObjectId.js'),
    stringToObjectId: $DBPath.include('/mongoose', 'stringToObjectId.js'),
    arrayToObjectIds: $DBPath.include('/mongoose', 'arrayToObjectIds.js'),
    isValidObjectId: $DBPath.include('/mongoose', 'isValidObjectId.js'),
    isObjectId: $DBPath.include('/mongoose', 'isObjectId.js'),
    toObjectId: $DBPath.include('/mongoose', 'toObjectId.js'),
};