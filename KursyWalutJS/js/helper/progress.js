"use strict";

/**
 * Progress reported.<br/>
 * Works properly in multithread/async environment.
 * @constructor 
 */
var Progress = WinJS.Class.define(

    /**
     * @constructor 
     * @param {number} maxValue - max progress value (for 100%)
     * @param {Progress} [parent] - (private) parent progress
     * @returns {Progress} 
     */
    function(maxValue, parent) {
        this.maxValue = maxValue;
        this._observers = parent ? parent._observers : [];
        this._parent = parent;
        this._lastReported = 0;
        this._lastNotified = 0;
    },
    {
        /**
         * Add method for observer pattern.<br/>
         * Use to subscribe progress changes.<br/>
         * Only progress >= 1% are reported to observers.
         * 
         * @param {function(Progress, number)} observer 
         * @returns {void} 
         */
        addObserver: function(observer) {
            this._observers.push(observer);
        },

        /**
         * Function for reporting method to report computing progress.
         * 
         * @param {number} percent 
         * @returns {void} 
         */
        reportProgress: function(percent) {
            var percentAsVal = this._computePercent(percent);
            var incrValue = percentAsVal - this._lastReported;
            if (incrValue <= 0) this.incrValue = 0;

            this._incrementProgress(incrValue);
        },

        /**
         * Sub progress factory method.<br/>
         * Useful to report progress in subtasks.
         * 
         * @param {number} percentFrom - 0 >= value >= 1.00
         * @param {number} percentTo - 0 >= value >= 1.00, {@link percentFrom} > {@link percentTo}
         * @returns {Progress} - sub progress
         */
        subPercent: function(percentFrom, percentTo) {
            return new Progress(
                this._computePercent(percentTo - percentFrom),
                this._callback,
                this
            );
        },

        /**
         * Sub progress factory method.<br/>
         * Useful to report progress in subtasks.
         * 
         * @param {number} partIndex - 0 >= partIndex > {@link partCount}
         * @param {number} partCount - number of parts, partCount > 0
         * @returns {Progress} - sub progress
         */
        subPart: function(partIndex, partCount) {
            return this.subPercent(0, 1.0 / partCount);
        },

        /**
         * (private) Increment progress & notify about change, if required.
         * 
         * @param {number} incrValue - incrValue <= ({@link maxValue} - {@link _lastReported})
         * @returns {void} 
         */
        _incrementProgress: function(incrValue) {
            var currentValue = this._lastReported += incrValue;
            if (this._parent) this._parent._incrementProgress(incrValue);
            else this._notifyChange(currentValue);
        },

        /**
         * (private) Notify observers about progress value change, if required.<br/>
         * Observers are notified if:<br/>
         * - it is progress init<br/>
         * - change from last notification is >= 1%<br/>
         * - progress value equals max value
         * 
         * @param {number} value
         * @returns {void} 
         */
        _notifyChange: function (value) {
            var self = this;

            var change = value - this._lastNotified;
            var percentageChange = change / this.maxValue * 100;

            var isInit = value === 0;
            var isEnoughChange = percentageChange > 1.00;
            var isMaxNotNotified = (value === this.maxValue) && (this._lastNotified !== value);

            if (isInit || isEnoughChange || isMaxNotNotified) {
                this._lastNotified = value;

                this._observers.forEach(function(observer) {
                    observer(self, value);
                });
            }
        },

        /**
         * (private) Compute percent of this.maxValue.
         * 
         * @param {number} percent - 0 >= value >= 1.00
         * @returns {number} - rounded result
         */
        _computePercent: function(percent) {
            return Math.round(this.maxValue * percent);
        },

        /**
         * @returns {string} 
         */
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