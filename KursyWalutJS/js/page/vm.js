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
        this.init();

        WinJS.Utilities.markSupportedForProcessing(this.doRetryButtonClicked);
        WinJS.Utilities.markSupportedForProcessing(this.doAvgListTapped);
        WinJS.Utilities.markSupportedForProcessing(this.doAvgDateChanged);
        WinJS.Utilities.markSupportedForProcessing(this.doHisDrawButtonClicked);
        WinJS.Utilities.markSupportedForProcessing(this.doBarSyncAllClicked);
        WinJS.Utilities.markSupportedForProcessing(this.doBarSaveChartClicked);
        WinJS.Utilities.markSupportedForProcessing(this.doPivotSelectionChanged);
    },
    {
        /**
         * @returns {void} 
         */
        init: function() {
            /** array of function() */
            this.RetryButtonClicked = [];

            /** array of function(Currency) */
            this.AvgListTapped = [];

            /** array of function(Date) */
            this.AvgDateChanged = [];

            /** array of function() */
            this.HisDrawButtonClicked = [];

            /** array of function() */
            this.BarSyncAllClicked = [];

            /** array of function() */
            this.BarSaveChartClicked = [];

            /** array of function(index:Number) */
            this.PivotSelectionChanged = [];
        },

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
         * @returns {void} 
         */
        doRetryButtonClicked: function() {
            Vm.Listen._notifyListeners(Vm.Listen.RetryButtonClicked);
        },

        /**
         * @param {Object} event 
         * @param {Currency} event.detail.itemPromise._value.data.currency 
         * @returns {void} 
         */
        doAvgListTapped: function(event) {
            var currency = event.detail.itemPromise._value.data.currency;
            Vm.Listen._notifyListeners(Vm.Listen.AvgListTapped, currency);
        },

        /**
         * @param {T(Date)} event 
         * @returns {void} 
         */
        doAvgDateChanged: function(event) {
            var date = event;
            Vm.Listen._notifyListeners(Vm.Listen.AvgDateChanged, date);
        },

        /**
         * @returns {void} 
         */
        doHisDrawButtonClicked: function() {
            Vm.Listen._notifyListeners(Vm.Listen.HisDrawButtonClicked);
        },

        /**
         * @returns {void} 
         */
        doBarSyncAllClicked: function() {
            Vm.Listen._notifyListeners(Vm.Listen.BarSyncAllClicked);
        },

        /**
         * @returns {void} 
         */
        doBarSaveChartClicked: function() {
            Vm.Listen._notifyListeners(Vm.Listen.BarSaveChartClicked);
        },

        /**
         * @param {Object} event
         * @param {Number} event.detail.index
         * @returns {void} 
         */
        doPivotSelectionChanged: function(event) {
            Vm.Listen._notifyListeners(Vm.Listen.PivotSelectionChanged, event.detail.index);
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

        InitSucessfully: false,
        HistoryDrawn: false,

        // ---------------------------------------------------------------------------

        isProperDay: function(date) {
            var self = Vm.m;
            if (self.AllDays.length !== self.AllDaysNumber.length) {
                self.AllDaysNumber = self.AllDays.map(Number);
            }
            return self.AllDaysNumber.indexOf(+date) > -1;
        },

        // ---------------------------------------------------------------------------

        _avgPicker: function() {
            return $("#avg-picker");
        },
        avgDate_g: function() {
            return this._avgPicker().datepicker("getDate");
        },
        avgDate_s: function(date) {
            this._avgPicker().datepicker("setDate", date);
        },

        // ---------------------------------------------------------------------------

        hisPivotVisible_g() {
            var self = this;
            return self.HistoryPivot === null;
        },
        hisPivotVisible_s(visible) {
            var self = this;
            if (visible) this._pivotContainer().items.push(self.HistoryPivot);
            self.HistoryPivot = visible ? null : this._pivotContainer().items.pop();
        },

        // ---------------------------------------------------------------------------

        _hisPickers: function() {
            return $("#history-picker-range").children(".calendar-date-picker");
        },
        hisDates_g: function() {
            var $historyPickers = this._hisPickers();
            return [
                $historyPickers.eq(0).datepicker("getDate"),
                $historyPickers.eq(1).datepicker("getDate")
            ];
        },
        hisDates_s: function(dates) {
            var $historyPickers = this._hisPickers();
            if (dates[0]) $historyPickers.eq(0).datepicker("setDate", dates[0]);
            if (dates[1]) $historyPickers.eq(1).datepicker("setDate", dates[1]);
        },

        // ---------------------------------------------------------------------------

        uiEnabled_g: function() {
            return $(".auto-disable").hasClass("auto-disabled");
        },
        uiEnabled_s: function(enabled) {
            if (enabled) $(".auto-disable").removeClass("auto-disabled");
            else $(".auto-disable").addClass("auto-disabled");
        },

        // ---------------------------------------------------------------------------

        uiInitDone_g: function() {
            return $("#retry-button-container").hasClass("hidden");

        },
        uiInitDone_s: function(done) {
            if (done) {
                $("#avg-picker-container").removeClass("hidden");
                $("#retry-button-container").addClass("hidden");
            } else {
                $("#avg-picker-container").addClass("hidden");
                $("#retry-button-container").removeClass("hidden");
            }
        },

        // ---------------------------------------------------------------------------

        _pivotHeader: function() {
            return $(".win-pivot-header").eq(1);
        },
        pivotHeader_g: function() {
            return this._pivotHeader().text();
        },
        pivotHeader_s: function(currency) {
            var historyPivot = this._pivotHeader();
            var oldValue = historyPivot.text();
            var newValue = oldValue.replace(/^(.*?) ?[A-Z]*?$/g, "$1 " + currency.code);
            historyPivot.text(newValue);
        },

        // ---------------------------------------------------------------------------

        _pivotContainer: function() {
            return document.querySelector("#pivot-container").winControl;
        },
        currentPivot_g: function() {
            var piCo = this._pivotContainer();
            return piCo ? piCo.selectedIndex : undefined;
        },
        currentPivot_s: function(index) {
            var piCo = this._pivotContainer();
            if (piCo) piCo.selectedIndex = index;
        },

        // ---------------------------------------------------------------------------

        _hisSaveButton: function() {
            return $("#saveChart");
        },

        hisSaveEnabled_g: function() {
            return this._hisSaveButton().hasClass("disabled");
        },

        hisSaveEnabled_s: function(enabled) {
            if (enabled) {
                this._hisSaveButton().removeClass("disabled");
            } else {
                this._hisSaveButton().addClass("disabled");
            }
        },

        // ---------------------------------------------------------------------------

        _appBar: function() {
            return document.querySelector("#appBar").winControl;
        },

        appBarOpened_g: function() {
            return this._appBar().opened = false;
        },

        appBarOpened_s: function(opened) {
            return this._appBar().opened = opened;
        },

        // ---------------------------------------------------------------------------

        _progressBars: function() {
            return $(".progress > .bar");
        },
        progressPercent_g: function() {
            return this._progressBars().eq(0).css("width").slice(0, -1);
        },
        progressPercent_s: function(value) {
            this._progressBars().css("width", value + "%");
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
            var $avgPicker = this._avgPicker();

            $avgPicker.datepicker("destroy");
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
                    Vm.Listen.doAvgDateChanged(eventDay);
                    Vm.m.avgDateBackup();
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
            var $historyPickerRangeInputs = $historyPickerRange.find("input");

            var firstDay = Utils.first(self.AllDays);
            var lastDay = Utils.last(self.AllDays);

            $historyPickerRangeInputs.eq(0).datepicker("destroy");
            $historyPickerRangeInputs.eq(1).datepicker("destroy");

            $historyPickerRange.datepicker({
                format: "dd-mm-yyyy",
                maxViewMode: 2,
                todayBtn: "linked",
                language: "pl",
                forceParse: false,
                autoclose: true,

                startDate: firstDay,
                endDate: lastDay
            }).on("changeDate", function() {
                if (!Vm.m.HistoryDrawn) {
                    Vm.m.hisDatesBackup();
                }
            });

            self.hisDates_s([
                fromDate,
                endDate <= lastDay ? endDate : lastDay
            ]);
        },

        initDrawButton: function() {
            var $historyDrawButton = $("#history-draw-button");
            $historyDrawButton.unbind("click");
            $historyDrawButton.on("click", Vm.Listen.doHisDrawButtonClicked);
        },

        initRetryButton: function() {
            var $retryButton = $("#retry-button");
            $retryButton.unbind("click");
            $retryButton.on("click", Vm.Listen.doRetryButtonClicked);
        },

        initPivotSelectionChange: function() {
            // ReSharper disable once Html.EventNotResolved
            WinJS.Application.removeEventListener(
                "selectionchanged", Vm.Listen.doPivotSelectionChanged, false);

            // ReSharper disable once Html.EventNotResolved
            this._pivotContainer().addEventListener(
                "selectionchanged", Vm.Listen.doPivotSelectionChanged);
        }

        // ---------------------------------------------------------------------------

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