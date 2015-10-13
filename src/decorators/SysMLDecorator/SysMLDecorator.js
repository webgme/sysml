/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 *
 * Authors:
 */

"use strict";

define(['js/Decorators/DecoratorBase',
    './DiagramDesigner/SysMLDecorator.DiagramDesignerWidget',
    './PartBrowser/SysMLDecorator.PartBrowserWidget'], function (
                                                           DecoratorBase,
                                                           SysMLDecoratorDiagramDesignerWidget,
                                                           SysMLDecoratorPartBrowserWidget) {

    /**
    * A module representing a decorator for the PN Modeling Language.
    * @exports SysMLDecorator
    * @version 1.0
    */
    var SysMLDecorator,
        __parent__ = DecoratorBase,
        __parent_proto__ = DecoratorBase.prototype,
        DECORATOR_ID = "SysMLDecorator";

    /**
     * Represents a SysMLDecorator factory.
     * @constructor
     * @param {object} params Parameters for this object.
     */
    SysMLDecorator = function (params) {
        var opts = _.extend( {"loggerName": this.DECORATORID}, params);

        __parent__.apply(this, [opts]);

        this.logger.debug("SysMLDecorator ctor");
    };

    _.extend(SysMLDecorator.prototype, __parent_proto__);
    SysMLDecorator.prototype.DECORATORID = DECORATOR_ID;

    /*********************** OVERRIDE DecoratorBase MEMBERS **************************/

    /**
     * Initializes the supported widget map for this decorator.
     *
     * @see SysMLDecoratorDiagramDesignerWidget:SysMLDecoratorDiagramDesignerWidget
     * @see SysMLDecoratorPartBrowserWidget:SysMLDecoratorPartBrowserWidget
     */
    SysMLDecorator.prototype.initializeSupportedWidgetMap = function () {
        this.supportedWidgetMap = {'DiagramDesigner': SysMLDecoratorDiagramDesignerWidget,
                                   'PartBrowser': SysMLDecoratorPartBrowserWidget};
    };

    return SysMLDecorator;
});
