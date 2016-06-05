"use strict";

/**
 * Model for ExchangeRate.
 * @constructor 
 */
var ExchangeRate = WinJS.Class.define(

    /**
     * @constructor 
     * @param {Date} day 
     * @param {Currency} currency 
     * @param {number} averageRate 
     * @returns {ExchangeRate} 
     */
    function(day, currency, averageRate) {
        this.day = day;
        this.currency = currency;
        this.averageRate = averageRate;
    },
    {
        /**
         * @returns {string} 
         */
        toString: function() {
            return "[day: " +
                moment(this.day).format("YYYY-MM-DD") +
                ", currency" +
                this.currency +
                ", averageRate: " +
                this.averageRate +
                "]";
        }
    },
    {
    
    }
);