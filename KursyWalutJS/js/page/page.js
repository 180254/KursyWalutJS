"use strict";

var AppGo = function() {
    console.log("APP.START");

    var pHelper = new ProviderHelper(
        new InMemCache(),
        { max: 10000, callback: Vm.updateProgressBar }
    );

    var initCalendarDatePicker = function() {
        $(".calendar-date-picker").datepicker({
            format: "dd.mm.yyyy",
            maxViewMode: 2,
            todayBtn: "linked",
            language: "pl",
            forceParse: false,
            autoclose: true,
            beforeShowDay: function(date) {
                if (date.getMonth() === (new Date()).getMonth())
                    switch (date.getDate()) {
                    case 4:
                        return false;
                    case 8:
                        return false;
                    case 12:
                        return "green";
                    default:
                        return true;
                    }

                return true;
            }
        });
    };

    using(pHelper.helper(), function(pHelp) {
        pHelp.initCacheAsync()
            .then(function() {
                var prog = pHelp.progress.subPercent(0.00, 0.80);
                return pHelp.erService.getAllAvailableDaysAsync(prog);
            })
            .then(function(allDays) {
                Vm.AllDays = allDays;
                var lastDay = Utils.last(allDays);

                var prog = pHelp.progress.subPercent(0.80, 1.00);
                return pHelp.erService.getExchangeRatesAsync(lastDay, prog);
            })
            .then(function(ers) {
                Vm.replace("ExchangeRates", ers);
                return pHelp.flushCacheAsync();
            })
            .done(function() {
                initCalendarDatePicker();
                console.log("INIT.DONE");
            }, function(e) {
                console.log("INIT.FAIL");
                console.log(e);
            });
    });
};