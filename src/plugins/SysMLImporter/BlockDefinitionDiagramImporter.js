/**
 * Created by Dana Zhang on 12/10/15.
 */

/*globals define*/
/*jshint node:true, browser:true*/

define(['./SysMLImporterConstants'], function (CONSTANTS) {

    'use strict';

    var BDDImporter = function () {

    };

    BDDImporter.prototype.buildDiagram = function (sysmlData, modelNotation) {
        var self = this,
            sysmlElms = sysmlData['http://www.eclipse.org/uml2/5.0.0/UML:Model'],
            blocks = sysmlData['http://www.eclipse.org/papyrus/0.7.0/SysML/Blocks:Block'],
            ports = sysmlData['http://www.eclipse.org/papyrus/0.7.0/SysML/PortAndFlows:FlowPort'],
            PREFIX ='@http://www.omg.org/spec/XMI/20131001:',
            i, j,
            elm,
            idToNode = {},
            idToConnector = {},
            connections = [],
            idToTypes = {},
            nodeDataById,
            node,
            position,
            smNode;


        if (!sysmlElms || !modelNotation) {
            //callback('!!Oops something went wrong with the model format!!');
            return;
        }

        nodeDataById = self._processModelNotation(modelNotation);

        // Create the internal block diagram
        smNode = self.core.createNode({
            parent: self.activeNode,
            base: self.META.BlockDefinitionDiagram
        });

        self.core.setAttribute(smNode, 'name', modelNotation['@name']);
        self.core.setRegistry(smNode, 'position', {x: 200, y: 200});    // todo: update position

        // get block objects idToTypes {id: type}  (id ==> meta_type)
        if (blocks) {
            if (blocks.length) {
                for (i = 0; i < blocks.length; ++i) {
                    idToTypes[blocks[i]['@base_Class']] = 'Block';
                }
            } else {
                idToTypes[blocks['@base_Class']] = 'Block';
            }
        }

        // get port objects idToTypes {id: type}
        if (ports) {
            if (ports.length) {
                for (i = 0; i < ports.length; ++i) {
                    idToTypes[ports[i]['@base_Port']] = 'FlowPort'
                        + CONSTANTS.FLOW_PORTS[ports[i]['@direction'] || 'inout'];
                }
            } else {
                idToTypes[ports['@base_Port']] = 'FlowPort'
                    + CONSTANTS.FLOW_PORTS[ports['@direction'] || 'inout'];
            }
        }

        // Gather component info
        for (i = 0; i < sysmlElms.packagedElement.length; i += 1) {
            elm = sysmlElms.packagedElement[i];
            var xmiId = elm[PREFIX + 'id'],
                name = elm['@name'],
                nodeMetaType;

            // skip Association between rootBlock and other elements
            if (elm[PREFIX + 'type'].replace('uml:', '') === 'Association') {
                var conn = {
                    id: xmiId,
                    src: elm['@memberEnd'].split(' ')[0],
                    dst: elm['@memberEnd'].split(' ')[1],
                    type: 'Association'
                };
                connections.push(conn);
                continue;
            }

            nodeMetaType = idToTypes[xmiId] || nodeDataById[xmiId].type;

            node = self._constructNode(smNode, nodeMetaType, name, nodeDataById[xmiId].position);
            idToNode[xmiId] = node;

            // process child elements in packagedElement
            if (elm.ownedAttribute) {
                if (elm.ownedAttribute.length) {
                    for (j = 0; j < elm.ownedAttribute.length; ++j) {
                        self.processChildElement(elm.ownedAttribute[j], node, j, nodeDataById, idToTypes, idToNode, idToConnector);
                    }
                } else {
                    self.processChildElement(elm.ownedAttribute, node, 0, nodeDataById, idToTypes, idToNode, idToConnector);
                }
            }
        }

        if (!connections) return;
        for (i = 0; i < connections.length; i += 1) {
            elm = connections[i];
            node = self.core.createNode({
                parent: smNode,
                base: self.META[idToTypes[elm.id] || elm.type]
            });

            self.core.setPointer(node, 'src', idToNode[idToConnector[elm.src]]);
            self.core.setPointer(node, 'dst', idToNode[idToConnector[elm.dst]]);
        }
    };

    BDDImporter.prototype._processModelNotation = function (modelNotation) {
        var nodeDataById = {},
            idPrefix,
            TYPE_KEY = '@http://www.omg.org/XMI:type',
            i,
            child,
            _saveComponentInfo;

        _saveComponentInfo = function (c, index) {
            if (c.element && c.element[TYPE_KEY] && c.element[TYPE_KEY].indexOf('uml:') === 0
                && c.element[TYPE_KEY].indexOf('uml:Stereotype') === -1) {

                idPrefix = c.element['@href'].substring(0, c.element['@href'].indexOf('#') + 1);

                var id = c.element['@href'].replace(idPrefix, '');
                    nodeDataById[id] =
                    {
                        position:
                        {
                            x: Math.abs(parseInt(c.layoutConstraint['@x']) || 200),
                            y: Math.abs(parseInt(c.layoutConstraint['@y']) || 50 + (50 * index))
                        },
                        type: c.element[TYPE_KEY].replace('uml:', '')
                    };
            }

            if (c.children) {
                if (c.children.length) {
                    for (var k = 0; k < c.children.length; ++k) {
                        _saveComponentInfo(c.children[k], k);
                    }
                } else {
                    _saveComponentInfo(c.children, 0);

                }

            }
        };

        if (!modelNotation.children) {
            return null;
        }
        for (i = 0; i < modelNotation.children.length; ++i) {
            child = modelNotation.children[i];
            if (child) {
                _saveComponentInfo(child, i);
            }
        }

        return nodeDataById;
    };

    BDDImporter.prototype.processChildElement = function (component, parentNode, index, nodeDataById, idToTypes, idToNode, idToConnector) {
        var self = this,
            id = component['@http://www.omg.org/spec/XMI/20131001:id'],
            type = component['@type'],
            name = component['@name'],
            connectionId = component['@association'],
            connectionType = component['@aggregation'],
            node;

        // if connectionId exists, save connection info
        if (connectionId) {
            idToConnector[id] = type;
            if (connectionType) {
                idToTypes[connectionId] = CONSTANTS.SYSML_TO_META_TYPES[connectionType];
            }
        } else {
            var metaType = idToTypes[id] || nodeDataById[id].type,
                position = nodeDataById && nodeDataById[id] ? nodeDataById[id].position
                : {x: 50 + (50 * index), y: 200};

            node = self._constructNode(parentNode, metaType, name, position);
            idToNode[id] = node;
        }
    };

    BDDImporter.prototype._processConnections = function (connection, parentNode, idToNode) {
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

    BDDImporter.prototype._constructNode = function (parentNode, metaType, name, position) {
        var self = this,
            smNode;

        smNode = self.core.createNode({
            parent: parentNode,
            base: self.META[metaType]
        });
        self.core.setAttribute(smNode, 'name', name);
        self.core.setRegistry(smNode, 'position', position);

        return smNode;
    };


    return BDDImporter;
});