/// <reference path="~/bower_components/winjs/js/base.js" />
/* global Windows, WinJS */
var Cache = WinJS.Class.define(
    function() {
    },
    {
    
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
    }
);