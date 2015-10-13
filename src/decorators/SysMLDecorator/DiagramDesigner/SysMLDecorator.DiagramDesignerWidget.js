/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 *
 * Authors:
 */

"use strict";

define(['js/Constants',
    'js/NodePropertyNames',
    '../Core/SysML.META',
    'js/Widgets/DiagramDesigner/DiagramDesignerWidget.DecoratorBase',
    '../Core/SysMLDecorator.Core.js',
    '../Core/SysMLDecorator.Constants',
    'js/Widgets/DiagramDesigner/DiagramDesignerWidget.Constants',
    'css!./SysMLDecorator.DiagramDesignerWidget'], function (CONSTANTS,
                                                       nodePropertyNames,
                                                       SysMLMETA,
                                                       DiagramDesignerWidgetDecoratorBase,
                                                       SysMLDecoratorCore,
                                                       SysMLDecoratorConstants,
                                                       DiagramDesignerWidgetConstants) {
    /**
    * A module representing DiagramDesignerWidget specific functionality for the SysMLModelingLanguage.
    * @exports SysMLDecoratorDiagramDesignerWidget
    * @version 1.0
    */
    var SysMLDecoratorDiagramDesignerWidget,
        DECORATOR_ID = "SysMLDecoratorDiagramDesignerWidget";

    /**
     * Initializes a new instance of SysMLDecoratorDiagramDesignerWidget
     * @param options {object} options for initialization
     * @constructor
     */
    SysMLDecoratorDiagramDesignerWidget = function (options) {
        var opts = _.extend( {}, options);

        DiagramDesignerWidgetDecoratorBase.apply(this, [opts]);

        // this widget supports connectors and connections
        this._initializeDecorator({"connectors": true});

        this.logger.debug("SysMLDecoratorDiagramDesignerWidget ctor");
    };

    _.extend(SysMLDecoratorDiagramDesignerWidget.prototype, DiagramDesignerWidgetDecoratorBase.prototype);
    _.extend(SysMLDecoratorDiagramDesignerWidget.prototype, SysMLDecoratorCore.prototype);

    SysMLDecoratorDiagramDesignerWidget.prototype.DECORATORID = DECORATOR_ID;

    /*********************** OVERRIDE DECORATORBASE MEMBERS **************************/

    /**
     * Called when a new element is added to the widget
     */
    SysMLDecoratorDiagramDesignerWidget.prototype.on_addTo = function () {
        var self = this;

        this._hideName = false;
        this._renderContent();

        if (this._metaType === SysMLMETA.TYPE_INFO.isSysMLMetaLanguage(this._gmeID) &&
            (SysMLMETA.getMETATypesOf(this._gmeID)[0] !== this._gmeID)) {

            this.$name.remove();
        } else {
            // set name editable on double-click
            if (this.$name) {
                this.$name.on("dblclick.editOnDblClick", null, function (event) {
                    if (self.hostDesignerItem.canvas.getIsReadOnlyMode() !== true) {
                        self.hostDesignerItem.canvas.selectNone();
                        $(this).editInPlace({"class": "",
                            "onChange": function (oldValue, newValue) {
                                self._onNodeTitleChanged(oldValue, newValue);
                            }});
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });
            }
        }
    };

    /**
     * Shows all source connectors.
     * @param params {String[]} Registered connector IDs to show.
     */
    SysMLDecoratorDiagramDesignerWidget.prototype.showSourceConnectors = function (params) {
        this.logger.debug('showSourceConnectors: ' + JSON.stringify(params));
        this.$sourceConnectors.show();
    };

    /**
     * Hides the source 'connectors' - detaches them from the DOM
     */
    SysMLDecoratorDiagramDesignerWidget.prototype.hideSourceConnectors = function () {
        this.$sourceConnectors.hide();
    };

    /**
     * Shows all end (destination) connectors.
     * @param params {String[]} Registered connector IDs to show.
     */
    SysMLDecoratorDiagramDesignerWidget.prototype.showEndConnectors = function (params) {
        this.logger.debug('showEndConnectors: ' + JSON.stringify(params));

        // TODO: elements from same SysML domain could be connected
        this.$endConnectors.show();
    };

    /**
     * Hides the end (destination) 'connectors' - detaches them from the DOM
     */
    SysMLDecoratorDiagramDesignerWidget.prototype.hideEndConnectors = function () {
        this.$endConnectors.hide();
    };

    /**
     * Initializes all connectors then hides them.
     */
    SysMLDecoratorDiagramDesignerWidget.prototype.initializeConnectors = function () {

        //find connectors
        this.$sourceConnectors = this.$el.find('.' + DiagramDesignerWidgetConstants.CONNECTOR_CLASS);
        this.$endConnectors = this.$el.find('.' + DiagramDesignerWidgetConstants.CONNECTOR_CLASS);

        // hide all connectors by default
        this.hideSourceConnectors();
        this.hideEndConnectors();
    };


    /**** Override from ModelDecoratorCore ****/
    SysMLDecoratorDiagramDesignerWidget.prototype._registerForNotification = function(portId) {
        var partId = this._metaInfo[CONSTANTS.GME_ID];

        this._control.registerComponentIDForPartID(portId, partId);
    };


    /**** Override from ModelDecoratorCore ****/
    SysMLDecoratorDiagramDesignerWidget.prototype._unregisterForNotification = function(portId) {
        var partId = this._metaInfo[CONSTANTS.GME_ID];

        this._control.unregisterComponentIDFromPartID(portId, partId);
    };

    SysMLDecoratorDiagramDesignerWidget.prototype.notifyComponentEvent = function (componentList) {
        this.update();
    };

    return SysMLDecoratorDiagramDesignerWidget;
});
