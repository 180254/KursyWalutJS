"use strict";

WinJS.Namespace.define("Vm", {
    ExchangeRates: new WinJS.Binding.List(),
    AllDays: [],

    replace: function(listName, newList) {
        var list = Vm[listName];

        list.length = 0;
        newList.forEach(function(item) {
            list.push(item);
        });
    },

    isProperDay: function(date) {
        return Vm.AllDays.map(Number).indexOf(+date) > -1;
    },

    updateProgressBar: function(progress, value) {
        var valuePercent = (value / progress.maxValue * 100) + "%";
        $(".progress > .bar").css("width", valuePercent);
    },

    enableAll: function() {
        $("#avg-picker").prop("disabled", false);
    },

    disableAll: function() {
        $("#avg-picker").prop("disabled", true);
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