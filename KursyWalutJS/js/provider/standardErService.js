"use strict";

var ErService = WinJS.Class.define(
    function(erProvider) {
        this._erProvider = erProvider;

    },
    {
        initCacheAsync: function(progress) {
            var basePromise = (typeof this._erProvider.initCacheAsync === "function")
                ? this._erProvider.initCacheAsync(progress)
                : WinJS.Promise.wrap(0);

            return basePromise.then(function() {
                progress.reportProgress(1.00);
                return WinJS.Promise.wrap(0);
            });
        },

        flushCacheAsync: function(progress) {
            var basePromise = (typeof this._erProvider.flushCacheAsync === "function")
                ? this._erProvider.flushCacheAsync(progress)
                : WinJS.Promise.wrap(0);

            return basePromise.then(function() {
                progress.reportProgress(1.00);
                return WinJS.Promise.wrap(0);
            });
        },

        getAvailableYearsAsync: function(progress) {
            return this._erProvider.getAvailableYearsAsync(progress);
        },

        getAvailableDaysAsync: function(year, progress) {
            return this._erProvider.getAvailableDaysAsync(year, progress);
        },

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

        getExchangeRatesAsync: function(day, progress) {
            return this._erProvider.getExchangeRatesAsync(day, progress);
        },

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

        _getExchangeRatesInDaysAsync: function(days, currency, progress) {
            var self = this;
            var waitFor = 30;
            var waitForMax = 150;
            var timePerLoopMs = 3000;
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

                for (var d = iStart; d < iEnd; d++) {
                    var prog = progress.subPart(d, days.length);
                    work.push(self.getExchangeRateAsync(currency, days[d], prog));
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