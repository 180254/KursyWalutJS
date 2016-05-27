"use strict";

WinJS.Namespace.define("Vm", {
    ExchangeRates: new WinJS.Binding.List([
        new ExchangeRate(moment().toDate(), Currency.dummyForCode("USD"), 5.10),
        new ExchangeRate(moment().toDate(), Currency.dummyForCode("EUR"), 2.1),
        new ExchangeRate(moment().toDate(), Currency.dummyForCode("USD"), 5.1)
    ]),


});

var VmUtils = WinJS.Class.define(
    function() {
    },
    {
    
    },
    {
        replace: function(bList, nList) {
            bList.length = 0;
            nList.forEach(function(item) {
                bList.push(item);
            });

        }
    }
);

WinJS.Namespace.define("Converters", {
    getFlagPath: WinJS.Binding.converter(function(currency) {
        return "flags/" + currency.code + ".GIF";
    })
});