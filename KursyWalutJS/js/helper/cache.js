"use strict";

/**
 * Cache class, which store values in local storage (local folder).
 * @constructor
 */
var LsCache = WinJS.Class.define(

    /**
     * @constructor
     * @returns {LsCache} 
     */
    function() {
        this._serializer = new Serializer();
    },
    {
        /**
         * (private) Folder to store cached values.
         * @returns {Windows.Storage.StorageFolder} 
         */
        _localFolder: function() {
            return Windows.Storage.ApplicationData.current.localFolder;
        },

        /**
         * @param {string} key 
         * @returns {WinJS.Promise<T>} 
         */
        getAsync: function(key) {
            var self = this;

            return self._localFolder()
                .getFileAsync(key)
                .then(function(file) {
                    return Windows.Storage.FileIO.readTextAsync(file);
                })
                .then(function(json) {
                    var value = self._serializer.deserialize(json);
                    return WinJS.Promise.wrap(value);
                }, function() {
                    return WinJS.Promise.wrap(0);
                });
        },

        /**
         * @param {string} key 
         * @param {T} value 
         * @returns {WinJS.Promise} 
         */
        storeAsync: function(key, value) {
            var self = this;

            return self._localFolder()
                .createFileAsync(key, Windows.Storage.CreationCollisionOption.replaceExisting)
                .then(function(file) {
                    var json = self._serializer.serialize(value);
                    return Windows.Storage.FileIO.writeTextAsync(file, json);
                });
        }
    },
    {
    
    }
);

/**
 * Cache class, which store values in memory.
 * @constructor 
 */
var InMemCache = WinJS.Class.define(

    /**
     * @constructor
     * @returns {InMemCache} 
     */
    function() {
        this._serializer = new Serializer();
        this._dict = {};
    },
    {
        /**
         * @param {string} key 
         * @returns {WinJS.Promise<T>} 
         */
        getAsync: function(key) {
            var json = this._dict[key];
            var value = this._serializer.deserialize(json);
            return WinJS.Promise.wrap(value);
        },

        /**
         * @param {string} key 
         * @param {T} value 
         * @returns {WinJS.Promise} 
         */
        storeAsync: function(key, value) {
            var json = this._serializer.serialize(value);
            this._dict[key] = json;
            return WinJS.Promise.wrap(0);
        }
    },
    {
    
    }
);

/**
 * Object serializer.<br/>
 * Objects are serialized as json.<br/>
 * Note: only properties are serialized.<br/>
 * Note: objects prototypes serialized and aren't restored during deserialization.<br/>
 * Except: standard Date class. 
 */
var Serializer = WinJS.Class.define(

    /**
     * @constructor 
     * @returns {CacheUtils} 
     */
    function() {
        // Storing dates:
        // - serialize as unix timestamp (miliseconds),
        // assumption[0]: large numbers (>=946681200000) are only used to store date,
        // assumption[1]: only dates with year >= 2000 are used,
        // - it's not the best solution for storing dates,
        // but deserializing is the fastest, of tested ways.

        // ReSharper disable once NativeTypePrototypeExtending
        Date.prototype.toJSON = Date.prototype.valueOf;
        moment.prototype.toJSON = moment.prototype.valueOf;
        this._valueOf2000 = moment(2000, "YYYY").valueOf();
    },
    {
        /**
         * @param {T} obj 
         * @returns {json<T>} serialized obj 
         */
        serialize: function(obj) {
            return JSON.stringify(obj);
        },

        /**
         * @param {json<T>} json 
         * @returns {T} deserialized obj
         */
        deserialize: function(json) {
            var self = this;

            return JSON.parse(json || null, function(k, v) {
                var probablyDate = typeof v === "number" && v >= self._valueOf2000;
                return probablyDate ? new Date(v) : v;
            });
        }
    },
    {
    
    }
);