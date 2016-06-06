"use strict";

/**
 * ExchangeRate average rate randomizer.
 * @constructor
 */
var ErsRandomizer = WinJS.Class.derive(
    FancyLoop,

    /**
     * @constructor
     * @param {WinJS.Binding.List<ExchangeRate>} ers
     * @returns {ErsRandomizer} 
     */
    function(ers) {
        this.timeMs = 300;
        this._ers = ers;
    },
    {

        /**
         * (private) Randomizing loop.
         * @returns {void} 
         */
        _go: function() {
            var self = this;

            if (!(self._started && self._ers.length > 0)) {
                self._running = false;
                return;
            }

            WinJS.Promise.timeout(0)
                .then(function() {
                    var $avgList = $("#avg-list .win-viewport");
                    var erHeight = $(".avg-item:first").closest(".win-container").outerHeight(true);

                    return WinJS.Promise.wrap({ avgList: $avgList, erHeight: erHeight });
                })
                .then(function(p) {
                    var iFirstVisibleEr = Math.floor(p.avgList.scrollTop() / p.erHeight);
                    var iCountVisibleEr = Math.ceil(p.avgList.outerHeight() / p.erHeight) + 1;
                    var iLastVisibleEr = Math.min(iFirstVisibleEr + iCountVisibleEr, self._ers.length);

                    return WinJS.Promise.wrap({ iFirstVisibleEr: iFirstVisibleEr, iLastVisibleEr: iLastVisibleEr });

                })
                .then(function(p) {
                    var diff = Utils.getRandomArbitrary(-1, 1);
                    for (var i = p.iFirstVisibleEr; i < p.iLastVisibleEr; i++) {
                        var oldEr = self._ers.getAt(i);
                        var newEr = new ExchangeRate(oldEr.dat, oldEr.currency, oldEr.averageRate + diff);
                        self._ers.setAt(i, newEr);
                    }

                    return WinJS.Promise.wrap(0);
                })
                .done(function() {
                    self.next();;
                });
        }
    },
    {
    
    }
);