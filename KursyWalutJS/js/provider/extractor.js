"use strict";

var NbpExtractor = WinJS.Class.define(
    function() {
        this._hc = new Windows.Web.Http.HttpClient();
    },
    {
        _iBufferToStringAsync: function(buffer, encoding) {
            var uint8Array = Windows.Security.Cryptography.CryptographicBuffer.copyToByteArray(buffer);
            var blob = new Blob([uint8Array], { type: "text/plain" });

            // blob to text with given encoding
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
            return this._hc.getBufferAsync(uri)
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
            return $($.parseXML(response));
        },

        parseExchangeRates: function($xml, day) {
            var self = this;
            return $.map($xml.find("tabela_kursow").find("pozycja"), function(xmlOne) {
                return self.parseExchangeRate($(xmlOne), day);
            });
        },

        parseExchangeRate: function($xml, day) {
            return new ExchangeRate(
                day,
                this.parseCurrency($xml),
                parseFloat($xml.find("kurs_sredni").text().replace(",", "."))
            );
        },
        parseCurrency: function($xml) {
            return new Currency(
                $xml.find("kod_waluty").text(),
                ($xml.find("nazwa_waluty") || $xml.find("nazwa_kraju")).text(),
                parseInt($xml.find("przelicznik").text())
            );
        }
    },
    {
    
    }
);