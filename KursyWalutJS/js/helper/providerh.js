﻿"use strict";

var ProviderHelper = WinJS.Class.define(
    function(cache, progressParams) {
        var nbpProvider = new NbpErProvider(cache);
        var cacheProvider = new CacheErProvider(nbpProvider, cache);

        this._erService = new StandardErService(cacheProvider);
        this._progressParams = progressParams;
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

        this._progress = new Progress(
            this._providerHelper._progressParams.max,
            this._providerHelper._progressParams.callback
        );
        this._progress.reportProgress(0.00);

        this.erService = this._providerHelper._erService;
        this.progress = this._progress.subPercent(0.05, 0.95);
    },
    {
        initCacheAsync: function() {
            var self = this;
            var promise = WinJS.Promise.wrap(0);

            if (!self._providerHelper._cacheAlreadyInit) {
                var subProgress = self._progress.subPercent(0.00, 0.05);
                promise = self.erService.initCacheAsync(subProgress);

                self._providerHelper._cacheAlreadyInit = true;
            }

            return promise.then(function() {
                self._progress.reportProgress(0.05);
                return WinJS.Promise.wrap(0);
            });
        },

        flushCacheAsync: function() {
            var self = this;

            var subProgress = self._progress.subPercent(0.95, 1.00);
            var promise = self.erService.flushCacheAsync(subProgress);

            return promise.then(function() {
                self._progress.reportProgress(1.00);
                return WinJS.Promise.wrap(0);
            });
        }
    },
    {
    
    }
);