/*globals define, _, WebGMEGlobal*/
/*jshint browser: true*/
/**
 * @author zhangpn / https://github.com/zhangpn
 */

define(['underscore'], function (_underscore) {
    'use strict';
    var _metaID = 'SysML.META.js',
        META_TYPES = {
            'Actor': 'Actor',
            'Block': 'Block',
            'BlockDefinitionDiagram': 'BlockDefinitionDiagram',
            'Comment': 'Comment',
            'Constraint': 'Constraint',
            'ConstraintBlock': 'ConstraintBlock',
            'ConstraintParameter': 'ConstraintParameter',
            'DataType': 'DataType',
            'Diagram': 'Diagram',
            'Dimension': 'Dimension',
            'Document': 'Document',
            'Problem': 'Problem',
            'FCO': 'FCO',
            'FlowPort': 'FlowPort',
            'FlowPortIn': 'FlowPortIn',
            'FlowPortOut': 'FlowPortOut',
            'FlowPortInOut': 'FlowPortInOut',
            'InternalBlockDiagram': 'InternalBlockDiagram',
            'Enumeration': 'Enumeration',
            'EnumerationLiteral': 'EnumerationLiteral',
            'Operation': "Operation",
            'Package': 'Package',
            'Parameter': 'Parameter',
            'ParametricDiagram': 'ParametricDiagram',
            'PrimitiveType': 'PrimitiveType',
            'Property': 'Property',
            'Rationale': 'Rationale',
            'Requirement': 'Requirement',
            'RequirementDiagram': 'RequirementDiagram',
            'Signal': 'Signal',
            'SequenceDiagram': 'SequenceDiagram',
            'Subject': 'Subject',
            'SysMLMetaLanguage': 'SysMLMetaLanguage',
            'Unit' : 'Unit',
            'UseCase': 'UseCase',
            'UseCaseDiagram': 'UseCaseDiagram',
            'Value': 'Value',
            'ValueType' : "ValueType"
        },
        client = WebGMEGlobal.Client;

    function _getMetaTypes() {
        var metaNodes = client.getAllMetaNodes(),
            dictionary = {},
            i,
            name;

        for (i = 0; i < metaNodes.length; i += 1) {
            name = metaNodes[i].getAttribute('name');
            if (META_TYPES[name]) {
                dictionary[name] = metaNodes[i].getId();
            }
        }

        return dictionary;
    }

    function _getMetaTypesOf(objId) {
        var orderedMetaList = Object.keys(META_TYPES).sort(),
            metaDictionary = _getMetaTypes(),
            i,
            result = [];

        for (i = 0; i < orderedMetaList.length; i += 1) {
            if (client.isTypeOf(objId, metaDictionary[orderedMetaList[i]])) {
                result.push(orderedMetaList[i]);
            }
        }

        return result;
    }

    //META ASPECT TYPE CHECKING
    var _isActor = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Actor]);
    };
    var _isBlock = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Block]);
    };
    var _isBlockDefinitionDiagram = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.BlockDefinitionDiagram]);
    };
    var _isComment = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Comment]);
    };
    var _isConstraint = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Constraint]);
    };
    var _isConstraintBlock = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.ConstraintBlock]);
    };
    var _isConstraintParameter = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.ConstraintParameter]);
    };
    var _isDataType = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.DataType]);
    };
    var _isDiagram = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Diagram]);
    };
    var _isDimension = function (objID){
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Dimension]);
    };
    var _isDocument = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Document]);
    };
    var _isEnumeration = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Enumeration]);
    };
    var _isEnumerationLiteral = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.EnumerationLiteral]);
    };
    var _isFCO = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.FCO]);
    };
    var _isFlowPort = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.FlowPort]);
    };
    var _isFlowPortIn = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.FlowPortIn]);
    };
    var _isFlowPortInOut = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.FlowPortInOut]);
    };
    var _isFlowPortOut = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.FlowPortOut]);
    };
    var _isInternalBlockDiagram = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.InternalBlockDiagram]);
    };
    var _isOperation = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Operation]);
    };
    var _isPackage = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Package]);
    };
    var _isParameter = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Parameter]);
    };
    var _isParametricDiagram = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.ParametricDiagram]);
    };
    var _isProblem = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Problem]);
    };
    var _isPrimitiveType = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.PrimitiveType]);
    };
    var _isProperty = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Property]);
    };
    var _isRationale = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Rationale]);
    };
    var _isRequirement = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Requirement]);
    };
    var _isRequirementDiagram = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.RequirementDiagram]);
    };
    var _isSequenceDiagram = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.SequenceDiagram]);
    };
    var _isSignal = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Signal]);
    };
    var _isSubject = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Subject]);
    };
    var _isSysMLMetaLanguage = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.SysMLMetaLanguage]);
    };
    var _isUnit = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Unit]);
    };
    var _isUseCase = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.UseCase]);
    };
    var _isUseCaseDiagram = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.UseCaseDiagram]);
    };
    var _isValue = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Value]);
    };
    var _isValueType = function (objID){
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.ValueType]);
    };


    //return utility functions
    return {
        getMetaTypes: _getMetaTypes,
        getMetaTypesOf: _getMetaTypesOf,
        TYPE_INFO: {
            isActor: _isActor,
            isBlock: _isBlock,
            isBlockDefinitionDiagram: _isBlockDefinitionDiagram,
            isComment: _isComment,
            isConstraint: _isConstraint,
            isConstraintBlock: _isConstraintBlock,
            isConstraintParameter: _isConstraintParameter,
            isDataType: _isDataType,
            isDiagram: _isDiagram,
            isDimension: _isDimension,
            isDocument: _isDocument,
            isEnumerationLiteral: _isEnumerationLiteral,
            isEnumeration: _isEnumeration,
            isFCO: _isFCO,
            isFlowPort: _isFlowPort,
            isFlowPortIn: _isFlowPortIn,
            isFlowPortInOut: _isFlowPortInOut,
            isFlowPortOut: _isFlowPortOut,
            isInternalBlockDiagram: _isInternalBlockDiagram,
            isOperation: _isOperation,
            isPackage: _isPackage,
            isParameter: _isParameter,
            isParametricDiagram: _isParametricDiagram,
            isPrimitiveType: _isPrimitiveType,
            isProblem: _isProblem,
            isProperty: _isProperty,
            isRationale: _isRationale,
            isRequirement: _isRequirement,
            isRequirementDiagram: _isRequirementDiagram,
            isSequenceDiagram: _isSequenceDiagram,
            isSignal: _isSignal,
            isSubject: _isSubject,
            isSysMLMetaLanguage: _isSysMLMetaLanguage,
            isUnit : _isUnit,
            isUseCase: _isUseCase,
            isUseCaseDiagram: _isUseCaseDiagram,
            isValue: _isValue,
            isValueType : _isValueType
        }
    };
});