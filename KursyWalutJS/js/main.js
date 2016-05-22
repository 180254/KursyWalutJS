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

//    var cache = new InMemCache();
//    cache.store("alamakota", { "a": 2, "XXX": { "b": 3 } })
//        .then(function() {
//            return cache.get("alamakota");
//        })
//        .done(function(value) {
//            console.log(value);
//        });
    var nbpExtractor = new NbpExtractor();
    nbpExtractor.getHttpResponse("http://www.nbp.pl/kursy/xml/a001z160104.xml", "iso-8859-2")
        .done(function(response) {
            var document = nbpExtractor.parseXml(response);
            var exchangeRates = nbpExtractor.parseExchangeRates(document);
            console.log(exchangeRates);
        });
}());