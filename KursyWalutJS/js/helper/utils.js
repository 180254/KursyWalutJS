"use strict";

/**
 * Common utils.
 * @constructor 
 */
var Utils = WinJS.Class.define(
    function() {
    },
    {
    
    },
    {
        /**
         * Range from {@link start}, with {@link count} number of elements.
         * 
         * @static 
         * @param {number} start 
         * @param {number} count 
         * @returns {number[]} 
         */
        rangeEx: function(start, count) {
            return Array.apply(0, Array(count))
                .map(function(element, index) {
                    return index + start;
                });
        },

        /**
         * Range from {@link start} (inclusive) to {@link end} (exclusive).
         * 
         * @static
         * @param {number} start 
         * @param {number} end - end > start
         * @returns {number[]} 
         */
        rangeEx2: function(start, end) {
            return Utils.rangeEx(start, end - start);
        },

        /**
         * Random from {@link min} (inclusive) to {@link max} (exclusive).<br/>
         * Credits: mozilla, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random <br/>
         * License: http://creativecommons.org/licenses/by-sa/2.5/
         * 
         * @static
         * @param {number} min 
         * @param {number} max - max > min
         * @returns {number} 
         */
        getRandomArbitrary: function(min, max) {
            return Math.random() * (max - min) + min;
        },

        /**
         * Random int from {@link min} (inclusive) to {@link max} (exclusive).<br/>
         * Credits: mozilla, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random <br/>
         * License: http://creativecommons.org/licenses/by-sa/2.5/
         * 
         * @static
         * @param {number} min 
         * @param {number} max - max > min
         * @returns {number} 
         */
        getRandomInt: function(min, max) {
            return Math.floor(Math.random() * (max - min)) + min;
        },

        /**
         * Random int from {@link min} (inclusive) to {@link max} (inclusive).<br/>
         * Credits: mozilla, https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random <br/>
         * License: http://creativecommons.org/licenses/by-sa/2.5/
         * 
         * @static
         * @param {number} min 
         * @param {number} max - max > min
         * @returns {number}
         */
        getRandomIntInclusive: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        /**
         * Check is string "start with" another string.<br/>
         * Credits: friend at stackoverflow, http://stackoverflow.com/a/4579228 <br/>
         * License: https://creativecommons.org/licenses/by-sa/3.0/
         * 
         * @static
         * @param {string} string 
         * @param {string} searchString 
         * @param {number} position 
         * @returns {boolean} 
         */
        startsWith: function(string, searchString, position) {
            position = position || 0;
            return string.lastIndexOf(searchString, position) === position;
        },

        /**
         * Flat nested arrays.<br/>
         * [1, 2, [5, [6]], 7] -> [1, 2, 5, 6, 7]<br/>
         * Credits: friends at stackoverflow, http://stackoverflow.com/a/10865042 <br/>
         * License: https://creativecommons.org/licenses/by-sa/3.0/ <br/>
         * Modification: loop added to handle multiple nested arrays.
         * 
         * @static
         * @param {T[]} array 
         * @returns {T[]} 
         */
        flatArray: function(array) {
            var a = array;

            while (a.some(Array.isArray)) {
                a = [].concat.apply([], a);
            }

            return a;
        },

        /**
         * First element of of not-empty array.
         * 
         * @static
         * @param {T[]} array 
         * @returns {T} 
         */
        first: function(array) {
            return array[0];
        },

        /**
         * Last element of not-empty array.
         * 
         * @static
         * @param {T[]} array 
         * @returns {T} 
         */
        last: function(array) {
            return array[array.length - 1];
        },

        /**
         * Clone an array.
         * 
         * @param {T[]} array 
         * @returns {T[]} 
         */
        cloneArray: function(array) {
            return array.slice();
        },

        /**
         * Get random element from not-empty array.
         * 
         * @param {T[]} array 
         * @returns {T} 
         */
        randomElement: function(array) {
            return array[this.getRandomInt(0, array.length)];
        },

        /**
         * Skip undefined values in array.
         * 
         * @param {T[]} array 
         * @returns {T[]} - copy without undefined 
         */
        skipUndefined: function(array) {
            return array.filter(function(element) {
                return element !== undefined;
            });
        },

        /**
         * This functions is to ensure that data has length approximately "expected length".<br/>
         * It is usefull if data has far too many elements to be processed.<br/>
         * This simply implementation just select some indexes omitting others.<br/>
         * Always first and last element is included in result.<br/>
         * <br/>
         * Example:<br/>
         * data = { 1, 2, 2, 3, 1, 6, 2, 1, 1 }<br/>
         * expectedLength = 3<br/>
         * return = { 1, 3, 2, 1 }
         *        
         * @static
         * @param {T[]} list 
         * @param {number} expectedLength 
         * @returns {T[]} - 
         * - just given list if list.length >= expectedSize<br/>
         * - just with at least expectedLength elements (probably more)
         */
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

        /**
         * Wait until a condition is met.<br/>
         * credits: friends at stackoverflow, http://stackoverflow.com/a/14811679 <br/>
         * License: https://creativecommons.org/licenses/by-sa/3.0/ <br/>
         * Modifications: removed debug code.
         *
         * @static
         * @param {function() : T} test - function that returns a value
         * @param {T} expectedValue  - the value of the test function we are waiting for
         * @param {number} msec - delay between the calls to test
         * @param {function()} callback - function to execute when the condition is met
         * @returns {void} 
         */
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

        /**
         * getElementsByTagName wrapper.
         * 
         * @static
         * @param {XMLDocument} xml 
         * @param {string} tagName 
         * @returns {XMLDocument[]} 
         */
        getElements: function(xml, tagName) {
            return xml.getElementsByTagName(tagName);
        },

        /**
         * getElementsByTagName wrapper.
         * 
         * @static
         * @param {XMLDocument} xml 
         * @param {string} tagName 
         * @returns {XMLDocument} 
         */
        getElement: function(xml, tagName) {
            return this.getElements(xml, tagName)[0];
        },


        /**
         * getElementsByTagName wrapper.
         *
         * @static
         * @param {XMLDocument} xml 
         * @param {string} tagName 
         * @returns {string} 
         */
        getElementValue: function(xml, tagName) {
            var element = this.getElement(xml, tagName);
            return element ? element.childNodes[0].nodeValue : null;
        },

        /**
         * Show MessageDialog.
         * 
         * @param {String} str 
         * @returns {void} 
         */
        messageDialog: function(str) {
            new Windows.UI.Popups.MessageDialog(str).showAsync();
        }
    }
);

/**
 * using keyword.<br/>
 * using(someVarComputer(), function(someVar) {});
 * 
 * @param {something} arg 
 * @param {function(something)} func 
 * @returns {void} 
 */
var using = function(arg, func) {
    setTimeout(function() {
        func(arg);
    }, 1000);
};