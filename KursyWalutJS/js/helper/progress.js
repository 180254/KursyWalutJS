"use strict";

var Progress = WinJS.Class.define(
    function(maxValue, callback, parent) {
        this.maxValue = maxValue;
        this._callback = callback;
        this._parent = parent;
        this._lastReported = 0;
        this._lastNotified = 0;
    },
    {
        reportProgress: function(percent) {
            var percentAsVal = this._computePercent(percent);
            var incrValue = percentAsVal - this._lastReported;
            if (incrValue <= 0) this.incrValue = 0;

            this._incrementProgress(incrValue);
        },

        subPercent: function(percentFrom, percentTo) {
            return new Progress(
                this._computePercent(percentTo - percentFrom),
                this._callback,
                this
            );
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

            var isInit = value === 0;
            var isEnoughChange = percentageChange > 1.00;
            var isMaxNotNotified = (value === this.maxValue) && (this._lastNotified !== value);

            if (isInit || isEnoughChange || isMaxNotNotified) {
                this._lastNotified = value;
                this._callback(this, value);
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
                ", _lastReported: " +
                this._lastReported +
                ", _lastNotified: " +
                this._lastNotified;
        }
    },
    {
    
    }
);