"use strict";

var NbpErProvider = WinJS.Class.define(
    function(cache) {
        this._cache = cache;
        this._extractor = new NbpErExtractor();
        this._dayToFilename = null;
        this._dayToFilenameChanged = null;

    },
    {
        initCacheAsync: function(progress) {
            var self = this;

            return self._cache
                .getAsync("_dayToFilename")
                .then(function(value) {
                    self._dayToFilename = value || {};
                    progress.reportProgress(1.00);
                });
        },

        flushCacheAsync: function(progress) {
            var self = this;

            var basePromise = self._dayToFilenameChanged
                ? self._cache.storeAsync()
                : new WinJS.Promise.wrap(0);

            return basePromise.then(function() {
                self._dayToFilenameChanged = false;
                progress.reportProgress(1.00);
            });
        },

        getAvailableYearsAsync: function(progress) {
            var startYear = 2002;
            var endYear = moment().year();

            return new WinJS.Promise(function(complete) {
                complete(Utils.rangeEx2(startYear, endYear + 1));
                progress.reportProgress(1.00);
            });
        },

        getAvailableDaysAsync: function(year, progress) {
            var self = this;

            return self
                ._downloadFilenamesForYearAsync(year)
                .then(function(filenames) {
                    progress.reportProgress(0.70);

                    var avgFilenames = filenames.filter(function(element) {
                        return Utils.startsWith(element, "a");
                    });

                    var result = self._parseAndCacheDates(avgFilenames);
                    progress.reportProgress(1.00);

                    return new WinJS.Promise.wrap(result);
                });

        },

        getExchangeRatesAsync: function(day, progress) {
            var self = this;

            var filename = this._dayToFilename[day];
            var url = "http://www.nbp.pl/kursy/xml/" + filename + ".xml";

            return self._extractor
                .getHttpResponseAsync(url, "iso-8859-2")
                .then(function(response) {
                    progress.reportProgress(0.60);

                    var $xml = self._extractor.parseXml(response);
                    progress.reportProgress(0.70);

                    return new WinJS.Promise.wrap($xml);
                })
                .then(function($xml) {
                    var result = self._extractor.parseExchangeRates($xml, day);
                    progress.reportProgress(1.00);

                    return new WinJS.Promise.wrap(result);
                });
        },

        _downloadFilenamesForYearAsync: function(year) {
            var self = this;

            var urlYear = year === moment().year() ? "" : year;
            var url = "http://www.nbp.pl/kursy/xml/dir" + urlYear + ".txt";

            return self._extractor
                .getHttpResponseAsync(url, "utf-8")
                .then(function(response) {
                    var filenames = self._extractor.parseFilenames(response);
                    return new WinJS.Promise.wrap(filenames);
                });
        },

        _parseAndCacheDates: function(filenames) {
            var self = this;

            self._dayToFilenameChanged = true;
            var result = [];

            for (var i = 0; i < filenames.length; i++) {
                var filename = filenames[i];
                var day = self._extractor.parseDateTime(filename);

                self._dayToFilename[day] = filename;
                result.push(day);
            }

            return result;
        }
    },
    {
    
    }
);