"use strict";

/**
 * @constructor 
 */
var VmAction = WinJS.Class.define(
    /**
     * @constructor 
     * @returns {VmAction} 
     */
    function() {
        this.AvgListTappedListeners = [];
        this.AvgDateChangedListeners = [];

        WinJS.Utilities.markSupportedForProcessing(this.onAvgListTapped);
        WinJS.Utilities.markSupportedForProcessing(this.onAvgDateChanged);
    },
    {
        /**
         * @param {function(T)[]} listeners 
         * @param {T} event 
         * @returns {void} 
         */
        _notifyListeners: function(listeners, event) {
            listeners.forEach(function(listener) {
                listener(event);
            });
        },

        /**
         * @param {T} event 
         * @returns {void} 
         */
        onAvgListTapped: function(event) {
            var self = Vm.VmAction;
            var currency = event.detail.itemPromise._value.data.currency;
            self._notifyListeners(self.AvgListTappedListeners, currency);
        },

        /**
         * @param {T} event 
         * @returns {void} 
         */
        onAvgDateChanged: function(event) {
            var self = Vm.VmAction;
            var date = event;
            self._notifyListeners(self.AvgDateChangedListeners, date);
        }
    },
    {
        /**
         * @param {Date} date 
         * @returns {void} 
         */
        initAvgPicker: function(date) {
            var $avgPicker = $("#avg-picker");

            var onChangeDate = function(e) {
                var eventDay = e.date;

                if (VmAction.isProperDay(eventDay)) {
                    Vm.VmAction.onAvgDateChanged(eventDay);
                } else {
                    var lastDay = Utils.last(Vm.AllDays);
                    $avgPicker.datepicker("setDate", lastDay);
                }
            };

            $avgPicker.datepicker({
                format: "dd.mm.yyyy",
                maxViewMode: 2,
                todayBtn: "linked",
                language: "pl",
                forceParse: false,
                autoclose: true,

                startDate: Utils.first(Vm.AllDays),
                endDate: Utils.last(Vm.AllDays),
                beforeShowDay: VmAction.isProperDay

            }).on("changeDate", onChangeDate);

            $avgPicker.datepicker("setDate", date);
        },

        /**
         * @returns {void} 
         */
        enableAll: function() {
            $(".disableable").removeClass("disabled");
        },

        /**
         * @returns {void} 
         */
        disableAll: function() {
            $(".disableable").addClass("disabled");
        },

        /**
         * @param {Date} date 
         * @returns {boolean} 
         */
        isProperDay: function(date) {
            return Vm.AllDays.map(Number).indexOf(+date) > -1;
        },

        /**
         * @param {Progress} progress 
         * @param {number} value 
         * @returns {void} 
         */
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

    /**
     * @param {WinJS.Binding.List<T>} bindList 
     * @param {T[]} newList 
     * @returns {void} 
     */
    replace: function(bindList, newList) {
        bindList.length = newList.length;

        newList.forEach(function(item, i) {
            bindList.setAt(i, item);
        });
    }
});

WinJS.Namespace.define("Converters", {

    /**
     * @param {Currency} currency
     * @returns {void} 
     */
    getFlagPath: WinJS.Binding.converter(function(currency) {
        return "flags/" + currency.code + ".GIF";
    }),

    /**
     * @param {number} number
     * @returns {number} 
     */
    getNumberFixed4: WinJS.Binding.converter(function(number) {
        return number.toFixed(4);
    })
});