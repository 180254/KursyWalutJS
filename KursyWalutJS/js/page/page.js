"use strict";

var AppGo = function() {

    $(".calendar-date-picker").datepicker({
        format: "dd.mm.yyyy",
        maxViewMode: 2,
        todayBtn: "linked",
        language: "pl",
        forceParse: false,
        autoclose: true,
        beforeShowDay: function(date) {
            if (date.getMonth() === (new Date()).getMonth())
                switch (date.getDate()) {
                case 4:
                    return false;
                case 8:
                    return false;
                case 12:
                    return "green";
                default:
                    return true;
                }

            return true;
        }
    });
};