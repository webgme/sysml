/**
 * Created by ningyuz on 11/19/15.
 */
/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Author: Dana Zhang, Ningyu Zhang
 * Created on: Nov. 19, 2015
 */

define(['ejs',
    'plugin/SysMLExporter/SysMLExporter/Templates/Templates',
    './SysMLExporterConstants'],
    function (ejs, TEMPLATES, CONSTANTS) {

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

        if (   self.isMetaTypeOf(baseClass, self.META.Value)
            || self.isMetaTypeOf(baseClass, self.META.ConstraintBlock)
            || self.isMetaTypeOf(baseClass, self.META.Parameter)) {

            self.idLUT[gmeID] = {id: self.modelID};
            self.reverseIdLUT[self.modelID] = gmeID;

            element = {
                name: name,
                id: self.modelID,
                x: xPos,
                y: yPos,
                type: type
            };
            if (self.isMetaTypeOf(baseClass, self.META.ConstraintBlock)){
                //var parameterPaths = core.getChildrenPaths(nodeObj);

                element.children = [];


                core.loadChildren(nodeObj, function(err, children){
                    if (err) {
                        console.log('error loading parameters');
                    }

                    for (var count = 0; count < children.length; count+=1){
                        //console.log(children[count]);
                        var parameter = {
                            name: null,
                            id: null,
                            parent: gmeID,
                            x: 0,
                            y: 0
                        };
                        parameter.name = core.getAttribute(children[count], 'name');
                        parameter.id = core.getPath(children[count]);
                        parameter.x = core.getRegistry(children[count], 'position').x;
                        parameter.y = core.getRegistry(children[count], 'position').y;


                        var src = core.getPointerPath(children[count], "src"),
                            dst = core.getPointerPath(children[count], "dst");


                        element.children.push(parameter);
                    }
                });


            }

            //console.log(element);


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
        }
    };


    ParametricDiagramExporter.prototype.addConnection = function (nodeObj, callback) {
        var self = this,
            core = self.core,
            parentPath = core.getPath(core.getParent(nodeObj)),
            diagramKey = parentPath + "+" + core.getAttribute(nodeObj.parent, 'name'),
            src = core.getPointerPath(nodeObj, "src"),
            dst = core.getPointerPath(nodeObj, "dst"),
            type = core.getAttribute(self.getMetaType(nodeObj), 'name'),
            counter = 2,
            error = '',
            pushParametricLink,
            afterSrcLoaded,
            afterDstLoaded,
            srcMetaType,
            dstMetaType,
            srcX,
            srcY,
            dstX,
            dstY,
            srcName = '',
            dstName,
            srcId,
            dstId;

        pushParametricLink = function (err, shouldPush) {
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
                        srcName: srcName,
                        dstName: dstName,
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

                    if (!self.parametricDiagrams.hasOwnProperty(diagramKey)) {
                        self.parametricDiagrams[diagramKey] = {};
                    }
                    if (!self.parametricDiagrams[diagramKey].hasOwnProperty('links')) {
                        self.parametricDiagrams[diagramKey].links = [];
                    }
                    self.parametricDiagrams[diagramKey].links.push(link);
                    if (type === "Connector" ) {

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
                pushParametricLink(err, false);
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
            pushParametricLink(null, true);
        };
        core.loadByPath(self.rootNode, src, afterSrcLoaded);

        afterDstLoaded = function (err, nodeObj) {
            if (err) {
                pushParametricLink(err, false);
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
            pushParametricLink(null, true);
        };
        core.loadByPath(self.rootNode, dst, afterDstLoaded);



    };

    ParametricDiagramExporter.prototype.saveResults = function (callback) {
        var self = this,
            diagramPath,
            i,
            h = 0,
            obj,
            diagramId = 1,
            output,
            artifact = self.blobClient.createArtifact('SysMLExporterOutput');



        for (diagramPath in self.parametricDiagrams) {
            if (self.parametricDiagrams.hasOwnProperty(diagramPath)) {
                var template,
                    notationFile,
                    modelFile,
                    projectFile,
                    modelNotationElms = [],
                    modelElms = [],
                    attributes = [],
                    blockElms = [],
                    portElms1 = [],
                    portElms2 = [],
                    mainDiagramInfo,
                    mainDiagramId = 'main_' + diagramPath,
                    mainDiagramName = self.parametricDiagrams[diagramPath].mainBlockName,
                    mainDiagramRelations = [],
                    diagramWidth = self.diagramDimension ? Math.max(self.diagramDimension.width, 500) : 500,
                    diagramHeight = self.diagramDimension ? Math.max(self.diagramDimension.height, 300) : 300;


                for (i = 0; i < self.parametricDiagrams[diagramPath].elements.length; ++i) {
                    var childElement = self.parametricDiagrams[diagramPath].elements[i],
                        elm,
                        j = 0;


                    // generate notations
                    template = TEMPLATES[childElement.type + '.Notation.ejs'];

                    if (template) {
                        elm = ejs.render(template,
                            {
                                id: childElement.id,
                                //type: childElement.type + childElement.id,
                                // x and y coordinates must be rounded to
                                // integer values or Papyrus would wipe them out
                                x: Math.round(childElement.x),
                                y: Math.round(childElement.y)
                            });
                        modelNotationElms.push(elm);

                        if (childElement.type === 'ConstraintBlock' && childElement.children.length) {
                            for (idx = 0; idx < childElement.children.length; idx++) {
                                var nestnotatemplate = TEMPLATES['Parameter.Notation.ejs'];
                                var parNota = ejs.render(nestnotatemplate,
                                    {
                                        id: childElement.id + 'n' + idx,
                                        x: Math.round(childElement.children[idx].x - childElement.x),
                                        y: Math.round(childElement.children[idx].y - childElement.y)
                                    });
                                modelNotationElms.push(parNota);

                            }
                        }
                    }



                    // extend new type of template
                    template = TEMPLATES['Attribute.ejs'];
                    if (template) {
                        elm = ejs.render(template,
                            {
                                id: childElement.id,
                                name: childElement.name,
                                type: childElement.type + childElement.id,
                            })
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&#39;/g, "'")
                            .replace(/&quot;/g, '"');
                        attributes.push(elm);

                    }

                    //generate model elements
                    template = TEMPLATES[childElement.type + '.ejs'];

                    //template = TEMPLATES['packagedElement.uml.ejs'];
                    obj = {
                        //name: childElement.name,
                        type: childElement.type + childElement.id,
                        name: childElement.name,
                        id: childElement.id ,
                        diagramID: diagramId,
                        parameters: '',
                        links: '',
                        relations:''
                    };
                    if (childElement.type === 'ConstraintBlock' && childElement.children.length){
                        var paraTemp = TEMPLATES['Parameter.ejs'];
                        for (var idx = 0; idx < childElement.children.length; idx += 1) {
                            obj.parameters += ejs.render(paraTemp, {
                                id: childElement.id + 'n' + idx,
                                name: childElement.children[idx].name
                            });
                        }
                    }

                    if (childElement.type === 'Connector') {
                        var lnkTemp = TEMPLATES['Connector.ejs'];
                        var connId,
                            srcId,
                            dstId;

                        if (self.idLUT[self.reverseIdLUT[childElement.id]].src) {

                            for (j = 0; j < self.idLUT[self.reverseIdLUT[childElement.id]].src.length; ++j) {
                                srcId = self.idLUT[self.reverseIdLUT[childElement.id]].src[j].srcId;
                                    obj.links += ejs.render(lnkTemp, {
                                        id: childElement.id,
                                        srcID: srcId
                                    });
                            }
                        }
                    }


                    template = TEMPLATES[childElement.type + '.ejs'];
                    elm = ejs.render(template, obj)
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&#39;/g, "'")
                        .replace(/&quot;/g, '"');

                    modelElms.push(elm);
                }



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


                            edge = ejs.render(TEMPLATES[link.type + '.Notation.ejs'], obj);
                            portElms2.push(edge);

                            edge = ejs.render(TEMPLATES[link.type + '.ejs'],
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





                notationFile = ejs.render(TEMPLATES['model.notation.ejs'],
                    {
                        diagramType: 'Parametric',
                        diagramName: diagramPath.split('+')[1],
                        childrenElements: modelNotationElms.join('\n'),
                        diagramId: '_D' + diagramId
                    })
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&#39;/g, "'")
                    .replace(/&quot;/g, '"');

                    //modelFile = ejs.render(TEMPLATES['model.uml.ejs'],
                    modelFile = ejs.render(TEMPLATES['Parametric.ejs'],
                    {
                        diagramId: '_D' + diagramId++,
                        id: h,
                        childElements: modelElms.join('\n'),
                        ownedAttributes: attributes.join('\n'),
                        xmiElements: ''
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





    return ParametricDiagramExporter;
});