"use strict";

/**
 * Model for Currency.
 * @constructor 
 */
var Currency = WinJS.Class.define(

    /**
     * @constructor 
     * @param {string} code 
     * @param {string} name 
     * @param {number} multiplier 
     * @returns {Currency} 
     */
    function(code, name, multiplier) {
        this.code = code;
        this.name = name;
        this.multiplier = multiplier;
    },
    {
        /**
         * @returns {string} 
         */
        toString: function() {
            return "[code: " + this.code + ", name: " + this.name + ", multiplier: " + this.multiplier + "]";
        }
    },
    {
        /**
         * @static 
         * @param {Currency} curr1 
         * @param {Currency} curr2 
         * @returns {boolean} 
         */
        equals: function(curr1, curr2) {
            return curr1.code === curr2.code;
        },

        /**
         * Factory method for {@link Currency}.<br/>
         * Dummy Currency instance with given code.
         * 
         * @static 
         * @param {string} code 
         * @returns {Currency}
         */
        dummyForCode: function(code) {
            return new Currency(code, "_dummy_", 1);
        }
    }
);