'use strict';

const mongoose = {
    isValidObjectId: $DBPath.include('/mongoose', 'isValidObjectId.js'),
    isObjectId: $DBPath.include('/mongoose', 'isObjectId.js'),
    toObjectId: $DBPath.include('/mongoose', 'toObjectId.js'),
};

module.exports = (str, valueDefault) => {
    if (mongoose.isObjectId(str)) return str;
    if (mongoose.isValidObjectId(str)) return mongoose.toObjectId(str);
    return valueDefault;
};
