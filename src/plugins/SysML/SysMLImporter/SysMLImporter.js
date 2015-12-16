/**
 * Created by Dana Zhang on 11/8/15.
 */
/*globals define*/
/*jshint node:true, browser:true*/


define([
    'plugin/PluginConfig',
    'plugin/PluginBase',
    './RequirementDiagramImporter',
    './UseCaseDiagramImporter',
    './BlockDefinitionDiagramImporter',
    'jszip',
    'xmljsonconverter'
], function (
    PluginConfig,
    PluginBase,
    RequirementDiagramImporter,
    UseCaseDiagramImporter,
    BlockDefinitionDiagramImporter,
    JSZip,
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
            currentConfig = self.getCurrentConfig(),
            getSysMLDataCallback;

        if (!currentConfig.file) {
            callback(new Error('No file provided.'), self.result);
            return;
        }

        if ( !self.activeNode ) {
            self.createMessage( null,
                'Active node not found! Try selecting another model and re-opening the desired model', 'error' );
            callback( 'Active node not found!', self.result );
            return;
        }

        if ( !self.isMetaTypeOf( self.activeNode, self.META.Package ) ) {
            var msg = "SysMLImporter must be called from a Package!";
            self.logger.error( msg );
            self.createMessage( self.activeNode, msg, 'error' );
            self.result.setSuccess( false );
            callback( null, self.result );
            return;
        }

        getSysMLDataCallback = function ( err, hash2acmJsonMap ) {
            var numUploaded,
                sysmlJson,
                numCreated = 0;

            if ( err ) {
                callback( err, self.result );
                return;
            }

            numUploaded = Object.keys( hash2acmJsonMap )
                .length;


            for ( var hash in hash2acmJsonMap ) {
                sysmlJson = hash2acmJsonMap[ hash ];
                self.buildUpSysMLModel(sysmlJson.modelUml, sysmlJson.notation);
                numCreated += 1;
            }

            ////var propertyString = JSON.stringify(self.propertyJson, null, 4);
            //
            //self.save( 'added obj', function ( err ) {
            //    if ( err ) {
            //        callback( err, self.result );
            //        return;
            //    }
            //    //if ( numUploaded > 1 ) {
            //    //    self.createMessage( acmFolderNode, numCreated + ' ACMs created out of ' +
            //    //        numUploaded + ' uploaded.', 'info' );
            //    //}
            //    if ( self.cleanImport === true ) {
            //        self.result.setSuccess( true );
            //    } else {
            //        self.result.setSuccess( false );
            //    }
            //
            //    callback( null, self.result );
            //} );

            self.save('SysML Importer created new model.', function (err) {
                if (err) {
                    callback(err, self.result);
                    return;
                }

                self.result.setSuccess(true);
                callback(null, self.result);
            });
        };


        self.getSysMLData(currentConfig.file, getSysMLDataCallback);


    };

    SysMLImporter.prototype.buildUpSysMLModel = function(dataModel, notationData) {

        var self = this,
            //projectName = projectData ? projectData.projectDescription.name : null,
            sysmlData = dataModel['http://www.eclipse.org/uml2/5.0.0/UML:Model']
                || dataModel['http://www.omg.org/spec/XMI/20131001:XMI']['http://www.eclipse.org/uml2/5.0.0/UML:Model'],
            notationObj = notationData['http://www.eclipse.org/gmf/runtime/1.0.2/notation:Diagram']
                || notationData['http://www.omg.org/XMI:XMI']['http://www.eclipse.org/gmf/runtime/1.0.2/notation:Diagram'],
            portAndFlows = dataModel['http://www.eclipse.org/papyrus/0.7.0/SysML/PortAndFlows:FlowPort']
            || dataModel['http://www.omg.org/spec/XMI/20131001:XMI']['http://www.eclipse.org/papyrus/0.7.0/SysML/PortAndFlows:FlowPort'],
            _buildDiagram,
            i;

        _buildDiagram = function(notation) {
            switch (notation['@type']) {
                case 'RequirementDiagram':
                    sysmlData = dataModel['http://www.omg.org/spec/XMI/20131001:XMI'];
                    _.extend(self, new RequirementDiagramImporter());
                        break;
                case 'UseCase':
                    _.extend(self, new UseCaseDiagramImporter());
                    break;
                case 'BlockDefinition':
                    _.extend(self, new BlockDefinitionDiagramImporter());
            }
            self.buildDiagram(sysmlData, notation, portAndFlows);
        };


        if (notationObj) {
            if (notationObj.length) {
                //todo: handle multiple diagrams
                for (i = 0; i < notationObj.length; ++i) {
                    _buildDiagram(notationObj[i]);
                }
            } else {
                _buildDiagram(notationObj);
            }
        }

    };

    SysMLImporter.prototype.buildDiagram = function (sysmlData, modelNotation, portsAndFlows) {

    };

    SysMLImporter.prototype.getSysMLData = function(filehash, callback) {
        var self = this,
            blobGetMetadataCallback;

        blobGetMetadataCallback = function ( getMetadataErr, metadata ) {
            if ( getMetadataErr ) {
                callback( getMetadataErr );
                return;
            }

            var content = metadata[ 'content' ],
                contentName = metadata[ 'name' ],
                contentType = metadata[ 'contentType' ],
                single = false,
                multi = false,
                hashTosysmlJsonMap = {},
                blobGetObjectCallback;

            if ( contentType === 'complex' ) {
                multi = true;
            } else if ( contentType === 'object' && contentName.indexOf( '.zip' ) > -1 ) {
                single = true;
            } else {
                var msg = 'Uploaded file "' + contentName + '" must be a .zip';
                self.createMessage( self.activeNode, msg, 'error' );
                self.logger.error( msg );
                callback( msg );
                return;
            }

            blobGetObjectCallback = function ( getObjectErr, uploadedObjContent ) {
                if ( getObjectErr ) {
                    callback( getObjectErr );
                    return;
                }

                var zipFile = new JSZip( uploadedObjContent ),
                    sysmlObjects,
                    sysmlObject,
                    sysmlContent,
                    sysmlZipFileName,
                    sysmlHash,
                    sysmlZipFile,
                    numbersysmlFiles,
                    sysmlJson;

                if (zipFile.file( /\.zip$/).length === 0 && zipFile.file( /\.uml/).length) {
                    single = true; // support complex blobs with sysml files
                }

                if ( single ) {
                    sysmlJson = self.getsysmlJsonFromZip( zipFile, contentName );

                    if ( sysmlJson != null ) {
                        hashTosysmlJsonMap[ filehash ] = sysmlJson;
                    }


                } else if ( multi ) {

                    sysmlObjects = zipFile.file( /\.zip$/ );
                    numbersysmlFiles = sysmlObjects.length;

                    for ( var i = 0; i < numbersysmlFiles; i += 1 ) {
                        sysmlObject = sysmlObjects[ i ];
                        sysmlZipFileName = sysmlObject.name;
                        sysmlContent = sysmlObject.asArrayBuffer();
                        sysmlZipFile = new JSZip( sysmlContent );
                        sysmlHash = content[ sysmlZipFileName ].content; // blob 'soft-link' hash

                        sysmlJson = self.getsysmlJsonFromZip( sysmlZipFile, sysmlZipFileName );

                        if ( sysmlJson != null ) {
                            hashTosysmlJsonMap[ sysmlHash ] = sysmlJson;
                        }
                    }

                }

                callback( null, hashTosysmlJsonMap );
            };

            self.blobClient.getObject( filehash, blobGetObjectCallback );
        };

        self.blobClient.getMetadata( filehash, blobGetMetadataCallback );
    };

    SysMLImporter.prototype.getsysmlJsonFromZip = function ( sysmlZip, sysmlZipName ) {
        var self = this,
            converterResult,
            sysmlXml = sysmlZip.file( /\.uml/ ),
            sysmlNotation = sysmlZip.file(/\.notation/),
            projectFile = sysmlZip.file(/\.project/),
            modelFile = sysmlZip.file('model.di'),
            msg;

        if ( sysmlXml.length === 1 ) {
            converterResult = {modelUml : self.convertXmlString2Json( sysmlXml[ 0 ].asText() )};

            if (sysmlNotation.length === 1) {
                converterResult.notation = self.convertXmlString2Json(sysmlNotation[0].asText());
            }

            if (projectFile.length === 1) {
                converterResult.project = self.convertXmlString2Json(projectFile[0].asText());
            }

            if ( converterResult instanceof Error ) {
                msg = '.uml file in "' + sysmlZipName + '" is not a valid xml.';
                self.logger.error( msg );
                self.createMessage( null, msg, 'error' );
                self.cleanImport = false;
                return null;
            } else {
                return converterResult;
            }
        } else if ( sysmlXml.length === 0 || sysmlNotation.length === 0) {
            msg = 'Missing model uml and notation files inside ' + sysmlZipName + '.';
            self.logger.error( msg );
            self.createMessage( null, msg, 'error' );
            self.cleanImport = false;
            return null;
        } else {
            msg = 'Found multiple .uml files in ' + sysmlZipName + '. Only one was expected.';
            self.logger.error( msg );
            self.createMessage( null, msg, 'error' );
            converterResult = self.convertXmlString2Json( sysmlXml[ 0 ].asText() );

            if ( converterResult instanceof Error ) {
                msg = '.uml file in ' + sysmlZipName + ' is not a valid xml.';
                self.logger.error( msg );
                self.createMessage( null, msg, 'error' );
                self.cleanImport = false;
                return null;
            } else {
                return converterResult;
            }
        }
    };

    SysMLImporter.prototype.convertXmlString2Json = function ( acmXmlString ) {
        var converter = new Converter.Xml2json( {
                skipWSText: true
            } );

        return converter.convertFromString( acmXmlString );
    };

    return SysMLImporter;
});


