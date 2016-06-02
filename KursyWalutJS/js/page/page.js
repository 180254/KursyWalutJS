"use strict";

var AppGo = function() {
    console.log("App.Start");

    var pHelper = new ProviderHelper(
        new InMemCache(), {
            max: 10000,
            observer: function(progress, value) {
                var valuePercent = (value / progress.maxValue * 100);
                Vm.m.progressPercent_s(valuePercent);
            }
        }
    );

    /**
     * 
     * @param {Date} date 
     * @returns {void} 
     */
    var onAvgReload = function(date) {
        console.log("onAvgReload.Start");
        Vm.m.uiEnabled_s(false);

        var erRandomizer = new ErsRandomizer(Vm.m.AvgExchangeRates);
        erRandomizer.start();

        var newErs;
        using(pHelper.helper2(), function(pHelp2) {
            pHelp2.initCacheAsync()
                .then(function() {
                    return pHelp2.erService.getExchangeRatesAsync(date, pHelp2.progress);
                })
                .then(function(ers) {
                    newErs = ers;

                    erRandomizer.stop();
                    var promises = [pHelp2.flushCacheAsync(), erRandomizer.waitUntilStopped()];

                    return WinJS.Promise.join(promises);
                }, function(e) {
                    erRandomizer.stop();
                    return WinJS.Promise.wrapError(e);
                })
                .done(function() {
                    Vm.replace(Vm.m.AvgExchangeRates, newErs);

                    Vm.m.uiEnabled_s(true);
                    console.log("onAvgReload.Done");
                }, function(e) {
                    Vm.m.uiEnabled_s(true);
                    console.log("onAvgReload.Fail");
                    console.log(e);
                });
        });
    };

    var onAvgListTapped = function(currency) {
        if (!Vm.m.hisPivotVisible_g()) {
            Vm.m.hisPivotVisible_s(true);
            Vm.m.progressPercent_s(100);
            Vm.m.uiEnabled_s(true);
        }

        Vm.m.HistoryCurrency = currency;
        Vm.m.pivotHeader_s(currency);
        Vm.m.currentPivot_s(1);
    };

    var init = function() {
        console.log("init.Start");
        Vm.m.uiEnabled_s(false);

        using(pHelper.helper2(), function (pHelp2) {
            pHelp2.initCacheAsync()
                .then(function() {
                    var prog = pHelp2.progress.subPercent(0.00, 0.60);
                    return pHelp2.erService.getAllAvailableDaysAsync(prog);
                })
                .then(function(allDays) {
                    Vm.m.AllDays = allDays;
                    var initDate = Utils.last(allDays);

                    Vm.m.initAvgPicker(
                        initDate
                    );
                    Vm.m.initHisPickers(
                        moment().subtract(1, "year").startOf("day").toDate(),
                        moment().startOf("day").toDate()
                    );

                    Vm.Listen.AvgDateChanged.push(onAvgReload);
                    Vm.Listen.AvgListTapped.push(onAvgListTapped);

                    var prog = pHelp2.progress.subPercent(0.60, 1.00);
                    return pHelp2.erService.getExchangeRatesAsync(initDate, prog);
                })
                .then(function(ers) {
                    Vm.replace(Vm.m.AvgExchangeRates, ers);
                    return pHelp2.flushCacheAsync();
                })
                .done(function () {
                    Vm.m.hisPivotVisible_s(false);
                    Vm.m.uiEnabled_s(true);
                    console.log("init.Done");
                }, function(e) {
                    Vm.m.uiEnabled_s(true);
                    console.log("init.Fail");
                    console.log(e);
                });
        });
    };

    init();
};