/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 *
 */

"use strict";

define(['js/NodePropertyNames',
        './SysMLDecorator.Constants',
        './SysML.META',
        'js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants',
        'js/Constants'], function (nodePropertyNames,
                                   SysMLDecoratorConstants,
                                   SysMLMETA,
                                   DiagramDesignerWidgetConstants,
                                   CONSTANTS) {

    /**
     * A module representing SysMLBase decorator functionality for the SysMLModelingLanguage.
     * @exports SysMLBase
     * @version 1.0
     */
    var SysMLBase;

    /**
     * Initializes a new instance of SysMLBase.
     * @constructor
     */
    SysMLBase = function () {

    };

    /**
     * Renders and updates the ports for this object.
     * @private
     */
    SysMLBase.prototype._updatePorts = function () {
        var portId,
            len = 4,
            gmeID = this._metaInfo[CONSTANTS.GME_ID],
            childSvg = this._renderChildElement ? $(this.skinParts.$svg.find('svg')[0]) : null,
            SVGWidth = childSvg ? parseInt(childSvg.attr('width')) : parseInt(this.skinParts.$svg.attr('width')),
            SVGHeight = childSvg ? parseInt(childSvg.attr('height')) : parseInt(this.skinParts.$svg.attr('height')),
            PortWidth = SysMLDecoratorConstants.PORT_WIDTH,
            SvgWidthOffset = SVGWidth >= SysMLDecoratorConstants.DEFAULT_NAME_WIDTH && !childSvg ? 0
                : parseInt((SysMLDecoratorConstants.DEFAULT_NAME_WIDTH - SVGWidth) / 2),
            SvgChildXOffset = childSvg ? (parseInt(this.skinParts.$svg.attr('width')) - parseInt(childSvg.attr('width'))) / 2
                : 0;

        if (childSvg) {
            childSvg.attr('x', SvgChildXOffset);
        }

        // reinitialize the port coordinates with an empty object
        this._connectionAreas = {};    
        this.skinParts.$connectorContainer.empty();

    	// positioning the connectors' connection areas

         // TOP
        this._connectionAreas[0] = {
            "x1": SVGWidth / 2 + SvgWidthOffset,
            "y1": 0
        };
        // BOTTOM
        this._connectionAreas[1] = {
            "x1": SVGWidth / 2 + SvgWidthOffset,
            "y1": SVGHeight
        };
        // LEFT
        this._connectionAreas[2] = {
            "x1": SvgWidthOffset,
            "y1": SVGHeight / 2
        };
        // RIGHT
        this._connectionAreas[3] = {
            "x1": SVGWidth + SvgWidthOffset,
            "y1": SVGHeight / 2
        };

        while(len--) {
            
            portId = 3 - len;
            // render connector
            var connectorE = $('<div/>', {'class': DiagramDesignerWidgetConstants.CONNECTOR_CLASS});

            if (portId === 3) {
                connectorE.addClass(SysMLDecoratorConstants.RIGHT_PORT_CLASS);
            } else if (portId === 2) {
                connectorE.addClass(SysMLDecoratorConstants.LEFT_PORT_CLASS);
            } else if (portId === 1 || portId === 4 || portId === 5) {
                connectorE.addClass(SysMLDecoratorConstants.BOTTOM_PORT_CLASS);
            } else {
                connectorE.addClass(SysMLDecoratorConstants.TOP_PORT_CLASS);
            }

            connectorE.css({
                    'top': this._connectionAreas[portId].y1 - PortWidth,
                    'left': this._connectionAreas[portId].x1 - PortWidth
                });

            if (this._displayConnectors) {

                // register connectors for creating connections
                if (this.hostDesignerItem) {
                    this.hostDesignerItem.registerConnectors(connectorE);
                } else {
                    this.logger.error("Decorator's hostDesignerItem is not set");
                }

                this.skinParts.$connectorContainer.append(connectorE);
            }
        }
    };

    /**
     * Renders the object based on the meta type.
     * @private
     */
    SysMLBase.prototype._renderMetaTypeSpecificParts = function () {

    };

    /**
     * Gets the connection areas for all connectors associated with this object including ports if there is any.
     * @param id {string} GME id of the port, null if connections has to be specified for this object.
     * @param isEnd {boolean} True if id object is the end point of the connection.
     * @param connectionMetaInfo {object} Source object's meta information.
     * @returns {Array} Connection areas to/from connections can be drawn.
     */
    SysMLBase.prototype.getConnectionAreas = function (id/*, isEnd, connectionMetaInfo*/) {

    	var result = [],
            LEN = 10, // length of stem that can stick out of the connector before connections can turn 
            ANGLES = [270, 90, 180, 0], // L, R, T, B
            gmeID = this._metaInfo[CONSTANTS.GME_ID],
            META_TYPES = SysMLMETA.getMetaTypes();

        //by default return the bounding box edges midpoints

        if (id === undefined || id === this.hostDesignerItem.id) {
            
            for (var i = 0; i < ANGLES.length; i++) {

                result.push( {"id": i,
                    "x1": this._connectionAreas[i].x1, // x's and y's determine the lines where connections can be drawn on
                    "y1": this._connectionAreas[i].y1,
                    "x2": this._connectionAreas[i].x1,
                    "y2": this._connectionAreas[i].y1,
                    "angle1": ANGLES[i], // angles determine from which direction between two angles connections can be drawn
                    "angle2": ANGLES[i],
                    "len": LEN} );
            } 
            
        }
        
        return result;
    };

    return SysMLBase;
});
