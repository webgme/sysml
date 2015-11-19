/**
 * Created by Dana Zhang on 11/18/15.
 */

/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Author: Dana Zhang
 * Created on: October 31, 2015
 */

define([], function () {

    'use strict';

    var UseCaseDiagramImporter = function () {

    };

    UseCaseDiagramImporter.prototype.buildDiagram = function (sysmlData, modelNotation) {
        var self = this,
            PREFIX ='@http://www.omg.org/spec/XMI/20131001:',
            i, j,
            idToNode = {},
            node,
            linkNode,
            nodeId,
            nodeType,
            links = [],
            smNode;

        // Create the use case diagram
        smNode = self.core.createNode({
            parent: self.activeNode,
            base: self.META.UseCaseDiagram
        });

        self.core.setAttribute(smNode, 'name', sysmlData['@name']);
        self.core.setRegistry(smNode, 'position', {x: 200, y: 200});

        // Create the states and gather data about the actor and use case
        for (i = 0; i < sysmlData.packagedElement.length; i += 1) {
            nodeId = sysmlData.packagedElement[i][PREFIX + 'id'];
            nodeType = sysmlData.packagedElement[i][PREFIX + 'type'].replace('uml:', '');


            if (nodeType === 'Association') {

                links.push({
                    src: sysmlData.packagedElement[i]['ownedEnd'][1]['@type'].replace('src_', ''),
                    dst: sysmlData.packagedElement[i]['ownedEnd'][0]['@type'].replace('dst_', ''),
                    type: 'Association'
                });

            } else {
                node = self.core.createNode({
                    parent: smNode,
                    base: self.META[nodeType]
                });

                self.core.setAttribute(node, 'name', sysmlData.packagedElement[i]['@name']);
                self.core.setRegistry(node, 'position', {x: 50 + (100 * i), y: 200}); // This could be more fancy.

                // Add the node with its old id to the map (will be used when creating the transitions)
                idToNode[nodeId] = node;

                // Gather the outgoing extend links from the current use case and store the info.
                if (sysmlData.packagedElement[i].extend) {
                    if (sysmlData.packagedElement[i].extend.length) {

                        for (j = 0; j < sysmlData.packagedElement[i].extend.length; j += 1) {
                            links.push({
                                src: nodeId,
                                dst: sysmlData.packagedElement[i].extend[j]['@extendedCase'],
                                type: 'Extend'
                            });
                        }
                    } else {
                        links.push({
                            src: nodeId,
                            dst: sysmlData.packagedElement[i].extend['@extendedCase'],
                            type: 'Extend'
                        });
                    }
                }
                // Gather the outgoing include links from the current use case and store the info.
                if (sysmlData.packagedElement[i].include) {
                    if (sysmlData.packagedElement[i].include.length) {

                        for (j = 0; j < sysmlData.packagedElement[i].include.length; j += 1) {
                            links.push({
                                src: nodeId,
                                dst: sysmlData.packagedElement[i].include[j]['@addition'],
                                type: 'Include'
                            });
                        }
                    } else {
                        links.push({
                            src: nodeId,
                            dst: sysmlData.packagedElement[i].include['@addition'],
                            type: 'Include'
                        });
                    }
                }
            }
        }

    // With all links created, we will now create the connections between the nodes.
        for (i = 0; i < links.length; i += 1) {
            linkNode = self.core.createNode({
                parent: smNode,
                base: self.META[links[i].type]
            });

            self.core.setPointer(linkNode, 'src', idToNode[links[i].src]);
            self.core.setPointer(linkNode, 'dst', idToNode[links[i].dst]);
        }

    };



    return UseCaseDiagramImporter;
});