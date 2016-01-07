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
            nodeObj = client.getNode(gmeID),
            parentID = nodeObj ? nodeObj.getParentId() : '',
            isDiagram = SysMLMETA.TYPE_INFO.isDiagram(gmeID),
            isMetaLanguage = SysMLMETA.TYPE_INFO.isSysMLMetaLanguage(gmeID),
            isPackage = SysMLMETA.TYPE_INFO.isPackage(gmeID),
            isTypeSubject = SysMLMETA.TYPE_INFO.isSubject(gmeID),
            isTypeWithPorts = SysMLMETA.TYPE_INFO.isBlock(gmeID) || SysMLMETA.TYPE_INFO.isConstraintBlock(gmeID);

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

        // remove extra compartments when Block or ConstraintBlock is inside IBD or PD
        if (isTypeWithPorts) {
            this._updateSVG(parentID);
        }

        if (this.skinParts.$svg) {
            this.$el.find('.svg-container').append(this.skinParts.$svg);

            //render the connectors
            this.skinParts.$connectorContainer = this.$el.find('.connector-container');
            this.skinParts.$connectorContainer.empty();

        } else {
            // append error svg if the svg does not exist for this element
            this.$el.find('.svg-container').append(this.getErrorSVG());
        }

        // domain-specific component rendering

        /** Use case diagram special type: Subject, which can contain UseCase **/
        if (isTypeSubject) {
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

        // only Block and ConstraintBlock in PD and IBD need to be extended from BlockBase
        if (!isMetaLanguage && !isDiagram && !isPackage) {
            if (isTypeWithPorts && (SysMLMETA.TYPE_INFO.isParametricDiagram(parentID)
                    || SysMLMETA.TYPE_INFO.isInternalBlockDiagram(parentID))) {
                _.extend(this, new SysMLBlockBase());
            } else {
                _.extend(this, new SysMLBase());
            }
        }

        // call the type specific renderer
        this._renderMetaTypeSpecificParts();

        // update the rendered object
        this.update();
    };

    SysMLDecoratorCore.prototype._updateSVG = function (parentID) {
        var alterDecorator = parentID ? SysMLMETA.TYPE_INFO.isParametricDiagram(parentID)
                    || SysMLMETA.TYPE_INFO.isInternalBlockDiagram(parentID): false;

        if (alterDecorator) {
            this.skinParts.$svg.find('.extra').remove();
            this.skinParts.$svg.attr('height', SysMLDecoratorConstants.DEFAULT_BLOCK_HEIGHT);
            this.skinParts.$svg.find('rect')[0].setAttribute('height', SysMLDecoratorConstants.DEFAULT_BLOCK_HEIGHT - 10);
        }
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
            nodeObj =control._client.getNode(gmeID),
            name = nodeObj.getAttribute(nodePropertyNames.Attributes.name),
            parentID = nodeObj ? nodeObj.getParentId() : '',
            childrenIDs = nodeObj ? nodeObj.getChildrenIds() : [],
            isTypeRequirement = SysMLMETA.TYPE_INFO.isRequirement(gmeID),
            isTypeConstraintBlock = SysMLMETA.TYPE_INFO.isConstraintBlock(gmeID),
            isTypeValue = SysMLMETA.TYPE_INFO.isValue(gmeID),
            isTypeProperty = SysMLMETA.TYPE_INFO.isProperty(gmeID),
            isTypeConstraintParameter = SysMLMETA.TYPE_INFO.isConstraintParameter(gmeID),
            isTypeBlock = SysMLMETA.TYPE_INFO.isBlock(gmeID),
            isTypeUnit = SysMLMETA.TYPE_INFO.isUnit(gmeID),
            isTypeOperation = SysMLMETA.TYPE_INFO.isOperation(gmeID),
            isTypeSignal = SysMLMETA.TYPE_INFO.isSignal(gmeID),
            isTypeValueType = SysMLMETA.TYPE_INFO.isValueType(gmeID),
            isTypeEnumerationLiteral = SysMLMETA.TYPE_INFO.isEnumerationLiteral(gmeID),
            isTypeDimension = SysMLMETA.TYPE_INFO.isDimension(gmeID),
            isTypePrimitive = SysMLMETA.TYPE_INFO.isPrimitiveType(gmeID),
            isTypeData = SysMLMETA.TYPE_INFO.isDataType(gmeID),
            isTypeFlow = SysMLMETA.TYPE_INFO.isFlowPort(gmeID),
            isTypeFlowIn = SysMLMETA.TYPE_INFO.isFlowPortIn(gmeID),
            isTypeFlowOut = SysMLMETA.TYPE_INFO.isFlowPortOut(gmeID),
            isTypeFlowInOut = SysMLMETA.TYPE_INFO.isFlowPortInOut(gmeID),
            isTypeEnumeration = SysMLMETA.TYPE_INFO.isEnumeration(gmeID),
            isSpecialBlock = isTypeRequirement || isTypeValue || isTypeProperty
                || isTypeConstraintParameter|| isTypeConstraintBlock
                || isTypeBlock || isTypeOperation || isTypeValueType || isTypeUnit || isTypeSignal
                || isTypeEnumerationLiteral || isTypeDimension || isTypePrimitive || isTypeData
                || isTypeEnumeration ||isTypeFlow || isTypeFlowOut || isTypeFlowIn || isTypeFlowInOut,

            isParentBlockDiagram = parentID ? SysMLMETA.TYPE_INFO.isBlockDefinitionDiagram(parentID): false,
            SvgHeight = parseInt(this.skinParts.$svg.attr('height')),
            texts;

        if (!this.skinParts.$svg) return;

        /************************************ update svg's name section **************************************/
        if (this.skinParts.$name) {
            this.skinParts.$name.text(name);
            // from displayConnectors value, we can distinguish part browser from diagram widget
            if (isSpecialBlock) {
                if (this._displayConnectors) {
                    // is type requirement or constraint block, move up name div
                    this.skinParts.$name.css('position', 'absolute');
                    this.skinParts.$name.css('top', SysMLDecoratorConstants.NAME_DIV_TOP);
                } else {
                    this.skinParts.$name.css('position', 'relative');
                    this.skinParts.$name.css('top', SysMLDecoratorConstants.NAME_DIV_TOP - SvgHeight);
                }
            }
        }

        /*************************** update requirement compartment ******************************/
        if (isTypeRequirement) {
            texts = this.skinParts.$svg.find('text');
            var id = nodeObj.getAttribute(SysMLDecoratorConstants.REQ_ATTRIBUTE_ID),
                text = nodeObj.getAttribute(SysMLDecoratorConstants.REQ_ATTRIBUTE_TEXT),
                textContent = text ? 'text: ' + text : '',
                textheight = parseInt($(this.skinParts.$svg.find("#svg_11")[0]).attr('y')) + SysMLDecoratorConstants.CHANGE_HEIGHT,
                t,
                endIndex,
                x = 6.983763,
                newText,
                charPerLine = SysMLDecoratorConstants.CHAR_PER_LINE;

            texts[1].textContent = id ? 'id: ' + id : '';

            for (var i = 0; i < textContent.length / charPerLine; ++i) {
                endIndex = (i + 1) * charPerLine > textContent.length ? textContent.length : (i + 1) * charPerLine;
                t = textContent.substring(i * charPerLine, endIndex);

                if (endIndex < textContent.length) {
                    if (/[^0-9a-bA-B]/gi.test(textContent[endIndex])) {
                        t += '-';
                    }
                }

                newText = this._createNewTextElement(textheight, x, t);
                $(this.skinParts.$svg[0]).find('.text')[0].appendChild(newText);
                textheight += SysMLDecoratorConstants.CHANGE_HEIGHT;
            }
            if (textheight > SvgHeight) {
                this.skinParts.$svg.attr({height: textheight + SysMLDecoratorConstants.CHANGE_HEIGHT});
                $(this.skinParts.$svg.find('#svg_3')[0]).attr({height: textheight + SysMLDecoratorConstants.CHANGE_HEIGHT - 2});
            }
        } else if (isParentBlockDiagram) {
            this._updateSVGCompartments(gmeID, childrenIDs)
        }
    };

    SysMLDecoratorCore.prototype._createNewTextElement = function (newtextheight, x, name) {
        var newtext = document.createElementNS("http://www.w3.org/2000/svg","text");

        newtext.setAttributeNS(null,"x",x);
        newtext.setAttributeNS(null,"y",newtextheight);
        newtext.setAttributeNS(null,"font-size",9);
        newtext.textContent = name || '';
        newtext.setAttributeNS(null,"font-family",'Trebuchet MS');
        return newtext;
    };


    SysMLDecoratorCore.prototype._updateSVGCompartments = function (gmeID, childrenIDs) {
        var self = this,
            client = self._control._client,
            ChId,
            i,
            name,
            svgIcon = this.skinParts.$svg,
            isTypeValueType = SysMLMETA.TYPE_INFO.isValueType(gmeID),
            isTypeBlock = SysMLMETA.TYPE_INFO.isBlock(gmeID),
            isTypeConstraintBlock = SysMLMETA.TYPE_INFO.isConstraintBlock(gmeID),
            isTypeData = SysMLMETA.TYPE_INFO.isDataType(gmeID),
            isTypeEnumeration = SysMLMETA.TYPE_INFO.isEnumeration(gmeID),
            isTypeWithCompartments = isTypeBlock || isTypeConstraintBlock || isTypeValueType || isTypeData || isTypeEnumeration,
            propertynum = 0,
            operationnum = 0,
            constraintnum = 0,
            props = [],
            ops = [],
            constraints = [],
            isAProperty,
            isAOpreation,
            isEnumerationLiteral,
            isATypeFlow,
            isATypeFlowIn,
            isATypeFlowOut,
            isaTypeFlowInOut,
            isConstraintParam,
            isAPropertyType,
            isAConstraint,
            textheight,
            newtextheight,
            x,
            newText,
            BLOCK_HEIGHT_INCREASE = SysMLDecoratorConstants.CHANGE_HEIGHT,
            MIN_BLOCK_HEIGHT,
            MIN_SVG_HEIGHT,
            high,
            highsvg,
            linehigh,
            linehigh2,
            text,
            b;

        if (!isTypeWithCompartments) return;

        // add texts to compartments
        for (i = 0; i < childrenIDs.length; i++) {
            ChId = childrenIDs[i];
            name = client.getNode(ChId).getAttribute(nodePropertyNames.Attributes.name);
            isAProperty = SysMLMETA.TYPE_INFO.isProperty(ChId);
            isEnumerationLiteral = SysMLMETA.TYPE_INFO.isEnumerationLiteral(ChId);
            isATypeFlow = SysMLMETA.TYPE_INFO.isFlowPort(ChId);
            isATypeFlowIn = SysMLMETA.TYPE_INFO.isFlowPortIn(ChId);
            isATypeFlowOut = SysMLMETA.TYPE_INFO.isFlowPortOut(ChId);
            isaTypeFlowInOut = SysMLMETA.TYPE_INFO.isFlowPortInOut(ChId);
            isConstraintParam = SysMLMETA.TYPE_INFO.isConstraintParameter(ChId);
            isAOpreation = SysMLMETA.TYPE_INFO.isOperation(ChId);
            isAConstraint = SysMLMETA.TYPE_INFO.isConstraint(ChId);
            isAPropertyType = isAProperty || isATypeFlow || isATypeFlowOut || isATypeFlowIn
                || isaTypeFlowInOut || isEnumerationLiteral || isConstraintParam;

            if (isAPropertyType) {
                propertynum += 1;
                props.push(name);
            } else if (isAOpreation) {
                operationnum += 1;
                ops.push(name);
            } else if (isAConstraint) {
                constraintnum += 1;
                constraints.push(name);
            }
        }

        // resize SVG to fit texts
        if (isTypeData || isTypeEnumeration) {
            MIN_BLOCK_HEIGHT = 96.000008;
            MIN_SVG_HEIGHT = 100;
            high = MIN_BLOCK_HEIGHT;
            highsvg = MIN_SVG_HEIGHT;
            if (propertynum > 2) {
                high = high + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg = highsvg + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
            }
            $(svgIcon.find("#datasvg_1")[0]).attr({height: high});
            this.skinParts.$svg.attr('height', highsvg);

        } else if (isTypeValueType) {
            MIN_BLOCK_HEIGHT = 183.000004;
            MIN_SVG_HEIGHT = 190;
            high = MIN_BLOCK_HEIGHT;
            highsvg = MIN_SVG_HEIGHT;
            linehigh = 110.75;
            text = 123;

            if (propertynum > 2) {
                high = MIN_BLOCK_HEIGHT + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg = MIN_SVG_HEIGHT + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                linehigh = linehigh + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                b = text + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
            }

            if (operationnum > 2) {
                high = high + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg = highsvg + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
            }
            $(svgIcon.find("#valsvg_3")[0]).attr({y2: linehigh, y1: linehigh});
            $(svgIcon.find("#valsvg_8")[0]).attr({y: b});
            $(svgIcon.find("#valsvg_1")[0]).attr({height: high});
            this.skinParts.$svg.attr('height', highsvg);
        } else if (isTypeBlock) {
            MIN_BLOCK_HEIGHT = 205;
            MIN_SVG_HEIGHT = parseInt(this.skinParts.$svg.attr('height'));
            high = MIN_BLOCK_HEIGHT;
            highsvg = MIN_SVG_HEIGHT;
            linehigh = 91.246378;
            linehigh2 = 148.123188;
            var text2 = 101.560661;
            var text3 = 159.560661;
            var e = 167.23337;
            d = 10;

            if (propertynum > 2) {
                high = MIN_BLOCK_HEIGHT + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg = MIN_SVG_HEIGHT + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                linehigh = linehigh + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                linehigh2 = linehigh2 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                b = text2 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                var c = text3 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                var d = 0;
                var f = e + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
            }

            if (operationnum > 2) {
                high = high + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg = highsvg + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
                linehigh2 = linehigh2 + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
                c = text3 + (operationnum - 1) * BLOCK_HEIGHT_INCREASE + (propertynum - 1) * BLOCK_HEIGHT_INCREASE - d;
                f = f + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
            }

            if (constraintnum > 2) {
                high = high + (constraintnum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg = highsvg + (constraintnum - 1) * BLOCK_HEIGHT_INCREASE;
            }

            $(svgIcon.find("#blksvg_7")[0]).attr({y2: linehigh, y1: linehigh});
            $(svgIcon.find("#blksvg_9")[0]).attr({y2: linehigh2, y1: linehigh2});
            $(svgIcon.find("#blksvg_10")[0]).attr({y: b});
            $(svgIcon.find("#blksvg_11")[0]).attr({y: c});
            $(svgIcon.find("#blksvg_12")[0]).attr({y: f});
            $(svgIcon.find("#blksvg_3")[0]).attr({height: high});
            this.skinParts.$svg.attr('height', highsvg);
        } else if (isTypeConstraintBlock) {
            MIN_BLOCK_HEIGHT = 166;
            MIN_SVG_HEIGHT = parseInt(this.skinParts.$svg.attr('height'));
            high = MIN_BLOCK_HEIGHT;
            highsvg = MIN_SVG_HEIGHT;
            linehigh = 100.565221;
            linehigh2 = 116;
            var h = 126.23337;

            if (propertynum > 2) {
                high = MIN_BLOCK_HEIGHT + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg = MIN_SVG_HEIGHT + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                linehigh = linehigh + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                linehigh2 = linehigh2 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                var m = h + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
            }

            if (constraintnum > 2) {
                high = high + (constraintnum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg = highsvg + (constraintnum - 1) * BLOCK_HEIGHT_INCREASE;
            }
            $(svgIcon.find("#consvg_8")[0]).attr({y2: linehigh, y1: linehigh});
            $(svgIcon.find("#consvg_11")[0]).attr({y: linehigh2});
            $(svgIcon.find("#consvg_3")[0]).attr({height: high});
            $(svgIcon.find("#consvg_15")[0]).attr({y: m});
            this.skinParts.$svg.attr('height', highsvg);
        }

        // add props
        for (i = 0; i < props.length; ++i) {
            textheight = 60.23337;
            newtextheight = textheight + i * 10;
            x = isTypeValueType ? 6.983763 : 12.983763;
            newText = this._createNewTextElement(newtextheight, x, props[i]);
            $(svgIcon[0]).find('.property-name')[0].appendChild(newText);
        }

        // add ops
        textheight = (isTypeValueType ? parseInt($(svgIcon.find("#valsvg_8")[0]).attr('y'))
                                      : parseInt($(svgIcon.find("#blksvg_10")[0]).attr('y')))
                    + BLOCK_HEIGHT_INCREASE;
        x = isTypeValueType ? 6.983763 : 12.983763;

        for (i = 0; i < ops.length; ++i) {
            newText = this._createNewTextElement(textheight, x, ops[i]);
            $(svgIcon[0]).find('.operator-name')[0].appendChild(newText);
            textheight += BLOCK_HEIGHT_INCREASE;
        }

        // add constraints
        textheight = (isTypeBlock ? parseInt($(svgIcon.find('#blksvg_11')[0]).attr('y'))
                                  : parseInt($(svgIcon.find('#consvg_11')[0]).attr('y')))
                + SysMLDecoratorConstants.CHANGE_HEIGHT;
        x = 12.983763;

        for (i = 0; i < constraints.length; ++i) {
            newText = this._createNewTextElement(textheight, x, constraints[i]);
            $(svgIcon[0]).find('.constraint-name')[0].appendChild(newText);
            textheight += SysMLDecoratorConstants.CHANGE_HEIGHT;
        }
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
