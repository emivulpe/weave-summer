 $("#panel_container" ).colResizable({ disable : true });



//Re-init the plugin on the new elements
$("#panel_container").colResizable({
    liveDrag: true,
    gripInnerHtml: "<div class='grip'></div>",
    draggingClass: "dragging",
    onDrag: function (){

         $('[id^="area_container"]').each(function(index) {
            var container_width = $(this).parent().width();
            console.log("id " + $(this).attr("id") + "width" + container_width);
            $(this).width(container_width);
            $(this).children().each(function(){
                $(this).width(container_width);
            })
         })   

    }
});

handleNavigationVisibility();


$().ready(function() {

    var int00;
    $("#example_container").splitter({
        type: "h", 
        accessKey: "P"
    });
});

$(window).resize(function() {
    
    $("#outer_panel2").width($("#example_container").width() + "px");
    $("#explanation_row2").width($("#example_container").width() + "px");
    $("#panel_container").width($("#example_container").width() + "px");
    $(".hsplitbar").width($("#example_container").width() + "px");
    $("#explanation_row2").height($("#example_container").height() - $("#outer_panel2").height() - 4 + "px");


     $('[id^="area_container"]').each(function(index) {
        var container_width = $(this).parent().width();
        console.log("id " + $(this).attr("id") + "width" + container_width);
        $(this).width(container_width);
        $(this).children().each(function(){
            $(this).width(container_width);
        })
     })   

    $("#explanation_row2").children().css("width", ($("#explanation_row2").width() - 20) + "px");



    $( "#panel_container" ).colResizable({ disable : true });
    //Re-init the plugin on the new elements
    $("#panel_container").colResizable({
        liveDrag: true,
        gripInnerHtml: "<div class='grip'></div>",
        draggingClass: "dragging",
        onDrag: function (){

             $('[id^="area_container"]').each(function(index) {
                var container_width = $(this).parent().width();
                console.log("id " + $(this).attr("id") + "width" + container_width);
                $(this).width(container_width);
                $(this).children().each(function(){
                    $(this).width(container_width);
                })
             })   

        }
    });

    $("#question_text").css("width", ($("#question_modal_body").width()) + "px");

});
