/*jshint node: true*/
/**
 * @author lattmann / https://github.com/lattmann
 */

var config = require('webgme/config/config.default');
var path = require('path');
config.server.port = 9091;

config.plugin.basePaths.push('./src/plugins/Layout');
// config.plugin.basePaths = ['./src/plugins/Test']; //disable exposure of core-plugins

if (config.client.defaultContext) {
	config.client.defaultContext.project = "guest+SysML";
}
config.seedProjects.defaultProject = "SysML";
config.seedProjects.basePaths.push('./seeds');



config.visualization.decoratorPaths.push('./src/decorators');

config.mongo.uri = 'mongodb://127.0.0.1:27017/webgme_sysml';

module.exports = config;
