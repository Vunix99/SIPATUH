(function ($) {
    "use strict";
    
    // Pastikan jQuery dan FloatLabels sudah terdefinisi
    if (typeof FloatLabels === "undefined") {
        console.error("FloatLabels library is not defined. Make sure to include the script.");
        return;
    }

    // Preload
    $(window).on('load', function () {
        $('[data-loader="circle-side"]').fadeOut(); // will first fade out the loading animation
        $('#preloader').delay(350).fadeOut('slow'); // will fade out the white DIV that covers the website.
        $('body').delay(350).css({
            'overflow': 'visible'
        });
    });
    
    // Submit loader mask
    $('form#wrapped').on('submit', function () {
        var form = $("form#wrapped");
        form.validate();
        if (form.valid()) {
            $("#loader_form").fadeIn();
        }
    });

    // Initialize Float Labels only if jQuery is present
    $(document).ready(function() {
        var floatlabels = new FloatLabels('form', {
            style: 2
        });
    });

})(window.jQuery);
