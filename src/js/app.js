/* eslint-disable no-undef */
window.jQuery = window.$ = require("jquery");

require("popper.js");
require("bootstrap");
require("@fortawesome/fontawesome-free");
window.moment = require("moment");
require("tempusdominus-bootstrap-4");
require("../css/styles.less");

$(document).ready(function() {
    "use strict";
    $("i.pass__toggle--visibility").on("click", function() {
        let field;
        if ($(this).hasClass("fa-eye")) {
            field = $(this).siblings("input[type=password]");
            $(this).removeClass("fa-eye");
            $(this).addClass("fa-eye-slash");
            field.attr("type", "text");
            $(this).attr("title", "Hide password");
        } else if ($(this).hasClass("fa-eye-slash")) {
            field = $(this).siblings("input[type=text]");
            $(this).removeClass("fa-eye-slash");
            $(this).addClass("fa-eye");
            field.attr("type", "password");
            $(this).attr("title", "Show password");
        }
    });

    // inizialize datetimepicker constructor to use fontawesome 5 icons by default
    try {
        $.fn.datetimepicker.Constructor.Default = $.extend({},
            $.fn.datetimepicker.Constructor.Default, {
                icons: {
                    time: "fas fa-clock",
                    date: "fas fa-calendar",
                    up: "fas fa-arrow-up",
                    down: "fas fa-arrow-down",
                    previous: "fas fa-chevron-left",
                    next: "fas fa-chevron-right",
                    today: "fas fa-calendar-check-o",
                    clear: "far fa-trash",
                    close: "fas fa-times"
                }
            }
        );
    } catch (error) {
        throw ("tempusdominus-bootstrap-4 datetimepicker is required", error);
    }
});

/*!
 * Start Bootstrap - SB Admin v6.0.1 (https://startbootstrap.com/templates/sb-admin)
 * Copyright 2013-2020 Start Bootstrap
 * Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-sb-admin/blob/master/LICENSE)
 */
(function($) {
    "use strict";

    // Add active state to sidbar nav links
    var path = window.location.href; // because the 'href' property of the DOM element is the absolute path
    $("#layoutSidenav_nav .sb-sidenav a.nav-link").each(function() {
        if (this.href === path) {
            $(this).addClass("active");
        }
    });

    // Toggle the side navigation
    $("#sidebarToggle").on("click", function(e) {
        e.preventDefault();
        $("body").toggleClass("sb-sidenav-toggled");
    });
})(window.jQuery);