"use strict";

var ExchangeRate = WinJS.Class.define(
    function(day, currency, averageRate) {
        this.__type = "ExchangeRate";
        this.day = day;
        this.currency = currency;
        this.averageRate = averageRate;
    },
    {
        toString: function() {
            return "[day: " +
                this.day.format() +
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