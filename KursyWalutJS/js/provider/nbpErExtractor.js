/*global moment*/
"use strict";

var NbpErExtractor = WinJS.Class.define(
    function() {
        this._hc = new Windows.Web.Http.HttpClient();
        this._dp = new window.DOMParser();
    },
    {
        _iBufferToStringAsync: function(buffer, encoding) {
            var uint8Array = Windows.Security.Cryptography.CryptographicBuffer.copyToByteArray(buffer);
            var blob = new Blob([uint8Array], { type: "text/plain" });

            return new WinJS.Promise(function(complete, error) {
                var reader = new FileReader();
                reader.onload = function(event) { complete(event.target.result); };
                reader.onerror = function(e) { error(e); };
                reader.readAsText(blob, encoding);
            });
        },

        getHttpResponseAsync: function(requestUri, encoding) {
            var self = this;

            var uri = new Windows.Foundation.Uri(requestUri);
            return self._hc.getBufferAsync(uri)
                .then(function(buffer) {
                    return self._iBufferToStringAsync(buffer, encoding);
                });
        },

        parseFilenames: function(response) {
            return response.split(/\r?\n/);
        },

        parseDateTime: function(filename) {
            return moment(filename.substr(5, 6), "YYMMDD");
        },

        parseXml: function(response) {
            return this._dp.parseFromString(response, "text/xml");;
        },

        parseExchangeRates: function(xml, day) {
            var self = this;

            var ers = [];
            var xmlErs = Utils.getElements(xml, "pozycja");

            for (var i = 0; i < xmlErs.length; i++) {
                var xmlEr = xmlErs[i];
                var er = self.parseExchangeRate(xmlEr, day);
                ers.push(er);
            }

            return ers;
        },

        parseExchangeRate: function(xml, day) {
            return new ExchangeRate(
                day,
                this.parseCurrency(xml),
                parseFloat(Utils.getElementValue(xml, "kurs_sredni").replace(",", "."))
            );
        },

        parseCurrency: function(xml) {
            return new Currency(
                Utils.getElementValue(xml, "kod_waluty"),
                Utils.getElementValue(xml, "nazwa_waluty") || Utils.getElementValue(xml, "nazwa_kraju"),
                parseInt(Utils.getElementValue(xml, "przelicznik"))
            );
        }
    },
    {
    
    }
);