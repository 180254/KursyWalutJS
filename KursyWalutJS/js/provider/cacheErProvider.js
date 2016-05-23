"use strict";

var CacheErProvider = WinJS.Class.define(
    function(erProvider, cache) {
        this._erProvider = erProvider;
        this._cache = cache;
        this._cacheChanged = {};
        this._availYears = null;
        this._yearToDays = null;
        this._dayToEr = null;

        this._resetCacheChanges();
    },
    {
        initCacheAsync: function(progress) {
            var self = this;

            return self
                ._cache.getAsync("_availYears")
                .then(function(availYears) {
                    self._availYears = availYears || [];
                    progress.reportProgress(0.10);

                    return self._cache.getAsync("_yearToDays");
                })
                .then(function(yearToDays) {
                    self._yearToDays = yearToDays || {};
                    progress.reportProgress(0.20);

                    return self._cache.getAsync("_dayToEr");
                })
                .then(function(dayToEr) {
                    self._dayToEr = dayToEr || {};
                    progress.reportProgress(0.50);

                    var promise = (typeof self._erProvider.initCacheAsync === "function")
                        ? self._erProvider.initCacheAsync(progress.subPercent(0.50, 1.00))
                        : WinJS.Promise.wrap(0);

                    return promise;
                })
                .then(function() {
                    progress.reportProgress(1.00);
                });

        },

        flushCacheAsync: function(progress) {
            var self = this;
            var promises = [];

            if (self._cacheChanged["_availYears"] === true) {
                promises.push(self._cache.storeAsync("_availYears", self._availYears));
            }

            if (self._cacheChanged["_yearToDays"] === true) {
                promises.push(self._cache.storeAsync("_yearToDays", self._yearToDays));
            }

            if (self._cacheChanged["_dayToEr"] === true) {
                promises.push(self._cache.storeAsync("_dayToEr", self._dayToEr));
            }

            var promise = (typeof self._erProvider.flushCacheAsync === "function")
                ? this._erProvider.flushCacheAsync(progress.subPercent(0.50, 1.00))
                : WinJS.Promise.wrap(0);
            promises.push(promise);

            return WinJS.Promise.join(promises);
        },

        getAvailableYearsAsync: function(progress) {
            var self = this;

            if (self._availYears) {
                return WinJS.Promise.wrap(self._availYears);
            } else {
                return self._calculateAvailableYearsAsync(progress);
            }
        },

        getAvailableDaysAsync: function(year, progress) {
            var self = this;

            return self._getOrCalculateAsync(
                "_yearToDays", self._yearToDays, year,
                function() {
                    return self._erProvider.getAvailableDaysAsync(year, progress);
                },
                progress);
        },

        getExchangeRatesAsync: function(day, progress) {
            var self = this;

            return self._getOrCalculateAsync(
                "_dayToEr", self._dayToEr, day,
                function() {
                    return self._erProvider.getExchangeRatesAsync(day, progress);
                },
                progress);
        },

        _calculateAvailableYearsAsync: function(progress) {
            var self = this;

            this._cacheChanged["_availYears"] = true;
            return self._erProvider.getAvailableYearsAsync(progress);
        },

        _getOrCalculateAsync: function(dictName, dict, key, valuePromiseFunc, progress) {
            var self = this;

            if (dict[key]) {
                progress.reportProgress(1.00);
                return WinJS.Promise.wrap(dict[key]);
            }

            self._cacheChanged[dictName] = true;

            return valuePromiseFunc().then(function(value) {
                dict[key] = value;
                return WinJS.Promise.wrap(value);
            });
        },

        _resetCacheChanges: function() {
            this._cacheChanged["_availYears"] = false;
            this._cacheChanged["_yearToDays"] = false;
            this._cacheChanged["_dayToEr"] = false;
        }
    },
    {
    
    }
);