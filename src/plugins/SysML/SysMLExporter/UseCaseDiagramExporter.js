/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Author: Dana Zhang
 * Created on: October 31, 2015
 */

define([], function () {

    'use strict';

    var UseCaseDiagramExporter = function () {
    };

    UseCaseDiagramExporter.prototype.addComponent = function (nodeObj) {

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

    UseCaseDiagramExporter.prototype.addConnection = function (nodeObj, callback) {

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

    return UseCaseDiagramExporter;
});