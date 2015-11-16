/**
 * Created by Dana Zhang on 11/8/15.
 */
/*globals define*/
/*jshint node:true, browser:true*/


define([
    'plugin/PluginConfig',
    'plugin/PluginBase',
    'xmljsonconverter'
], function (
    PluginConfig,
    PluginBase,
    Converter) {
    'use strict';

    /**
     * Initializes a new instance of SysMLImporter.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin SysMLImporter.
     * @constructor
     */
    var SysMLImporter = function () {
        // Call base class' constructor.
        PluginBase.call(this);
    };

    // Prototypal inheritance from PluginBase.
    SysMLImporter.prototype = Object.create(PluginBase.prototype);
    SysMLImporter.prototype.constructor = SysMLImporter;

    /**
     * Gets the name of the SysMLImporter.
     * @returns {string} The name of the plugin.
     * @public
     */
    SysMLImporter.prototype.getName = function () {
        return 'SysML Importer';
    };

    /**
     * Gets the semantic version (semver.org) of the SysMLImporter.
     * @returns {string} The version of the plugin.
     * @public
     */
    SysMLImporter.prototype.getVersion = function () {
        return '0.1.0';
    };

    /**
     * Gets the configuration structure for the SysMLImporter.
     * The ConfigurationStructure defines the configuration for the plugin
     * and will be used to populate the GUI when invoking the plugin from webGME.
     * @returns {object} The version of the plugin.
     * @public
     */
    SysMLImporter.prototype.getConfigStructure = function () {
        return [
            {
                name: 'file',
                displayName: 'SysML model',
                description: 'Click and drag existing SysML models from Eclipse Papyrus',
                value: '',
                valueType: 'asset',
                readOnly: false
            }
        ];
    };


    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    SysMLImporter.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            currentConfig = self.getCurrentConfig();

        if (!currentConfig.file) {
            callback(new Error('No file provided.'), self.result);
            return;
        }

        self.blobClient.getObject( currentConfig.file, function ( err, xmlArrayBuffer ) {
            var xmlToJson = new Converter.Xml2json( {
                skipWSText: true
                //arrayElements: arrayElementsInXml
            } );
            if ( err ) {
                self.logger.error( 'Retrieving uml failed with err:' + err.toString() );
                self.createMessage( null, 'Could not retrieve content of uml-file.', 'error' );
                callback( 'Retrieving uml file failed with err:' + err.toString(), self.result );
                return;
            }
            var sysmlData = xmlToJson.convertFromBuffer( xmlArrayBuffer );
            if (sysmlData instanceof Error ) {
                self.createMessage( null, 'Given atm not valid xml: ' + sysmlData.message, 'error' );
                callback( null, self.result );
                return;
            }

            self.logger.debug( JSON.stringify( sysmlData, null, 4 ) );
            self.buildUpSysMLModel(sysmlData, function (err) {
                if (err) {
                    callback(err, self.result);
                    return;
                }

                self.save('SysML Importer created new model.', function (err) {
                    if (err) {
                        callback(err, self.result);
                        return;
                    }

                    self.result.setSuccess(true);
                    callback(null, self.result);
                });
            });
            //self.createTestBench( self.activeNode );
            //finnishPlugin( null );
        } );

    };

    SysMLImporter.prototype.buildUpSysMLModel = function(dataModel, callback) {
        var self = this,
            sysmlData = dataModel['http://www.eclipse.org/uml2/5.0.0/UML:Model'],
            PREFIX ='@http://www.omg.org/spec/XMI/20131001:',
            i, j,
            idToNode = {},
            node,
            linkNode,
            nodeId,
            nodeType,
            links = [],
            smNode;

        if (!sysmlData) {
            callback('!!Oops something went wrong with the model format!!');
            return;
        }

        // Create the use case diagram
        smNode = self.core.createNode({
            parent: self.activeNode,
            base: self.META.UseCaseDiagram
        });

        self.core.setAttribute(smNode, 'name', sysmlData['@name']);
        self.core.setRegistry(smNode, 'position', {x: 200, y: 200});

        // Create the states and gather data about the actor and use case
        for (i = 0; i < sysmlData.packagedElement.length; i += 1) {
            nodeId = sysmlData.packagedElement[i][PREFIX + 'id'];
            nodeType = sysmlData.packagedElement[i][PREFIX + 'type'].replace('uml:', '');



            if (nodeType === 'Association') {

                links.push({
                    src: sysmlData.packagedElement[i]['ownedEnd'][1]['@type'].replace('src_', ''),
                    dst: sysmlData.packagedElement[i]['ownedEnd'][0]['@type'].replace('dst_', ''),
                    type: 'Association'
                });

            } else {
                node = self.core.createNode({
                    parent: smNode,
                    base: self.META[nodeType]
                });

                self.core.setAttribute(node, 'name', sysmlData.packagedElement[i]['@name']);
                self.core.setRegistry(node, 'position', {x: 50 + (100 * i), y: 200}); // This could be more fancy.

                // Add the node with its old id to the map (will be used when creating the transitions)
                idToNode[nodeId] = node;

                // Gather the outgoing extend links from the current use case and store the info.
                if (sysmlData.packagedElement[i].extend) {
                    if (sysmlData.packagedElement[i].extend.length) {

                        for (j = 0; j < sysmlData.packagedElement[i].extend.length; j += 1) {
                            links.push({
                                src: nodeId,
                                dst: sysmlData.packagedElement[i].extend[j]['@extendedCase'],
                                type: 'Extend'
                            });
                        }
                    } else {
                        links.push({
                            src: nodeId,
                            dst: sysmlData.packagedElement[i].extend['@extendedCase'],
                            type: 'Extend'
                        });
                    }
                }
                // Gather the outgoing include links from the current use case and store the info.
                if (sysmlData.packagedElement[i].include) {
                    if (sysmlData.packagedElement[i].include.length) {

                        for (j = 0; j < sysmlData.packagedElement[i].include.length; j += 1) {
                            links.push({
                                src: nodeId,
                                dst: sysmlData.packagedElement[i].include[j]['@addition'],
                                type: 'Include'
                            });
                        }
                    } else {
                        links.push({
                            src: nodeId,
                            dst: sysmlData.packagedElement[i].include['@addition'],
                            type: 'Include'
                        });
                    }
                }
            }
            }

        // With all links created, we will now create the connections between the nodes.
        for (i = 0; i < links.length; i += 1) {
            linkNode = self.core.createNode({
                parent: smNode,
                base: self.META[links[i].type]
            });

            self.core.setPointer(linkNode, 'src', idToNode[links[i].src]);
            self.core.setPointer(linkNode, 'dst', idToNode[links[i].dst]);
        }

        callback(null);
    };

    return SysMLImporter;
});