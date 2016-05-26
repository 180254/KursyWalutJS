"use strict";

var ProviderHelper = WinJS.Class.define(
    function(cache, progressMax) {
        var nbpProvider = new NbpErProvider(cache);
        var cacheProvider = new CacheErProvider(nbpProvider, cache);
        this._erService = new StnadardErService(cacheProvider);
        this._progressMax = progressMax;
        this._cacheAlreadyInit = false;
    },
    {
        helper: function() {
            return new ProviderHelper2(this);
        }
    },
    {
    
    }
);
var ProviderHelper2 = WinJS.Class.define(
    function(providerHelper) {
        this._providerHelper = providerHelper;

        this._progress = new Progress(this._providerHelper._progressMax);
        this._progress.reportProgress(0.00);

        this.erService = this._providerHelper._erService;
        this.progress = this._progress.subPercent(0.05, 0.95);
    },
    {
        initCacheAsync: function() {
            var self = this;
            var promise = WinJS.Promise.wrap();

            if (self._providerHelper._cacheAlreadyInit) {
                if (typeof self.erService.initCacheAsync === "function") {
                    var subProgress = self._progress.subPercent(0.00, 0.05);
                    promise = self.erService.initCacheAsync(subProgress);
                }
                self._providerHelper._cacheAlreadyInit = true;
            }

            return promise.then(function() {
                self._progress.reportProgress(0.05);
                return WinJS.Promise.wrap();
            });
        },

        flushCacheAsync: function() {
            var self = this;
            var promise = WinJS.Promise.wrap();

            if (typeof self.erService.flushCacheAsync === "function") {
                var subProgress = self._progress.subPercent(0.95, 1.00);
                promise = self.erService.flushCacheAsync(subProgress);
            }

            return promise.then(function() {
                self._progress.reportProgress(1.00);
                return WinJS.Promise.wrap();
            });
        }
    },
    {
    
    }
);