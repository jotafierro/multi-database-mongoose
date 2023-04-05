'use strict';

const _ = {
        get: require('lodash').get,
        filter: require('lodash').filter,
        first: require('lodash').first,
        isEmpty: require('lodash').isEmpty,
        isNull: require('lodash').isNull,
        isString: require('lodash').isString,
        isUndefined: require('lodash').isUndefined,
        isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
        set: require('lodash').set,
        toInteger: require('lodash').toInteger,
    },
    fs = {
        existsSync: require('fs').existsSync,
        mkdirSync: require('fs').mkdirSync,
        readdirSync: require('fs').readdirSync,
    },
    moment = require('moment'),
    switchMigration = {
        up: (numberOfMigrations, docMigrate, opts, cb) => {
            let migrations = fs.readdirSync(opts.pathMigrations),
                timestamp;

            if (_.isEmpty(migrations)) return cb('not exist migrations', null);

            migrations = migrations.sort((a, b) => getTimestamp(a) - getTimestamp(b));
            if (_.isNull(docMigrate)) {
                docMigrate = new opts.modelMigrate({});
                timestamp = moment(getTimestamp(_.first(migrations))).subtract(1, 'seconds').unix();
            } else timestamp = docMigrate.last;

            migrations = _.filter(migrations, (nameMigration) => {
                let timestampMigration = getTimestamp(nameMigration);
                return timestampMigration > timestamp;
            });

            if (_.isEmpty(migrations)) return cb('not migrate', null);

            if (numberOfMigrations > migrations.length) numberOfMigrations = migrations.length;

            loopMigrations('up', numberOfMigrations, migrations, docMigrate, [], opts, (doc, result) => {
                doc.save((err) => {
                    if (err) return cb(err, result);
                    cb(null, result);
                });
            });
        },
        down: (numberOfMigrations, docMigrate, opts, cb) => {
            let migrations = fs.readdirSync(opts.pathMigrations),
                timestamp;
            migrations = migrations.sort((a, b) => getTimestamp(b) - getTimestamp(a));
            timestamp = docMigrate.last;

            migrations = _.filter(migrations, (nameMigration) => {
                let timestampMigration = getTimestamp(nameMigration);
                return timestampMigration <= timestamp;
            });

            if (numberOfMigrations > migrations.length) numberOfMigrations = migrations.length;

            loopMigrations('down', numberOfMigrations, migrations, docMigrate, [], opts, (doc, result) => {
                if (_.isNull(doc)) 
                    return opts.modelMigrate.remove((err) => {
                        if (err) return cb(err, result);
                        cb(null, result);
                    });
                doc.save((err) => {
                    if (err) return cb(err, result);
                    cb(null, result);
                });
            });
        },
    },
    applyMigration = (direction, migration, cb) => migration[direction](cb),
    loopMigrations = (direction, numberOfMigrations, migrations, docMigrate, result, opts, cb) => {
        let nameMigration,
            migration;

        if (numberOfMigrations == 0) return cb(docMigrate, result);

        nameMigration = migrations.shift();
        if (!_.isUndefined(nameMigration)) {
            if (direction == 'down') {
                let previusMigration = _.get(migrations, '[0]');
                if (!_.isUndefined(previusMigration)) 
                    docMigrate.last = getTimestamp(previusMigration);
                else docMigrate = null;
            } else docMigrate.last = getTimestamp(nameMigration);
        }

        result.push('apply ' + direction + ' ' + nameMigration);
        migration = require(opts.pathMigrations + nameMigration);
        applyMigration(direction, migration, () => {
            numberOfMigrations--;
            loopMigrations(direction, numberOfMigrations, migrations, docMigrate, result, opts, cb);
        });
    },
    getTimestamp = (name) => _.toInteger((name.split('-'))[0]),
    modelMigrate = $DBPath.include('/lib/migrations', 'modelMigrate.js');

module.exports = (opts, connections) => {
    let existModel = $DBPath.include('/lib', 'exist.js')(opts, connections),
        getModel = $DBPath.include('/lib', 'get.js')(opts, connections),
        registerModel = $DBPath.include('/lib', 'register.js')(opts, connections);
    return (direction, numberOfMigrations, cb) => {
        let Migrate,
            dbName = opts.defaultDbName;

        if (!existModel(modelMigrate.name)) registerModel(modelMigrate, dbName);
        Migrate = getModel(modelMigrate.name, dbName);

        opts.pathMigrations = _.get(opts, 'pathMigrations');

        if (_.isUndefinedOrNull(opts.pathMigrations) || !_.isString(opts.pathMigrations))
            return cb('not exist path to migrations');

        // create migrations directory
        if (!fs.existsSync(opts.pathMigrations)) fs.mkdirSync(opts.pathMigrations);

        if (numberOfMigrations == 0) return $DBLog.error('not valid number of migrations');

        Migrate.findOne({}, 'last').exec((err, docMigrate) => {
            if (err) return cb(err);

            if (direction == 'down' && _.isNull(docMigrate)) {
                return cb('not migrate');
            }

            _.set(opts, 'modelMigrate', Migrate);
            switchMigration[direction](numberOfMigrations, docMigrate, opts, cb);
        });
    };
};
