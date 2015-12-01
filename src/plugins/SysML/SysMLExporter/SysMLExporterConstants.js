/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 * author: Dana Zhang
 * created on: 11/7/15
 */


define([], function () {

    "use strict";

    return {
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
        templates: {
            Decompose: 'decompose.ejs',
            Satisfy: 'abstraction.ejs',
            DeriveReqt: 'abstraction.ejs',
            RequirementUml: 'requirement.uml.ejs',
            DefaultEdges: 'edges.ejs'
        }
    };
});