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
    toSlug = $DBPath.include('/utils', 'toSlug.js');

module.exports = (opts) => {
    return (nameSeed, type, cb) => {
        let seedName, filename, template;

        opts.pathSeeders = _.get(opts, 'pathSeeders');

        if (_.isUndefinedOrNull(opts.pathSeeders) || !_.isString(opts.pathSeeders))
            return cb('not exist path to seeders', null, null);

        // create seeds directory
        if (!fs.existsSync(opts.pathSeeders)) fs.mkdirSync(opts.pathSeeders);

        if (type && type == 'file') seedName = toSlug(nameSeed) + '.js';
        else {
            seedName = toSlug(nameSeed);
            if (!fs.existsSync(opts.pathSeeders + seedName)) 
                fs.mkdirSync(opts.pathSeeders + seedName);
            seedName += '/index.js';
        }

        template = $DBPath.get('/lib/templates', 'seed.js');
        filename = opts.pathSeeders + seedName;

        template = fs.readFileSync(template);
        fs.writeFileSync(filename, template);
        cb(null, seedName, filename);
    };
};
