"use strict";

var LsCache = WinJS.Class.define(
    function() {
    },
    {
        _localFolder: function() {
            return Windows.Storage.ApplicationData.current.localFolder;
        },

        getAsync: function(key) {
            return this._localFolder()
                .getFileAsync(key)
                .then(function(file) {
                    return Windows.Storage.FileIO.readTextAsync(file);
                })
                .then(function(value) {
                    return WinJS.Promise.wrap(JSON.parse(value));
                });
        },

        storeAsync: function(key, value) {
            return this._localFolder()
                .createFileAsync(key, Windows.Storage.CreationCollisionOption.replaceExisting)
                .then(function(file) {
                    return Windows.Storage.FileIO.writeTextAsync(file, JSON.stringify(value));
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