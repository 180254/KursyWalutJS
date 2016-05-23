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
                    var value = JSON.parse(json);
                    return WinJS.Promise.wrap(value);
                });
        },

        storeAsync: function(key, value) {
            var self = this;

            return self._localFolder()
                .createFileAsync(key, Windows.Storage.CreationCollisionOption.replaceExisting)
                .then(function(file) {
                    var json = JSON.stringify(value);
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
            return WinJS.Promise.wrap(this._dict[key]);
        },

        storeAsync: function(key, value) {
            this._dict[key] = value;
            return WinJS.Promise.wrap(0);
        }
    },
    {
    
    }
);