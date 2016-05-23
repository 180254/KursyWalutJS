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
            return (array.slice(-1))[0];
        },

        averaged: function(list, expectedLength) {
            if (list.length <= expectedLength) return list;

            var incr = Math.round(list.length / expectedLength);
            var nextSize = Math.floor(list.length / incr);

            var indexes =
                Utils.rangeEx(0, nextSize)
                    .map(function(value, index) {
                        return index * incr;
                    });

            if (nextSize * incr !== list.length - 1)
                indexes.push(list.length - 1);

            return list.filter(function(value, index) {
                return indexes.indexOf(index) > -1;
            });
        },

        getElements: function(xml, tagName) {
            return xml.getElementsByTagName(tagName);
        },

        getElement: function(xml, tagName) {
            return this.getElements(xml, tagName)[0];
        },


        getElementValue: function(xml, tagName) {
            var element = this.getElement(xml, tagName);
            return element ? element.childNodes[0].nodeValue : null;
        }
    }
);