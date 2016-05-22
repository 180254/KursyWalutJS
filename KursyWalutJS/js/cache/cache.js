"use strict";

var LsCache = WinJS.Class.define(
    function() {
    },
    {
        localFolder: function() {
            return Windows.Storage.ApplicationData.current.localFolder;
        },

        get: function(key) {
            return this.localFolder()
                .getFileAsync(key)
                .then(function(file) {
                    return Windows.Storage.FileIO.readTextAsync(file);
                })
                .then(function(value) {
                    return WinJS.Promise.wrap(JSON.parse(value));
                });
        },

        store: function(key, value) {
            return this.localFolder()
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
        localFolder: function() {
            return Windows.Storage.ApplicationData.current.localFolder;
        },
        get: function(key) {
            return WinJS.Promise.wrap(this._dict[key]);
        },

        store: function(key, value) {
            this._dict[key] = value;
            return WinJS.Promise.wrap(0);
        }
    },
    {
    
    }
);