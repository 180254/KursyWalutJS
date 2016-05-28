"use strict";

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

var ErRandomizer = WinJS.Class.define(
    function(ers) {
        this.timeMs = 300;
        this.ers = ers;
        this.started = false;
        this.running = false;
    },
    {
        start: function() {
            var self = this;

            self.started = true;
            self.running = true;
            setTimeout(function() { self._go(); });
        },

        _go: function() {
            var self = this;

            if (self.started && self.ers.length > 0) {
                var $avgList = $("#avg-list .win-viewport");
                var erHeight = $(".avg-item:first").closest(".win-container").outerHeight(true);

                var iFirstVisibleEr = Math.floor($avgList.scrollTop() / erHeight);
                var iCountVisibleEr = Math.ceil($avgList.outerHeight() / erHeight);
                var iLastVisibleEr = Math.min(iFirstVisibleEr + iCountVisibleEr, self.ers.length);

                for (var i = iFirstVisibleEr; i < iLastVisibleEr; i++) {
                    var oldEr = self.ers.getAt(i);
                    var diff = getRandomArbitrary(-0.5 * oldEr.averageRate, 0.5 * oldEr.averageRate);
                    var newEr = new ExchangeRate(oldEr.dat, oldEr.currency, oldEr.averageRate + diff);
                    self.ers.setAt(i, newEr);
                }

                if (self.started) {
                    setTimeout(function() {
                        self._go();
                    }, this.timeMs);
                } else {
                    this.started = false;
                    this.running = false;
                }
            } else {
                this.running = false;
            }
        },

        stop: function() {
            this.started = false;
        },

        waitUntilStopped: function() {
            var self = this;

            var isRunning = function() {
                return self.running;
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