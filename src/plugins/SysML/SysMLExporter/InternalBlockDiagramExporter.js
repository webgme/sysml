/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Author: Dana Zhang
 * Created on: December 3, 2015
 */

define(['ejs',
        'plugin/SysMLExporter/SysMLExporter/Templates/Templates',
        './SysMLExporterConstants'], function (ejs, TEMPLATES, CONSTANTS) {

    'use strict';

    var IBDExporter = function () {
    };

    IBDExporter.prototype.addComponent = function (nodeObj) {

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

        //if (self.isMetaTypeOf(baseClass, self.META.Block) || self.isMetaTypeOf(baseClass, self.META.FlowPort)) {

            self.idLUT[gmeID] = {id: self.modelID};
            self.reverseIdLUT[self.modelID] = gmeID;

            element = {
                name: name,
                id: self.modelID,
                x: xPos,
                y: yPos,
                type: type
                // subType: datatype // value only
            };

            if (!self.internalBlockDiagrams.hasOwnProperty(diagramKey)) {
                self.internalBlockDiagrams[diagramKey] = {};
            }
            if (!self.internalBlockDiagrams[diagramKey].hasOwnProperty('mainBlockName')) {
                var mainBlockNode = core.getParent(core.getParent(nodeObj));
                self.internalBlockDiagrams[diagramKey].mainBlockName = mainBlockNode ? core.getAttribute(mainBlockNode, 'name') : 'mainBlock';
            }

            if (!self.diagramDimension) {
                self.diagramDimension = {
                    height: yPos,
                    width: xPos
                };
            } else {
                self.diagramDimension.height = Math.max(self.diagramDimension.height + 250, yPos);
                self.diagramDimension.width = Math.max(self.diagramDimension.width + 200, xPos);
            }

            if (!self.internalBlockDiagrams[diagramKey].hasOwnProperty('elements')) {
                self.internalBlockDiagrams[diagramKey].elements = [];
            }
            self.internalBlockDiagrams[diagramKey].elements.push(element);
            self.modelID += 1;
        //}
    };

    IBDExporter.prototype.addConnection = function (nodeObj, callback) {

        var self = this,
            core = self.core,
            parentPath = core.getPath(core.getParent(nodeObj)),
            diagramKey = parentPath + "+" + core.getAttribute(nodeObj.parent, 'name'),
            src = core.getPointerPath(nodeObj, "src"),
            dst = core.getPointerPath(nodeObj, "dst"),
            type = core.getAttribute(self.getMetaType(nodeObj), 'name'),
            name = core.getAttribute(nodeObj, 'name'),
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
            dstY,
            srcName,
            dstName,
            srcId,
            dstId;

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
                        id: self.modelID,
                        src: self.idLUT[src].id,
                        dst: self.idLUT[dst].id,
                        type: type,
                        name: name,
                        points: {
                            src: {
                                x: 1, //srcX,
                                y: 0.5 //srcY
                            },
                            dst: {
                                x: 0, //dstX,
                                y: 0.5 //dstY
                            }
                        }
                    };

                    if (!self.internalBlockDiagrams.hasOwnProperty(diagramKey)) {
                        self.internalBlockDiagrams[diagramKey] = {};
                    }
                    if (!self.internalBlockDiagrams[diagramKey].hasOwnProperty('links')) {
                        self.internalBlockDiagrams[diagramKey].links = [];
                    }
                    self.internalBlockDiagrams[diagramKey].links.push(link);
                }
                self.modelID += 1;
                callback(null);
            }
        };

        afterSrcLoaded = function (err, nodeObj) {
            var isParentIBD = self.isMetaTypeOf(self.getMetaType(nodeObj.parent), self.META.InternalBlockDiagram);
            if (err) {
                pushUseCaseLink(err, false);
                return;
            }
            if (!self.idLUT.hasOwnProperty(src)) {
                srcMetaType = core.getAttribute(self.getMetaType(nodeObj), 'name');
                if (isParentIBD) {
                    self.addComponent(nodeObj, srcMetaType);
                } else {
                    self.addFlowPort(nodeObj);
                }
                self.modelID += 1;
            }
            srcX = core.getRegistry(nodeObj, 'position').x;
            srcY = core.getRegistry(nodeObj, 'position').y;
            srcName = core.getAttribute(nodeObj, 'name');
            srcId = core.getPath(nodeObj);
            pushUseCaseLink(null, true);
        };
        core.loadByPath(self.rootNode, src, afterSrcLoaded);

        afterDstLoaded = function (err, nodeObj) {
            var isParentIBD = self.isMetaTypeOf(self.getMetaType(nodeObj.parent), self.META.InternalBlockDiagram);
            if (err) {
                pushUseCaseLink(err, false);
                return;
            }
            if (!self.idLUT.hasOwnProperty(dst)) {
                srcMetaType = core.getAttribute(self.getMetaType(nodeObj), 'name');
                if (isParentIBD) {
                    self.addComponent(nodeObj, dstMetaType);
                } else {
                    self.addFlowPort(nodeObj);
                }
                self.modelID += 1;
            }
            dstX = core.getRegistry(nodeObj, 'position').x;
            dstY = core.getRegistry(nodeObj, 'position').y;
            dstName = core.getAttribute(nodeObj, 'name');
            dstId = core.getPath(nodeObj);
            pushUseCaseLink(null, true);
        };
        core.loadByPath(self.rootNode, dst, afterDstLoaded);
    };

    IBDExporter.prototype.saveResults = function (callback) {
        var self = this,
            diagramPath,
            i,
            h = 0,
            obj,
            diagramId = 1,
            output,
            artifact = self.blobClient.createArtifact('SysMLExporterOutput');

        for (diagramPath in self.internalBlockDiagrams) {
            if (self.internalBlockDiagrams.hasOwnProperty(diagramPath)) {
                var template,
                    notationFile,
                    modelFile,
                    projectFile,
                    modelNotationElms = [],
                    modelElms = [],
                    blockElms = [],
                    portElms1 = [],
                    portElms2 = [],
                    mainDiagramInfo,
                    mainDiagramId = 'main_' + diagramPath,
                    mainDiagramName = self.internalBlockDiagrams[diagramPath].mainBlockName,
                    mainDiagramRelations = [],
                    diagramWidth = self.diagramDimension ? Math.max(self.diagramDimension.width, 500) : 500,
                    diagramHeight = self.diagramDimension ? Math.max(self.diagramDimension.height, 300) : 300;

                mainDiagramInfo = {
                    type: 'Class',
                    id: mainDiagramId,
                    name: mainDiagramName
                };


                for (i = 0; i < self.internalBlockDiagrams[diagramPath].elements.length; ++i) {
                    var childElement = self.internalBlockDiagrams[diagramPath].elements[i],
                        elm;

                    template = TEMPLATES[childElement.type + '.ejs'];

                    if (childElement.type === 'Block') {
                        elm = self._createBlockNotation(childElement, portElms2);
                        modelNotationElms.push(elm);

                    } else if (childElement.type.indexOf('FlowPort') === 0) {
                        template = TEMPLATES['FlowPort.ejs'];
                        var portPos = self._getPortPosition(diagramWidth, diagramHeight, childElement.x, childElement.y);
                        elm = ejs.render(template, {
                            id: childElement.id,
                            x: portPos.x,
                            y: portPos.y
                        });
                        portElms1.push(elm);
                        template = TEMPLATES['FlowPort2.ejs'];
                        elm = ejs.render(template, {id: childElement.id});
                        portElms2.push(elm);
                    } else if (template) {
                        elm = ejs.render(template,
                            {
                                id: childElement.id,
                                x: childElement.x,
                                y: childElement.y
                            });
                        modelNotationElms.push(elm);
                    }

                    if (childElement.type === 'Block') {
                        template = TEMPLATES[childElement.type + '.uml.ejs'];
                        var portElms = self._getPorts(childElement.id, blockElms);

                        obj = {
                            childElements: portElms.join('\n'),
                            blockId: 'block_' + childElement.id,
                            blockName: childElement.name,
                            associationId: 'assoc_' + childElement.id,
                            propId: childElement.id,
                            mainBlockId: mainDiagramId,
                            mainBlockName: mainDiagramName
                        };

                        elm = ejs.render(template, obj)
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&#39;/g, "'")
                            .replace(/&quot;/g, '"');

                        modelElms.push(elm);


                        elm = '<Blocks:Block xmi:id="_8LNtsZyREeW8sf1tOYG01w" base_Class="' + 'block_' + childElement.id + '"/>';
                        blockElms.push(elm);

                        obj = {
                            propId: childElement.id,
                            propName: childElement.name,
                            blockId: 'block_' + childElement.id,
                            associationId: 'assoc_' + childElement.id
                        };

                        elm = ejs.render(TEMPLATES['ownedAttribute.uml.ejs'], obj)
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&#39;/g, "'")
                            .replace(/&quot;/g, '"');
                    } else if (childElement.type === 'Property') {
                        elm = '<ownedAttribute xmi:type="uml:Property" xmi:id="' + childElement.id + '" name="' + childElement.name + '"/>';
                    } else if (childElement.type.indexOf('FlowPort') > -1 ) {
                        elm = self._getFlowPortUml(childElement, blockElms);
                    }

                    mainDiagramRelations.push(elm);
                }

                elm = '<Blocks:Block xmi:id="_8LNtsZyREeW8sf1tOYG01w" base_Class="' + mainDiagramId + '"/>';
                blockElms.push(elm);

                if (self.internalBlockDiagrams[diagramPath].links) {
                    for (i = 0; i < self.internalBlockDiagrams[diagramPath].links.length; ++i) {
                        var link = self.internalBlockDiagrams[diagramPath].links[i],
                            edge;

                        obj = {};
                        obj.srcId = link.src;
                        obj.dstId = link.dst;
                        obj.id = link.id;
                        obj.srcX = link.points.src.x;
                        obj.srcY = link.points.src.y;
                        obj.dstX = link.points.dst.x;
                        obj.dstY = link.points.dst.y;

                        if (link.type === 'Connector') {

                            var srcParent = self.reversePortLUT[self.reverseIdLUT[link.src]]
                                    ? 'partWithPort="' + self.idLUT[self.reversePortLUT[self.reverseIdLUT[link.src]]].id + '"'
                                    : ''
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')
                                    .replace(/&#39;/g, "'")
                                    .replace(/&quot;/g, '"'),
                                dstParent = self.reversePortLUT[self.reverseIdLUT[link.dst]]
                                    ? 'partWithPort="' + self.idLUT[self.reversePortLUT[self.reverseIdLUT[link.dst]]].id + '"'
                                    : ''
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')
                                    .replace(/&#39;/g, "'")
                                    .replace(/&quot;/g, '"');


                            edge = ejs.render(TEMPLATES[link.type + '.ejs'], obj);
                            portElms2.push(edge);

                            edge = ejs.render(TEMPLATES[link.type + '.uml.ejs'],
                                {
                                    id: link.id,
                                    name: link.name,
                                    srcId: link.src,
                                    dstId: link.dst,
                                    srcParent: srcParent,
                                    dstParent: dstParent
                                });
                            mainDiagramRelations.push(edge);
                        }
                    }
                }

                mainDiagramInfo.relations = mainDiagramRelations.join('\n')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"');

                elm = ejs.render(TEMPLATES['packagedElement.uml.ejs'], mainDiagramInfo)
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"');

                modelElms.push(elm);

                    notationFile = ejs.render(TEMPLATES['InternalBlockDiagram.notation.ejs'],
                        {
                            diagramBlockId: 'main_' + diagramPath,
                            diagramName: diagramPath.split('+')[1],
                            childrenElements: modelNotationElms.join('\n'),
                            portElements1: portElms1.join('\n'),
                            portElements2: portElms2.join('\n'),
                            diagramId: '_D' + diagramId,
                            diagramWidth: diagramWidth,
                            diagramHeight: diagramHeight
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
                            xmiElements: blockElms.join('\n')
                        })
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&#39;/g, "'")
                        .replace(/&quot;/g, '"');

                    projectFile = ejs.render(TEMPLATES['.project.ejs'],
                        {
                            name: diagramPath.split('+')[1]
                        });

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

    IBDExporter.prototype._getPortPosition = function (diagramWidth, diagramHeight, x, y) {
        var pos = {};
        if (x < y) {
            pos.y = Math.min(y, diagramHeight - 20);
            if (x < diagramWidth / 2) {
                pos.x = -10;
            } else {
                pos.x = diagramWidth - 10;
            }
        } else {
            pos.x =  Math.min(x, diagramWidth - 20);
            if (y < diagramHeight / 2) {
                pos.y = -10;
            } else {
                pos.y = diagramHeight - 10;
            }
        }
        return pos;
    };


    IBDExporter.prototype._getFlowPortUml = function (port, elementGroup) {
        var elm = '<PortAndFlows:FlowPort xmi:id="_Ydo_8J6fEeW8sf1tOYG01w" base_Port="' + port.id + '" direction="'
            + port.type.replace('FlowPort', '').toLowerCase() + '"/>';
        elementGroup.push(elm);
        return '<ownedAttribute xmi:type="uml:Port" xmi:id="' + port.id + '" name="' + port.name + '" aggregation="composite"/>';
    };

    IBDExporter.prototype._getPorts = function(blockId, elementGroup) {
        var self = this,
            ports = self.portLUT[self.reverseIdLUT[blockId]] ? self.portLUT[self.reverseIdLUT[blockId]].ports : [],
            i,
            portElms = [];

        for (i = 0; i < ports.length; ++i) {
            portElms.push(self._getFlowPortUml(ports[i], elementGroup));
        }
        return portElms;

    };

    IBDExporter.prototype._createBlockNotation = function (blockObj, notationGroup) {
        var self = this,
            ports = self.portLUT[self.reverseIdLUT[blockObj.id]] ? self.portLUT[self.reverseIdLUT[blockObj.id]].ports : [],
            i,
            portElms1 = [],
            portElms2 = [],
            elm,
            pos;

        for (i = 0; i < ports.length; ++i) {
            pos = self._getPortPosition(CONSTANTS.BLOCK_WIDTH, CONSTANTS.BLOCK_HEIGHT, ports[i].x, ports[i].y);
            elm = ejs.render(TEMPLATES['ChildFlowPort1.ejs'], {
                id: ports[i].id,
                x: pos.x,
                y: pos.y
            })
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"');

            portElms1.push(elm);

            elm = ejs.render(TEMPLATES['ChildFlowPort2.ejs'], {
                id: ports[i].id
            })
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"');
            portElms2.push(elm);

            elm = ejs.render(TEMPLATES['ChildFlowPort3.ejs'], {
                id: ports[i].id
            })
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"');
            notationGroup.push(elm);
        }

        elm = ejs.render(TEMPLATES[blockObj.type + '.ejs'],
            {
                id: blockObj.id,
                x: blockObj.x,
                y: blockObj.y,
                portNotation1: portElms1.join('\n'),
                portNotation2: portElms2.join('\n')
            })
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"');
        return elm;
    };

    return IBDExporter;
});

