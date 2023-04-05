'use strict';

module.exports = (str) => require('mongoose').Types.ObjectId.isValid(str);
