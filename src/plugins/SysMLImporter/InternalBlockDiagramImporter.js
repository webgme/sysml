/**
 * Created by Dana Zhang on 12/10/15.
 */

/*globals define*/
/*jshint node:true, browser:true*/

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
            components = [],
            idToChildren = {},
            idToTypes = {},
            nodeDataById,
            node,
            position,
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

        // get block objects idToTypes {id: type}  (id ==> meta_type)
        if (blocks) {
            if (blocks.length) {
                for (i = 0; i < blocks.length; ++i) {
                    if (blocks[i]['@base_Class'] !== rootBlockId) {
                        idToTypes[blocks[i]['@base_Class']] = 'Block';
                    }
                }
            } else {
                if (blocks['@base_Class'] !== rootBlockId) {
                    idToTypes[blocks['@base_Class']] = 'Block';
                }
            }
        }

        // get port objects idToTypes {id: type}
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

        // Gather component info
        for (i = 0; i < sysmlElms.packagedElement.length; i += 1) {
            elm = sysmlElms.packagedElement[i];
            var parentId = null,
                xmiId = elm[PREFIX + 'id'],
                nodeMetaType = elm[PREFIX + 'type'].replace('uml:', '');

            // skip Association between rootBlock and other elements
            if (nodeMetaType === 'Association') continue;

            // save packaged element type as Block if not root block
            //if (xmiId !== rootBlockId) {
            //    // todo: save what block is typed as, currently not supported by webgme-sysml
            //}

            // process child elements in packagedElement
            if (elm.ownedAttribute) {
                if (xmiId !== rootBlockId) {
                    parentId = xmiId;
                    idToChildren[parentId] = {children: []};
                }

                if (elm.ownedAttribute.length) {
                    for (j = 0; j < elm.ownedAttribute.length; ++j) {
                        self._processComponents(elm.ownedAttribute[j], components, parentId, idToChildren, nodeDataById, idToTypes);
                    }
                } else {
                    self._processComponents(elm.ownedAttribute, components, parentId, idToChildren, nodeDataById, idToTypes);
                }
            }
        }

        for (i = 0; i < components.length; ++i) {

            // create the webgme node for component
            node = self.core.createNode({
                parent: smNode,
                base: self.META[components[i].type]
            });
            self.core.setAttribute(node, 'name', components[i].name);
            self.core.setRegistry(node, 'position', components[i].position);
            idToNode[components[i].id] = node;

            // if component has children, then create children nodes
            if (idToChildren[components[i].id]) {
                for (j = 0; j < idToChildren[components[i].id].children.length; ++j) {
                    var child = idToChildren[components[i].id].children[j],
                        childNode = self.core.createNode({
                            parent: node,
                            base: self.META[child.type]
                        });
                    self.core.setAttribute(childNode, 'name', child.name);
                    self.core.setRegistry(childNode, 'position', child.position);
                    idToNode[child.id] = childNode;
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

    IBDImporter.prototype._processComponents = function (component, components, parentId, idToChildren, nodeDataById, idToTypes) {
        var xmiId = component['@http://www.omg.org/spec/XMI/20131001:id'],
            id = component['@type'],
            name = component['@name'];

        // if component is child element, save it to idToChildren list
        if (idToChildren[parentId]) {
            var childObj = {
                id: xmiId,
                name: name,
                position: nodeDataById[xmiId].position,
                type: idToTypes[xmiId]
            };
            idToChildren[parentId].children.push(childObj);
        } else {
            // if component is diagram component, save it to components list
            var compObj = {
                id: id || xmiId,
                name: name,
                position: nodeDataById[xmiId].position
            };
            // if component is Block, it has an id, get its type from idToTypes
            compObj.type = idToTypes[id] || idToTypes[xmiId]
                || component['@http://www.omg.org/spec/XMI/20131001:type'].replace('uml:', '');
            components.push(compObj);
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