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

            if (!(self._started || self.lastDrawnLen !== self.days.length)) {
                self.running = false;
                return;
            }

            var chartContainer = $("#chartcontainer");

            // destroy previous chart instance
            var ejDestroy = chartContainer.data("ejChart");
            if (ejDestroy) ejDestroy.destroy();

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
            var i, newEr;
            if (ers21.length === 0) {
                for (i = 0; i < self.days.length; i++) {
                    newEr = {
                        day: self.days[i],
                        currency: self.currency,
                        averageRate: Utils.getRandomArbitrary(1.00, 1.05)
                    };
                    ers3.push(newEr);
                }
                ers21.push(Utils.first(ers3));
            } else {
                for (i = ers2.length; i < self.days.length; i++) {
                    newEr = {
                        day: self.days[i],
                        currency: self.currency,
                        averageRate: Utils.randomElement(ers21).averageRate,
                    };
                    ers3.push(newEr);
                }
            }

            // remember state
            self.lastDrawnLen = ers2.length;

            // go!
            var onLoad = function() {
                self.next(self.lastDrawnLen !== self.days.length);
            };

            chartContainer.ejChart({
                title: { text: "Historia waluty " + this.currency.code, font: { color: "#CCC2C2" } },
                primaryXAxis: { font: { color: "#CCC2C2" } },
                primaryYAxis: { font: { color: "#CCC2C2" } },
                size: { width: chartContainer.width().toString(), height: chartContainer.height().toString() },

                isResponsive: true,
                enableCanvasRendering: true,
                locale: "pl-PL",
                legend: { visible: false },
                zooming: { enable: false },

                series: [
                    {
                        type: "line",
                        lineJoin: "round",
                        tooltip: { visible: true },
                        dataSource: ers21,
                        xName: "day",
                        yName: "averageRate"
                    },
                    {
                        type: "line",
                        lineJoin: "round",
                        tooltip: { visible: false },
                        dataSource: ers3,
                        xName: "day",
                        yName: "averageRate",
                        fill: "#ACED80",
                        opacity: 0.8
                    }
                ],

                load: onLoad
            });
        }
    },
    {
    
    }
);