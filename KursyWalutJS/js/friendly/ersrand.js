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

            self.next();
        }
    },
    {
    
    }
);