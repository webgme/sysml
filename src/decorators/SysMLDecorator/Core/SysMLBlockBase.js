/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 *
 */

"use strict";

define(['js/NodePropertyNames',
        'js/RegistryKeys',
        './SysMLDecorator.Constants',
        './SysML.META',
        'js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants',
        'js/Constants',
        'text!../Icons/Port.svg'], function (nodePropertyNames,
                                             REGISTRY_KEYS,
                                             SysMLDecoratorConstants,
                                             SysMLMETA,
                                             DiagramDesignerWidgetConstants,
                                             CONSTANTS,
                                             PortSvg) {

    /**
     * A module representing SysMLBlockBase decorator functionality for the SysMLModelingLanguage.
     * @exports SysMLBlockBase
     * @version 1.0
     */
    var SysMLBlockBase,
        PortBase = $(PortSvg).find("g.port");

    /**
     * Initializes a new instance of SysMLBlockBase.
     * @constructor
     */
    SysMLBlockBase = function () {

    };

    /**
     * Gets a clone of a port svg icon.
     * @returns {*|jQuery|HTMLElement} Port svg icon.
     */
    SysMLBlockBase.prototype.getPortSVG = function () {

        return PortBase.clone();
    };

    SysMLBlockBase.prototype._updatePorts = function () {
        var self = this,
            gmeID = this._metaInfo[CONSTANTS.GME_ID],
            client = this._control._client,
            nodeObj = client.getNode(gmeID),
            childrenIDs = nodeObj ?  nodeObj.getChildrenIds() : [],
            leftPorts = [],
            rightPorts = [],
            SVGWidth = parseInt(this.skinParts.$svg.attr('width')),
            TOPOFFSET = parseInt(this.skinParts.$svg.find('line')[0].getAttribute('y1')),
            SVGHeight = parseInt(this.skinParts.$svg.attr('height')) - TOPOFFSET,
            svgIcon = this.skinParts.$svg;


        // reinitialize the port coordinates with an empty object
        this._portCoordinates = {};
        this.skinParts.$connectorContainer.empty();

        function compare (p1, p2) {
            return p1.y < p2.y;
        }

        if (childrenIDs && childrenIDs.length) {
            for (var i = 0; i <childrenIDs.length; ++i) {
                if (!self.isPort(childrenIDs[i])) {
                    continue;
                }
                var portNode = client.getNode(childrenIDs[i]),
                    portPosition = portNode ? portNode.getRegistry(REGISTRY_KEYS.POSITION) : {x: 0, y: 0};


                if (portPosition.x > SysMLDecoratorConstants.PORT_POSITION_DIVIDER_POINT) {
                    rightPorts.push({id: childrenIDs[i], y: portPosition.y});
                } else {
                    leftPorts.push({id: childrenIDs[i], y: portPosition.y});
                }
            }
            leftPorts.sort(compare);
            rightPorts.sort(compare);
        }

        function renderPorts (ports, left) {
            if (ports.length <= 0) {
                return;
            }
            var length = ports.length,
                portVerticalOffset = SVGHeight / (length + 1),
                portNum,
                portId,
                leftOff = left ? 0 : SVGWidth - 1.5 * SysMLDecoratorConstants.PORT_WIDTH,
                topOff,
                portSVG,
                portContainer;

            for (portNum = 0; portNum < length; ++portNum) {
                portId = ports[portNum].id;
                topOff = portVerticalOffset * (portNum + 1) - SysMLDecoratorConstants.PORT_WIDTH + TOPOFFSET;
                self._portCoordinates[portId] = {
                    'x': leftOff,
                    'y': topOff,
                    'w': SysMLDecoratorConstants.PORT_WIDTH,
                    'h': SysMLDecoratorConstants.PORT_WIDTH,
                    'angle': left ? 180 : 0
                };
                portSVG = self.getPortSVG();
                portSVG.attr("transform", "translate(" + leftOff + "," + topOff + ")");
                portContainer = $(svgIcon[0]).find('.ports');

                if (portContainer.length > 0) {
                    portContainer[0].appendChild(portSVG[0]);

                    // render connector
                    var connectorE = $('<div/>', {'class': DiagramDesignerWidgetConstants.CONNECTOR_CLASS});

                    connectorE.css({
                        'top': self._portCoordinates[portId].y,
                        'left': self._portCoordinates[portId].x
                    });

                    if (self._displayConnectors) {

                        // register connectors for creating connections
                        if (self.hostDesignerItem) {
                            self.hostDesignerItem.registerConnectors(connectorE, portId);
                            self.hostDesignerItem.registerSubcomponent(portId, {"GME_ID": portId});
                        } else {
                            self.logger.error("Decorator's hostDesignerItem is not set");
                        }

                        self.skinParts.$connectorContainer.append(connectorE);
                    }
                }
            }


        }


        // delete all ports from svg icon
        svgIcon.find('.port').remove();

        // align left then right ports
        renderPorts(leftPorts, true);
        renderPorts(rightPorts, false);


    };


    /**
     * Renders the object based on the meta type.
     * @private
     */
    SysMLBlockBase.prototype._renderMetaTypeSpecificParts = function () {

    };

    /**
     * Gets the connection areas for all connectors associated with this object including ports if there is any.
     * @param id {string} GME id of the port, null if connections has to be specified for this object.
     * @param isEnd {boolean} True if id object is the end point of the connection.
     * @param connectionMetaInfo {object} Source object's meta information.
     * @returns {Array} Connection areas to/from connections can be drawn.
     */
    SysMLBlockBase.prototype.getConnectionAreas = function (id/*, isEnd, connectionMetaInfo*/) {

        if (this._portCoordinates[id]) {
            return [{
                "id": id,
                "x1": this._portCoordinates[id].x + this._portCoordinates[id].w / 2,
                "y1": this._portCoordinates[id].y + this._portCoordinates[id].h / 2,
                "x2": this._portCoordinates[id].x + this._portCoordinates[id].w / 2,
                "y2": this._portCoordinates[id].y + this._portCoordinates[id].h / 2,
                "angle1": this._portCoordinates[id].angle,
                "angle2": this._portCoordinates[id].angle,
                "len": 2
            }];
        } else {
            return [];
        }
    };

    return SysMLBlockBase;
});
