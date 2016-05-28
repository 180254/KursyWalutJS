"use strict";

var VmAction = WinJS.Class.define(
    function() {
        this.AvgListTapHandlers = [];
        this.AvgPickerChangedHandlers = [];

        WinJS.Utilities.markSupportedForProcessing(this.avgListTapped);
        WinJS.Utilities.markSupportedForProcessing(this.avgPickerChange);
    },
    {
        _handlerFunction: function(handlers, event) {
            handlers.forEach(function(handler) {
                handler(event);
            });
        },

        avgListTapped: function(event) {
            var self = Vm.VmAction;
            var currency = event.detail.itemPromise._value.data.currency;
            self._handlerFunction(self.AvgListTapHandlers, currency);
        },

        avgPickerChange: function(date) {
            var self = Vm.VmAction;
            self._handlerFunction(self.AvgPickerChangedHandlers, date);
        }
    },
    {
        initAvgPicker: function(date) {
            $("#avg-picker").datepicker({
                format: "dd.mm.yyyy",
                maxViewMode: 2,
                todayBtn: "linked",
                language: "pl",
                forceParse: false,
                autoclose: true,

                startDate: Utils.first(Vm.AllDays),
                endDate: Utils.last(Vm.AllDays),
                beforeShowDay: VmAction.isProperDay

            }).on("changeDate", function(e) {
                Vm.VmAction.avgPickerChange(e.date);
            });

            $("#avg-picker").datepicker("setDate", date);
        },

        enableAll: function() {
            $(".disableable").removeClass("disabled");
        },

        disableAll: function() {
            $(".disableable").addClass("disabled");
        },

        isProperDay: function(date) {
            return Vm.AllDays.map(Number).indexOf(+date) > -1;
        },

        updateProgressBar: function(progress, value) {
            var valuePercent = (value / progress.maxValue * 100) + "%";
            $(".progress > .bar").css("width", valuePercent);
        }
    }
);

WinJS.Namespace.define("Vm", {
    AllDays: [],
    AvgExchangeRates: new WinJS.Binding.List(),
    VmAction: new VmAction(),

    replace: function(bindList, newList) {
        bindList.length = 0;
        newList.forEach(function(item) {
            bindList.push(item);
        });
    }
});

WinJS.Namespace.define("Converters", {
    getFlagPath: WinJS.Binding.converter(function(currency) {
        return "flags/" + currency.code + ".GIF";
    }),

    getNumberFixed4: WinJS.Binding.converter(function(number) {
        return number.toFixed(4);
    })
});