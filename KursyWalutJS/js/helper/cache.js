"use strict";

var LsCache = WinJS.Class.define(
    function() {
    },
    {
        _localFolder: function() {
            return Windows.Storage.ApplicationData.current.localFolder;
        },

        getAsync: function(key) {
            var self = this;

            return self._localFolder()
                .getFileAsync(key)
                .then(function(file) {
                    return Windows.Storage.FileIO.readTextAsync(file);
                })
                .then(function(json) {
                    var value = CacheUtils.deserialize(json);
                    return WinJS.Promise.wrap(value);
                }, function(e) {
                    return WinJS.Promise.wrap();
                });
        },

        storeAsync: function(key, value) {
            var self = this;

            return self._localFolder()
                .createFileAsync(key, Windows.Storage.CreationCollisionOption.replaceExisting)
                .then(function(file) {
                    var json = CacheUtils.serialize(value);
                    return Windows.Storage.FileIO.writeTextAsync(file, json);
                });
        }
    },
    {
    
    }
);

var InMemCache = WinJS.Class.define(
    function() {
        this._dict = {};
    },
    {
        getAsync: function(key) {
            var json = this._dict[key];
            var value = CacheUtils.deserialize(json);
            return WinJS.Promise.wrap(value);
        },

        storeAsync: function(key, value) {
            var json = CacheUtils.serialize(value);
            this._dict[key] = json;
            return WinJS.Promise.wrap(0);
        }
    },
    {
    
    }
);

var CacheUtils = WinJS.Class.define(
    function() {
    },
    {
    
    },
    {
        serialize: function(obj) {
            return JSON.stringify(obj);
        },

        deserialize: function(json) {
            var obj = JSON.parse(json || null);
            return this._de(obj);
        },

        _de: function(obj) {
            var self = this;

            if (!obj) {
                return obj;
            }

            if (typeof obj === "string" && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
                return moment(obj);
            }

            if (typeof obj.__type === "string" && obj.__type === "Currency") {
                return new Currency(obj.code, obj.name, obj.multiplier);
            }

            if (typeof obj.__type === "string" && obj.__type === "ExchangeRate") {
                return new ExchangeRate(self._de(obj.day), self._de(obj.currency), obj.averageRate);
            }

            var copy;

            if (obj instanceof Array) {
                copy = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    copy[i] = self._de(obj[i]);
                }
                return copy;
            }

            if (obj instanceof Object) {
                copy = {};

                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) {
                        copy[attr] = self._de(obj[attr]);
                    }
                }

                return copy;
            }

            return obj;
        }
    }
);