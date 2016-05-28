"use strict";

var AppGo = function() {
    console.log("App.Start");
    VmAction.disableAll();

    var pHelper = new ProviderHelper(
        new InMemCache(),
        { max: 10000, callback: VmAction.updateProgressBar }
    );

    var avgReload = function(date) {
        console.log("AvgReload.Init");
        VmAction.disableAll();

        var erRandomizer = new ErRandomizer(Vm.AvgExchangeRates);
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
                    Vm.replace(Vm.AvgExchangeRates, newErs);
                    return pHelp.flushCacheAsync();
                })
                .done(function() {
                    VmAction.enableAll();
                    console.log("AvgReload.Done");
                }, function(e) {
                    erRandomizer.stop();
                    console.log("AvgReload.Fail");
                    console.log(e);
                });
        });
    };


    using(pHelper.helper(), function(pHelp) {
        console.log("Init.Start");
        Vm.VmAction.AvgPickerChangedHandlers.push(avgReload);
        Vm.VmAction.AvgListTapHandlers.push(function(currency) { console.log(currency); });

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
                VmAction.initAvgPicker(initDate);
                console.log("Init.Done");
            }, function(e) {
                console.log("Init.Fail");
                console.log(e);
            });
    });
};