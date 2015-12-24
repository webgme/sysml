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

        if(!isMetaLanguage && !isDiagram && !isPackage){
            var isParentBlockDiagram;
            var isParentInternalBlockDiagram;
            if (isTypeWithPorts){
                nodeObj = client.getNode(gmeID);
                parentID = nodeObj ? nodeObj.getParentId() : '';
                isParentBlockDiagram = parentID ? SysMLMETA.TYPE_INFO.isBlockDefinitionDiagram(parentID): false;
                isParentInternalBlockDiagram = parentID ? SysMLMETA.TYPE_INFO.isInternalBlockDiagram(parentID): false;
            }
            if (isParentInternalBlockDiagram){
                _.extend(this,new SysMLBlockBase());
            }
            if (isParentBlockDiagram){
                _.extend(this,new SysMLBase());
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
            isSpecialBlock = isTypeRequirement || isTypeValue || isTypeProperty
                || isTypeParameter || isTypeConstraintParameter|| isTypeConstraintBlock;

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

        if (this.skinParts.$svg && (isTypeRequirement )) {
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

        var client = this._control._client,
            nodeObj = client.getNode(gmeID),
            childrenIDs = nodeObj ? nodeObj.getChildrenIds() : [],
            SVGWidth = parseInt(this.skinParts.$svg.attr('width')),
            SVGHeight = parseInt(this.skinParts.$svg.attr('height')),
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

            isTypeSpBlock = isTypeBlock || isTypeOperation || isTypeValueType || isTypeUnit
                || isTypeSignal || isTypeEnumerationLiteral || isTypeDimension || isTypePrimitive || isTypeData || isTypeEnumeration ||isTypeFlow || isTypeFlowOut
                || isTypeFlowIn || isTypeFlowInOut;

        if (this.skinParts.$name) {
            this.skinParts.$name.text(name);
            // from displayConnectors value, we can distinguish part browser from diagram widget
            if (isTypeSpBlock) {
                if (this._displayConnectors) {

                    // is type requirement or constraint block, move up name div
                    this.skinParts.$name.css('position', 'absolute');
                    this.skinParts.$name.css('top', SysMLDecoratorConstants.NAME_DIV_TOPS);
                } else {
                    var SvgHeight = parseInt(this.skinParts.$svg.attr('height'));
                    this.skinParts.$name.css('position', 'relative');
                    this.skinParts.$name.css('top', SysMLDecoratorConstants.NAME_DIV_TOPS - SvgHeight);

                }
            }
        }
        if (this.skinParts.$svg && (isTypeConstraintBlock)) {
            var texts = this.skinParts.$svg.find('text');
            var nodeObj = control._client.getNode(gmeID),
                parentID = nodeObj ? nodeObj.getParentId() : '';
            var eq = control._client.getNode(gmeID).getAttribute(SysMLDecoratorConstants.PAR_ATTRIBUTE_EQUATION);
            texts[4].textContent = eq ? '{' + eq + '}' : '';

        }
        if (this.skinParts.$svg && (isTypeBlock)) {
            var texts = this.skinParts.$svg.find('text');
            var nodeObj = control._client.getNode(gmeID),
                parentID = nodeObj ? nodeObj.getParentId() : '';
            var eq = control._client.getNode(gmeID).getAttribute(SysMLDecoratorConstants.PAR_ATTRIBUTE_EQUATION);
            texts[4].textContent = eq ? '{' + eq + '}' : '';

        }

        if(isTypeConstraintBlock)
        {
            var len = childrenIDs.length,
                self = this ,
                ChId,
                svgIcon = this.skinParts.$svg;
            var propertynum = 0,
                operationnum = 0,
                constraintnum = 0,
                parameternum = 0,
                isAProperty = false,
                isAConstrain =false,
                isAParameter =false,
                isAOpreation =false;

            var Textbase = this.skinParts.$svg.find("#consvg_16");


            if(childrenIDs && len)
            {
                for(var i = 0; i< childrenIDs.length; i++)
                {
                    var j = 1;
                    j= j+i;
                    var abcd =(control._client.getNode(childrenIDs[i])).getAttribute(nodePropertyNames.Attributes.name);

                    //Textbase[0].textContent = abcd ? abcd:'';
                    //var texts= svg.createText();

                    var textheight = 60.23337;
                    var newtextheight= textheight + (j - 1) * 10;
                    //$(svgIcon.find("#consvg_16")[0]).attr({y: newtextheight});
                    var newtext = document.createElementNS("http://www.w3.org/2000/svg","text");
                    newtext.setAttributeNS(null,"x",12.983763);
                    newtext.setAttributeNS(null,"y",newtextheight);
                    newtext.setAttributeNS(null,"font-size",9);
                    newtext.textContent= abcd ? abcd:'';
                    newtext.setAttributeNS(null,"font-family",'Trebuchet MS');

                    $(svgIcon[0]).find('.property-name')[0].appendChild(newtext);
                    //this.skinParts.$svg.appendChild(newtext);
                }


            }



            while(len--){
                ChId = childrenIDs[len];

                var childnode = control._client.getNode();
                isAProperty = SysMLMETA.TYPE_INFO.isProperty(ChId);
                isAConstrain = SysMLMETA.TYPE_INFO.isConstraintParameter(ChId);
                isAParameter = SysMLMETA.TYPE_INFO.isParameter(ChId);
                isAOpreation = SysMLMETA.TYPE_INFO.isOperation(ChId);
                if(isAProperty)
                {
                    propertynum += 1;

                }
                if (isAConstrain)
                {
                    constraintnum += 1;

                }
                if (isAParameter)
                {
                    parameternum += 1;
                }
                if (isAOpreation)
                {
                    operationnum += 1;
                }


            }





            var MIN_BLOCK_HEIGHT = 166;
            //var MIN_SVG_HEIGHT = 170;
            var MIN_SVG_HEIGHT =parseInt(this.skinParts.$svg.attr('height'))
            var BLOCK_HEIGHT_INCREASE = SysMLDecoratorConstants.CHANGE_HEIGHT;
            var high = MIN_BLOCK_HEIGHT;
            var highsvg = MIN_SVG_HEIGHT;
            var linehigh2 = 100.565221;
            var linehigh1 = 100.565221;
            var abc = linehigh2;
            var bb = linehigh1;
            var a = 116;
            var h = 126.23337;

            if(constraintnum + parameternum > 2){
                high = MIN_BLOCK_HEIGHT + (constraintnum + parameternum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg = MIN_SVG_HEIGHT + (constraintnum + parameternum - 1) * BLOCK_HEIGHT_INCREASE;
                abc = linehigh2 + (constraintnum + parameternum - 1) * BLOCK_HEIGHT_INCREASE;
                bb = linehigh1 + (constraintnum + parameternum - 1) * BLOCK_HEIGHT_INCREASE;
                var b = a + (constraintnum + parameternum - 1) * BLOCK_HEIGHT_INCREASE;
                var m = h + (constraintnum + parameternum - 1) * BLOCK_HEIGHT_INCREASE;
            }
            $(svgIcon.find("#consvg_8")[0]).attr({y2: abc ,y1: bb});
            $(svgIcon.find("#consvg_11")[0]).attr({y:  b});
            $(svgIcon.find("#consvg_3")[0]).attr({height: high});
            $(svgIcon.find("#consvg_15")[0]).attr({y: m});
            this.skinParts.$svg.attr('height',highsvg);

        }
        // Uncomment if you want to show the flow ports as property in the block definition diagram
        //var isParentBlockDiagram;
        //var isParentInternalBlockDiagram;
        //nodeObj = client.getNode(gmeID);
        //parentID = nodeObj ? nodeObj.getParentId() : '';
        //isParentBlockDiagram = parentID ? SysMLMETA.TYPE_INFO.isBlockDefinitionDiagram(parentID): false;
        //isParentInternalBlockDiagram = parentID ? SysMLMETA.TYPE_INFO.isInternalBlockDiagram(parentID): false;


        /*if(isParentBlockDiagram) 
         //{
         if(isTypeBlock)
         {
         var len = childrenIDs.length,
         self = this ,
         ChId,
         svgIcon = this.skinParts.$svg;
         var propertynum = 0,
         operationnum = 0,
         constraintnum = 0,
         parameternum = 0,
         isAProperty = false,
         isAConstrain =false,
         isAParameter =false,
         isAOpreation =false,
         isATypeFlow = false,
         isATypeFlowIn = false,
         isATypeFlowOut = false,
         isaTypeFlowInOut = false,
         isAProperty1 = false;

         while(len--){
         ChId = childrenIDs[len];

         isAProperty = SysMLMETA.TYPE_INFO.isProperty(ChId);
         isAConstrain = SysMLMETA.TYPE_INFO.isConstraintParameter(ChId);
         isAParameter = SysMLMETA.TYPE_INFO.isParameter(ChId);
         isAOpreation = SysMLMETA.TYPE_INFO.isOperation(ChId);
         isATypeFlow = SysMLMETA.TYPE_INFO.isFlowPort(ChId);
         isATypeFlowIn = SysMLMETA.TYPE_INFO.isFlowPortIn(ChId);
         isATypeFlowOut = SysMLMETA.TYPE_INFO.isFlowPortOut(ChId);
         isaTypeFlowInOut = SysMLMETA.TYPE_INFO.isFlowPortInOut(ChId);
         isAProperty1 = isAProperty || isATypeFlow || isATypeFlowOut || isATypeFlowIn || isaTypeFlowInOut;
         if(isAProperty1)
         {
         propertynum += 1;
         var nnn =(control._client.getNode(childrenIDs[len])).getAttribute(nodePropertyNames.Attributes.name);
         var textheight = 60.23337;
         var newtextheight= textheight + (propertynum- 1) * 10;
         //$(svgIcon.find("#consvg_16")[0]).attr({y: newtextheight});
         var newtext2 = document.createElementNS("http://www.w3.org/2000/svg","text");
         newtext2.setAttributeNS(null,"x",12.983763);
         newtext2.setAttributeNS(null,"y",newtextheight);
         newtext2.setAttributeNS(null,"font-size",9);
         newtext2.textContent= nnn ? nnn:'';
         newtext2.setAttributeNS(null,"font-family",'Trebuchet MS');

         $(svgIcon[0]).find('.property-name')[0].appendChild(newtext2);
         }
         if (isAConstrain)
         {
         constraintnum += 1;
         }
         if (isAParameter)
         {
         parameternum += 1;
         }
         if (isAOpreation)
         {
         operationnum += 1;
         var mmm =(control._client.getNode(childrenIDs[len])).getAttribute(nodePropertyNames.Attributes.name);
         var textheight = 126.23337;
         var newtextheight= textheight + (propertynum + operationnum) * 5;
         //$(svgIcon.find("#consvg_16")[0]).attr({y: newtextheight});
         var newtext3 = document.createElementNS("http://www.w3.org/2000/svg","text");
         newtext3.setAttributeNS(null,"x",12.983763);
         newtext3.setAttributeNS(null,"y",newtextheight);
         newtext3.setAttributeNS(null,"font-size",9);
         newtext3.textContent= mmm ? mmm:'';
         newtext3.setAttributeNS(null,"font-family",'Trebuchet MS');

         $(svgIcon[0]).find('.operator-name')[0].appendChild(newtext3);
         }


         }

         var MIN_BLOCK_HEIGHT1 = 205;
         //var MIN_SVG_HEIGHT2 = 208;
         var MIN_SVG_HEIGHT2 =parseInt(this.skinParts.$svg.attr('height'))
         var BLOCK_HEIGHT_INCREASE = SysMLDecoratorConstants.CHANGE_HEIGHT;
         var high1 = MIN_BLOCK_HEIGHT1;
         var highsvg1 = MIN_SVG_HEIGHT2;
         var linehigh = 91.246378;
         var linehigh2 = 148.123188;
         var abc = linehigh;
         var bb = linehigh;
         var l2y1 = linehigh2;
         var l2y2 = linehigh2;
         var text2 = 101.560661;
         var text3 = 159.560661;
         var d = 10;
         var e = 167.23337;

         if (propertynum > 2 ){
         high1 = MIN_BLOCK_HEIGHT1 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
         highsvg1 = MIN_SVG_HEIGHT2 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
         abc = linehigh + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
         bb = linehigh + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
         l2y2 = linehigh2 +(propertynum - 1) * BLOCK_HEIGHT_INCREASE;
         l2y1 = linehigh2 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
         var b = text2 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
         var c = text3 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
         var d = 0;
         var f = e + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
         }
         var newl2y2 = l2y2, newl2y1= l2y1, newhigh1 = high1, newhighsvg1 = highsvg1, newf = f;


         if(operationnum > 2){
         high1 = newhigh1 + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
         highsvg1 = newhighsvg1 + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
         l2y2 = newl2y2 +(operationnum - 1) * BLOCK_HEIGHT_INCREASE;
         l2y1 = newl2y1 + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
         c = (text3 + (operationnum - 1) * BLOCK_HEIGHT_INCREASE + (propertynum - 1) * BLOCK_HEIGHT_INCREASE) - d ;
         f = newf + +(operationnum - 1) * BLOCK_HEIGHT_INCREASE;
         }
         $(svgIcon.find("#blksvg_7")[0]).attr({y2: abc ,y1: bb});
         $(svgIcon.find("#blksvg_9")[0]).attr({y2: l2y2 ,y1: l2y1});
         $(svgIcon.find("#blksvg_10")[0]).attr({y:  b});
         $(svgIcon.find("#blksvg_11")[0]).attr({y:  c});
         $(svgIcon.find("#blksvg_12")[0]).attr({y:  f});
         $(svgIcon.find("#blksvg_3")[0]).attr({height: high1});
         this.skinParts.$svg.attr('height',highsvg1);
         }
         //}*/



        //if(isParentInternalBlockDiagram)
        //{
        if(isTypeBlock)
        {
            var len = childrenIDs.length,
                self = this ,
                ChId,
                svgIcon = this.skinParts.$svg;
            var propertynum = 0,
                operationnum = 0,
                constraintnum = 0,
                parameternum = 0,
                isAProperty = false,
                isAConstrain =false,
                isAParameter =false,
                isAOpreation =false;

            while(len--){
                ChId = childrenIDs[len];

                isAProperty = SysMLMETA.TYPE_INFO.isProperty(ChId);
                isAConstrain = SysMLMETA.TYPE_INFO.isConstraintParameter(ChId);
                isAParameter = SysMLMETA.TYPE_INFO.isParameter(ChId);
                isAOpreation = SysMLMETA.TYPE_INFO.isOperation(ChId);
                if(isAProperty)
                {
                    propertynum += 1;
                    var nnn =(control._client.getNode(childrenIDs[len])).getAttribute(nodePropertyNames.Attributes.name);
                    var textheight = 60.23337;
                    var newtextheight= textheight + (propertynum- 1) * 10;
                    //$(svgIcon.find("#consvg_16")[0]).attr({y: newtextheight});
                    var newtext2 = document.createElementNS("http://www.w3.org/2000/svg","text");
                    newtext2.setAttributeNS(null,"x",12.983763);
                    newtext2.setAttributeNS(null,"y",newtextheight);
                    newtext2.setAttributeNS(null,"font-size",9);
                    newtext2.textContent= nnn ? nnn:'';
                    newtext2.setAttributeNS(null,"font-family",'Trebuchet MS');

                    $(svgIcon[0]).find('.property-name')[0].appendChild(newtext2);
                }
                if (isAConstrain)
                {
                    constraintnum += 1;
                }
                if (isAParameter)
                {
                    parameternum += 1;
                }
                if (isAOpreation)
                {
                    operationnum += 1;
                    var mmm =(control._client.getNode(childrenIDs[len])).getAttribute(nodePropertyNames.Attributes.name);
                    var textheight = 126.23337;
                    var newtextheight= textheight + (propertynum + operationnum ) * 5;
                    //$(svgIcon.find("#consvg_16")[0]).attr({y: newtextheight});
                    var newtext3 = document.createElementNS("http://www.w3.org/2000/svg","text");
                    newtext3.setAttributeNS(null,"x",12.983763);
                    newtext3.setAttributeNS(null,"y",newtextheight);
                    newtext3.setAttributeNS(null,"font-size",9);
                    newtext3.textContent= mmm ? mmm:'';
                    newtext3.setAttributeNS(null,"font-family",'Trebuchet MS');

                    $(svgIcon[0]).find('.operator-name')[0].appendChild(newtext3);
                }


            }

            var MIN_BLOCK_HEIGHT1 = 205;
            //var MIN_SVG_HEIGHT2 = 208;
            var MIN_SVG_HEIGHT2 =parseInt(this.skinParts.$svg.attr('height'))
            var BLOCK_HEIGHT_INCREASE = SysMLDecoratorConstants.CHANGE_HEIGHT;
            var high1 = MIN_BLOCK_HEIGHT1;
            var highsvg1 = MIN_SVG_HEIGHT2;
            var linehigh = 91.246378;
            var linehigh2 = 148.123188;
            var abc = linehigh;
            var bb = linehigh;
            var l2y1 = linehigh2;
            var l2y2 = linehigh2;
            var text2 = 101.560661;
            var text3 = 159.560661;
            var d = 10;
            var e = 167.23337;

            if (propertynum > 2 ){
                high1 = MIN_BLOCK_HEIGHT1 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg1 = MIN_SVG_HEIGHT2 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                abc = linehigh + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                bb = linehigh + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                l2y2 = linehigh2 +(propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                l2y1 = linehigh2 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                var b = text2 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                var c = text3 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                var d = 0;
                var f = e + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
            }
            var newl2y2 = l2y2, newl2y1= l2y1, newhigh1 = high1, newhighsvg1 = highsvg1, newf = f;


            if(operationnum > 2){
                high1 = newhigh1 + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg1 = newhighsvg1 + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
                l2y2 = newl2y2 +(operationnum - 1) * BLOCK_HEIGHT_INCREASE;
                l2y1 = newl2y1 + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
                c = (text3 + (operationnum - 1) * BLOCK_HEIGHT_INCREASE + (propertynum - 1) * BLOCK_HEIGHT_INCREASE) - d ;
                f = newf + +(operationnum - 1) * BLOCK_HEIGHT_INCREASE;
            }
            $(svgIcon.find("#blksvg_7")[0]).attr({y2: abc ,y1: bb});
            $(svgIcon.find("#blksvg_9")[0]).attr({y2: l2y2 ,y1: l2y1});
            $(svgIcon.find("#blksvg_10")[0]).attr({y:  b});
            $(svgIcon.find("#blksvg_11")[0]).attr({y:  c});
            $(svgIcon.find("#blksvg_12")[0]).attr({y:  f});
            $(svgIcon.find("#blksvg_3")[0]).attr({height: high1});
            this.skinParts.$svg.attr('height',highsvg1);
        }
        //}

        if(isTypeValueType)
        {
            var len = childrenIDs.length,
                self = this ,
                ChId,
                svgIcon = this.skinParts.$svg;
            var propertynum = 0,
                operationnum = 0,
                constraintnum = 0,
                parameternum = 0,
                isAProperty = false,
                isAConstrain =false,
                isAParameter =false,
                isAOpreation =false;


            while(len--){
                ChId = childrenIDs[len];

                isAProperty = SysMLMETA.TYPE_INFO.isProperty(ChId);
                isAConstrain = SysMLMETA.TYPE_INFO.isConstraintParameter(ChId);
                isAParameter = SysMLMETA.TYPE_INFO.isParameter(ChId);
                isAOpreation = SysMLMETA.TYPE_INFO.isOperation(ChId);

                if(isAProperty)
                {
                    propertynum += 1;


                    var abcd =(control._client.getNode(childrenIDs[len])).getAttribute(nodePropertyNames.Attributes.name);

                    var textheight = 60.23337;
                    var newtextheight= textheight + (propertynum- 1) * 10;
                    //$(svgIcon.find("#consvg_16")[0]).attr({y: newtextheight});
                    var newtext = document.createElementNS("http://www.w3.org/2000/svg","text");
                    newtext.setAttributeNS(null,"x",6.983763);
                    newtext.setAttributeNS(null,"y",newtextheight);
                    newtext.setAttributeNS(null,"font-size",9);
                    newtext.textContent= abcd ? abcd:'';
                    newtext.setAttributeNS(null,"font-family",'Trebuchet MS');

                    $(svgIcon[0]).find('.property-name')[0].appendChild(newtext);
                }

                if (isAOpreation)
                {
                    operationnum += 1;
                    var rrr =(control._client.getNode(childrenIDs[len])).getAttribute(nodePropertyNames.Attributes.name);

                    var textheight1 = 120.23337;
                    var newtextheight1= textheight1 + (propertynum + operationnum ) * 10;
                    //$(svgIcon.find("#consvg_16")[0]).attr({y: newtextheight});
                    var newtext1 = document.createElementNS("http://www.w3.org/2000/svg","text");
                    newtext1.setAttributeNS(null,"x",6.983763);
                    newtext1.setAttributeNS(null,"y",newtextheight1);
                    newtext1.setAttributeNS(null,"font-size",9);
                    newtext1.textContent= rrr ? rrr:'';
                    newtext1.setAttributeNS(null,"font-family",'Trebuchet MS');
                    $(svgIcon[0]).find('.operator-name')[0].appendChild(newtext1);

                }


            }




            /*if(childrenIDs && len )
             {


             for(var i = 0; i< childrenIDs.length; i++)
             {
             var j = 1;
             j= j+i;
             ChId = childrenIDs[len];
             isAProperty = SysMLMETA.TYPE_INFO.isProperty(ChId);
             if(isAProperty)
             var abcd =(control._client.getNode(childrenIDs[i])).getAttribute(nodePropertyNames.Attributes.name);

             //Textbase[0].textContent = abcd ? abcd:'';
             //var texts= svg.createText();

             var textheight = 60.23337;
             var newtextheight= textheight + (j - 1) * 10;
             //$(svgIcon.find("#consvg_16")[0]).attr({y: newtextheight});
             var newtext = document.createElementNS("http://www.w3.org/2000/svg","text");
             newtext.setAttributeNS(null,"x",6.983763);
             newtext.setAttributeNS(null,"y",newtextheight);
             newtext.setAttributeNS(null,"font-size",9);
             newtext.textContent= abcd ? abcd:'';
             newtext.setAttributeNS(null,"font-family",'Trebuchet MS');

             $(svgIcon[0]).find('.property-name')[0].appendChild(newtext);
             //this.skinParts.$svg.appendChild(newtext);


             }
             } */



            var MIN_BLOCK_HEIGHT3 = 183.000004;
            var MIN_SVG_HEIGHT3 = 190;
            var BLOCK_HEIGHT_INCREASE = SysMLDecoratorConstants.CHANGE_HEIGHT;
            var high2 = MIN_BLOCK_HEIGHT3;
            var highsvg2 = MIN_SVG_HEIGHT3;
            var linehigh3 = 110.75
            var abc = linehigh;
            var bb = linehigh;
            var text2 = 123;
            var d = 10;

            if (propertynum > 2 ){
                high2 = MIN_BLOCK_HEIGHT3 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg2 = MIN_SVG_HEIGHT3 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                abc = linehigh3 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                bb = linehigh3 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                var b = text2 + (propertynum - 1) * BLOCK_HEIGHT_INCREASE;
                var d = 0;
            }
            var  newhigh2 = high2, newhighsvg2 = highsvg2;


            if(operationnum > 2){
                high2 = newhigh2 + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg2 = newhighsvg2 + (operationnum - 1) * BLOCK_HEIGHT_INCREASE;


            }
            $(svgIcon.find("#valsvg_3")[0]).attr({y2: abc ,y1: bb});
            $(svgIcon.find("#valsvg_8")[0]).attr({y:  b});
            $(svgIcon.find("#valsvg_1")[0]).attr({height: high2});
            this.skinParts.$svg.attr('height',highsvg2);

        }

        if(isTypeEnumeration)
        {
            var len = childrenIDs.length,
                self = this ,
                ChId,
                svgIcon = this.skinParts.$svg;
            var literalnum = 0,
                m = 0,

                isAliteral = false;
            while(len--){
                ChId = childrenIDs[len];

                isAliteral = SysMLMETA.TYPE_INFO.isEnumerationLiteral(ChId);
                if(isAliteral)
                {
                    literalnum  += 1;

                    var gfh =(control._client.getNode(childrenIDs[m])).getAttribute(nodePropertyNames.Attributes.name);
                    m = m+1;
                    var textheight = 60.23337;
                    var newtextheight= textheight + (literalnum - 1) * 10;
                    //$(svgIcon.find("#consvg_16")[0]).attr({y: newtextheight});
                    var newtxt = document.createElementNS("http://www.w3.org/2000/svg","text");
                    newtxt.setAttributeNS(null,"x",12.983763);
                    newtxt.setAttributeNS(null,"y",newtextheight);
                    newtxt.setAttributeNS(null,"font-size",9);
                    newtxt.textContent= gfh ? gfh:'';
                    newtxt.setAttributeNS(null,"font-family",'Trebuchet MS');

                    $(svgIcon[0]).find('.property-name')[0].appendChild(newtxt);
                }
            }
            var MIN_BLOCK_HEIGHT4 = 96.000008 ;
            var MIN_SVG_HEIGHT4 = 100;
            var BLOCK_HEIGHT_INCREASE = SysMLDecoratorConstants.CHANGE_HEIGHT;
            var high3 = MIN_BLOCK_HEIGHT4;
            var highsvg3 = MIN_SVG_HEIGHT4;
            if(literalnum > 2){
                high3 = high3 + (literalnum - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg3 = highsvg3 + (literalnum - 1) * BLOCK_HEIGHT_INCREASE;



            }
            $(svgIcon.find("#enumsvg_1")[0]).attr({height: high3});
            this.skinParts.$svg.attr('height',highsvg3);

        }
        if(isTypeData)
        {
            var len = childrenIDs.length,
                self = this ,
                ChId,
                svgIcon = this.skinParts.$svg;
            var propertynumb = 0,
                n=0,
                isAProperty = false;
            while(len--){
                ChId = childrenIDs[len];

                isAProperty = SysMLMETA.TYPE_INFO.isProperty(ChId);
                if(isAProperty)
                {
                    propertynumb  += 1;
                    var def =(control._client.getNode(childrenIDs[n])).getAttribute(nodePropertyNames.Attributes.name);
                    n = n+1;
                    var textheight = 60.23337;
                    var newtextheight= textheight + (propertynumb - 1) * 10;
                    //$(svgIcon.find("#consvg_16")[0]).attr({y: newtextheight});
                    var newtxt1 = document.createElementNS("http://www.w3.org/2000/svg","text");
                    newtxt1.setAttributeNS(null,"x",12.983763);
                    newtxt1.setAttributeNS(null,"y",newtextheight);
                    newtxt1.setAttributeNS(null,"font-size",9);
                    newtxt1.textContent= def ? def:'';
                    newtxt1.setAttributeNS(null,"font-family",'Trebuchet MS');

                    $(svgIcon[0]).find('.property-name')[0].appendChild(newtxt1);
                }
            }
            var MIN_BLOCK_HEIGHT5 = 96.000008 ;
            var MIN_SVG_HEIGHT5 = 100;
            var BLOCK_HEIGHT_INCREASE = SysMLDecoratorConstants.CHANGE_HEIGHT;
            var high4 = MIN_BLOCK_HEIGHT5;
            var highsvg4 = MIN_SVG_HEIGHT5;
            if(propertynumb > 2){
                high4 = high4 + (propertynumb - 1) * BLOCK_HEIGHT_INCREASE;
                highsvg4 = highsvg4 + (propertynumb - 1) * BLOCK_HEIGHT_INCREASE;


            }
            $(svgIcon.find("#datasvg_1")[0]).attr({height: high4});
            this.skinParts.$svg.attr('height',highsvg4);
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
