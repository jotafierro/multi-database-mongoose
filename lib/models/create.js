'use strict';

const _ = {
        format: require('lodash-extends').format,
        get: require('lodash').get,
        isString: require('lodash').isString,
        isUndefinedOrNull: require('lodash-extends').isUndefinedOrNull,
        trim: require('lodash').trim,
    },
    fs = {
        existsSync: require('fs').existsSync,
        mkdirSync: require('fs').mkdirSync,
        readFileSync: require('fs').readFileSync,
        writeFileSync: require('fs').writeFileSync,
    };

module.exports = (opts) => {
    return (nameModel, extraPath, cb) => {
        let filename,
            template;

        if (_.isUndefinedOrNull(extraPath)) extraPath = '';
        else extraPath += '/';

        opts.path = _.get(opts, 'path');

        if (_.isUndefinedOrNull(opts.path) || !_.isString(opts.path))
            return cb('not exist path to models', null, null);

        // @t: validar que nameModel sea una sola palabra
        nameModel = _.trim(nameModel);

        template = $DBPath.get('/lib/templates', 'model.js');
        filename = opts.path + extraPath + nameModel + '.js';

        if (!fs.existsSync(opts.path + extraPath)) fs.mkdirSync(opts.path + extraPath);

        template = fs.readFileSync(template);
        fs.writeFileSync(filename, _.format(template.toString('utf8'), {Model: nameModel}));
        cb(null, nameModel, filename);
    };
};
