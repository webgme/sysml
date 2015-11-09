/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Author: Dana Zhang
 * Created on: October 23, 2015
 */

define(['plugin/PluginConfig',
    'plugin/PluginBase',
    './UseCaseDiagramExporter',
    './RequirementDiagramExporter'
    ], function (PluginConfig, PluginBase, UseCaseExporter, RequirementExporter) {

    'use strict';

    var SysMLExporterPlugin = function () {
        PluginBase.call(this);
        this.modelID = 0;
        this.usecaseDiagrams = {};
        this.diagrams = [];
        this.diagram = {};
        this.outputFiles = {};
        this.idLUT = {};
        this.reverseIdLUT = {};
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

    };

    SysMLExporterPlugin.prototype.addComponent = function (nodeObj) {

    };

    SysMLExporterPlugin.prototype.addConnection = function (nodeObj, callback) {

    };

    return SysMLExporterPlugin;
});