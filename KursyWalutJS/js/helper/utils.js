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

        getRandomArbitrary: function(min, max) {
            return Math.random() * (max - min) + min;
        },

        getRandomInt: function(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        },

        getRandomIntInclusive: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        startsWith: function(string, searchString, position) {
            position = position || 0;
            return string.lastIndexOf(searchString, position) === position;
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

        // credits: friends@stackoverflow; http://stackoverflow.com/posts/14811679/revisions
        waitFor: function(test, expectedValue, msec, callback) {
            // Check if condition met. If not, re-check later (msec).
            if (test() !== expectedValue) {
                setTimeout(function() {
                    Utils.waitFor(test, expectedValue, msec, callback);
                }, msec);
            } else {
                callback();
            }
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

var using = function(arg, func) {
    setTimeout(function() {
        func(arg);
    }, 1000);
};