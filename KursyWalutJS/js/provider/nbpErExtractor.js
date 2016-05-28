/*global moment*/
"use strict";

/**
 * Utils useful to get exchange rates from NBP.
 * @constructor 
 */
var NbpErExtractor = WinJS.Class.define(

    /**
     * @constructor 
     * @returns {NbpErExtractor} 
     */
    function() {
        this._hc = new Windows.Web.Http.HttpClient();
        this._dp = new window.DOMParser();
    },
    {
        /**
         * @param {IBuffer} buffer 
         * @param {string} encoding 
         * @returns {string} 
         */
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

        /**
         * @param {string} requestUri 
         * @param {string} encoding 
         * @returns {WinJS.Promise<IBuffer>} 
         */
        getHttpResponseAsync: function(requestUri, encoding) {
            var self = this;

            var uri = new Windows.Foundation.Uri(requestUri);
            return self._hc.getBufferAsync(uri)
                .then(function(buffer) {
                    return self._iBufferToStringAsync(buffer, encoding);
                });
        },

        /**
         * @param {string} response 
         * @returns {string[]} 
         */
        parseFilenames: function(response) {
            return response.split(/\r?\n/);
        },

        /**
         * @param {string} filename 
         * @returns {Date} 
         */
        parseDateTime: function(filename) {
            return moment(filename.substr(5, 6), "YYMMDD").toDate();
        },

        /**
         * @param {string} response 
         * @returns {XMLDocument} 
         */
        parseXml: function(response) {
            return this._dp.parseFromString(response, "text/xml");
        },

        /**
         * @param {XMLDocument} xml 
         * @param {Date} day 
         * @returns {ExchangeRate[]} 
         */
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

        /**
         * @param {XMLDocument} xml 
         * @param {Date} day 
         * @returns {ExchangeRate} 
         */
        parseExchangeRate: function(xml, day) {
            return new ExchangeRate(
                day,
                this.parseCurrency(xml),
                parseFloat(Utils.getElementValue(xml, "kurs_sredni").replace(",", "."))
            );
        },


        /**
         * @param {XMLDocument} xml 
         * @returns {Currency} 
         */
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