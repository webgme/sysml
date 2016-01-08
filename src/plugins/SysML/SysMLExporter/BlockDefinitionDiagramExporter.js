/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Author: Vishwesh Nath
 * Created on: November 31, 2015
 */

define(['ejs',
        'plugin/SysMLExporter/SysMLExporter/Templates/Templates',
        './SysMLExporterConstants'], function (ejs, TEMPLATES, CONSTANTS) {

    'use strict';

    var BlockDefinitionDiagramExporter = function () {
    };
	
	var webgmeEclipseMapping ={
		'Block' : 'Class'
	};
	
	var templateMapping = {
		'Class' : 'Block1.ejs'
	};

    BlockDefinitionDiagramExporter.prototype.addComponent = function (nodeObj) {

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

        self.idLUT[gmeID] = {id: self.modelID};
        self.reverseIdLUT[self.modelID] = gmeID;

        element = {
            name: name,
            id: self.modelID,
            x: xPos,
            y: yPos,
            type: webgmeEclipseMapping[type] || type
        };

        if (!self.blockdefinitionDiagrams.hasOwnProperty(diagramKey)) {
            self.blockdefinitionDiagrams[diagramKey] = {};
        }
        if (!self.blockdefinitionDiagrams[diagramKey].hasOwnProperty('elements')) {
            self.blockdefinitionDiagrams[diagramKey].elements = [];
        }
        self.blockdefinitionDiagrams[diagramKey].elements.push(element);
        self.modelID += 1;

    };

    BlockDefinitionDiagramExporter.prototype.addConnection = function (nodeObj, callback) {

        var self = this,
            core = self.core,
            parentPath = core.getPath(core.getParent(nodeObj)),
            diagramKey = parentPath + "+" + core.getAttribute(nodeObj.parent, 'name'),
            src = core.getPointerPath(nodeObj, "src"),
            dst = core.getPointerPath(nodeObj, "dst"),
            type = core.getAttribute(self.getMetaType(nodeObj), 'name'),
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
                        srcName: srcName,
                        dstName: dstName,
                        dst: self.idLUT[dst].id,
                        type: type,
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

                    if (!self.blockdefinitionDiagrams.hasOwnProperty(diagramKey)) {
                        self.blockdefinitionDiagrams[diagramKey] = {};
                    }
                    if (!self.blockdefinitionDiagrams[diagramKey].hasOwnProperty('links')) {
                        self.blockdefinitionDiagrams[diagramKey].links = [];
                    }
                    self.blockdefinitionDiagrams[diagramKey].links.push(link);
                    if (type === "Composition" || type === "DirectedComposition" || type ==="Association" || 
                        type ==="DirectedAssociation" || type ==="Aggregation" || type==="DirectedAggregation") {

                        if (!self.idLUT[src].hasOwnProperty('dst')) {
                            self.idLUT[src].dst = [];
                        }
                        self.idLUT[src].dst.push({
                            type: type,
                            dstId: link.dst,
                            connId: link.id
                        });
                        if (!self.idLUT[dst].hasOwnProperty('src')) {
                            self.idLUT[dst].src = [];
                        }
                        self.idLUT[dst].src.push({
                            type: type,
                            srcId: link.src
                        });
                    }
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
            srcName = core.getAttribute(nodeObj, 'name');
            srcId = core.getPath(nodeObj);
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
            dstName = core.getAttribute(nodeObj, 'name');
            dstId = core.getPath(nodeObj);
            pushUseCaseLink(null, true);
        };
        core.loadByPath(self.rootNode, dst, afterDstLoaded);

    };

    BlockDefinitionDiagramExporter.prototype.processBDDData = function () {
        var self = this,
            diagramPath,
            i,
            h = 0,
            obj,
            diagramId = 1,
            output;

        for (diagramPath in self.blockdefinitionDiagrams) {
            if (self.blockdefinitionDiagrams.hasOwnProperty(diagramPath)) {
                var template,
                    notationFile,
                    modelFile,
                    projectFile,
                    modelNotationElms = [],
                    blockElms = [],
                    modelElms = [];

                for (i = 0; i < self.blockdefinitionDiagrams[diagramPath].elements.length; ++i) {
                    var childElement = self.blockdefinitionDiagrams[diagramPath].elements[i],
                        elm,
                        j;

                    template = TEMPLATES['packagedElement.uml.ejs'];

                    if (childElement.type === 'Class') {
                        elm = '<Blocks:Block xmi:id="_8LNtsZyREeW8sf1tOYG01w" base_Class="' + 'block_' + childElement.id + '"/>';
                        blockElms.push(elm);
                        var portElms = self._getPorts(childElement.id, blockElms);

                        obj = {
                            type: 'Class',
                            name: childElement.name,
                            id: childElement.id,
                            relations: portElms.join('\n')
                        };
                    } else {
                        obj = {
                            type: childElement.type,
                            name: childElement.name,
                            id: childElement.id,
                            relations: ''
                        };
                    }

                    elm = ejs.render(template, obj)
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&#39;/g, "'")
                        .replace(/&quot;/g, '"');

                    modelElms.push(elm);
                }
                if (self.blockdefinitionDiagrams[diagramPath].links != null) {

                    for (i = 0; i < self.blockdefinitionDiagrams[diagramPath].links.length; ++i) {
                        var link = self.blockdefinitionDiagrams[diagramPath].links[i],
                            edge;

                        obj = CONSTANTS[link.type];
                        obj.srcId = link.src;
                        obj.dstId = link.dst;
                        obj.id = link.id;
                        obj.srcX = link.points.src.x;
                        obj.srcY = link.points.src.y;
                        obj.dstX = link.points.dst.x;
                        obj.dstY = link.points.dst.y;

                        edge = ejs.render(TEMPLATES['edges.ejs'], obj);
                        modelNotationElms.push(edge);

                        if (link.type === "DirectedComposition" || link.type === "DirectedAggregation" || link.type === "DirectedAssociation"
                            || link.type === "Composition" || link.type === "Aggregation" || link.type === "Association") {

                            edge = ejs.render(TEMPLATES['edge_packagedElement.ejs'],
                                {
                                    connId: link.id,
                                    srcId: link.src,
                                    dstId: link.dst,
                                    srcName: link.srcName,
                                    dstName: link.dstName
                                });
                            modelElms.push(edge);
                        }
                    }
                }

                if (this.visitMultiDiagrams) {
                    self.xml1 += modelElms.join('\n');
                    self.xml2 += blockElms.join('\n');
                } else {
                    notationFile = ejs.render(TEMPLATES['model.notation.ejs'],
                        {
                            diagramType: 'BlockDefinition',
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
                    self.outputFiles['model.uml'] = output.modelUml;
                    self.outputFiles['.project'] = output.project;
                    self.outputFiles['model.di'] = output.modelDi;
                    self.outputFiles['model.notation'] = output.notation;
                }
            }
            ++h;

        }
    };

    BlockDefinitionDiagramExporter.prototype._getPorts = function(blockId, elementGroup) {
        var self = this,
            ports = self.portLUT[self.reverseIdLUT[blockId]] ? self.portLUT[self.reverseIdLUT[blockId]].ports : [],
            i,
            portElms = [];

        for (i = 0; i < ports.length; ++i) {
            portElms.push(self._getPortUml(ports[i], elementGroup));
        }
        return portElms;

    };

    BlockDefinitionDiagramExporter.prototype._getPortUml = function (port, elementGroup) {
        if (port.type.indexOf('FlowPort') > -1) {
            var elm = '<PortAndFlows:FlowPort xmi:id="_Ydo_8J6fEeW8sf1tOYG01w" base_Port="' + port.id + '" direction="'
                + port.type.replace('FlowPort', '').toLowerCase() + '"/>';
            elementGroup.push(elm);
        }

        if (port.type.indexOf('Port') > -1) {
            return '<ownedAttribute xmi:type="uml:Port" xmi:id="' + port.id + '" name="' + port.name + '" aggregation="composite"/>';
        } else if (port.type === 'Operation') {
            return '<ownedOperation xmi:type="uml:Operation" xmi:id="' + port.id + '" name="' + port.name + '"/>';
        } else {
            return '<ownedAttribute xmi:type="uml:Property" xmi:id="' + port.id + '" name="' + port.name + '"/>';
        }
    };

    return BlockDefinitionDiagramExporter;
});