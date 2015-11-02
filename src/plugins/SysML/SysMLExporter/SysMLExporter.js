/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Author: Dana Zhang
 * Created on: October 23, 2015
 */

define(['plugin/PluginConfig',
    'plugin/PluginBase',
    'ejs',
    'plugin/SysMLExporter/SysMLExporter/Templates/Templates',
    'text!./Templates/model.di'
    ], function (PluginConfig, PluginBase, ejs, TEMPLATES, modelDiFile) {

    'use strict';

    var SysMLExporterPlugin = function () {
        PluginBase.call(this);
        this.modelID = 0;
        this.usecaseDiagrams = {};
        this.diagrams = [];
        this.diagram = {};
        this.idLUT = {};
        this.outputFiles = {};
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
            isActor = self.isMetaTypeOf(baseClass, self.META.Actor),
            isUseCase = self.isMetaTypeOf(baseClass, self.META.UseCase),
            //isSubject = self.isMetaTypeOf(baseClass, self.META.Subject),
            isUseCaseLink = self.isMetaTypeOf(baseClass, self.META.UseCaseLinks),
            parentBaseClass = self.getMetaType(node.parent),
            isParentValid = self.isMetaTypeOf(parentBaseClass, self.META.Package) ||
                            self.isMetaTypeOf(parentBaseClass, self.META.Block) ||
                            self.isMetaTypeOf(parentBaseClass, self.META.UseCaseDiagram),
            validType = isParentValid && (isActor || isUseCase || isUseCaseLink),
            afterConnAdded;

        if (validType) {
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

        var self = this,
            core = self.core,
            gmeID = core.getPath(nodeObj),
            baseClass = self.getMetaType(nodeObj),
            type = core.getAttribute(baseClass, 'name'),
            name = core.getAttribute(nodeObj, 'name'),
            xPos = core.getRegistry(nodeObj, 'position').x,
            yPos = core.getRegistry(nodeObj, 'position').y,
            element,
            parentPath = core.getPath(core.getParent(nodeObj)),
            diagramKey = parentPath + "+" + core.getAttribute(nodeObj.parent, 'name');

        if (self.isMetaTypeOf(baseClass, self.META.Actor) || self.isMetaTypeOf(baseClass, self.META.UseCase)) {

            self.idLUT[gmeID] = self.modelID;

            element = {
                name: name,
                id: self.modelID,
                x: xPos,
                y: yPos,
                type: type
            };
            //actor = ejs.render(TEMPLATES['actor.uml.ejs'], {actorId: self.modelID, x: xPos, y: yPos});

            if (!self.usecaseDiagrams.hasOwnProperty(diagramKey)) {
                self.usecaseDiagrams[diagramKey] = {};
            }
            if (!self.usecaseDiagrams[diagramKey].hasOwnProperty('elements')) {
                self.usecaseDiagrams[diagramKey].elements = [];
            }
            self.usecaseDiagrams[diagramKey].elements.push(element);
            self.modelID += 1;
        }
    };

    SysMLExporterPlugin.prototype.addConnection = function (nodeObj, callback) {

        var self = this,
            core = self.core,
            parentPath = core.getPath(core.getParent(nodeObj)),
            diagramKey = parentPath + "+" + core.getAttribute(nodeObj.parent, 'name'),
            src = core.getPointerPath(nodeObj, "src"),
            dst = core.getPointerPath(nodeObj, "dst"),
            counter = 2,
            error = '',
            pushUseCaseLink,
            afterSrcLoaded,
            afterDstLoaded,
            srcMetaType,
            dstMetaType,
            srcX,
            srcY,
            dstX,
            dstY;

        pushUseCaseLink = function (err, shouldPush) {
            var link;
            if (err) {
                error += err;
                shouldPush = false;
            }
            counter -= 1;
            if (counter === 0) {
                if (error) {
                    callback(error);
                    return;
                }
                if (shouldPush) {

                    link = {
                        "@id": self.modelID,
                        "@source": self.idLUT[src],
                        "@target": self.idLUT[dst],
                        "points": {
                            "point": [
                                {
                                    "@x": srcX,
                                    "@y": srcY
                                },
                                {
                                    "@x": dstX,
                                    "@y": dstY
                                }
                            ]
                        }
                    };
                    if (!self.usecaseDiagrams.hasOwnProperty(diagramKey)) {
                        self.usecaseDiagrams[diagramKey] = {};
                    }
                    if (!self.usecaseDiagrams[diagramKey].hasOwnProperty('links')) {
                        self.usecaseDiagrams[diagramKey].links = [];
                    }
                    //self.usecaseDiagrams[diagramKey].links.push(link);
                }
                self.modelID += 1;
                callback(null);
            }
        };

        afterSrcLoaded = function (err, nodeObj) {
            if (err) {
                pushUseCaseLink(err, false);
                return;
            }
            if (!self.idLUT.hasOwnProperty(src)) {
                srcMetaType = core.getAttribute(self.getMetaType(nodeObj), 'name');
                self.addComponent(nodeObj, srcMetaType);
                self.modelID += 1;
            }
            srcX = core.getRegistry(nodeObj, 'position').x;
            srcY = core.getRegistry(nodeObj, 'position').y;
            pushUseCaseLink(null, true);
        };
        core.loadByPath(self.rootNode, src, afterSrcLoaded);

        afterDstLoaded = function (err, nodeObj) {
            if (err) {
                pushUseCaseLink(err, false);
                return;
            }
            if (!self.idLUT.hasOwnProperty(dst)) {
                srcMetaType = core.getAttribute(self.getMetaType(nodeObj), 'name');
                self.addComponent(nodeObj, dstMetaType);
                self.modelID += 1;
            }
            dstX = core.getRegistry(nodeObj, 'position').x;
            dstY = core.getRegistry(nodeObj, 'position').y;
            pushUseCaseLink(null, true);
        };
        core.loadByPath(self.rootNode, dst, afterDstLoaded);

    };

    return SysMLExporterPlugin;
});