/// <reference path="~/bower_components/winjs/js/base.js" />
var Progress = WinJS.Class.define(
    function(maxValue, parent) {
        this.maxValue = maxValue;
        this._parent = parent;
        this._lastResported = 0;
        this._lastNotified = 0;
    },
    {
        reportProgress: function(percent) {
            if (percent < 0) this.notifyChange(-1);
            var computePercentVal = this.computePercent(percent);
            var incrValue = computePercentVal - this._lastResported;
            if (incrValue <= 0) this.incrValue = 0;

            this.incrementProgress(incrValue);
        },

        subPercent: function(percentFrom, percentTo) {
            return new Progress(this.conputePercent(percentFrom, percentTo), this);
        },

        subPart: function(partIndex, partCount) {
            return this.subPercent(0, 1.0 / partCount);
        },

        incrementProgress: function(incrValue) {
            var currentValue = this._lastReported += incrValue;
            if (parent == null) this.notifyChange(currentValue);
            else this._parent.incrementProgress(incrValue);
        },

        notifyChange: function(value) {
            var change = value - this._lastNotified;
            var percentageChange = change / this.maxValue * 100;
            var isMaxNotNotified = (value === this.maxValue) && (this._lastNotified !== value);

            if (percentageChange > 1.00 || isMaxNotNotified) {
                this._lastNotified = value;
                console.log(value);
            }
        },

        computePercent: function(percent) {
            return Math.round(this.maxValue * percent);
        }
    },
    {
    
    }
);