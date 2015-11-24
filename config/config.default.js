/*jshint node: true*/
/**
 * @author lattmann / https://github.com/lattmann
 */

var config = require('webgme/config/config.default');
var path = require('path');
config.server.port = 9091;

config.plugin.basePaths.push('./src/plugins/Layout');
config.plugin.basePaths.push('./src/plugins/SysML');
// config.plugin.basePaths = ['./src/plugins/Test']; //disable exposure of core-plugins

if (config.client.defaultContext) {
	config.client.defaultContext.project = "guest+SysML";
}
config.seedProjects.defaultProject = "SysML";
config.seedProjects.basePaths.push('./seeds');


config.requirejsPaths = {
	ejs: "./node_modules/webgme/src/common/util/ejs",
	xmljsonconverter: "./node_modules/webgme/src/common/util/xmljsonconverter"
};
config.visualization.decoratorPaths.push('./src/decorators');
config.visualization.decoratorsToPreload = null;

config.mongo.uri = 'mongodb://127.0.0.1:27017/webgme_sysml';

module.exports = config;
