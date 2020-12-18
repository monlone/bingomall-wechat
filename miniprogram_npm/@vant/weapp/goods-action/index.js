"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var component_1 = require("../common/component");
component_1.VantComponent({
    relation: {
        type: 'descendant',
        name: 'products-action-button',
        current: 'products-action',
    },
    props: {
        safeAreaInsetBottom: {
            type: Boolean,
            value: true
        }
    }
});
