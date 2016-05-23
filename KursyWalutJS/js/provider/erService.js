"use strict";

var ErService = WinJS.Class.define(
    function(erProvider) {
        this._erProvider = erProvider;

    },
    {
        initCacheAsync: function(progress) {
            var basePromise = (typeof this._erProvider.initCacheAsync === "function")
                ? this._erProvider.initCacheAsync(progress)
                : new WinJS.Promise.wrap(0);

            return basePromise.then(function() {
                progress.reportProgress(1.00);
                return new WinJS.Promise.wrap(0);
            });
        },

        flushCacheAsync: function(progress) {
            var basePromise = (typeof this._erProvider.flushCacheAsync === "function")
                ? this._erProvider.flushCacheAsync(progress)
                : new WinJS.Promise.wrap(0);

            return basePromise .then(function() {
                progress.reportProgress(1.00);
                return new WinJS.Promise.wrap(0);
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
                    var firstYear = years[0];
                    return self.getAvailableDaysAsync(firstYear, progress.subPercent(0.40, 1.00));
                })
                .then(function(days) {
                    progress.reportProgress(1.00);
                    return new WinJS.Promise.wrap(days[0]);
                });
        },

        getLastAvailableDayAsync: function(progress) {
            var self = this;

            return self
                .getAvailableYearsAsync(progress.subPercent(0.00, 0.40))
                .then(function(years) {
                    var lastYear = years.slice(-1)[0];
                    return self.getAvailableDaysAsync(lastYear, progress.subPercent(0.40, 1.00));
                })
                .then(function(days) {
                    var lastDay = days.slice(-1)[0];
                    progress.reportProgress(1.00);
                    return new WinJS.Promise.wrap(lastDay);
                });
        },

        getAllAvailableDaysAsync: function(progress) {
            var self = this;

            return self
                .getAvailableYearsAsync(progress.subPercent(0.00, 0.05))
                . then(function(years) {
                    var firstYear = years[0];
                    var lastYear = years.slice(-1)[0];

                    return self._getDaysBetweenYearsAsync(firstYear, lastYear, progress.subPercent(0.05, 1.00));
                })
                .then(function(days) {
                    progress.reportProgress(1.00);
                    return new WinJS.Promise.wrap(days);
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
                        return er.currency.equals(currency);
                    })[0];

                    return new WinJS.Promise.wrap(firstOrDefault);
                });
        },

        getExchangeRateAvaragedHistoryAsync: function(currency, startDay, endDay, expectedSize, progress) {
            var self = this;

            return self.
                _getDaysBetweenYearsAsync(startDay.year(), endDay.year(), progress.subPercent(0.00, 0.20))
                .then(function(availableDays) {
                    var properDays = availableDays.filter(function(day) {
                        return (day >= startDay) && (day <= endDay);
                    });

                    var averaged = Utils.averaged(properDays, expectedSize);
                    return self._getExchangeRatesInDaysAsync(averaged, currency, progress.subPercent(0.20, 1.00));
                })
                .then(function(erInDays) {
                    progress.reportProgress(1.00);
                    return new WinJS.Promise.wrap(erInDays);
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
                .then(function(args) {
                    progress.reportProgress(1.00);
                    var flattenArgs = Utils.flatArray(args);
                    return new WinJS.Promise.wrap(flattenArgs);
                });
        },

        _getExchangeRatesInDaysAsync: function(days, currency, progress) {
            var self = this;

            var waitFor = 10;

            var loop = function(iStart, prevResult) {
                prevResult = prevResult || [];

                return new WinJS.Promise(function(complete, error) {
                    var work = [];
                    var iEnd = Math.min(iStart + waitFor, days.length);

                    for (var d = 0; d < iEnd; d++) {
                        var day = days[d];
                        var prog = progress.subPart(d, days.length);
                        work.push(self.getExchangeRateAsync(currency, day, prog));
                    }

                    WinJS.Promise.join(work)
                        .done(function(args) {
                            var flattenArgs = Utils.flatArray([iEnd, args, prevResult]);
                            complete(flattenArgs);
                        }, function(e) {
                            error(e);
                        });
                });
            };

            return loop(0);

//            var loop2 = function() {
//                return new WinJS.Promise(function(complete, error) {
//                    loop(0).then(function(args) {
//                        if (args[0] !== days.length) {
//                            return loop(args[0] + 1, args.slice(1));
//                        }
//                    });
//                });
//            };
//            
//            loop(0).then(function (args) {
//                if (args[0] !== days.length) {
//                    return loop(args[0] + 1, args.slice(1));
//                }
//            });}

//            for (var i = 0; i < days.length; i++) {
//                var day = days[i];
//                var prog = progress.subPart(i, days.length);
//                var isCheckpoint = ((i % waitFor === 0) || (i === day.length - 1));
//
//                work.push(self.getExchangeRateAsync(currency, day, prog));
//
//                if (isCheckpoint) {
//                    var workClone = Utils.cloneArray(work);
//                    var progressPoint = (i + 1.00) / days.length;
//
//                    promises = promises.then(function() {
//                        return WinJS.Promise.join(workClone)
//                            .then(function(args) {
//                                progress.reportProgress(progressPoint);
//                                var flattenArgs = [].concat.apply([], args);
//                                return new WinJS.Promise.wrap(flattenArgs);
//                            });
//                    });
//
//                }
//
//                if ((days.length > 10) && (i % (days.length / 10) === 0)) {
//                    console.log("DL-" + days.length + "-" + i);
//                }
//            }


        }


    },
    {
    
    }
);