"use strict";

/**
 * Repeat action stopable loop.<br/>
 * Repeat some action every {@link timeMs} seconds.
 * @constructor
 */
var FancyLoop = WinJS.Class.define(

    /**
     * @constructor
     * @returns {StopableLoop} 
     */
    function() {
        this.timeMs = -1;
        this._started = false;
        this._running = false;
    },
    {
        /**
         * Schedule start.
         * @returns {void} 
         */
        start: function() {
            var self = this;

            if (self.timeMs === -1) {
                throw new Error("timeMs has default value!");
            }

            self._started = true;
            self._running = true;
            setTimeout(function() { self._go(); }, 0);
        },

        /**
         * Next loop iteration.
         * @param {boolean} [additionalCond] - if condition is fulfilled loop is always continued
         * @returns {void} 
         */
        next: function(additionalCond) {
            var self = this;
            var addCond = additionalCond !== undefined ? additionalCond : false;

            if (self._started || addCond) {
                setTimeout(function() { self._go(); }, this.timeMs);
            } else {
                this._started = false;
                this._running = false;
            }
        },

        /**
         * Schedule stop.<br/>
         * Warning: use {@link waitUntilStopped} promise 
         * to be sure that loop is already stopped.
         * @returns {void} 
         */
        stop: function() {
            this._started = false;
        },

        /**
         * Primise which reports complete
         * if loop is not longer running.<br/>
         * Warning: Use {@link stop} method first.
         * @returns {WinJS.Promise} 
         */
        waitUntilStopped: function() {
            var self = this;

            var isRunning = function() {
                return self._running;
            };

            return new WinJS.Promise(function(complete) {
                Utils.waitFor(isRunning, false, self.timeMs, function() {
                    complete();
                });
            });
        }
    },
    {
    
    }
);