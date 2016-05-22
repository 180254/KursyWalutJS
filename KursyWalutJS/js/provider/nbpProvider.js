"use strict";

var NbpProvider = WinJS.Class.define(
    function(cache) {
        this._cache = cache;
        this._extractor = new NbpExtractor();
        this._dayToFilename = null;
        this._dayToFilenameChanged = null;

    },
    {
        initCacheAsync: function(progress) {
            var self = this;
            return this._cache.getAsync("_dayToFilename")
                .then(function(value) {
                    self._dayToFilename = value || {};
                    progress.reportProgress(1.00);
                });
        },

        flushCacheAsync: function(progress) {
            var basePromise = this._dayToFilenameChanged
                ? this._cache.storeAsync()
                : new WinJS.Promise.as(0);

            return basePromise(function() {
                this._dayToFilenameChanged = false;
                progress.reportProgress(1.00);
            });
        },

        _range: function(start, count) {
            return Array.apply(0, Array(count))
                .map(function(element, index) {
                    return index + start;
                });
        },

        getAvailableYearsAsync: function(progress) {
            var startYear = 2002;
            var endYear = moment().year();

            var self = this;
            return new WinJS.Promise(function(complete) {
                complete(self._range(startYear, endYear - startYear + 1));
                progress.reportProgress(1.00);
            });
        },

        getAvailableDaysAsync: function(year, progress) {
            var self = this;
            return this._downloadFilenamesForYearAsync(year)
                .then(function(filenames) {
                    progress.reportProgress(0.70);

                    var avgFilenames = filenames.filter(function(element) {
                        return self._startsWith(element, "a");
                    });

                    var result = self._parseAndCacheDates(avgFilenames);
                    progress.reportProgress(1.00);

                    return new WinJS.Promise.as(result);
                });

        },

        getExchangeRatesAsync: function(day, progress) {
            var filename = this._dayToFilename[day];
            var url = "http://www.nbp.pl/kursy/xml/" + filename + ".xml";

            var self = this;
            return this._extractor.getHttpResponseAsync(url, "iso-8859-2")
                .then(function(response) {
                    progress.reportProgress(0.60);

                    var $xml = self._extractor.parseXml(response);
                    progress.reportProgress(0.70);

                    var result = self._extractor.parseExchangeRates($xml, day);
                    progress.reportProgress(1.00);

                    return new WinJS.Promise.as(result);
                });
        },

        _downloadFilenamesForYearAsync: function(year) {
            var urlYear = year === moment().year() ? "" : year;
            var url = "http://www.nbp.pl/kursy/xml/dir" + urlYear + ".txt";

            var self = this;
            return this._extractor.getHttpResponseAsync(url, "utf-8")
                .then(function(response) {
                    return new WinJS.Promise.as(self._extractor.parseFilenames(response));
                });
        },

        _parseAndCacheDates: function(filenames) {
            this._dayToFilenameChanged = true;

            var result = [];
            for (var i = 0; i < filenames.length; i++) {
                var day = this._extractor.parseDateTime(filenames[i]);
                this._dayToFilename[day] = filenames[i];
                result.push(day);
            }

            return result;
        },

        _startsWith: function(string, searchString, position) {
            position = position || 0;
            return string.substr(position, searchString.length) === searchString;
        }
    },
    {
    
    }
);