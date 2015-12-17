/**
 * Created by Dana Zhang on 12/10/15.
 */

/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Author: Dana Zhang
 * Created on: October 31, 2015
 */

define(['./SysMLImporterConstants'], function (CONSTANTS) {

    'use strict';

    var IBDImporter = function () {

    };

    IBDImporter.prototype.buildDiagram = function (sysmlData, modelNotation) {
        var self = this,
            sysmlElms = sysmlData['http://www.eclipse.org/uml2/5.0.0/UML:Model'],
            blocks = sysmlData['http://www.eclipse.org/papyrus/0.7.0/SysML/Blocks:Block'],
            ports = sysmlData['http://www.eclipse.org/papyrus/0.7.0/SysML/PortAndFlows:FlowPort'],
            PREFIX ='@http://www.omg.org/spec/XMI/20131001:',
            rootBlockId = modelNotation.element['@href'].substring(modelNotation.element['@href'].indexOf('#') + 1),
            i, j,
            elm,
            idToNode = {},
            components = {},
            notationIdToUmlId = {},
            idToTypes = {},
            elmId,
            nodeDataById,
            node,
            linkNode,
            nodeId,
            nodeType,
            position,
            links = [],
            smNode;



        if (!sysmlElms || !modelNotation) {
            //callback('!!Oops something went wrong with the model format!!');
            return;
        }

        nodeDataById = self._processModelNotation(modelNotation, rootBlockId);

        // Create the internal block diagram
        smNode = self.core.createNode({
            parent: self.activeNode,
            base: self.META.InternalBlockDiagram
        });

        self.core.setAttribute(smNode, 'name', modelNotation['@name']);
        self.core.setRegistry(smNode, 'position', {x: 200, y: 200});    // todo: update position

        // Gather component info
        for (i = 0; i < sysmlElms.packagedElement.length; i += 1) {
            elm = sysmlElms.packagedElement[i];
            var parentId;
            nodeId = elm[PREFIX + 'id'];
            nodeType = elm[PREFIX + 'type'].replace('uml:', '');

            if (nodeId !== rootBlockId) {

                if (nodeDataById[nodeId]) {
                    nodeDataById[nodeId].type = 'Block';
                } else if (notationIdToUmlId[nodeId]) {
                    nodeDataById[notationIdToUmlId[nodeId]].type = 'Block';
                }
                parentId = notationIdToUmlId[nodeId] || nodeId;
            }

            if (elm.ownedAttribute) {
                if (elm.ownedAttribute.length) {
                    for (j = 0; j < elm.ownedAttribute.length; ++j) {
                        self._processComponents(elm.ownedAttribute[j], nodeDataById, components, parentId, notationIdToUmlId);
                    }
                } else {
                    self._processComponents(elm.ownedAttribute, nodeDataById, components, parentId, notationIdToUmlId);
                }
            }
        }

        if (blocks) {
            if (blocks.length) {
                for (i = 0; i < blocks.length; ++i) {
                    if (blocks[i]['@base_Class'] !== rootBlockId) {
                        idToTypes[notationIdToUmlId[blocks[i]['@base_Class']]] = 'Block';
                    }
                }
            } else {
                if (blocks['@base_Class'] !== rootBlockId) {
                    idToTypes[notationIdToUmlId[blocks['@base_Class']]] = 'Block';
                }
            }
        }

        if (ports) {
            if (ports.length) {
                for (i = 0; i < ports.length; ++i) {
                    idToTypes[ports[i]['@base_Port']] = 'FlowPort'
                        + CONSTANTS.FLOW_PORTS[ports[i]['@direction']];
                }
            } else {
                idToTypes[ports['@base_Port']] = 'FlowPort'
                    + CONSTANTS.FLOW_PORTS[ports['@direction']];
            }
        }

        for (i in components) {
            if (components.hasOwnProperty(i)) {
                node = self.core.createNode({
                    parent: smNode,
                    base: self.META[idToTypes[i] || components[i].type]
                });

                self.core.setAttribute(node, 'name', components[i].name);
                self.core.setRegistry(node, 'position', components[i].position);

                idToNode[i] = node;
                if (components[i].children) {
                    for (j = 0; j < components[i].children.length; ++j) {
                        var child = components[i].children[j],
                            childNode = self.core.createNode({
                                parent: node,
                                base: self.META[idToTypes[child.id]]
                            });
                        self.core.setAttribute(childNode, 'name', components[i].name);
                        self.core.setRegistry(childNode, 'position', child.position);
                        idToNode[child.id] = childNode;
                    }
                }
            }
        }

        for (i = 0; i < sysmlElms.packagedElement.length; i += 1) {
            elm = sysmlElms.packagedElement[i];
            if (elm.ownedConnector) {
                if (elm.ownedConnector.length) {
                    for (j = 0; j < elm.ownedConnector.length; ++j) {
                        self._processConnections(elm.ownedConnector[j], smNode, idToNode);
                    }
                } else {
                    self._processConnections(elm.ownedConnector, smNode, idToNode);
                }
            }
        }


    };

    IBDImporter.prototype._processModelNotation = function (modelNotation, rootBlockId) {
        var nodeDataById = {},
            idPrefix,
            TYPE_KEY = '@http://www.omg.org/XMI:type',
            i,
            child,
            _saveComponentInfo;

        _saveComponentInfo = function (c) {
            if (c.element && c.element[TYPE_KEY] && c.element[TYPE_KEY].indexOf('uml:') === 0
                && c.element[TYPE_KEY].indexOf('uml:Stereotype') === -1) {

                idPrefix = c.element['@href'].substring(0, c.element['@href'].indexOf('#') + 1);

                var id = c.element['@href'].replace(idPrefix, '');
                if (id !== rootBlockId) {
                    nodeDataById[id] =
                    {
                        type: c.element[TYPE_KEY].replace('uml:', ''),
                        position:
                        {
                            x: Math.abs(parseInt(c.layoutConstraint['@x'])),
                            y: Math.abs(parseInt(c.layoutConstraint['@y']))
                        }
                    };
                }
            }

            if (c.children) {
                for (var k = 0; k < c.children.length; ++k) {
                    _saveComponentInfo(c.children[k]);
                }
            }
        };

        if (!modelNotation.children[0] || !modelNotation.children[0].children) {
            return null;
        }
        for (i = 0; i < modelNotation.children[0].children.length; ++i) {
            child = modelNotation.children[0].children[i];
            if (child) {
                _saveComponentInfo(child);
            }
        }

        return nodeDataById;
    };




    IBDImporter.prototype._processComponents = function (component, nodeDataById, componentList, parentId, notationIdToUmlId) {
        var id = component['@type'],
            notationId = component['@http://www.omg.org/spec/XMI/20131001:id'],
            name = component['@name'];

        if (id) {
            notationIdToUmlId[id] = notationId;
        }

        if (nodeDataById[notationId]) {
            nodeDataById[notationId].name = name;
        }

        if (parentId) {
            if (!componentList[parentId]) {
                componentList[parentId] = {};
            }
            componentList[parentId].children = componentList[parentId].children || [];
            var childObj = nodeDataById[notationId];
            childObj.id = notationId;
            componentList[parentId].children.push(childObj);
        } else {
            componentList[notationId] = nodeDataById[notationId];
        }
    };

    IBDImporter.prototype._processConnections = function (connection, parentNode, idToNode) {
        var self = this,
            name = connection['@name'],
            src = connection.end[0]['@role'],
            dst = connection.end[1]['@role'],
            linkNode = self.core.createNode({
                parent: parentNode,
                base: self.META['Connector']
            });

        self.core.setPointer(linkNode, 'src', idToNode[src]);
        self.core.setPointer(linkNode, 'dst', idToNode[dst]);

    };


    return IBDImporter;
});