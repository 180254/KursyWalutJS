"use strict";

var Utils = WinJS.Class.define(
    function() {
    },
    {
    
    },
    {
        rangeEx: function(start, count) {
            return Array.apply(0, Array(count))
                .map(function(element, index) {
                    return index + start;
                });
        },

        rangeEx2: function(start, end) {
            return Utils.rangeEx(start, end - start);
        },

        startsWith: function(string, searchString, position) {
            position = position || 0;
            return string.substr(position, searchString.length) === searchString;
        },

        cloneArray: function(array) {
            return array.slice(0);
        },

        flatArray: function(array) {
            var a = array;

            while (a.some(Array.isArray)) {
                a = [].concat.apply([], a);
            }

            return a;
        },

        first: function(array) {
            return array[0];
        },

        last: function(array) {
            return array.slice(-1)[0];
        },

        averaged: function(list, expectedSize) {
            return list;

        }
    }
);