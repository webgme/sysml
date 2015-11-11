/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Author: Dana Zhang
 * Created on: October 31, 2015
 */

define(['ejs',
    'plugin/SysMLExporter/SysMLExporter/Templates/Templates',
    './SysMLExporterConstants'], function (ejs, TEMPLATES, CONSTANTS) {

    'use strict';

    var RequirementDiagramExporter = function () {
    };

    RequirementDiagramExporter.prototype.addComponent = function (nodeObj) {

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

        if (self.isMetaTypeOf(baseClass, self.META.Requirement)) {

            self.idLUT[gmeID] = self.modelID;

            element = {
                name: name,
                id: self.modelID,
                x: xPos,
                y: yPos,
                type: 'Class'
            };

            if (!self.requirementDiagrams.hasOwnProperty(diagramKey)) {
                self.requirementDiagrams[diagramKey] = {};
            }
            if (!self.requirementDiagrams[diagramKey].hasOwnProperty('elements')) {
                self.requirementDiagrams[diagramKey].elements = [];
            }
            self.requirementDiagrams[diagramKey].elements.push(element);
            self.modelID += 1;
        }
    };

    RequirementDiagramExporter.prototype.addConnection = function (nodeObj, callback) {

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
                    if (!self.requirementDiagrams.hasOwnProperty(diagramKey)) {
                        self.requirementDiagrams[diagramKey] = {};
                    }
                    if (!self.requirementDiagrams[diagramKey].hasOwnProperty('links')) {
                        self.requirementDiagrams[diagramKey].links = [];
                    }
                    //self.requirementDiagrams[diagramKey].links.push(link);
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

    RequirementDiagramExporter.prototype.saveResults = function (callback) {
        var self = this,
            diagramPath,
            i,
            h = 0,
            obj,
            diagramId = 1,
            output,
            artifact = self.blobClient.createArtifact('SysMLExporterOutput');

        for (diagramPath in self.requirementDiagrams) {
            if (self.requirementDiagrams.hasOwnProperty(diagramPath)) {
                var template,
                    notationFile,
                    modelFile,
                    projectFile,
                    modelNotationElms = [],
                    modelElms = [],
                    reqElms = [];


                for (i = 0; i < self.requirementDiagrams[diagramPath].elements.length; ++i) {
                    var childElement = self.requirementDiagrams[diagramPath].elements[i],
                        elm,
                        j;

                    template = TEMPLATES[childElement.type + '.ejs'];

                    if (template) {
                        elm = ejs.render(template,
                            {
                                id: childElement.id,
                                x: childElement.x,
                                y: childElement.y
                            });
                        modelNotationElms.push(elm);
                    }

                    template = TEMPLATES['packagedElement.uml.ejs'];
                    obj = {
                        type: childElement.type,
                        name: childElement.name,
                        id: childElement.id,
                        relations: ''
                    };

                    //
                    //if (childElement.type === 'UseCase') {
                    //    var connType,
                    //        connId,
                    //        srcId,
                    //        dstId;
                    //
                    //    if (self.idLUT[self.reverseIdLUT[childElement.id]].src) {
                    //
                    //        for (j = 0; j < self.idLUT[self.reverseIdLUT[childElement.id]].src.length; ++j) {
                    //            connType = self.idLUT[self.reverseIdLUT[childElement.id]].src[j].type;
                    //            srcId = self.idLUT[self.reverseIdLUT[childElement.id]].src[j].srcId;
                    //            if (connType == "Extend") {
                    //                obj.relations += '\n<extensionPoint xmi:type="uml:ExtensionPoint" xmi:id="ext_' + srcId
                    //                    + '" name="ExtensionPoint' + j + '"/>'
                    //            }
                    //        }
                    //    }
                    //    if (self.idLUT[self.reverseIdLUT[childElement.id]].dst) {
                    //
                    //        for (j = 0; j < self.idLUT[self.reverseIdLUT[childElement.id]].dst.length; ++j) {
                    //            connType = self.idLUT[self.reverseIdLUT[childElement.id]].dst[j].type;
                    //            dstId = self.idLUT[self.reverseIdLUT[childElement.id]].dst[j].dstId;
                    //            connId = self.idLUT[self.reverseIdLUT[childElement.id]].dst[j].connId;
                    //            if (connType == "Include") {
                    //                obj.relations += '\n<include xmi:type="uml:Include" xmi:id="' + connId
                    //                    + '" addition="' + dstId + '"/>';
                    //            } else if (connType == "Extend") {
                    //                obj.relations += '\n<extend xmi:type="uml:Extend" xmi:id="' + connId
                    //                    + '" extendedCase="' + dstId + '" extensionLocation="ext_' + obj.id + '"/>'
                    //            }
                    //        }
                    //    }
                    //}

                    elm = ejs.render(template, obj)
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&#39;/g, "'")
                        .replace(/&quot;/g, '"');

                    modelElms.push(elm);

                    template = TEMPLATES['requirement.uml.ejs'];
                    elm = ejs.render(template, {
                        id: childElement.id
                    })
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&#39;/g, "'")
                        .replace(/&quot;/g, '"');
                    reqElms.push(elm);
                }

                //for (i = 0; i < self.requirementDiagrams[diagramPath].links.length; ++i) {
                //    var link = self.requirementDiagrams[diagramPath].links[i],
                //        edge;
                //
                //    obj = CONSTANTS[link.type];
                //    obj.srcId = link.src;
                //    obj.dstId = link.dst;
                //    obj.id = link.id;
                //    obj.srcX = link.points.src.x;
                //    obj.srcY = link.points.src.y;
                //    obj.dstX = link.points.dst.x;
                //    obj.dstY = link.points.dst.y;
                //
                //    edge = ejs.render(TEMPLATES['edges.ejs'], obj);
                //    modelNotationElms.push(edge);
                //
                //    if (link.type === "CommunicationPath") {
                //
                //        edge = ejs.render(TEMPLATES['edge_packagedElement.ejs'],
                //            {
                //                connId: link.id,
                //                srcId: link.src,
                //                dstId: link.dst,
                //                srcName: link.srcName,
                //                dstName: link.dstName
                //            });
                //        modelElms.push(edge);
                //    }
                //}

                notationFile = ejs.render(TEMPLATES['model.notation.ejs'],
                    {
                        diagramType: 'RequirementDiagram',
                        diagramName: diagramPath.split('+')[1],
                        childrenElements: modelNotationElms.join('\n'),
                        diagramId: '_D' + diagramId
                    })
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"');

                modelFile = ejs.render(TEMPLATES['model.uml.ejs'],
                    {
                        diagramId: '_D' + diagramId++,
                        id: h,
                        childElements: modelElms.join('\n'),
                        xmiElements: reqElms
                    })
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"');

                projectFile = ejs.render(TEMPLATES['.project.ejs'],
                    {
                        name: diagramPath.split('+')[1]
                    });

                //self.diagram.usecasediagram.subject = self.requirementDiagrams[diagramPath].subjects;
                //self.diagram.usecasediagram.link = self.requirementDiagrams[diagramPath].links;
                output = {
                    project: projectFile,
                    modelDi: TEMPLATES['model.di.ejs'],
                    notation: notationFile,
                    modelUml: modelFile
                };
                self.outputFiles['.project'] = output.project;
                self.outputFiles['model.di'] = output.modelDi;
                self.outputFiles['model.notation'] = output.notation;
                self.outputFiles['model.uml'] = output.modelUml;
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


    return RequirementDiagramExporter;
});