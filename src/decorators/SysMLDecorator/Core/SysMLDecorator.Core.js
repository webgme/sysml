/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 * 
 */

"use strict";

define(['js/Constants',
    'js/NodePropertyNames',
    'js/RegistryKeys',
    './SysMLBase',
    './SysMLBlockBase',
    './SysML.META',
    './SysMLDecorator.Constants',
    'js/Decorators/DecoratorWithPorts.Base',
    'text!./SysMLDecorator.html',
    'text!../default.svg'], function (CONSTANTS,
                                      nodePropertyNames,
                                      REGISTRY_KEYS,
                                      SysMLBase,
                                      SysMLBlockBase,
                                      SysMLMETA,
                                      SysMLDecoratorConstants,
                                      DecoratorWithPortsBase,
                                      SysMLDecoratorTemplate,
                                      DefaultSvgTemplate) {

    /**
    * A module representing core decorator functionality for the SysMLModelingLanguage.
    * @exports SysMLDecoratorCore
    * @version 1.0
    */
    var SysMLDecoratorCore,
        SVG_ICON_PATH = "/decorators/SysMLDecorator/Icons/";

    /**
     * Contains downloaded svg elements from the server.
     * @type {{}}
     * @private
     */
    var svgCache = {};

    /**
     * Svg element that can be used as a placeholder for the icon if the icon does not exist on the server.
     * @type {*|jQuery|HTMLElement}
     * @private
     */
    var errorSVGBase = $(DefaultSvgTemplate);

    /**
     * Creates a new instance of SysMLDecoratorCore.
     * @constructor
     */
    SysMLDecoratorCore = function () {
    };


    _.extend(SysMLDecoratorCore.prototype, DecoratorWithPortsBase.prototype);

    /**
     * Represents the base element that would be inserted into the DOM.
     */
    SysMLDecoratorCore.prototype.$DOMBase = (function () {
        var el = $(SysMLDecoratorTemplate);
        //use the same HTML template as the DefaultDecorator.DiagramDesignerWidget
        //but remove the connector DOM elements since they are not needed in the PartBrowser
        //el.find('div.name').remove();
        return el;
    })();

    /**** Override from *.WidgetDecoratorBase ****/
	SysMLDecoratorCore.prototype.getTerritoryQuery = function () {
        var territoryRule = {};

        territoryRule[this._metaInfo[CONSTANTS.GME_ID]] = { "children": 1 };

        return territoryRule;
    };

    /**
     * Initializes decorator.
     * @param params {object}  parameters for initialization
     * @param params.connectors {boolean} True if connectors have to be rendered otherwise false.
     * @private
     */
    SysMLDecoratorCore.prototype._initializeDecorator = function (params) {
        this.portIDs = [];
        this.$name = undefined;
        this.portIDs = [];
        this.ports = {};

        this._displayConnectors = false;
        if (params && params.connectors) {
            this._displayConnectors = params.connectors;
        }

        if(Object.keys(svgCache || {}).length === 0){
            var _metaAspectTypes = SysMLMETA.getMetaTypes();

            for (var m in _metaAspectTypes) {

                if (_metaAspectTypes.hasOwnProperty(m)) {

                    // get the svg's url on the server for this META type
                    var svg_resource_url = SVG_ICON_PATH + m + ".svg";

                    // get the svg from the server in SYNC mode, may take some time
                    $.ajax(svg_resource_url, {'async': false})
                        .done(function (data) {

                            // TODO: console.debug('Successfully downloaded: ' + svg_resource_url + ' for ' + metaType);
                            // downloaded successfully
                            // cache the downloaded content
                            svgCache[m] = $(data.childNodes[0]);
                        })
                        .fail(function () {

                            // download failed for this type
                            // TODO: console.warning('Failed to download: ' + svg_resource_url);
                        });
                }
            }
        }
    };

    /**
     * Downloads and caches the svg files for a given METAType based on a gmeID
     * @param gmeID {string} An ID of the GME object.
     * @returns {*|jQuery|HTMLElement} SVG element that should be displayed.
     */
    SysMLDecoratorCore.prototype.getSVGByMetaType = function (gmeID) {

        // define local variables
        var SysMLClassNames,
            SysMLClassName,
            returnSVG,
            len;

        // get all META types for the given GME object including inheritance in the meta model
        SysMLClassNames = SysMLMETA.getMetaTypesOf(gmeID);

        // reverse the list since the iteration is backwards in the while loop
        SysMLClassNames.reverse();

        // length of the list on which the iteration is performed
        len = SysMLClassNames.length;

        // iterate through the list from the last element to the first one
        while (len--) {
            // get current the META type name
            SysMLClassName = SysMLClassNames[len];

            if (SysMLClassName === undefined || SysMLClassName === null || SysMLClassName === "") {

                // if the META type name is invalid return with an error SVG
                returnSVG = errorSVGBase.clone();

            } else {

                // META type name is valid
                if (svgCache[SysMLClassName]) {

                    returnSVG = svgCache[SysMLClassName].clone();
                }
            }
        }

        if (returnSVG === undefined) {

            // if svg is not defined use the default error svg
            returnSVG = errorSVGBase.clone();
        }

        return returnSVG;
    };

    /**
     * Gets a clone of an error svg icon.
     * @returns {*|jQuery|HTMLElement} Error svg icon.
     */
    SysMLDecoratorCore.prototype.getErrorSVG = function () {

        return this._errorSVGBase.clone();
    };

    /**
     * @todo Not implemented yet.
     * @param searchDesc {string} Search description or query.
     * @returns {boolean} True if this object satisfies the search condition.
     */
    SysMLDecoratorCore.prototype.doSearch = function (searchDesc) {

        //TODO: correct implementation needed
        return false;
    };

    /**
     * Renders the content in the placeholder DOM element.
     * @private
     */
    SysMLDecoratorCore.prototype._renderContent = function () {

        // gme id of the rendered object
        var gmeID = this._metaInfo[CONSTANTS.GME_ID],
            client = this._control._client,
            isDiagram = SysMLMETA.TYPE_INFO.isDiagram(gmeID),
            isMetaLanguage = SysMLMETA.TYPE_INFO.isSysMLMetaLanguage(gmeID),
            isPackage = SysMLMETA.TYPE_INFO.isPackage(gmeID),
            isTypeSubject = SysMLMETA.TYPE_INFO.isSubject(gmeID),
            isTypeWithPorts = SysMLMETA.TYPE_INFO.isBlock(gmeID);

        // meta type of the rendered object
        this._metaType = SysMLMETA.getMetaTypesOf(gmeID)[0];

        if (DEBUG) {

            //render GME-ID in the DOM, for debugging
            this.$el.attr({"data-id": gmeID});
        }

        // setting the name of component
        this.skinParts.$name = this.$el.find('.name');

        
        //empty out SVG container
        this.$el.find('.svg-container').empty();

        //figure out the necessary SVG based on children type
        this.skinParts.$svg = this.getSVGByMetaType(gmeID);

        if (this.skinParts.$svg) {

            //this.skinParts.$svg.append(this._SysMLDecoratorCore.getPortSVG());
            this.$el.find('.svg-container').append(this.skinParts.$svg);

            //render the connectors
            this.skinParts.$connectorContainer = this.$el.find('.connector-container');
            this.skinParts.$connectorContainer.empty();

        } else {

            // append error svg if the svg does not exist for this element
            this.$el.find('.svg-container').append(this.getErrorSVG());
        }

        var nodeObj,
            parentID;
        if (isTypeSubject) {
                nodeObj = client.getNode(gmeID);
                parentID = nodeObj ? nodeObj.getParentId() : '';
                var isParentUseCaseDiagram = parentID ? SysMLMETA.TYPE_INFO.isUseCaseDiagram(parentID) : false;

            if (parentID && isParentUseCaseDiagram) {
                var childrenIDs = nodeObj ? nodeObj.getChildrenIds() : [],
                    i,
                    useCaseSVG = svgCache['UseCase'] ? svgCache['UseCase'].clone() : errorSVGBase.clone();
                for (i = 0; i < childrenIDs.length; ++i) {
                    this.skinParts.$svg.append(useCaseSVG);
                    this._renderChildElement = true;
                }
            }
        }

        if (!isMetaLanguage && !isDiagram && !isPackage) {
            var isParentParametricDiagram;
            if (isTypeWithPorts) {
                nodeObj = client.getNode(gmeID);
                parentID = nodeObj ? nodeObj.getParentId() : '';
                isParentParametricDiagram = parentID ? SysMLMETA.TYPE_INFO.isParametricDiagram(parentID) : false;

            }

            if (isParentParametricDiagram) {
                _.extend(this, new SysMLBlockBase());
            }
            else {
                _.extend(this, new SysMLBase());
            }
        }

        // call the type specific renderer
        this._renderMetaTypeSpecificParts();

        // update the rendered object
        this.update();
    };


    /**
     * Updates the rendered object. This function is called by the Widget.
     */
    SysMLDecoratorCore.prototype.update = function () {

        // internal update function
        this._update();

        if (this._displayConnectors) {

            // initializes the connectors if they have to be displayed.
            this.initializeConnectors();
        }
    };

    /**
     * Updates the rendered object.
     * @private
     */
    SysMLDecoratorCore.prototype._update = function () {

        // update name of the rendered object
        this._updateName();
        this._updatePorts();
    };

    /**
     * Updates the name of the rendered object.
     * @private
     */
    SysMLDecoratorCore.prototype._updateName = function () {

        // initialize local variables
        var control = this._control,
            gmeID = this._metaInfo[CONSTANTS.GME_ID],
            name = (control._client.getNode(gmeID)).getAttribute(nodePropertyNames.Attributes.name),
            isTypeRequirement = SysMLMETA.TYPE_INFO.isRequirement(gmeID),
            isTypeConstraintBlock = SysMLMETA.TYPE_INFO.isConstraintBlock(gmeID),
            isTypeValue = SysMLMETA.TYPE_INFO.isValue(gmeID),
            isTypeProperty = SysMLMETA.TYPE_INFO.isProperty(gmeID),
            isTypeParameter = SysMLMETA.TYPE_INFO.isParameter(gmeID),
            isTypeConstraintParameter = SysMLMETA.TYPE_INFO.isConstraintParameter(gmeID),
            isSpecialBlock = isTypeRequirement || isTypeConstraintBlock || isTypeValue || isTypeProperty
                || isTypeParameter || isTypeConstraintParameter;

        /************************************ Requirement & Parametric Diagram **************************************/
        if (this.skinParts.$name) {
            this.skinParts.$name.text(name);
            // from displayConnectors value, we can distinguish part browser from diagram widget
            if (isSpecialBlock) {
                if (this._displayConnectors) {

                    // is type requirement or constraint block, move up name div
                    this.skinParts.$name.css('position', 'absolute');
                    this.skinParts.$name.css('top', SysMLDecoratorConstants.NAME_DIV_TOP);
                } else {
                    var SvgHeight = parseInt(this.skinParts.$svg.attr('height'));
                    this.skinParts.$name.css('position', 'relative');
                    this.skinParts.$name.css('top', SysMLDecoratorConstants.NAME_DIV_TOP - SvgHeight);

                }
            }
        }

        if (this.skinParts.$svg && (isTypeRequirement || isTypeConstraintBlock)) {
            var texts = this.skinParts.$svg.find('text');

            if (isTypeRequirement) {
                var id = control._client.getNode(gmeID).getAttribute(SysMLDecoratorConstants.REQ_ATTRIBUTE_ID),
                    text = control._client.getNode(gmeID).getAttribute(SysMLDecoratorConstants.REQ_ATTRIBUTE_TEXT);

                texts[1].textContent = id ? 'id: ' + id : '';
                texts[2].textContent = text ? 'text: ' + text : '';
            } else {
                var nodeObj = control._client.getNode(gmeID),
                    parentID = nodeObj ? nodeObj.getParentId() : '',
                    isParentParametricDiagram = parentID ? SysMLMETA.TYPE_INFO.isParametricDiagram(parentID) : false;
                if (isParentParametricDiagram) {
                    var eq = control._client.getNode(gmeID).getAttribute(SysMLDecoratorConstants.PAR_ATTRIBUTE_EQUATION);
                    texts[1].textContent = eq ? '{' + eq + '}' : '';
                }
            }
        }
        /************************************ Requirement & Parametric Diagram **************************************/

    };

    /* TO BE OVERRIDDEN IN META TYPE SPECIFIC CODE */

    /**
     * Renders and updates the ports for this object.
     * @private
     */
    SysMLDecoratorCore.prototype._updatePorts = function () {

    };

    /**
     * Renders the object based on the meta type.
     * @private
     */
    SysMLDecoratorCore.prototype._renderMetaTypeSpecificParts = function () {

    };

    /**
     * Registers a GME ID for notifications.
     * @param portId {string} GME ID for getting notification about this object.
     * @private
     */
    SysMLDecoratorCore.prototype._registerForNotification = function (portId) {

    };

    /**
     * Unregisters a GME ID from the event notifications.
     * @param portId {string} GME ID for getting notification about this object.
     * @private
     */
    SysMLDecoratorCore.prototype._unregisterForNotification = function (portId) {

    };


    return SysMLDecoratorCore;
});
