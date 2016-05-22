"use strict";

var Currency = WinJS.Class.define(
    function(code, name, multiplier) {
        this.code = code;
        this.name = name;
        this.multiplier = multiplier;
    },
    {
        toString: function() {
            return "code: " + this.code + ", name" + this.name + ", multiplier: " + this.multiplier;
        }
    },
    {
        dummyForCode: function(code) {
            return new this.Currency(code, "", 1);
        }
    }
);