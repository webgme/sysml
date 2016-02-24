/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Author: Dana Zhang
 * Created on: December 3, 2015
 */

define(['common/util/ejs',
        'plugin/SysMLExporter/SysMLExporter/Templates/Templates',
        './SysMLExporterConstants'], function (ejs, TEMPLATES, CONSTANTS) {

    'use strict';

    var ParametricDiagramExporter = function () {
    };

    ParametricDiagramExporter.prototype.addComponent = function (nodeObj) {

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

            if (!self.parametricDiagrams.hasOwnProperty(diagramKey)) {
                self.parametricDiagrams[diagramKey] = {};
            }
            if (!self.parametricDiagrams[diagramKey].hasOwnProperty('mainBlockName')) {
                var mainBlockNode = core.getParent(core.getParent(nodeObj));
                self.parametricDiagrams[diagramKey].mainBlockName = mainBlockNode ? core.getAttribute(mainBlockNode, 'name') : 'mainBlock';
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

            if (!self.parametricDiagrams[diagramKey].hasOwnProperty('elements')) {
                self.parametricDiagrams[diagramKey].elements = [];
            }
            self.parametricDiagrams[diagramKey].elements.push(element);
            self.modelID += 1;
        //}
    };

    ParametricDiagramExporter.prototype.addConnection = function (nodeObj, callback) {

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

                    if (!self.parametricDiagrams.hasOwnProperty(diagramKey)) {
                        self.parametricDiagrams[diagramKey] = {};
                    }
                    if (!self.parametricDiagrams[diagramKey].hasOwnProperty('links')) {
                        self.parametricDiagrams[diagramKey].links = [];
                    }
                    self.parametricDiagrams[diagramKey].links.push(link);
                }
                self.modelID += 1;
                callback(null);
            }
        };

        afterSrcLoaded = function (err, nodeObj) {
            var isParentIBD = self.isMetaTypeOf(self.getMetaType(nodeObj.parent), self.META.ParametricDiagram);
            if (err) {
                pushUseCaseLink(err, false);
                return;
            }
            if (!self.idLUT.hasOwnProperty(src)) {
                srcMetaType = core.getAttribute(self.getMetaType(nodeObj), 'name');
                if (isParentIBD) {
                    self.addComponent(nodeObj, srcMetaType);
                } else {
                    self.addChildPort(nodeObj, true);
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
            var isParentIBD = self.isMetaTypeOf(self.getMetaType(nodeObj.parent), self.META.ParametricDiagram);
            if (err) {
                pushUseCaseLink(err, false);
                return;
            }
            if (!self.idLUT.hasOwnProperty(dst)) {
                srcMetaType = core.getAttribute(self.getMetaType(nodeObj), 'name');
                if (isParentIBD) {
                    self.addComponent(nodeObj, dstMetaType);
                } else {
                    self.addChildPort(nodeObj, true);
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

    ParametricDiagramExporter.prototype.processParametricData = function () {
        var self = this,
            diagramPath,
            i,
            h = 0,
            obj,
            diagramId = 1,
            output;

        for (diagramPath in self.parametricDiagrams) {
            if (self.parametricDiagrams.hasOwnProperty(diagramPath)) {
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
                    mainDiagramName = self.parametricDiagrams[diagramPath].mainBlockName,
                    mainDiagramRelations = [],
                    diagramWidth = self.diagramDimension ? Math.max(self.diagramDimension.width, 500) : 500,
                    diagramHeight = self.diagramDimension ? Math.max(self.diagramDimension.height, 300) : 300;

                mainDiagramInfo = {
                    type: 'Class',
                    id: mainDiagramId,
                    name: mainDiagramName
                };


                if (self.parametricDiagrams[diagramPath].elements) {
                    for (i = 0; i < self.parametricDiagrams[diagramPath].elements.length; ++i) {
                        var childElement = self.parametricDiagrams[diagramPath].elements[i],
                            elm;

                        if (childElement.type === 'ConstraintBlock') {
                            template = TEMPLATES[childElement.type + '.uml.ejs'];

                            var portElms = self._getPorts(childElement.id, blockElms);

                            // packaged element
                            obj = {
                                childElements: portElms.join('\n'),
                                links: '',
                                id: childElement.id,
                                assocId: 'assoc_' + childElement.id,
                                propId: 'prop_' + childElement.id,
                                name: childElement.name,
                                diagramId: mainDiagramId,
                                diagramName: mainDiagramName
                            };

                            elm = ejs.render(template, obj)
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&#39;/g, "'")
                                .replace(/&quot;/g, '"');

                            modelElms.push(elm);

                            // block elements
                            elm = '<Constraints:ConstraintProperty xmi:id="_ZqTCAKmwEeW8sf1tOYG01w" base_Property="prop_' + childElement.id + '"/>\n' +
                                '<Constraints:ConstraintBlock xmi:id="_ZqTCAqmwEeW8sf1tOYG01w" base_Class="' + childElement.id + '"/>';

                            blockElms.push(elm);

                            // nested inside root block element

                            obj = {
                                propId: 'prop_' + childElement.id,
                                propName: childElement.name,
                                blockId: childElement.id,
                                associationId: 'assoc_' + childElement.id
                            };

                            elm = ejs.render(TEMPLATES['ownedAttribute.uml.ejs'], obj)
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&#39;/g, "'")
                                .replace(/&quot;/g, '"');
                        } else if (childElement.type === 'Value') {
                            template = TEMPLATES['packagedElement.uml.ejs'];
                            obj = {
                                type: 'DataType',
                                id: childElement.id,
                                name: childElement.name,
                                relations: ''
                            };
                            elm = ejs.render(template, obj);
                            modelElms.push(elm);
                            elm = '<ownedAttribute xmi:type="uml:Property" xmi:id="_84rS8Km-EeW8sf1tOYG01w" name="'
                                + childElement.name + '" type="' + childElement.id + '" aggregation="composite"/>';
                        }

                        mainDiagramRelations.push(elm);
                    }
                }

                elm = '<Blocks:Block xmi:id="_8LNtsZyREeW8sf1tOYG01w" base_Class="' + mainDiagramId + '"/>';
                blockElms.push(elm);

                if (self.parametricDiagrams[diagramPath].links) {
                    for (i = 0; i < self.parametricDiagrams[diagramPath].links.length; ++i) {
                        var link = self.parametricDiagrams[diagramPath].links[i],
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

                            //edge = ejs.render(TEMPLATES[link.type + '.ejs'], obj);
                            //portElms2.push(edge);
                            var srcParent = self.reversePortLUT[self.reverseIdLUT[link.src]]
                                    ? self.idLUT[self.reversePortLUT[self.reverseIdLUT[link.src]]].id : null,
                                dstParent = self.reversePortLUT[self.reverseIdLUT[link.dst]]
                                    ? self.idLUT[self.reversePortLUT[self.reverseIdLUT[link.dst]]].id : null;


                            obj = {
                                id: link.id,
                                name: link.name,
                                srcId: link.src,
                                dstId: link.dst,
                                srcParent: '',
                                dstParent: ''
                            };
                            edge = ejs.render(TEMPLATES[link.type + '.uml.ejs'], obj);

                            mainDiagramRelations.push(edge);

                            self._getConnectorUml(obj, srcParent, dstParent, blockElms);
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

                if (this.visitMultiDiagrams) {
                    self.xml1 += modelElms.join('\n');
                    self.xml2 += blockElms.join('\n');
                } else {
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
                        notation: '',
                        modelUml: modelFile
                    };
                    self.outputFiles['.project'] = output.project;
                    self.outputFiles['model.di'] = output.modelDi;
                    self.outputFiles['model.notation'] = output.notation;
                    self.outputFiles['model.uml'] = output.modelUml;
                }
            }
            ++h;

        }

    };

    ParametricDiagramExporter.prototype._getPortPosition = function (diagramWidth, diagramHeight, x, y) {
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


    ParametricDiagramExporter.prototype._getFlowPortUml = function (port, elementGroup) {
        var template = TEMPLATES['ConstraintParameter.uml.ejs'],
            elm = ejs.render(template, {
                id: port.id,
                name: port.name
            });
        return elm;
    };

    ParametricDiagramExporter.prototype._getPorts = function(blockId, elementGroup) {
        var self = this,
            ports = self.portLUT[self.reverseIdLUT[blockId]] ? self.portLUT[self.reverseIdLUT[blockId]].ports : [],
            i,
            portElms = [];

        for (i = 0; i < ports.length; ++i) {
            portElms.push(self._getFlowPortUml(ports[i], elementGroup));
        }
        return portElms;

    };

    ParametricDiagramExporter.prototype._createBlockNotation = function (blockObj, notationGroup) {
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

    ParametricDiagramExporter.prototype._getConnectorUml = function (obj, srcParent, dstParent, blockElms) {
        var elm;
        // binding connector elements:
        if (srcParent === dstParent) {
            elm = '<Blocks:BindingConnector xmi:id="_V-bhUqm9E" base_Connector="' + obj.id + ' "/>';
            blockElms.push(elm);
        } else {
            // src connector
            elm = srcParent !== null
                ? '<Blocks:NestedConnectorEnd xmi:id="_PS5oA6m" propertyPath="prop_'
            + srcParent + '" base_ConnectorEnd="src_' + obj.srcId + '"/>'
                : '<Blocks:BindingConnector xmi:id="_V-bhUqm9E" base_Connector="' + obj.id + '"/>';
            blockElms.push(elm);

            // dst connector
            elm = dstParent !== null ? '<Blocks:NestedConnectorEnd xmi:id="_PS5oA6m" propertyPath="prop_'
            + dstParent + '" base_ConnectorEnd="dst_' + obj.dstId + '"/>'
                : '<Blocks:BindingConnector xmi:id="_V-bhUqm9E" base_Connector="' + obj.id + '"/>';
            blockElms.push(elm);

            if (srcParent !== null && dstParent !== null) {
                elm = '<Blocks:BindingConnector xmi:id="_V-bhUqm9E" base_Connector="' + obj.id + '"/>';
                blockElms.push(elm);
            }
        }
    };

    return ParametricDiagramExporter;
});

