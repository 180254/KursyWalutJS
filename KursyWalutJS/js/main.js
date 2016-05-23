/* global Windows, WinJS */
(function() {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function(args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll().then(function() {
                // TODO: Your code here.
            }));
        }
    };

    app.oncheckpoint = function(args) {
        // TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
        // You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
        // If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
    };

    app.start();

    /*
    var cache = new InMemCache();
    cache.storeAsync("alamakota", { "a": 2, "XXX": { "b": 3 } })
        .then(function() {
            return cache.getAsync("alamakota");
        })
        .done(function(value) {
            console.log(value);
        });
    var nbpExtractor = new NbpErExtractor();
    nbpExtractor.getHttpResponseAsync("http://www.nbp.pl/kursy/xml/a001z160104.xml", "iso-8859-2")
        .done(function(response) {
            var document = nbpExtractor.parseXml(response);
            var exchangeRates = nbpExtractor.parseExchangeRates(document);
            console.log(exchangeRates);
        });

    var progress = new Progress(1000);
    var nbpProvider = new NbpErProvider(cache);

    nbpProvider.initCacheAsync(new Progress(1000))
        .then(function() {
            return nbpProvider.getAvailableYearsAsync(new Progress(1000));
        })
        .then(function(years) {
            console.log(years);
            return nbpProvider.getAvailableDaysAsync(2016, new Progress(1000));
        })
        .then(function(days) {
            console.log(days);
            return nbpProvider.getAvailableDaysAsync(2016, new Progress(1000));
        })
        .then(function(days) {
            console.log(days);
            return nbpProvider.getExchangeRatesAsync(days[0], progress);
        })
        .then(function(exchangeRates) {
            console.log(progress);
            console.log(exchangeRates);
            return nbpProvider.flushCacheAsync(new Progress(1000));
        })
        .done(function() { console.log("OK") },
            function(e) {
                console.log(e);
            });

            */

    var cache = new InMemCache();
    var provider = new NbpErProvider(cache);
    var service = new ErService(provider);

    var lastDej;
    var timeStart;
    var dejs;
    service.initCacheAsync(new Progress(1000))
//        .then(function() {
//            return service.getFirstAvailableDayAsync(new Progress(1000));
//        })
//        .then(function(firstDay) {
//            console.log(firstDay);
//            return service.getLastAvailableDayAsync(new Progress(1000));
//        })
//        .then(function(lastDay) {
//            lastDej = lastDay;
//            console.log(lastDay);
//            return service.getAllAvailableDaysAsync(new Progress(1000));
//        })
//        .then(function(allDays) {
//            console.log(allDays);
//            return service.getExchangeRatesAsync(lastDej, new Progress(1000));
//        })
//        .then(function(ers) {
//            console.log(ers);
//            return service.getExchangeRateAsync(Currency.dummyForCode("USD"), lastDej, new Progress(1000));
//        })
        .then(function(er) {
            console.log(er);
            return service.getAvailableDaysAsync(2015, new Progress(1000));
        })
        .then(function(days) {
            console.log(days);
            dejs = days;
            timeStart = moment();
            return service.getExchangeRateAvaragedHistoryAsync(Currency.dummyForCode("USD"), dejs[0], dejs.slice(-1)[0],
                100, new Progress(1000));
        })
        .then(function(result) {
            var timeStop = moment();
            console.log(result);

            var time = (timeStop - timeStart) / 100;
            console.log("OK1/" + time + "s");
            timeStart = moment();

            return service.getExchangeRateAvaragedHistoryAsync(Currency.dummyForCode("USD"), dejs[0], dejs.slice(-1)[0],
                100, new Progress(1000));
        })
        .done(function() {
            var timeStop = moment();
            var time = (timeStop - timeStart) / 100;
            console.log("OK2/" + time + "s");
            },
            function(e) {
                console.log(e);
            });

    //https://fknet.wordpress.com/2013/02/08/winjs-promises-lessons-learned/
}());