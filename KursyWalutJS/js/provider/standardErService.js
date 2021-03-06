﻿"use strict";

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

        // --------PROVIDER-METHODS---------------------------------------------------

        /**
         * @param {Progress} progress 
         * @returns {WinJS.Promise} 
         */
        initCacheAsync: function(progress) {
            return U.wp(this._erProvider.initCacheAsync(progress));
        },

        /**
         * @param {Progress} progress 
         * @returns {WinJS.Promise} 
         */
        flushCacheAsync: function(progress) {
            return U.wp(this._erProvider.flushCacheAsync(progress));
        },

        /**
         * @param {Progress} progress 
         * @returns {WinJS.Promise<number[]>} 
         */
        getAvailableYearsAsync: function(progress) {
            return U.wp(this._erProvider.getAvailableYearsAsync(progress));
        },

        /**
         * @param {number} year
         * @param {Progress} progress 
         * @returns {WinJS.Promise<Date[]>} 
         */
        getAvailableDaysAsync: function(year, progress) {
            return U.wp(this._erProvider.getAvailableDaysAsync(year, progress));
        },

        /**
         * @param {Date} day
         * @param {Progress} progress 
         * @returns {WinJS.Promise<ExchangeRate[]>} 
         */
        getExchangeRatesAsync: function(day, progress) {
            return U.wp(this._erProvider.getExchangeRatesAsync(day, progress));
        },

        // --------SERVICE--METHODS---------------------------------------------------

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

                    return U.wp(firstDay);
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

                    return U.wp(lastDay);
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
                    return U.wp(days);
                });
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

                    return U.wp(firstOrDefault);
                });
        },

        /**
         * @param {Date} startDay 
         * @param {DayDate} endDay 
         * @param {number} expectedSize 
         * @param {Progress} progress 
         * @returns {WinJS.Promise<ExchangeRate[]>} 
         */
        getAvaragedDaysAsync: function(startDay, endDay, expectedSize, progress) {
            var self = this;

            return self.
                _getDaysBetweenYearsAsync(startDay.getFullYear(), endDay.getFullYear(),
                    progress.subPercent(0.00, 0.80))
                .then(function(availableDays) {
                    progress.reportProgress(0.80);

                    var properDays = availableDays.filter(function(day) {
                        return (day >= startDay) && (day <= endDay);
                    });

                    progress.reportProgress(0.90);
                    return U.wp(properDays);
                })
                .then(function(properDays) {
                    var averagedDays = Utils.averaged(properDays, expectedSize);
                    progress.reportProgress(1.00);

                    return U.wp(averagedDays);
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

            return U.wp(WinJS.Promise.join(promises))
                .then(function(days) {
                    var flattenDays = Utils.flatArray(days);
                    progress.reportProgress(1.00);

                    return U.wp(flattenDays);
                });
        },

        /**
         * @param {Date[]} days 
         * @param {Currency} currency 
         * @param {Progress} progress 
         * @param {ExchangeRate[]} ers - array to be filled
         * @returns {WinJS.Promise<ExchangeRate[]>} 
         */
        getExchangeRatesInDaysAsync: function(days, currency, ers, progress) {
            var self = this;

            if (days.length === 0) {
                return WinJS.Promise.wrap(ers);
            }

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

            var loop = function(iStart) {
                var work = [];
                var iEnd = Math.min(iStart + waitFor, days.length);

                for (var i = iStart; i < iEnd; i++) {
                    var prog = progress.subPart(i, days.length);
                    work.push(self.getExchangeRateAsync(currency, days[i], prog));
                }

                return WinJS.Promise.join(work)
                    .then(function(result) {
                        Array.prototype.push.apply(ers, result);

                        logDownloadProgress(iEnd);
                        adjustWaitFor();

                        if (iEnd !== days.length) {
                            return U.wp(loop(iEnd));
                        } else {
                            return U.wp(ers);
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