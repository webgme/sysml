/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 * author: Dana Zhang
 * created on: 11/7/15
 */


define([], function () {

    "use strict";

    return {
        SYSML_TO_META_TYPES: {
            Class: 'Requirement',
            Abstraction: 'Abstraction'
        },
        FLOW_PORTS: {
            in: 'In',
            out: 'Out',
            inout: 'InOut'
        }
    };
});