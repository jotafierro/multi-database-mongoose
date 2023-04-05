'use strict';

module.exports = {
    detail: $DBPath.include('/lib/actions', 'detail.js'),
    list: $DBPath.include('/lib/actions', 'list.js'),
    remove: $DBPath.include('/lib/actions', 'remove.js'),
    restore: $DBPath.include('/lib/actions', 'restore.js'),
    create: $DBPath.include('/lib/actions', 'create.js'),
    update: $DBPath.include('/lib/actions', 'update.js'),
};