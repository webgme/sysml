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
            'Comment': 'Comment',
            'Diagram': 'Diagram',
            'Document': 'Document',
            'FCO': 'FCO',
            'Package': 'Package',
            'ParametricDiagram': 'ParametricDiagram',
            'Rationale': 'Rationale',
            'Requirement': 'Requirement',
            'RequirementDiagram': 'RequirementDiagram',
            'SequenceDiagram': 'SequenceDiagram',
            'Subject': 'Subject',
            'SysMLMetaLanguage': 'SysMLMetaLanguage',
            'UseCase': 'UseCase',
            'UseCaseDiagram': 'UseCaseDiagram'
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
    var _isComment = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Comment]);
    };
    var _isDiagram = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Diagram]);
    };
    var _isDocument = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Document]);
    };
    var _isFCO = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.FCO]);
    };
    var _isPackage = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.Package]);
    };
    var _isParametricDiagram = function (objID) {
        return client.isTypeOf(objID, _getMetaTypes()[META_TYPES.ParametricDiagram]);
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


    //return utility functions
    return {
        getMetaTypes: _getMetaTypes,
        getMetaTypesOf: _getMetaTypesOf,
        TYPE_INFO: {
            isActor: _isActor,
            isComment: _isComment,
            isDiagram: _isDiagram,
            isDocument: _isDocument,
            isFCO: _isFCO,
            isPackage: _isPackage,
            isParametricDiagram: _isParametricDiagram,
            isRationale: _isRationale,
            isRequirement: _isRequirement,
            isRequirementDiagram: _isRequirementDiagram,
            isSequenceDiagram: _isSequenceDiagram,
            isSubject: _isSubject,
            isSysMLMetaLanguage: _isSysMLMetaLanguage,
            isUseCase: _isUseCase,
            isUseCaseDiagram: _isUseCaseDiagram
        }
    };
});