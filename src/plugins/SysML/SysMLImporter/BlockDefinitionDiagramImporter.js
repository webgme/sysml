
/**
 * Author: Zlatko Joveski
 * Created on: December 15, 2015
 */

define([], function () {

    'use strict';

    var BlockDefinitionDiagramImporter = function () {

    };

    BlockDefinitionDiagramImporter.prototype.buildDiagram = function (sysmlData, modelNotation, portAndFlows) {
        var self = this,
            PREFIX ='@http://www.omg.org/spec/XMI/20131001:',
            i,
            idToNode = {},
            nodeDataById = self._processModelNotation(modelNotation);

        // Node variables
        var smNode,
            node,
            portNode,
            connectionNode,
            propertyNode,
            nodeId,
            nodeType;

        // Names of methods for extracting model information from the Eclipse generated files to an intermediate form
        var _getOwnedPort,
            _getPortTypesAndDirections,

            _getConnectionType,
            _getConnectionMultiplicity,
            _getOwnedConnection,

            _getOwnedProperty,

            _getOwnedAttributes;

        // Variables storing the model information in an intermediate form
        var rawConnections = {},
            rawPorts = {},
            rawProperties = {};

        // Names of methods for creating the corresponding objects in the WebGME model, using the Eclipse model
        // information stored in intermediate form
        var _importNode,
            _importPorts,
            _importConnections,
            _importProperties;


        _getOwnedPort = function (id, ownedPort) {
            var portId,
                portName,
                portObject;

            portId = ownedPort[PREFIX + 'id'];
            portName = ownedPort['@name'];

            // Create a new port data object
            portObject = {
                portName: portName,
                portType: 'Port',
                portOwner: id
            };

            rawPorts[portId] = portObject;
        };

        _getPortTypesAndDirections = function() {
            var portId,
                portDirection,
                portTypeSuffix;

            for (i = 0; i < portAndFlows.length; i += 1) {
                portId = portAndFlows[i]['@base_Port'];
                portDirection = portAndFlows[i]['@direction'];

                if (portDirection) {
                    rawPorts[portId]['portDirection'] = portDirection;

                    switch (portDirection) {
                        case 'in':
                            portTypeSuffix = 'In';
                            break;
                        case 'out':
                            portTypeSuffix = 'Out';
                            break;
                        case 'inout':
                            portTypeSuffix = 'InOut';
                    }

                    rawPorts[portId]['portType'] = 'FlowPort' + portTypeSuffix;
                }

            }
        };


        _getConnectionType = function (rawType) {
            var connectionType;

            // Determine (if possible from the information stored in the current packaged element)
            // if the connection type is a composition or aggregation
            if (rawType) {
                switch (rawType) {
                    case 'composite':
                        connectionType = 'composition';
                        break;
                    case 'shared':
                        connectionType = 'aggregation';
                        break;
                }
            } else {
                // Note that the 'association' type is at this point only temporary - data contained in
                // the packaged element on the other end of the connection may indicate that this
                // is in fact a different type of connection and the connection type will need to
                // be updated accordingly.
                connectionType = 'association';
            }

            return connectionType;
        };

        // One-sided
        _getConnectionMultiplicity = function(lower, upper) {
            if (lower && upper) {
                if (lower['@value'] == upper['@value']) {
                    return lower['@value'];
                } else {
                    return lower['@value'] + ".." + upper['@value'];
                }
            } else {
                return "1";
            }
        };

        _getOwnedConnection = function (id, ownedConnection) {
            var connectionId,
                connectionType,
                connectionMultiplicity,     // one-sided
                connectionObject;

            connectionId = ownedConnection['@association'];
            connectionType = _getConnectionType(ownedConnection['@aggregation']);
            connectionMultiplicity = _getConnectionMultiplicity(ownedConnection['lowerValue'],
                                                                ownedConnection['upperValue']);

            // If this is the first time we have encountered this connection
            if (!rawConnections[connectionId]) {

                // Create a new connection data object
                connectionObject = {
                    // The endpoints
                    firstEnd: id,                               // not necessarily the actual source
                    secondEnd: ownedConnection['@type'],        // not necessarily the actual destination

                    firstMltp: "1",                             // default value
                    secondMltp: connectionMultiplicity,

                    // The connection type
                    connectionType: connectionType,

                    // Direction information
                    // firstToSecond == true && secondToFirst == true -> undirected;
                    // otherwise -> directed (but 'actual' source and destination may depend on type of
                    // connection).
                    // [cannot have firstToSecond == false && secondToFirst == false]
                    firstToSecond: true,
                    secondToFirst: false,
                    connectionOwner: id
                };

                rawConnections[connectionId] = connectionObject;
            }
            // If we have already encountered this connection before
            else {
                // The connection must be undirected.
                rawConnections[connectionId]['secondToFirst'] = true;
                rawConnections[connectionId]['firstMltp'] = connectionMultiplicity;

                // We only need to update the recorded connection type if the connection type
                // stored in this packaged element is 'composition' or 'aggregation'.
                if (connectionType === 'composition' || connectionType === 'aggregation') {
                    rawConnections[connectionId]['connectionType'] = connectionType;
                    rawConnections[connectionId]['connectionOwner'] = id;
                }

            }
        };


        _getOwnedProperty = function (id, ownedProperty) {
            var propertyId,
                propertyName,
                propertyObject;

            propertyId = ownedProperty[PREFIX + 'id'];
            propertyName = ownedProperty['@name'];

            // Create a new port data object
            propertyObject = {
                propertyName: propertyName,
                propertyOwner: id
            };

            rawProperties[propertyId] = propertyObject;
        };


        _getOwnedAttributes = function (id, elm) {
            var ownedAttributes = elm['ownedAttribute'],
                attributeType;

            // If packaged element has no owned attributes, do nothing
            if (!ownedAttributes) return;

            // If the packaged element has a single owned attribute, it is 'stored' as a single object, not
            // as an array of one object
            if (ownedAttributes.length == undefined) {
                ownedAttributes = [];
                ownedAttributes.push(elm['ownedAttribute']);
            }

            for (var j = 0; j < ownedAttributes.length; j++) {

                attributeType = ownedAttributes[j][PREFIX + 'type'].replace('uml:', '');

                if (attributeType == 'Port') {
                    // Owned attribute is a port

                    _getOwnedPort(id, ownedAttributes[j]);

                } else if (attributeType == 'Property') {
                    if (ownedAttributes[j]['@association']) {
                        // Owned attribute is a connection

                        _getOwnedConnection(id, ownedAttributes[j]);

                    } else {
                        // Owned attribute is a property

                        _getOwnedProperty(id, ownedAttributes[j]);

                    }
                }
            }

        };


        _importNode = function (id, elm, nodeType, count) {
            var position = nodeDataById && nodeDataById[id] ? nodeDataById[id].position: {x: 150, y: 50 + (150 * count)};
            node = self._constructNode(smNode, self.META[nodeType], elm['@name'], position);

            idToNode[id] = node;
        };

        _importPorts = function() {
            for (var pId in rawPorts) {
                if (rawPorts.hasOwnProperty(pId)) {

                    portNode = self.core.createNode({
                        parent: idToNode[rawPorts[pId]['portOwner']],
                        base: self.META[rawPorts[pId]['portType']]
                    });

                    self.core.setAttribute(portNode, 'name', rawPorts[pId]['portName']);
                }
            }
        };

        _importConnections = function() {
            var src,
                dst,
                type = "",
                dstMultiplicity,
                srcMultiplicity,
                connectionObject;

            for (var connectId in rawConnections) {
                if (rawConnections.hasOwnProperty(connectId)) {
                    connectionObject = rawConnections[connectId];

                    type = "";

                    src = connectionObject['connectionOwner'];
                    if (src == connectionObject['firstEnd']) {
                        dst = connectionObject['secondEnd'];

                        dstMultiplicity = connectionObject['secondMltp'];
                        srcMultiplicity = connectionObject['firstMltp'];
                    } else {
                        dst = connectionObject['firstEnd'];

                        dstMultiplicity = connectionObject['firstMltp'];
                        srcMultiplicity = connectionObject['secondMltp'];
                    }

                    // If we are dealing with a directed connection type
                    if (!(connectionObject['firstToSecond'] && connectionObject['secondToFirst'])) {
                        type += "Directed";
                    }

                    type += connectionObject['connectionType'].charAt(0).toUpperCase() +
                            connectionObject['connectionType'].slice(1);

                    connectionNode = self.core.createNode({
                        parent: smNode,
                        base: self.META[type]
                    });

                    self.core.setPointer(connectionNode, 'src', idToNode[src]);
                    self.core.setPointer(connectionNode, 'dst', idToNode[dst]);

                    self.core.setAttribute(connectionNode, 'Multiplicity_Dst', dstMultiplicity);
                    self.core.setAttribute(connectionNode, 'Multiplicity_Src', srcMultiplicity);
                }
            }
        };

        _importProperties = function() {
            for (var propId in rawProperties) {
                if (rawProperties.hasOwnProperty(propId)) {

                    propertyNode = self.core.createNode({
                        parent: idToNode[rawProperties[propId]['propertyOwner']],
                        base: self.META['Property']
                    });

                    self.core.setAttribute(propertyNode, 'name', rawProperties[propId]['propertyName']);
                }
            }
        };


        self.logger.info( "The block definition diagram is being imported." );

        // We assume there is only one BDD in the project.
        // Create the block definition diagram.
        smNode = self.core.createNode({
            parent: self.activeNode,
            base: self.META.BlockDefinitionDiagram
        });

        self.core.setAttribute(smNode, 'name', modelNotation['@name']);
        self.core.setRegistry(smNode, 'position', { x: 150, y: 150 });

        /* Traverse the object definitions within sysmlData, create them in WebGME, and replicate
           their visual appearance based on the corresponding information in modelNotation. Also,
           extract their owned attributes in an intermediate form. */
        for (i = 0; i < sysmlData.packagedElement.length; i += 1) {
            nodeId = sysmlData.packagedElement[i][PREFIX + 'id'];
            nodeType = sysmlData.packagedElement[i][PREFIX + 'type'].replace('uml:', '');

            if (nodeType === 'Association') {
                // Do not do anything here - information about connections will be extracted from the owning blocks
            } else if (nodeType === 'Class') {
                nodeType = 'Block';
                _importNode(nodeId, sysmlData.packagedElement[i], nodeType, i);

                _getOwnedAttributes(nodeId, sysmlData.packagedElement[i]);

            } else {
                // Not certain if there could be other types of packaged elements
            }
        }

        // Determine the type and direction of ports (are they only ports, or flowports; are they 'in' and/or 'out')
        _getPortTypesAndDirections();

        // Import the ports into the WebGME model
        _importPorts();

        // Import the connections into the WebGME model
        _importConnections();

        // Import the properties into the WebGME model
        _importProperties();

    };

    // Read the positioning and size data for each individual object in their respective diagrams.
    // Adapted from Dana's RequirementDiagramImporter.prototype._processModelNotation.
    BlockDefinitionDiagramImporter.prototype._processModelNotation = function (modelNotation) {
        var nodeDataById = {},
            ID_PREFIX = 'simp_elev.uml#',    // Need to make this dynamic
            i,
            child;

        if (!modelNotation.children) {
            return null;
        }
        for (i = 0; i < modelNotation.children.length; ++i) {
            child = modelNotation.children[i];
            if (child.element['@href']) {
                nodeDataById[child.element['@href'].replace(ID_PREFIX, '')] =
                {
                    position:
                    {
                        x: parseInt(child.layoutConstraint['@x']),
                        y: parseInt(child.layoutConstraint['@y'])
                    }
                };
            }
        }
        return nodeDataById;
    };

    BlockDefinitionDiagramImporter.prototype._constructNode = function (parentNode, metaType, name, position) {
        var self = this,
            smNode;

        smNode = self.core.createNode({
            parent: parentNode,
            base: metaType
        });

        self.core.setAttribute(smNode, 'name', name);
        self.core.setRegistry(smNode, 'position', position);

        return smNode;
    };

    return BlockDefinitionDiagramImporter;
});