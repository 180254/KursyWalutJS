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

                    Vm.m.allDatesBackup();
                    Vm.m.uiEnabled_s(true);
                    console.log("onAvgReload.Done");
                }, function(e) {
                    Vm.m.uiEnabled_s(true);
                    console.log("onAvgReload.Fail");
                    console.log(e);
                });
        });
    };

    /**
     * @param {Currency} currency 
     * @returns {void} 
     */
    var onAvgListTapped = function(currency) {
        console.log("onAvgListTapped.Start");

        var newCurrencySelected =
            !Currency.equals(Vm.m.HistoryCurrency, currency) && Vm.m.HistoryPivot === null;
        if (newCurrencySelected) {
            LiveChart.destroy();
            Vm.m.HistoryDrawn = false;
        }

        if (!Vm.m.hisPivotVisible_g()) {
            Vm.m.hisPivotVisible_s(true);
            Vm.m.progressPercent_s(100);
            Vm.m.uiEnabled_s(true);
        }

        Vm.m.HistoryCurrency = currency;
        Vm.m.pivotHeader_s(currency);
        Vm.m.currentPivot_s(1);

        console.log("onAvgListTapped.Done");
    };


    /**
     * @returns {void} 
     */
    var onHisDrawButtonClicked = function() {
        console.log("onHisDrawButtonClicked.Start");

        var hisDates = Vm.m.hisDates_g();
        if (!hisDates[0] || !hisDates[1]) {
            console.log("onHisDrawButtonClicked.Stop.hisDateEmpty");
            return;
        }

        Vm.m.uiEnabled_s(false);
        var currency = Vm.m.HistoryCurrency;
        var expectedSize = $("#chartcontainer").width() * 1.1;
        var liveChart = new LiveChart(currency);

        using(pHelper.helper2(), function(pHelp2) {
            pHelp2.erService.getAvaragedDaysAsync(
                    hisDates[0], hisDates[1], expectedSize,
                    pHelp2.progress.subPercent(0.00, 0.10))
                .then(function(days) {
                    liveChart.setDays(days);
                    liveChart.start();

                    return pHelp2.erService.getExchangeRatesInDaysAsync(
                        days, currency, liveChart.Ers,
                        pHelp2.progress.subPercent(0.10, 1.00));
                })
                .then(function() {
                    liveChart.stop();
                    return [pHelp2.flushCacheAsync(), liveChart.waitUntilStopped()];
                })
                .then(function() {
                    if (liveChart.Ers.length === 0) {
                        LiveChart.destroy();
                        Utils.message("Brak notowań kursu dla podanej waluty, w podanym okresie, w bazie NBP.");
                    }

                    return WinJS.Promise.wrap(0);
                })
                .done(function() {
                    Vm.m.HistoryDrawn = liveChart.Ers.length > 0;
                    Vm.m.hisSaveEnabled_s(Vm.m.HistoryDrawn);
                    Vm.m.allDatesBackup();
                    Vm.m.uiEnabled_s(true);

                    console.log("onHisDrawButtonClicked.Done");
                });
        });
    };

    /**
     * @returns {void} 
     */
    var onPivotSelectionChanged = function(selectedIndex) {
        var hisPivotSelected = selectedIndex === 1;
        var hisSaveEnabled = hisPivotSelected && Vm.m.HistoryDrawn;
        Vm.m.hisSaveEnabled_s(hisSaveEnabled);

        if (Vm.m.DatesBackup[0]) {
            Vm.m.allDatesRestore();
        }
    };

    /**
     * @returns {void} 
     */
    var onBarSaveChartClicked = function() {
        var hisDates = Vm.m.hisDates_g();

        var savePicker = new Windows.Storage.Pickers.FileSavePicker();
        savePicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.picturesLibrary;
        savePicker.fileTypeChoices.insert("PNG", [".png"]);
        savePicker.suggestedFileName =
            Vm.m.HistoryCurrency.code +
            "_" +
            moment(hisDates[0]).format("YYYYMMDD") +
            "_" +
            moment(hisDates[1]).format("YYYYMMDD");

        savePicker.pickSaveFileAsync().then(function(file) {
            if (!file) return;
            var png = LiveChart.toPNGbytes();

            Windows.Storage.CachedFileManager.deferUpdates(file);
            Windows.Storage.FileIO.writeBytesAsync(file, png)
                .done(function() {
                    Windows.Storage.CachedFileManager.completeUpdatesAsync(file)
                        .done(function(updateStatus) {
                            if (updateStatus === Windows.Storage.Provider.FileUpdateStatus.complete) {
                                Utils.message("Zapisano wykres");
                            }
                        });
                });

        });
    };

    var onUnhandledException = function(event) {
        if (Array.isArray(event.detail.error)) {
            return true;
        }

        var errors = Array.isArray(event.detail.error.error)
            ? event.detail.error.error
            : [event.detail.error.error];

        var ioException = errors.filter(function(err) {
                return typeof err.asyncOpType === "string" &&
                    err.asyncOpType.indexOf("Windows.Web.Http") > -1;
            }).length >
            0;

        var msg = ioException
            ? "Wystąpił problem podczas przetwarzania. " +
            "Sprawdź dostępność połączenia internetowego. " +
            "Być może serwis NBP nie jest osiągalny. " +
            "Proszę spróbować później."
            : "Wystąpił problem podczas przetwarzania. " +
            "Proszę spróbować ponownie. " +
            "W razie dalszych problemów przeinstaluj aplikację i/lub skontaktuj się z autorem.";

        Vm.m.progressPercent_s(0.00);
        Utils.message(msg);

        if (Vm.m.InitSucessfully) {
            Vm.m.uiEnabled_s(true);
            Vm.m.allDatesRestore();
        } else {
            Vm.m.uiInitDone_s(false);
        }

        return true;
    };

    var onBarSyncAllClicked = function() {
        Vm.m.uiEnabled_s(false);
        Vm.m.appBarOpened_s(false);

        using(pHelper.helper2(), function(pHelp2) {
            var prog1 = pHelp2.progress.subPercent(0.00, 0.05);
            var prog2 = pHelp2.progress.subPercent(0.05, 1.00);
            var count = 0;

            pHelp2.erService.getAllAvailableDaysAsync(prog1)
                .then(function(days) {
                    count = days.length;
                    return pHelp2.erService.getExchangeRatesInDaysAsync(days, Currency.dummyForCode("USD"), [], prog2);
                })
                .then(function() {
                    return pHelp2.flushCacheAsync();
                })
                .done(function() {
                    Utils.message("Cache został zsynchronizowany z bazą NBP. Wpisów w pamięci: " + count);
                    Vm.m.uiEnabled_s(true);
                });
        });
    };

    var preInit = function() {
        Vm.m.initRetryButton();
    };

    /**
     * @returns {void} 
     */
    var init = function() {
        console.log("init.Start");
        Vm.m.uiEnabled_s(false);

        Vm.Listen.reset();
        WinJS.Application.onerror = onUnhandledException;
        Vm.Listen.RetryButtonClicked.push(function() {
            Vm.m.uiInitDone_s(true);
            init();
        });


        using(pHelper.helper2(), function(pHelp2) {
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
                    Vm.m.initDrawButton();
                    Vm.m.initOtherEvents();

                    Vm.Listen.AvgDateChanged.push(onAvgReload);
                    Vm.Listen.AvgListTapped.push(onAvgListTapped);
                    Vm.Listen.BarSaveChartClicked.push(onBarSaveChartClicked);
                    Vm.Listen.BarSyncAllClicked.push(onBarSyncAllClicked);
                    Vm.Listen.HisDrawButtonClicked.push(onHisDrawButtonClicked);
                    Vm.Listen.PivotSelectionChanged.push(onPivotSelectionChanged);

                    Vm.m.allDatesBackup();
                    Vm.m.InitSucessfully = true;

                    var prog = pHelp2.progress.subPercent(0.60, 1.00);
                    return pHelp2.erService.getExchangeRatesAsync(initDate, prog);
                })
                .then(function(ers) {
                    Vm.replace(Vm.m.AvgExchangeRates, ers);
                    return pHelp2.flushCacheAsync();
                })
                .done(function() {
                    Vm.m.hisPivotVisible_s(false);
                    Vm.m.uiEnabled_s(true);
                    console.log("init.Done");
                });
        });
    };

    preInit();
    init();
};;