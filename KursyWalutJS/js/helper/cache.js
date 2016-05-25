"use strict";

var LsCache = WinJS.Class.define(
    function() {
        this._cacheUtils = new CacheUtils();
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
                    var value = self._cacheUtils.deserialize(json);
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
                    var json = self._cacheUtils.serialize(value);
                    return Windows.Storage.FileIO.writeTextAsync(file, json);
                });
        }
    },
    {
    
    }
);

var InMemCache = WinJS.Class.define(
    function() {
        this._cacheUtils = new CacheUtils();
        this._dict = {};
    },
    {
        getAsync: function(key) {
            var json = this._dict[key];
            var value = this._cacheUtils.deserialize(json);
            return WinJS.Promise.wrap(value);
        },

        storeAsync: function(key, value) {
            var json = this._cacheUtils.serialize(value);
            this._dict[key] = json;
            return WinJS.Promise.wrap(0);
        }
    },
    {
    
    }
);

var CacheUtils = WinJS.Class.define(
    function() {
        // Storing moment dates:
        // - serialized as unix timestamp(miliseconds),
        // assumption[0]: large numbers (>=946681200000) are only used to store date,
        // assumption[1]: only dates with year >= 2000 are used,
        // - it's not the best solution for storing dates,
        // but deserializing is the fastest, of tested ways.

        moment.prototype.toJSON = moment.prototype.valueOf;
        this._valueOf2000 = moment(2000, "YYYY").valueOf();
    },
    {
        serialize: function(obj) {
            return JSON.stringify(obj);
        },

        deserialize: function(json) {
            var self = this;

            return JSON.parse(json || null, function(k, v) {
                var probablyMoment = typeof v === "number" && v >= self._valueOf2000;
                return probablyMoment ? moment(v) : v;
            });
        }
    },
    {
    
    }
);