/*jshint node: true*/
/**
 * @author lattmann / https://github.com/lattmann
 */

var config = require('./config.webgme.js');
var path = require('path');
config.server.port = 9091;

if (config.client.defaultContext) {
	config.client.defaultContext.project = "guest+SysML";
}
config.seedProjects.defaultProject = "SysML";

config.mongo.uri = 'mongodb://127.0.0.1:27017/webgme_sysml';

module.exports = config;
