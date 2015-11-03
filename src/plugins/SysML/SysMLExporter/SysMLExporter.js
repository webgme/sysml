/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Author: Dana Zhang
 * Created on: October 23, 2015
 */

define(['plugin/PluginConfig',
    'plugin/PluginBase',
    './UseCaseDiagramExporter',
    './RequirementDiagramExporter',
    'ejs',
    'plugin/SysMLExporter/SysMLExporter/Templates/Templates',
    'text!./Templates/model.di'
    ], function (PluginConfig, PluginBase, UseCaseExporter, RequirementExporter, ejs, TEMPLATES, modelDiFile) {

    'use strict';

    var SysMLExporterPlugin = function () {
        PluginBase.call(this);
        this.modelID = 0;
        this.usecaseDiagrams = {};
        this.diagrams = [];
        this.diagram = {};
        this.outputFiles = {};
        this.idLUT = {};
        this.error = '';
    };

    SysMLExporterPlugin.prototype = Object.create(PluginBase.prototype);
    SysMLExporterPlugin.prototype.constructor = SysMLExporterPlugin;

    SysMLExporterPlugin.prototype.getName = function () {
        return 'SysMLExporter';
    };

    SysMLExporterPlugin.prototype.main = function (callback) {

        var self = this,
            selectedNode = self.activeNode,
            afterAllVisited;

        if (!selectedNode) {
            callback('selectedNode is not defined', self.result);
            return;
        }
        afterAllVisited = function (err) {
            if (err) {
                callback(err, self.result);
                return;
            }
            self.saveResults(callback);
        };
        self.visitFromNode(selectedNode, afterAllVisited);
    };

    SysMLExporterPlugin.prototype.visitFromNode = function (node, callback) {
        var self = this,
            afterLoading;
        afterLoading = function (err, children) {
            var counter,
                i,
                itrCallback,
                error = '';
            if (err) {
                callback('failed to load children, error: ' + err);
                return;
            }
            counter = {visits: children.length};
            itrCallback = function (err) {
                error = err ? error += err : error;
                counter.visits -= 1;
                if (counter.visits <= 0) {
                    callback(error);
                }
            };

            if (children.length === 0) {
                itrCallback(null);
            } else {
                for (i = 0; i < children.length; i += 1) {
                    self.visitObject(children[i], function (err, node) {
                        self.visitChildrenRec(node, counter, itrCallback);
                    });
                }
            }
        };
        self.core.loadChildren(node, afterLoading);
    };

    SysMLExporterPlugin.prototype.visitChildrenRec = function (node, counter, callback) {
        var self = this,
            core = self.core,
            afterLoading;

        afterLoading = function (err, children) {
            var i;
            if (err) {
                callback('failed to load children, error: ' + err);
                return;
            }
            counter.visits += children.length;
            if (children.length === 0) {
                callback(null);
            } else {
                counter.visits -= 1;
                for (i = 0; i < children.length; i += 1) {
                    self.visitObject(children[i], function (err, node) {
                        self.visitChildrenRec(node, counter, callback);
                    });
                }
            }
        };
        core.loadChildren(node, afterLoading);
    };

    SysMLExporterPlugin.prototype.visitObject = function (node, callback) {
        var self = this,
            core = self.core,
            gmeID = core.getPath(node),
            baseClass = self.getMetaType(node),
            parentBaseClass = self.getMetaType(node.parent),
            isPackage = self.isMetaTypeOf(parentBaseClass, self.META.Package),
            /** use case diagram **/
            isActor = self.isMetaTypeOf(baseClass, self.META.Actor),
            isUseCase = self.isMetaTypeOf(baseClass, self.META.UseCase),
            //isSubject = self.isMetaTypeOf(baseClass, self.META.Subject),
            isUseCaseLink = self.isMetaTypeOf(baseClass, self.META.UseCaseLinks),
            isUseCaseParent = isPackage || self.isMetaTypeOf(parentBaseClass, self.META.Block) ||
                            self.isMetaTypeOf(parentBaseClass, self.META.UseCaseDiagram),
            isUseCaseDiagram = isUseCaseParent && (isActor || isUseCase || isUseCaseLink),

            /** requirement diagram **/
            isRequirement = self.isMetaTypeOf(parentBaseClass, self.META.Requirement),
            isRqtParent = isPackage || self.isMetaTypeOf(parentBaseClass, self.META.RequirementDiagram),
            isRqtDiagram = isRqtParent && (isRequirement),
            afterConnAdded;

        if (isUseCaseDiagram) {
            _.extend(self, new UseCaseExporter());
            if (isUseCaseLink) {
                afterConnAdded = function (err) {
                    if (err) {
                        self.error += err;
                        callback(err, node);
                        return;
                    }
                    callback(null, node);
                };
                self.addConnection(node, afterConnAdded);
            } else {
                // if key not exist already, add key; otherwise ignore
                if (!self.idLUT.hasOwnProperty(gmeID)) {
                    self.addComponent(node);
                }
                callback(null, node);
            }
        } else if (isRqtDiagram) {
            _.extend(self, new RequirementExporter());
            // todo: add object
        } else {
            callback(null, node);
        }
    };

    SysMLExporterPlugin.prototype.saveResults = function (callback) {
        var self = this,
            diagramPath,
            i,
            h = 0,
            diagramId = 1,
            output,
            artifact = self.blobClient.createArtifact('SysMLExporterOutput');

        for (diagramPath in self.usecaseDiagrams) {
            if (self.usecaseDiagrams.hasOwnProperty(diagramPath)) {
                var notationFile,
                    modelFile,
                    projectFile,
                    modelNotationElms = [],
                    modelElms = [];

                    for (i = 0; i < self.usecaseDiagrams[diagramPath].elements.length; ++i) {
                        var childElement = self.usecaseDiagrams[diagramPath].elements[i],
                            template = TEMPLATES[childElement.type + '.ejs'],
                            elm;
                            if (template) {
                                elm = ejs.render(template,
                                    {
                                        id: childElement.id,
                                        x: childElement.x,
                                        y: childElement.y
                                    });
                                modelNotationElms.push(elm);
                            }
                        elm = ejs.render(TEMPLATES['packagedElement.uml.ejs'],
                            {
                                type: childElement.type,
                                name: childElement.name,
                                id: childElement.id
                            });
                        modelElms.push(elm);
                    }

                    notationFile = ejs.render(TEMPLATES['model.notation.ejs'],
                            {diagramName: diagramPath.split('+')[1],
                            childrenElements: modelNotationElms.join('\n'),
                            diagramId: '_D' + diagramId})
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&#39;/g, "'")
                                .replace(/&quot;/g, '"');
                    modelFile = ejs.render(TEMPLATES['model.uml.ejs'],
                        {
                            diagramId: '_D' + diagramId++,
                            id: h,
                            childElements: modelElms.join('\n')
                        })
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&#39;/g, "'")
                        .replace(/&quot;/g, '"');

                    projectFile = ejs.render(TEMPLATES['.project.ejs'],
                        {
                            name: diagramPath.split('+')[1]
                        });

                    //self.diagram.usecasediagram.subject = self.usecaseDiagrams[diagramPath].subjects;
                    //self.diagram.usecasediagram.link = self.usecaseDiagrams[diagramPath].links;
                output = {
                    project: projectFile,
                    modelDi: modelDiFile,
                    notation: notationFile,
                    modelUml: modelFile
                };
                self.outputFiles['.project'] = projectFile;
                self.outputFiles['model.di'] = modelDiFile;
                self.outputFiles['model.notation'] = notationFile;
                self.outputFiles['model.uml'] = modelFile;
            }
            ++h;
        }

        artifact.addFiles(self.outputFiles, function (err, hashes) {
            if (err) {
                callback(err, self.result);
                return;
            }
            self.logger.warn(hashes.toString());
            artifact.save(function (err, hash) {
                if (err) {
                    callback(err, self.result);
                    return;
                }
                self.result.addArtifact(hash);
                self.result.setSuccess(true);
                callback(null, self.result);
            });
        });
    };

    SysMLExporterPlugin.prototype.addComponent = function (nodeObj) {

    };

    SysMLExporterPlugin.prototype.addConnection = function (nodeObj, callback) {

    };

    return SysMLExporterPlugin;
});