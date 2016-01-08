/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 * author: Dana Zhang
 * created on: 11/7/15
 */


define([], function () {

    "use strict";

    return {
        BLOCK_WIDTH: 200,
        BLOCK_HEIGHT: 100,
        CommunicationPath: {
            type0: 4011,
            type1: 6008,
            type2: 6033,
            y1: 40,
            y2: -20,
            connType: "Association"
        },
        Extend: {
            type0: 4009,
            type1: 6007,
            type2: 6031,
            y1: 20,
            y2: -20,
            connType: "Extend"
        },
        Include: {
            type0: 4008,
            type1: 6006,
            type2: 6030,
            y1: 20,
            y2: -20,
            connType: "Include"
        },
        DirectedComposition: {
            type0: 4007,
            type1: 6005,
            type2: 6029,
            y1: 20,
            y2: -20,
            connType: "DirectedComposition"

        },
        Composition: {
            type0: 4007,
            type1: 6005,
            type2: 6029,
            y1: 20,
            y2: -20,
            connType: "DirectedComposition"

        },
        DirectedAssociation: {
            type0: 4006,
            type1: 6004,
            type2: 6028,
            y1: 20,
            y2: -20,
            connType: "DirectedAssociation"

        },
        Association: {
            type0: 4006,
            type1: 6004,
            type2: 6028,
            y1: 20,
            y2: -20,
            connType: "DirectedAssociation"

        },
        DirectedAggregation: {
            type0: 4005,
            type1: 6003,
            type2: 6027,
            y1: 20,
            y2: -20,
            connType: "DirectedAggregation"

        },
        Aggregation: {
            type0: 4005,
            type1: 6003,
            type2: 6027,
            y1: 20,
            y2: -20,
            connType: "DirectedAggregation"

        },
        templates: {
            Decompose: 'decompose.ejs',
            Satisfy: 'abstraction.ejs',
            Derive: 'abstraction.ejs',
            RequirementUml: 'requirement.uml.ejs',
            DefaultEdges: 'edges.ejs',
            Comment: 'Comment.ejs',
            CommentLink: 'CommentLink.ejs'
        }
    };
});