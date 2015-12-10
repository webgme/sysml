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

    // main block
    //  <packagedElement xmi:type="uml:Class" xmi:id="<%=diagramBlockId%>" name="<%= parentName %>"/>
    //       <ownedAttribute xmi:type="uml:Property" xmi:id="<%= propId %>" name="<%= propName %>"
    // type="<%= newBlockId %>" aggregation="composite" association="<%= associationId %>"/>
    // outside uml:Model

    // propId is id in Block.ejs file

    // newBlockId is created from propId

    // packagedElement block element for Part
    //<packagedElement xmi:type="uml:Association" xmi:id="<%= associationId %>" name="Association1" memberEnd="<%= propId %> <%= mainBlockId %>">
    //    <eAnnotations xmi:type="ecore:EAnnotation" xmi:id="_AgAuQZyTEeW8sf1tOYG01w" source="org.eclipse.papyrus">
    //    <details xmi:type="ecore:EStringToStringMapEntry" xmi:id="_AgAuQpyTEeW8sf1tOYG01w" key="nature" value="SysML_Nature"/>
    //    </eAnnotations>
    //    <ownedEnd xmi:type="uml:Property" xmi:id="<%= mainBlockId %>" name="<%= mainBlockName %>"
    // type="<%= mainBlockId %>" association="<%= associationId %>"/>
    //</packagedElement>

    //  <Blocks:Block xmi:id="_8LNtsZyREeW8sf1tOYG01w" base_Class="<%= mainBlockId %>"/>


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

                    if (!self.internalBlockDiagrams.hasOwnProperty(diagramKey)) {
                        self.internalBlockDiagrams[diagramKey] = {};
                    }
                    if (!self.internalBlockDiagrams[diagramKey].hasOwnProperty('links')) {
                        self.internalBlockDiagrams[diagramKey].links = [];
                    }
                    self.internalBlockDiagrams[diagramKey].links.push(link);
                    if (type === "Extend" || type === "Include") {

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
                    mainDiagramRelations = [];

                mainDiagramInfo = {
                    type: 'Class',
                    id: mainDiagramId,
                    name: mainDiagramName
                };


                for (i = 0; i < self.internalBlockDiagrams[diagramPath].elements.length; ++i) {
                    var childElement = self.internalBlockDiagrams[diagramPath].elements[i],
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
                    } else if (childElement.type.indexOf('FlowPort') === 0) {
                        template = TEMPLATES['FlowPort.ejs'];
                        elm = ejs.render(template, {
                            id: childElement.id,
                            x: childElement.x,
                            y: childElement.y
                        });
                        portElms1.push(elm);
                        template = TEMPLATES['FlowPort2.ejs'];
                        elm = ejs.render(template, {id: childElement.id});
                        portElms2.push(elm);
                    }

                    template = TEMPLATES[childElement.type + '.uml.ejs'];

                    if (template) {
                        obj = {
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
                    }

                    if (childElement.type === 'Block') {
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
                        elm = '<PortAndFlows:FlowPort xmi:id="_Ydo_8J6fEeW8sf1tOYG01w" base_Port="' + childElement.id + '" direction="'
                            + childElement.type.replace('FlowPort', '').toLowerCase() + '"/>';
                        blockElms.push(elm);
                        elm = '<ownedAttribute xmi:type="uml:Port" xmi:id="' + childElement.id + '" name="' + childElement.name + '" aggregation="composite"/>';
                    }

                    mainDiagramRelations.push(elm);
                }

                mainDiagramInfo.relations = mainDiagramRelations.join('\n');
                elm = ejs.render(TEMPLATES['packagedElement.uml.ejs'], mainDiagramInfo)
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"');
                modelElms.push(elm);

                elm = '<Blocks:Block xmi:id="_8LNtsZyREeW8sf1tOYG01w" base_Class="' + mainDiagramId + '"/>';
                blockElms.push(elm);

                if (self.internalBlockDiagrams[diagramPath].links) {
                    for (i = 0; i < self.internalBlockDiagrams[diagramPath].links.length; ++i) {
                        var link = self.internalBlockDiagrams[diagramPath].links[i],
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

                        if (link.type === "CommunicationPath") {

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

                    notationFile = ejs.render(TEMPLATES['InternalBlockDiagram.notation.ejs'],
                        {
                            diagramBlockId: 'main_' + diagramPath,
                            diagramName: diagramPath.split('+')[1],
                            childrenElements: modelNotationElms.join('\n'),
                            portElements1: portElms1.join('\n'),
                            portElements2: portElms2.join('\n'),
                            diagramId: '_D' + diagramId,
                            diagramWidth: self.diagramDimension ? Math.max(self.diagramDimension.width, 500) : 500,
                            diagramHeight: self.diagramDimension ? Math.max(self.diagramDimension.height, 300) : 300
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

    return IBDExporter;
});