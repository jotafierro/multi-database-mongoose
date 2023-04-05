'use strict';

const _ = {
        get: require('lodash').get,
        isString: require('lodash').isString,
        isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
    },
    fs = {
        existsSync: require('fs').existsSync,
        mkdirSync: require('fs').mkdirSync,
        readFileSync: require('fs').readFileSync,
        writeFileSync: require('fs').writeFileSync,
    },
    moment = require('moment'),
    toSlug = $DBPath.include('/utils', 'toSlug.js');

module.exports = (opts) => {
    return (description, type, cb) => {
        let timestamp,
            migrationName,
            filename,
            template;

        opts.pathMigrations = _.get(opts, 'pathMigrations');

        if (_.isUndefinedOrNull(opts.pathMigrations) || !_.isString(opts.pathMigrations))
            return cb('not exist path to migrations', null, null);

        // create migrations directory
        if (!fs.existsSync(opts.pathMigrations)) fs.mkdirSync(opts.pathMigrations);

        timestamp = moment().unix();
        if (type && type == 'file')
            migrationName = timestamp + '-' + toSlug(description) + '.js';
        else {
            migrationName = timestamp + '-' + toSlug(description);
            if (!fs.existsSync(opts.pathMigrations + migrationName))
                fs.mkdirSync(opts.pathMigrations + migrationName);
            migrationName += '/index.js';
        }
        template = $DBPath.get('/lib/templates', 'migration.js');
        filename = opts.pathMigrations + migrationName;

        template = fs.readFileSync(template);
        fs.writeFileSync(filename, template);
        cb(null, description, filename);
    };
};
