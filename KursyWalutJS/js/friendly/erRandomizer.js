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

            if (self.started) {
                for (var i = 0; i < self.ers.length; i++) {
                    var oldEr = self.ers.getAt(i);
                    var diff = getRandomArbitrary(-1 * oldEr.averageRate, 1 * oldEr.averageRate);
                    var newEr = new ExchangeRate(oldEr.dat, oldEr.currency, oldEr.averageRate + diff);
                    self.ers.setAt(i, newEr);
                }

                if (self.started && self.ers.length > 0) {
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