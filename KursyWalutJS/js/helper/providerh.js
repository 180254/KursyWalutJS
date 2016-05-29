"use strict";

/**
 * Helper to simplify usage of er providers.
 * @constructor 
 */
var ProviderHelper = WinJS.Class.define(
    /**
     * @constructor 
     * @param {(LsCache|InMemCache)} cache 
     * @param {Object} progressParams 
     * @param {number} progressParams.max 
     * @param {function()} progressParams.observer 
     * @returns {ProviderHelper} 
     */
    function(cache, progressParams) {
        var nbpProvider = new NbpErProvider(cache);
        var cacheProvider = new CacheErProvider(nbpProvider, cache);

        this._erService = new StandardErService(cacheProvider);
        this._progressParams = progressParams;
        this._cacheAlreadyInit = false;
    },
    {
        /**
         * @returns {ProviderHelper2} 
         */
        helper2: function() {
            return new ProviderHelper2(this);
        }
    },
    {
    
    }
);

/**
 * Helper to simplify usage of er providers.<br/>
 * Instance for one sequence of actions (progress from 0% to 100%).
 * @constructor 
 */
var ProviderHelper2 = WinJS.Class.define(
    /**
     * @constructor 
     * @param {ProviderHelper} providerHelper 
     * @returns {ProviderHelper2} 
     */
    function(providerHelper) {
        this.PV = { onStart: 0.03, initCache: 0.05, app: 0.95, flushCache: 1.00 };
        this._providerHelper = providerHelper;

        this._progress = new Progress(this._providerHelper._progressParams.max);
        this._progress.addObserver(this._providerHelper._progressParams.observer);
        this._progress.reportProgress(this.PV.onStart);

        this.erService = this._providerHelper._erService;
        this.progress = this._progress.subPercent(this.PV.initCache, this.PV.app);
    },
    {
        /**
         * @returns {WinJS.Promise} 
         */
        initCacheAsync: function() {
            var self = this;
            var promise;

            if (!self._providerHelper._cacheAlreadyInit) {
                self._providerHelper._cacheAlreadyInit = true;
                var subProgress = self._progress.subPercent(self.PV.onStart, self.PV.initCache);
                promise = self.erService.initCacheAsync(subProgress);

            } else {
                promise = WinJS.Promise.wrap(0);
            }

            return promise.then(function() {
                self._progress.reportProgress(self.PV.initCache);
                return WinJS.Promise.wrap(0);
            });
        },

        /**
         * @returns {WinJS.Promise} 
         */
        flushCacheAsync: function() {
            var self = this;

            var subProgress = self._progress.subPercent(self.PV.app, self.PV.flushCache);
            var promise = self.erService.flushCacheAsync(subProgress);

            return promise.then(function() {
                self._progress.reportProgress(self.PV.flushCache);
                return WinJS.Promise.wrap(0);
            });
        }
    },
    {
    
    }
);