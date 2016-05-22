/// <reference path="~/bower_components/winjs/js/base.js" />
var Currency = WinJS.Class.define(
    function(code, name, multiplier) {
        this.code = code;
        this.name = name;
        this.multiplier = multiplier;
    },
    {
        toString: function() {
            return "Code: " + this.code + ", Name" + this.name + ", Multiplier: " + this.multiplier;
        }
    },
    {
        dummyForCode: function(code) {
            return new Currency(code, "", 1);
        }
    }
);