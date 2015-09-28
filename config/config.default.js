/*jshint node: true*/
/**
 * @author lattmann / https://github.com/lattmann
 */

var config = require('webgme/config/config.default');

config.server.port = 9091;

//config.plugin.basePaths.push('./src/plugins/Test');
//config.plugin.basePaths = ['./src/plugins/Test']; //disable exposure of core-plugins


config.client.defaultProject.name = "guest+SysML";
config.client.defaultProject.branch = "master";
config.client.defaultProject.node = "root";

config.seedProjects.defaultProject = "SysML";
config.mongo.uri = 'mongodb://127.0.0.1:27017/webgme_sysml';

module.exports = config;