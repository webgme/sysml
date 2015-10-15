/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 *
 * Authors:
 */

"use strict";

define(['js/Constants',
    'js/NodePropertyNames',
    'js/Widgets/PartBrowser/PartBrowserWidget.DecoratorBase',
    '../Core/SysMLDecorator.Core.js',
    'css!./SysMLDecorator.PartBrowserWidget'], function (CONSTANTS,
                                                       nodePropertyNames,
                                                       PartBrowserWidgetDecoratorBase,
                                                       SysMLDecoratorCore) {

    /**
     * A module representing PartBrowserWidget specific functionality for the SysMLModelingLanguage.
     * @exports SysMLDecoratorPartBrowserWidget
     * @version 1.0
     */
    var SysMLDecoratorPartBrowserWidget,
        DECORATOR_ID = "SysMLDecoratorPartBrowserWidget";

    /**
     * Initializes a new instance of SysMLDecoratorPartBrowserWidget
     * @param options {object} options for initialization
     * @constructor
     */
    SysMLDecoratorPartBrowserWidget = function (options) {
        var opts = _.extend( {}, options);

        PartBrowserWidgetDecoratorBase.apply(this, [opts]);

        // Part browser widget does not support creating connections therefore do not render connectors
        this._initializeDecorator({"connectors": false});

        this.logger.debug("SysMLDecoratorPartBrowserWidget ctor");
    };


    /************************ INHERITANCE *********************/
    _.extend(SysMLDecoratorPartBrowserWidget.prototype, PartBrowserWidgetDecoratorBase.prototype);
    _.extend(SysMLDecoratorPartBrowserWidget.prototype, SysMLDecoratorCore.prototype);


    /**************** OVERRIDE INHERITED / EXTEND ****************/

    /**** Override from PartBrowserWidgetDecoratorBase ****/
    SysMLDecoratorPartBrowserWidget.prototype.DECORATORID = DECORATOR_ID;

    /**
     * Called before appending the element to the part browser. Renders content for the part browser.
     */
    SysMLDecoratorPartBrowserWidget.prototype.beforeAppend = function () {
        this.$el = this.$DOMBase.clone();

        this._renderContent();
    };


    /**
     * Called after element is appended to the part browser. Currently this method does nothing.
     */
    SysMLDecoratorPartBrowserWidget.prototype.afterAppend = function () {

    };


    /**** Override from ModelDecoratorCore ****/
    SysMLDecoratorPartBrowserWidget.prototype._registerForNotification = function(portId) {
        var partId = this._metaInfo[CONSTANTS.GME_ID];

        this._control.registerComponentIDForPartID(portId, partId);
    };


    /**** Override from ModelDecoratorCore ****/
    SysMLDecoratorPartBrowserWidget.prototype._unregisterForNotification = function(portId) {
        var partId = this._metaInfo[CONSTANTS.GME_ID];

        this._control.unregisterComponentIDFromPartID(portId, partId);
    };

    return SysMLDecoratorPartBrowserWidget;
});