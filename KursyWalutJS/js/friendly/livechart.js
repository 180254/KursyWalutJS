"use strict";

/**
 * Live chart drawing util.
 * @constructor
 */
var LiveChart = WinJS.Class.derive(
    FancyLoop,

    /**
     * @constructor
     * @param {Currency} currency 
     * @returns {LiveChart} 
     */
    function(currency) {
        this.timeMs = 1200;

        this.Ers = [];
        this.currency = currency;
        this.days = null;
        this.lastDrawnLen = 0;

        LiveChart.destroy();
        Vm.m.uiHisAjaxLoader_s(true);
    },
    {
        /**
         * @param {Date[]} days 
         * @returns {void} 
         */
        setDays: function(days) {
            this.days = days;
        },

        /**
          * (private) Draw chart loop.
          * @returns {void} 
          */
        _go: function() {
            var self = this;

            var finalDrawnBefore = self.lastDrawnLen === self.days.length;
            if (!self._started && finalDrawnBefore) {
                self.running = false;
                return;
            }

            var chartContainer = $("#chartcontainer");

            // ers2 are currently downloaded info
            var ers2 = Utils.cloneArray(self.Ers);

            // check if is something to draw
            if (ers2.length === self.lastDrawnLen) {
                self.next();
                return;
            }

            // ers21 are currently downloaded info with skipped undefined
            // - undefined means currency doesn't exist in that day
            // ers3 are not yet downloaded dummies
            var ers21 = Utils.skipUndefined(ers2);
            var ers3 = [];

            // fill ers3 with dummy info
            var i, startI, newEr, rate;
            if (ers21.length === 0) {
                rate = Utils.getRandomArbitrary(1.00, 1.05);
                startI = 0;
            } else {
                rate = Utils.last(ers21).averageRate;
                startI = ers2.length;;
            }

            for (i = startI; i < self.days.length; i++) {
                newEr = {
                    day: self.days[i],
                    currency: self.currency,
                    averageRate: rate
                };
                ers3.push(newEr);
            }

            if (ers21.length === 0) {
                ers21.push(Utils.first(ers3));
            }

            // remember state
            self.lastDrawnLen = ers2.length;

            // next iteration
            var finalDrawnNow = self.lastDrawnLen === self.days.length;
            var onDone = function() {
                self.next(!finalDrawnNow);
            };

            // destroy previous chart instance
            LiveChart.destroy();
            Vm.m.uiHisAjaxLoader_s(false);

            // go!
            var zoomingEnabled = finalDrawnNow;
            LiveChart.draw(this.currency, ers21, ers3, zoomingEnabled, onDone);
        }
    },
    {
        draw: function(currency, series1, series2, zooming, ondone) {
            var chartContainer = $("#chartcontainer");
            chartContainer.ejChart({
                title: { text: "Historia waluty " + currency.code, font: { color: "#CCC2C2" } },
                primaryXAxis: { font: { color: "#CCC2C2" } },
                primaryYAxis: { font: { color: "#CCC2C2" } },
                size: { width: chartContainer.width().toString(), height: chartContainer.height().toString() },
                exporting: { type: "png", mode: "client", fileName: "x" },

                isResponsive: true,
                enableCanvasRendering: true,
                locale: "pl-PL",
                legend: { visible: false },
                zooming: { enable: zooming },

                series: [
                    {
                        type: "line",
                        lineJoin: "round",
                        tooltip: { visible: true },
                        dataSource: series1,
                        xName: "day",
                        yName: "averageRate"
                    },
                    {
                        type: "line",
                        lineJoin: "round",
                        tooltip: { visible: false },
                        dataSource: series2,
                        xName: "day",
                        yName: "averageRate",
                        fill: "#ACED80",
                        opacity: 0.8
                    }
                ],

                create: ondone
            });
        },

        destroy: function() {
            var chartContainer = $("#chartcontainer");
            var ejDestroy = chartContainer.data("ejChart");
            if (ejDestroy) ejDestroy.destroy();
        },

        toPNGbytes: function() {
            var base64 = $("#chartcontainer").ejChart("export").toDataURL("image/png").substr(22);

            var raw = window.atob(base64);
            var rawLength = raw.length;

            var array = new Uint8Array(new ArrayBuffer(rawLength));
            for (var i = 0; i < rawLength; i++) {
                array[i] = raw.charCodeAt(i);
            }

            return array;
        }
    }
);