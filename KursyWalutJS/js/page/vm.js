"use strict";

WinJS.Namespace.define("Vm", {
    ExchangeRates: new WinJS.Binding.List(),
    AllDays: [],

    updateProgressBar: function(progress, value) {
        var valuePercent = (value / progress.maxValue * 100) + "%";
        $(".progress > .bar").css("width", valuePercent);
    },

    replace: function(listName, newList) {
        var list = Vm[listName];

        list.length = 0;
        newList.forEach(function(item) {
            list.push(item);
        });
    }
});

WinJS.Namespace.define("Converters", {
    getFlagPath: WinJS.Binding.converter(function(currency) {
        return "flags/" + currency.code + ".GIF";
    }),

    getNumberFixed: WinJS.Binding.converter(function(number) {
        return number.toFixed(4);
    })
});