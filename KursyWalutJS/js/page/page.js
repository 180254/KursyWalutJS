"use strict";

var AppGo = function() {
    console.log("App.Start");

    var erRandomizer = null;
    var liveChart = null;

    var applicationData = Windows.Storage.ApplicationData.current;
    var localSettings = applicationData.localSettings;

    var pHelper = new ProviderHelper(
        new InMemCache(), {
            max: 10000,
            observer: function(progress, value) {
                var valuePercent = (value / progress.maxValue * 100);
                Vm.m.progressPercent_s(valuePercent);
            }
        }
    );

    var debug = {
        /**
         * @param {String} name 
         * @returns {moment} 
         */
        start: function(name) {
            console.log(name + ".Start");
            return moment();
        },
        /**
         * @param {String} name 
         * @param {moment} sw 
         * @returns {void} 
         */
        elapsed: function(name, sw) {
            var time = moment.utc(moment().diff(sw)).format("HH:mm:ss.SSS");
            console.log(name + ".Time: " + time);
        }
    };


    /**
     * @param {Date} date 
     * @returns {void} 
     */
    var onAvgReload = function(date) {
        var sw = debug.start("onAvgReload");
        Vm.m.uiEnabled_s(false);

        erRandomizer = new ErsRandomizer(Vm.m.AvgExchangeRates);
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
                })
                .done(function() {
                    Vm.replace(Vm.m.AvgExchangeRates, newErs);

                    Vm.m.allDatesBackup();
                    Vm.m.uiEnabled_s(true);
                    debug.elapsed("onAvgReload", sw);
                });
        });
    };

    /**
     * @param {Currency} currency 
     * @returns {void} 
     */
    var onAvgListTapped = function(currency) {
        var sw = debug.start("onAvgListTapped");

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

        debug.elapsed("onAvgReload", sw);
    };


    /**
     * @returns {void} 
     */
    var onHisDrawButtonClicked = function() {
        var sw = debug.start("onHisDrawButtonClicked");

        var hisDates = Vm.m.hisDates_g();
        if (!hisDates[0] || !hisDates[1]) {
            return;
        }

        Vm.m.uiEnabled_s(false);
        var currency = Vm.m.HistoryCurrency;
        var expectedSize = $("#chartcontainer").width() * 1.1;
        liveChart = new LiveChart(currency);

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

                    var promises = [pHelp2.flushCacheAsync(), liveChart.waitUntilStopped()];
                    return WinJS.Promise.join(promises);
                })
                .then(function() {
                    if (liveChart.Ers.length === 0) {
                        LiveChart.destroy();
                        Utils.messageDialog("Brak notowań kursu dla podanej waluty, w podanym okresie, w bazie NBP.");
                    }

                    return WinJS.Promise.wrap(0);
                })
                .done(function() {
                    Vm.m.HistoryDrawn = liveChart.Ers.length > 0;
                    Vm.m.hisSaveEnabled_s(Vm.m.HistoryDrawn);
                    Vm.m.allDatesBackup();
                    Vm.m.uiEnabled_s(true);

                    debug.elapsed("onHisDrawButtonClicked", sw);
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
            var sw = debug.start("onBarSaveChartClicked");
            var pngBytes = LiveChart.toPNGbytes();

            Windows.Storage.CachedFileManager.deferUpdates(file);
            Windows.Storage.FileIO.writeBytesAsync(file, pngBytes)
                .done(function() {
                    Windows.Storage.CachedFileManager.completeUpdatesAsync(file)
                        .done(function(updateStatus) {
                            if (updateStatus === Windows.Storage.Provider.FileUpdateStatus.complete) {
                                Utils.messageDialog("Zapisano wykres");
                                debug.elapsed("onHisDrawButtonClicked", sw);
                            }
                        });
                });

        });
    };

    /**
     * @returns {void} 
     */
    var onBarSyncAllClicked = function() {
        var sw = debug.start("onBarSyncAllClicked");
        Vm.m.uiEnabled_s(false);
        Vm.m.appBarOpened_s(false);

        using(pHelper.helper2(), function(pHelp2) {
            var prog1 = pHelp2.progress.subPercent(0.00, 0.05);
            var prog2 = pHelp2.progress.subPercent(0.05, 1.00);
            var count = 0;

            pHelp2.erService.getAllAvailableDaysAsync(prog1)
                .then(function(days) {
                    count = days.length;

                    return pHelp2.erService.getExchangeRatesInDaysAsync(
                        days, Currency.dummyForCode("USD"), [], prog2);
                })
                .then(function() {
                    return pHelp2.flushCacheAsync();
                })
                .done(function() {
                    Utils.messageDialog("Cache został zsynchronizowany z bazą NBP. Wpisów w pamięci: " + count);
                    Vm.m.uiEnabled_s(true);

                    debug.elapsed("onBarSyncAllClicked", sw);
                });
        });
    };

    /**
     * @param {Event<WinJS.Application.onerror>} event 
     * @returns {void} 
     */
    var onUnhandledException = function(event) {
        if (typeof event.detail.error.preventDefault !== "function") {
            return true;
        }
        var sw = debug.start("onUnhandledException");

        if (erRandomizer != null) erRandomizer.stop();
        if (liveChart != null) liveChart.stop();

        var errors = Array.isArray(event.detail.error.error)
            ? event.detail.error.error
            : [event.detail.error.error];

        var isIoException = errors.some(function(err) {
            return err &&
                typeof err.asyncOpType === "string" &&
                err.asyncOpType.indexOf("Windows.Web.Http") > -1;
        });

        var msg = isIoException
            ? "Wystąpił problem podczas przetwarzania. Sprawdź dostępność połączenia internetowego.\n" +
            "Być może serwis NBP nie jest osiągalny. Proszę spróbować później."
            : "Wystąpił problem podczas przetwarzania. Proszę spróbować ponownie.\n" +
            "W razie dalszych problemów przeinstaluj aplikację i/lub skontaktuj się z autorem.";

        Vm.m.progressPercent_s(100);
        Utils.messageDialog(msg);

        Vm.m.uiAvgAjaxLoader_s(false);
        Vm.m.uiHisAjaxLoader_s(false);

        if (Vm.m.InitSucessfully) {
            Vm.m.uiEnabled_s(true);
            Vm.m.allDatesRestore();
        } else {
            Vm.m.uiInitDone_s(false);
        }

        debug.elapsed("onUnhandledException", sw);
        return true;
    };

    var onSuspending = function() {
        var sw = debug.start("onSuspending");
        var hisDates = Vm.m.hisDates_g();

        localSettings.values["currentPivot"] = Vm.m.currentPivot_g();
        localSettings.values["avgDate"] = Vm.m.avgDate_g().valueOf();
        localSettings.values["hisPivot"] = Vm.m.HistoryPivot === null;
        localSettings.values["hisCurrency"] = Vm.m.HistoryCurrency ? Vm.m.HistoryCurrency.code : null;
        localSettings.values["hisDrawn"] = Vm.m.HistoryDrawn;
        localSettings.values["hisDates[0]"] = hisDates[0] ? hisDates[0].valueOf() : null;
        localSettings.values["hisDates[1]"] = hisDates[1] ? hisDates[1].valueOf() : null;

        debug.elapsed("onSuspending", sw);
    };

    /**
     * @returns {void} 
     */
    var init = function() {
        var sw = debug.start("init");
        Vm.m.uiEnabled_s(false);

        Vm.m.initRetryButton();
        Vm.Listen.init();
        Vm.Listen.RetryButtonClicked.push(function() {
            Vm.m.uiInitDone_s(true);
            init();
        });

        Vm.m.uiAvgAjaxLoader_s(true);
        Vm.m.uiHisAjaxLoader_s(true);

        using(pHelper.helper2(), function(pHelp2) {
            pHelp2.initCacheAsync()
                .then(function() {
                    var prog = pHelp2.progress.subPercent(0.00, 0.30);
                    return pHelp2.erService.getAllAvailableDaysAsync(prog);
                })
                .then(function(allDays) {
                    Vm.m.AllDays = allDays;
                    var initDate = localSettings.values["avgDate"]
                        ? new Date(localSettings.values["avgDate"])
                        : Utils.last(allDays);

                    Vm.m.initAvgPicker(
                        initDate
                    );

                    Vm.m.initHisPickers(
                        localSettings.values["hisDates[0]"]
                        ? new Date( localSettings.values["hisDates[0]"] )
                        : moment().subtract(1, "year").startOf("day").toDate(),
                        //
                        localSettings.values["hisDates[1]"]
                        ? new Date( localSettings.values["hisDates[1]"] )
                        : moment().startOf("day").toDate()
                    );

                    if (localSettings.values["hisCurrency"]) {
                        Vm.m.HistoryCurrency = Currency.dummyForCode(localSettings.values["hisCurrency"]);
                        Vm.m.pivotHeader_s(Vm.m.HistoryCurrency);
                    }

                    Vm.m.initDrawButton();
                    Vm.m.initPivotSelectionChange();

                    Vm.Listen.AvgDateChanged.push(onAvgReload);
                    Vm.Listen.AvgListTapped.push(onAvgListTapped);
                    Vm.Listen.BarSaveChartClicked.push(onBarSaveChartClicked);
                    Vm.Listen.BarSyncAllClicked.push(onBarSyncAllClicked);
                    Vm.Listen.HisDrawButtonClicked.push(onHisDrawButtonClicked);
                    Vm.Listen.PivotSelectionChanged.push(onPivotSelectionChanged);

                    Vm.m.allDatesBackup();
                    Vm.m.InitSucessfully = true;

                    var prog1 = localSettings.values["hisDrawn"]
                        ? pHelp2.progress.subPercent(0.30, 0.70)
                        : pHelp2.progress.subPercent(0.30, 1.00);
                    return pHelp2.erService.getExchangeRatesAsync(initDate, prog1);
                })
                .then(function(ers) {
                    Vm.m.uiAvgAjaxLoader_s(false);
                    Vm.replace(Vm.m.AvgExchangeRates, ers);

                    if (localSettings.values["hisDrawn"]) {
                        Vm.m.HistoryDrawn = localSettings.values["hisDrawn"];

                        var hisDates = Vm.m.hisDates_g();
                        var currency = Vm.m.HistoryCurrency;
                        var expectedSize = $("#chartcontainer").width() * 1.1;

                        return Vm.m.currentPivot_s(1)
                            .then(function() {
                                return pHelp2.erService.getAvaragedDaysAsync(
                                    hisDates[0], hisDates[1], expectedSize,
                                    pHelp2.progress.subPercent(0.70, 0.85));
                            })
                            .then(function(days) {
                                return pHelp2.erService.getExchangeRatesInDaysAsync(
                                    days, currency, [],
                                    pHelp2.progress.subPercent(0.85, 1.00));
                            });
                    } else {
                        return WinJS.Promise.wrap(0);
                    }

                })
                .then(function(ers) {
                    Vm.m.uiHisAjaxLoader_s(false);

                    if (localSettings.values["hisDrawn"]) {
                        return new WinJS.Promise(function(complete) {
                            LiveChart.draw(Vm.m.HistoryCurrency, ers, [], true, function() {
                                complete();
                            });
                        });
                    } else {
                        return WinJS.Promise.wrap(0);
                    }
                })
                .then(function() {
                    if (typeof localSettings.values["currentPivot"] == "number" &&
                        Vm.m.currentPivot_g() !== localSettings.values["currentPivot"]) {
                        return Vm.m.currentPivot_s(localSettings.values["currentPivot"]);
                    } else {
                        return WinJS.Promise.wrap(0);
                    }
                }).then(function() {
                    if (!localSettings.values["hisPivot"]) {
                        Vm.m.hisPivotVisible_s(false);
                    }
                    return pHelp2.flushCacheAsync();
                })
                .done(function() {
                    Vm.m.uiEnabled_s(true);
                    debug.elapsed("init", sw);
                });
        });
    };

    WinJS.Application.oncheckpoint = onSuspending;
    WinJS.Application.onerror = onUnhandledException;
    init();
};;