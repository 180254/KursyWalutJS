"use strict";

/**
 * @constructor 
 */
var VmListen = WinJS.Class.define(
    /**
     * @constructor 
     * @returns {VmAction} 
     */
    function() {
        this.AvgListTapped = [];
        this.AvgDateChanged = [];

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
            var currency = event.detail.itemPromise._value.data.currency;
            Vm.Listen._notifyListeners(Vm.Listen.AvgListTapped, currency);
        },

        /**
         * @param {T} event 
         * @returns {void} 
         */
        onAvgDateChanged: function(event) {
            var date = event;
            Vm.Listen._notifyListeners(Vm.Listen.AvgDateChanged, date);
        }
    },
    {
    
    }
);

var VmM = WinJS.Class.define(
    function() {

    },
    {
        AllDays: [],
        AllDaysNumber: [],
        AvgExchangeRates: new WinJS.Binding.List(),

        DatesBackup: [null, null],
        HistoryCurrency: null,
        HistoryPivot: null,

        // ---------------------------------------------------------------------------

        isProperDay: function(date) {
            var self = Vm.m;
            if (self.AllDays.length !== self.AllDaysNumber.length) {
                self.AllDaysNumber = self.AllDays.map(Number);
            }
            return self.AllDaysNumber.indexOf(+date) > -1;
        },

        // ---------------------------------------------------------------------------

        avgPicker: function() {
            return $("#avg-picker");
        },
        avgDate_g() {
            return this.avgPicker().datepicker("getDate");
        },
        avgDate_s(date) {
            this.avgPicker().datepicker("setDate", date);
        },

        // ---------------------------------------------------------------------------

        hisPivotVisible_g() {
            var self = this;
            return self.HistoryPivot === null;
        },
        hisPivotVisible_s(visible) {
            var self = this;
            if (visible) this.pivotContainer().items.push(self.HistoryPivot);
            self.HistoryPivot = visible ? null : this.pivotContainer().items.pop();
        },

        hisPickers: function() {
            return $("#history-picker-range").children(".calendar-date-picker");
        },
        hisDates_g() {
            var $historyPickers = this.hisPickers();
            return [
                $historyPickers.eq(0).datepicker("getDate"),
                $historyPickers.eq(1).datepicker("getDate")
            ];
        },
        hisDates_s(dates) {
            var $historyPickers = this.hisPickers();
            if (dates[0]) $historyPickers.eq(0).datepicker("setDate", dates[0]);
            if (dates[1]) $historyPickers.eq(1).datepicker("setDate", dates[1]);
        },

        // ---------------------------------------------------------------------------

        uiEnabled_g() {
            return $(".disableable").hasClass("disabled");
        },
        uiEnabled_s(enabled) {
            if (enabled) $(".disableable").removeClass("disabled");
            else $(".disableable").addClass("disabled");
        },

        // ---------------------------------------------------------------------------

        pivotHeader: function() {
            return $(".win-pivot-header").eq(1);
        },
        pivotHeader_g() {
            return this.pivotHeader().text();
        },
        pivotHeader_s(currency) {
            var historyPivot = this.pivotHeader();
            var oldValue = historyPivot.text();
            var newValue = oldValue.replace(/^(.*?) ?[A-Z]*?$/g, "$1 " + currency.code);
            historyPivot.text(newValue);
        },

        // ---------------------------------------------------------------------------

        pivotContainer: function() {
            return document.querySelector("#pivot-container").winControl;
        },
        currentPivot_g() {
            var piCo = this.pivotContainer();
            return piCo ? piCo.selectedIndex : undefined;
        },
        currentPivot_s(index) {
            var piCo = this.pivotContainer();
            if (piCo) piCo.selectedIndex = index;
        },

        // ---------------------------------------------------------------------------

        progressBars: function() {
            return $(".progress > .bar");
        },
        progressPercent_g() {
            return this.progressBars().eq(0).css("width");
        },
        progressPercent_s(value) {
            this.progressBars().css("width", value + "%");
        },

        // ---------------------------------------------------------------------------


        avgDateBackup: function() {
            this.DatesBackup[0] = this.avgDate_g;
        },
        avgDateRestore: function() {
            this.avgDate_g = this.DatesBackup[0];
        },

        hisDatesBackup: function() {
            this.DatesBackup[1] = this.HisDates;
        },
        hisDatesRestore: function() {
            this.HisDates = this.DatesBackup[1];
        },

        allDatesBackup: function() {
            this.avgDateBackup();
            this.hisDatesBackup();
        },
        allDatesRestore: function() {
            this.avgDateRestore();
            this.hisDatesRestore();
        },

        // ---------------------------------------------------------------------------

        initAvgPicker: function(date) {
            var self = this;
            var $avgPicker = this.avgPicker();

            $avgPicker.datepicker({
                format: "dd.mm.yyyy",
                maxViewMode: 2,
                todayBtn: "linked",
                language: "pl",
                forceParse: false,
                autoclose: true,

                startDate: Utils.first(self.AllDays),
                endDate: Utils.last(self.AllDays),
                beforeShowDay: self.isProperDay

            }).on("changeDate", function(e) {
                var eventDay = e.date;

                if (self.isProperDay(eventDay)) {
                    Vm.Listen.onAvgDateChanged(eventDay);
                } else {
                    var lastDay = Utils.last(self.AllDays);
                    self.avgDate_g = lastDay;
                    $avgPicker.datepicker("setDate", lastDay);
                }
            });

            self.avgDate_s(date);
        },

        initHisPickers: function(fromDate, endDate) {
            var self = this;
            var $historyPickerRange = $("#history-picker-range");

            var firstDay = Utils.first(self.AllDays);
            var lastDay = Utils.last(self.AllDays);

            $historyPickerRange.datepicker({
                format: "dd-mm-yyyy",
                maxViewMode: 2,
                todayBtn: "linked",
                language: "pl",
                forceParse: false,
                autoclose: true,

                startDate: firstDay,
                endDate: lastDay
            });

            self.hisDates_s([
                fromDate,
                endDate <= lastDay ? endDate : lastDay
            ]);
        }
    },
    {
    
    }
);

WinJS.Namespace.define("Vm", {
    Listen: new VmListen(),
    m: new VmM(),

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