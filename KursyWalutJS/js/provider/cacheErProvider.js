"use strict";

/**
 * Decorator for exchange rate provider.<br/>
 * Now values are cached, and aren't downloaded twice.
 * @constructor 
 */
var CacheErProvider = WinJS.Class.define(

    /**
     * @constructor 
     * @param {(Nbp)ErProvider} erProvider 
     * @param {(InMem|Ls)Cache)} cache 
     * @returns {CacheErProvider} 
     */
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
        /**
         * @param {Progress} progress 
         * @returns {WinJS.Promise} 
         */
        initCacheAsync: function(progress) {
            var self = this;
            var promises = [];

            promises.push(self._cache.getAsync("_availYears"));
            promises.push(self._cache.getAsync("_yearToDays"));
            promises.push(self._cache.getAsync("_dayToEr"));

            var subProgress = progress.subPercent(0.50, 1.00);
            promises.push(self._erProvider.initCacheAsync(subProgress));

            return WinJS.Promise.join(promises)
                .then(function(result) {
                    self._availYears = result[0] || [];
                    self._yearToDays = result[1] || {};
                    self._dayToEr = result[2] || {};

                    progress.reportProgress(1.00);
                    return WinJS.Promise.wrap(0);
                });
        },

        /**
         * @param {Progress} progress 
         * @returns {WinJS.Promise} 
         */
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

            var subProgress = progress.subPercent(0.50, 1.00);
            promises.push(this._erProvider.flushCacheAsync(subProgress));

            return WinJS.Promise.join(promises)
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
            var self = this;

            if (self._availYears.length > 0) {
                return WinJS.Promise.wrap(self._availYears);
            } else {
                return self._erProvider
                    .getAvailableYearsAsync(progress)
                    .then(function(availYears) {
                        self._cacheChanged["_availYears"] = true;
                        self._availYears = availYears;
                        return WinJS.Promise.wrap(self._availYears);
                    });
            }
        },

        /**
         * @param {number} year
         * @param {Progress} progress 
         * @returns {WinJS.Promise<Date[]>} 
         */
        getAvailableDaysAsync: function(year, progress) {
            var self = this;

            return self._getOrCalculateAsync(
                "_yearToDays", self._yearToDays, year,
                function() {
                    return self._erProvider.getAvailableDaysAsync(year, progress);
                },
                progress);
        },

        /**
         * @param {Date} day
         * @param {Progress} progress 
         * @returns {WinJS.Promise<ExchangeRate[]>} 
         */
        getExchangeRatesAsync: function(day, progress) {
            var self = this;

            return self._getOrCalculateAsync(
                "_dayToEr", self._dayToEr, day.toJSON(),
                function() {
                    return self._erProvider.getExchangeRatesAsync(day, progress);
                },
                progress);
        },

        /**
         * @param {string} dictName 
         * @param {Object<string, T>} dict 
         * @param {string} key 
         * @param {function() : WinJS.Promise<T>} valuePromiseFunc 
         * @param {Progress} progress 
         * @returns {WinJS.Promise}
         */
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

        /**
         * @returns {void} 
         */
        _resetCacheChanges: function() {
            this._cacheChanged["_availYears"] = false;
            this._cacheChanged["_yearToDays"] = false;
            this._cacheChanged["_dayToEr"] = false;
        }
    },
    {
    
    }
);