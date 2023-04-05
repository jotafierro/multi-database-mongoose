'use strict';

module.exports = (opts, connections) => {
    let getModel = $DBPath.include('/lib', 'get.js')(opts, connections),
        existModel = $DBPath.include('/lib', 'exist.js')(opts, connections),
        registerModel = $DBPath.include('/lib', 'register.js')(opts, connections);
    return (modelName, dbName) => {
        if (!existModel(modelName, dbName)) registerModel(modelName, dbName);
        return getModel(modelName, dbName);
    };
};
