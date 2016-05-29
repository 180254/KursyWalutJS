"use strict";

var AppGo = function() {
    console.log("App.Start");

    var pHelper = new ProviderHelper(
        new InMemCache(),
        { max: 10000, observer: VmAction.updateProgressBar }
    );

    /**
     * 
     * @param {Date} date 
     * @returns {void} 
     */
    var onAvgReload = function(date) {
        console.log("onAvgReload.Start");
        VmAction.disableAll();

        var erRandomizer = new ErsRandomizer(Vm.AvgExchangeRates);
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
                    Vm.replace(Vm.AvgExchangeRates, newErs);

                    VmAction.enableAll();
                    console.log("onAvgReload.Done");
                }, function(e) {
                    VmAction.enableAll();
                    console.log("onAvgReload.Fail");
                    console.log(e);
                });
        });
    };

    var onAvgListTapped = function(currency) {
        console.log(currency);
    };

    var init = function() {
        console.log("init.Start");
        VmAction.disableAll();

        using(pHelper.helper2(), function(pHelp2) {
            pHelp2.initCacheAsync()
                .then(function() {
                    var prog = pHelp2.progress.subPercent(0.00, 0.60);
                    return pHelp2.erService.getAllAvailableDaysAsync(prog);
                })
                .then(function(allDays) {
                    Vm.AllDays = allDays;
                    var initDate = Utils.last(allDays);

                    VmAction.initAvgPicker(
                        initDate
                    );
                    VmAction.initHistoryPickerRange(
                        moment().subtract(1, "year").startOf("day").toDate(),
                        moment().startOf("day").toDate()
                    );

                    Vm.VmAction.AvgDateChangedListeners.push(onAvgReload);
                    Vm.VmAction.AvgListTappedListeners.push(onAvgListTapped);

                    var prog = pHelp2.progress.subPercent(0.60, 1.00);
                    return pHelp2.erService.getExchangeRatesAsync(initDate, prog);
                })
                .then(function(ers) {
                    Vm.replace(Vm.AvgExchangeRates, ers);
                    return pHelp2.flushCacheAsync();
                })
                .done(function() {
                    VmAction.enableAll();
                    console.log("init.Done");
                }, function(e) {
                    VmAction.enableAll();
                    console.log("init.Fail");
                    console.log(e);
                });
        });
    };

    init();
};