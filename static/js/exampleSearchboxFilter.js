$('#example_search_box').keyup(function() {
    var valThis = $(this).val().toLowerCase();
    $('.navList>li').each(function() {
        var text = $(this).text().toLowerCase();
        (text.indexOf(valThis) == 0) ? $(this).show(): $(this).hide();
    });
});