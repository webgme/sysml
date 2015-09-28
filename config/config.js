var config = require('webgme/config/config.default'),
    validateConfig = require('webgme/config/validator');

// Overwrite options as needed
config.server.port = 9091;
config.mongo.uri = 'mongodb://127.0.0.1:27017/webgme_sysml';


validateConfig(config);
module.exports = config;