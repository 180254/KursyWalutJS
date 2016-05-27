"use strict";

var AppGo = function() {
    console.log("App.Start");
    Vm.disableAll();

    var pHelper = new ProviderHelper(
        new InMemCache(),
        { max: 10000, callback: Vm.updateProgressBar }
    );

    var avgReload = function(date) {
        console.log("AvgReload.Init");
        Vm.disableAll();

        var erRandomizer = new ErRandomizer(Vm.ExchangeRates);
        erRandomizer.start();

        var newErs = null;

        using(pHelper.helper(), function(pHelp) {
            pHelp.initCacheAsync()
                .then(function() {
                    return pHelp.erService.getExchangeRatesAsync(date, pHelp.progress);
                })
                .then(function(ers) {
                    newErs = ers;
                    erRandomizer.stop();
                    return erRandomizer.waitUntilStopped();
                })
                .then(function() {
                    Vm.replace("ExchangeRates", newErs);
                    return pHelp.flushCacheAsync();
                })
                .done(function() {
                    Vm.enableAll();
                    console.log("AvgReload.Done");
                }, function(e) {
                    erRandomizer.stop();
                    console.log("AvgReload.Fail");
                    console.log(e);
                });
        });
    };

    var initCalendarDatePicker = function(date) {
        $("#avg-picker").datepicker({
            format: "dd.mm.yyyy",
            maxViewMode: 2,
            todayBtn: "linked",
            language: "pl",
            forceParse: false,
            autoclose: true,

            startDate: Utils.first(Vm.AllDays),
            endDate: Utils.last(Vm.AllDays),
            beforeShowDay: Vm.isProperDay
        }).on("changeDate", function(e) {
            avgReload(e.date);
        });

        $("#avg-picker").datepicker("setDate", date);
    };

    using(pHelper.helper(), function(pHelp) {
        console.log("Init.Start");
        var initDate = null;

        pHelp.initCacheAsync()
            .then(function() {
                var prog = pHelp.progress.subPercent(0.00, 0.80);
                return pHelp.erService.getAllAvailableDaysAsync(prog);
            })
            .then(function(allDays) {
                Vm.AllDays = allDays;
                initDate = Utils.last(allDays);
                return pHelp.flushCacheAsync();
            })
            .done(function() {
                initCalendarDatePicker(initDate);
                console.log("Init.Done");
            }, function(e) {
                console.log("Init.Fail");
                console.log(e);
            });
    });
};