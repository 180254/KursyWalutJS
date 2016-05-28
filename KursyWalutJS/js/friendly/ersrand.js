"use strict";

/**
 * ExchangeRate average rate randomizer.<br/>
 * Change that value every {@link timeMs} seconds.
 * @constructor
 */
var ErsRandomizer = WinJS.Class.define(

    /**
     * @constructor
     * @param {WinJS.Binding.List<ExchangeRate>} ers
     * @returns {ErsRandomizer} 
     */
    function(ers) {
        this.timeMs = 300;
        this._ers = ers;
        this._started = false;
        this._running = false;
    },
    {
        /**
         * Schedule randomizing start.
         * @returns {void} 
         */
        start: function() {
            var self = this;

            self._started = true;
            self._running = true;
            setTimeout(function() { self._go(); }, 0);
        },

        /**
         * (private) Randomizing loop.
         * @returns {void} 
         */
        _go: function() {
            var self = this;

            if (self._started && self._ers.length > 0) {
                var $avgList = $("#avg-list .win-viewport");
                var erHeight = $(".avg-item:first").closest(".win-container").outerHeight(true);

                var iFirstVisibleEr = Math.floor($avgList.scrollTop() / erHeight);
                var iCountVisibleEr = Math.ceil($avgList.outerHeight() / erHeight) + 1;
                var iLastVisibleEr = Math.min(iFirstVisibleEr + iCountVisibleEr, self._ers.length);

                var diff = Utils.getRandomArbitrary(-1, 1);
                for (var i = iFirstVisibleEr; i < iLastVisibleEr; i++) {
                    var oldEr = self._ers.getAt(i);
                    var newEr = new ExchangeRate(oldEr.dat, oldEr.currency, oldEr.averageRate + diff);
                    self._ers.setAt(i, newEr);
                }

                if (self._started) {
                    setTimeout(function() { self._go(); }, this.timeMs);
                } else {
                    this._started = false;
                    this._running = false;
                }
            } else {
                this._running = false;
            }
        },

        /**
         * Schedule randomizing stop.<br/>
         * Warning: use {@link waitUntilStopped} promise to be sure randomize already stopped.
         * @returns {void} 
         */
        stop: function() {
            this._started = false;
        },

        /**
         * Primise which reports complete if randomizer is not longer running.<br/>
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