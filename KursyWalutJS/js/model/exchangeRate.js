"use strict";

var ExchangeRate = WinJS.Class.define(
    function(day, currency, averageRate) {
        this.day = day;
        this.currency = currency;
        this.averageRate = averageRate;
    },
    {
        toString: function() {
            return "Day: " + this.day + ", Currency" + this.currency + ", AverageRate: " + this.averageRate;
        }
    },
    {
    
    }
);