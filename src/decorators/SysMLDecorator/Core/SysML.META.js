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
            'Comment': 'Comment',
            'ConstraintBlock': 'ConstraintBlock',
            'ConstraintParameter': 'ConstraintParameter',
            'Diagram': 'Diagram',
            'Problem': 'Problem',
            'FCO': 'FCO',
            'Package': 'Package',
            'Parameter': 'Parameter',
            'ParametricDiagram': 'ParametricDiagram',
            'Property': 'Property',
            'Rationale': 'Rationale',
            'Requirement': 'Requirement',
            'RequirementDiagram': 'RequirementDiagram',
            'SequenceDiagram': 'SequenceDiagram',
            'Subject': 'Subject',
            'SysMLMetaLanguage': 'SysMLMetaLanguage',
            'UseCase': 'UseCase',
            'UseCaseDiagram': 'UseCaseDiagram',
            'Value': 'Value'
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
    var _isComment = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Comment]);
    };
    var _isConstraintBlock = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.ConstraintBlock]);
    };
    var _isConstraintParameter = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.ConstraintParameter]);
    };
    var _isDiagram = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Diagram]);
    };
    var _isProblem = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Problem]);
    };
    var _isFCO = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.FCO]);
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
    var _isSubject = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Subject]);
    };
    var _isSysMLMetaLanguage = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.SysMLMetaLanguage]);
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


    //return utility functions
    return {
        getMetaTypes: _getMetaTypes,
        getMetaTypesOf: _getMetaTypesOf,
        TYPE_INFO: {
            isActor: _isActor,
            isBlock: _isBlock,
            isComment: _isComment,
            isConstraintBlock: _isConstraintBlock,
            isConstraintParameter: _isConstraintParameter,
            isDiagram: _isDiagram,
            isProblem: _isProblem,
            isFCO: _isFCO,
            isPackage: _isPackage,
            isParameter: _isParameter,
            isParametricDiagram: _isParametricDiagram,
            isProperty: _isProperty,
            isRationale: _isRationale,
            isRequirement: _isRequirement,
            isRequirementDiagram: _isRequirementDiagram,
            isSequenceDiagram: _isSequenceDiagram,
            isSubject: _isSubject,
            isSysMLMetaLanguage: _isSysMLMetaLanguage,
            isUseCase: _isUseCase,
            isUseCaseDiagram: _isUseCaseDiagram,
            isValue: _isValue
        }
    };
});