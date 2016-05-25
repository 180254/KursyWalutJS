"use strict";

var Currency = WinJS.Class.define(
    function(code, name, multiplier) {
        this.__type = "Currency";
        this.code = code;
        this.name = name;
        this.multiplier = multiplier;
    },
    {
        toString: function() {
            return "[code: " + this.code + ", name: " + this.name + ", multiplier: " + this.multiplier + "]";
        }
    },
    {
        equals: function (curr1, curr2) {
            return curr1.code === curr2.code;
        },

        dummyForCode: function(code) {
            return new Currency(code, "_dummy_", 1);
        }
    }
);