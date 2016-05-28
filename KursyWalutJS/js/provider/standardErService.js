"use strict";

/**
 * Service, which provide methods not directly available from ErProvider,<br/>
 * but easy to compute and usable in app.
 * @constructor 
 */
var StandardErService = WinJS.Class.define(

    /**
     * @param {(Nbp|Cache)ErProvider} erProvider 
     * @returns {StandardErService} 
     */
    function(erProvider) {
        this._erProvider = erProvider;

    },
    {
        /**
         * @param {Progress} progress 
         * @returns {WinJS.Promise} 
         */
        initCacheAsync: function(progress) {
            return this._erProvider.initCacheAsync(progress)
                .then(function() {
                    progress.reportProgress(1.00);
                    return WinJS.Promise.wrap(0);
                });
        },

        /**
         * @param {Progress} progress 
         * @returns {WinJS.Promise} 
         */
        flushCacheAsync: function(progress) {
            return this._erProvider.flushCacheAsync(progress)
                .then(function() {
                    progress.reportProgress(1.00);
                    return WinJS.Promise.wrap(0);
                });
        },

        /**
         * @param {Progress} progress 
         * @returns {WinJS.Promise<number[]>} 
         */
        getAvailableYearsAsync: function(progress) {
            return this._erProvider.getAvailableYearsAsync(progress);
        },

        /**
         * @param {number} year
         * @param {Progress} progress 
         * @returns {WinJS.Promise<Date[]>} 
         */
        getAvailableDaysAsync: function(year, progress) {
            return this._erProvider.getAvailableDaysAsync(year, progress);
        },

        /**
         * @param {Progress} progress 
         * @returns {WinJS.Promise<Date>} 
         */
        getFirstAvailableDayAsync: function(progress) {
            var self = this;

            return self
                .getAvailableYearsAsync(progress.subPercent(0.00, 0.40))
                .then(function(years) {
                    var firstYear = Utils.first(years);
                    return self.getAvailableDaysAsync(firstYear, progress.subPercent(0.40, 1.00));
                })
                .then(function(days) {
                    var firstDay = Utils.first(days);
                    progress.reportProgress(1.00);

                    return WinJS.Promise.wrap(firstDay);
                });
        },

        /**
         * @param {Progress} progress 
         * @returns {WinJS.Promise<Date>} 
         */
        getLastAvailableDayAsync: function(progress) {
            var self = this;

            return self
                .getAvailableYearsAsync(progress.subPercent(0.00, 0.40))
                .then(function(years) {
                    var lastYear = Utils.last(years);
                    return self.getAvailableDaysAsync(lastYear, progress.subPercent(0.40, 1.00));
                })
                .then(function(days) {
                    var lastDay = Utils.last(days);
                    progress.reportProgress(1.00);

                    return WinJS.Promise.wrap(lastDay);
                });
        },

        /**
         * @param {Progress} progress 
         * @returns {WinJS.Promise<Date[]>} 
         */
        getAllAvailableDaysAsync: function(progress) {
            var self = this;

            return self
                .getAvailableYearsAsync(progress.subPercent(0.00, 0.05))
                . then(function(years) {
                    var firstYear = Utils.first(years);
                    var lastYear = Utils.last(years);

                    return self._getDaysBetweenYearsAsync(firstYear, lastYear, progress.subPercent(0.05, 1.00));
                })
                .then(function(days) {
                    progress.reportProgress(1.00);
                    return WinJS.Promise.wrap(days);
                });
        },

        /**
         * @param {Date} day
         * @param {Progress} progress 
         * @returns {WinJS.Promise<ExchangeRate[]>} 
         */
        getExchangeRatesAsync: function(day, progress) {
            return this._erProvider.getExchangeRatesAsync(day, progress);
        },

        /**
         * @param {Currency} currency
         * @param {Date} day
         * @param {Progress} progress 
         * @returns {WinJS.Promise<ExchangeRate>} 
         */
        getExchangeRateAsync: function(currency, day, progress) {
            var self = this;

            return self
                .getExchangeRatesAsync(day, progress)
                .then(function(erList) {
                    var firstOrDefault = erList.filter(function(er) {
                        return Currency.equals(er.currency, currency);
                    })[0];

                    return WinJS.Promise.wrap(firstOrDefault);
                });
        },

        /**
         * @param {Currency} currency 
         * @param {Date} startDay 
         * @param {DayDate} endDay 
         * @param {number} expectedSize 
         * @param {Progress} progress 
         * @returns {WinJS.Promise<ExchangeRate[]>} 
         */
        getExchangeRateAvaragedHistoryAsync: function(currency, startDay, endDay, expectedSize, progress) {
            var self = this;

            return self.
                _getDaysBetweenYearsAsync(startDay.getFullYear(), endDay.getFullYear(), progress.subPercent(0.00, 0.20))
                .then(function(availableDays) {
                    var properDays = availableDays.filter(function(day) {
                        return (day >= startDay) && (day <= endDay);
                    });

                    return WinJS.Promise.wrap(properDays);
                })
                .then(function(properDays) {
                    var averagedDays = Utils.averaged(properDays, expectedSize);
                    return WinJS.Promise.wrap(averagedDays);
                })
                .then(function(averagedDays) {
                    return self._getExchangeRatesInDaysAsync(averagedDays, currency, progress.subPercent(0.20, 1.00));
                })
                .then(function(erInDays) {
                    progress.reportProgress(1.00);
                    return WinJS.Promise.wrap(erInDays);
                });
        },

        /**
         * @param {number} startYear 
         * @param {number} endYear 
         * @param {Progress} progress 
         * @returns {WinJS.Promise<Date[]>} 
         */
        _getDaysBetweenYearsAsync: function(startYear, endYear, progress) {
            var self = this;

            var years = Utils.rangeEx2(startYear, endYear + 1);
            var promises = [];

            for (var i = 0; i < years.length; i++) {
                var year = years[i];
                var prog = progress.subPart(i, years.length);
                promises.push(self.getAvailableDaysAsync(year, prog));
            }

            return WinJS.Promise.join(promises)
                .then(function(days) {
                    var flattenDays = Utils.flatArray(days);
                    progress.reportProgress(1.00);

                    return WinJS.Promise.wrap(flattenDays);
                });
        },

        /**
         * @param {Date[]} days 
         * @param {Currency} currency 
         * @param {Progress} progress 
         * @returns {WinJS.Promise<ExchangeRate[]>} 
         */
        _getExchangeRatesInDaysAsync: function(days, currency, progress) {
            var self = this;
            var waitFor = 30;
            var waitForMax = 100;
            var timePerLoopMs = 2500;
            var waitForMultiplier = 1.3;

            var logDownloadProgress = function(iDone) {
                console.log("DL-" + days.length + "-" + iDone);
                progress.reportProgress(iDone / days.length);
            };

            var timeStart = null;
            var adjustWaitFor = function() {
                if (new Date() - timeStart < timePerLoopMs) {
                    waitFor = Math.round(waitFor * waitForMultiplier);
                    waitFor = Math.min(waitForMax, waitFor);
                }
                timeStart = new Date();
            };

            var results = [];
            var loop = function(iStart) {
                var work = [];
                var iEnd = Math.min(iStart + waitFor, days.length);

                for (var i = iStart; i < iEnd; i++) {
                    var prog = progress.subPart(i, days.length);
                    work.push(self.getExchangeRateAsync(currency, days[i], prog));
                }

                return WinJS.Promise.join(work)
                    .then(function(result) {
                        results.push(result);
                        logDownloadProgress(iEnd);
                        adjustWaitFor();

                        if (iEnd !== days.length) {
                            return loop(iEnd);
                        } else {
                            var flattenResults = Utils.flatArray(results);
                            return WinJS.Promise.wrap(flattenResults);
                        }
                    });
            };

            logDownloadProgress(0);
            timeStart = new Date();
            return loop(0);
        }
    },
    {
    
    }
);