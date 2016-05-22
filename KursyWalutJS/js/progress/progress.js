"use strict";

var Progress = WinJS.Class.define(
    function(maxValue, parent) {
        this.maxValue = maxValue;
        this._parent = parent;
        this._lastReported = 0;
        this._lastNotified = 0;
    },
    {
        reportProgress: function(percent) {
            if (percent < 0) this._notifyChange(-1);
            var computePercentVal = this._computePercent(percent);
            var incrValue = computePercentVal - this._lastReported;
            if (incrValue <= 0) this.incrValue = 0;

            this._incrementProgress(incrValue);
        },

        subPercent: function(percentFrom, percentTo) {
            return new Progress(this.conputePercent(percentFrom, percentTo), this);
        },

        subPart: function(partIndex, partCount) {
            return this.subPercent(0, 1.0 / partCount);
        },

        _incrementProgress: function(incrValue) {
            var currentValue = this._lastReported += incrValue;
            if (this._parent) this._parent._incrementProgress(incrValue);
            else this._notifyChange(currentValue);
        },

        _notifyChange: function(value) {
            var change = value - this._lastNotified;
            var percentageChange = change / this.maxValue * 100;
            var isMaxNotNotified = (value === this.maxValue) && (this._lastNotified !== value);

            if (percentageChange > 1.00 || isMaxNotNotified) {
                this._lastNotified = value;
                console.log(value);
            }
        },

        _computePercent: function(percent) {
            return Math.round(this.maxValue * percent);
        },

        toString: function() {
            return "maxValue: " +
                this.maxValue +
                ", _parent: " +
                this._parent +
                ", _lastResported: " +
                this._lastResported +
                ", _lastNotified: " +
                this._lastNotified;
        }
    },
    {
    
    }
);