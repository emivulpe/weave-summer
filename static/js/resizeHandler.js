function resizeEditors() {
    console.log("mouse down");
    $("#panel_container").find($(".nicEdit-main")).css("min-height",$("#area_container0").height() - $("#panel_container").find($(".nicEdit-panel")).height() - 20 + "px");
    $("#panel_container").find($(".nicEdit-main")).css("margin-top",$("#panel_container").find($(".nicEdit-panel")).height() + 5 + "px");       

    $("#explanation_row2").find($(".nicEdit-main")).css("min-height",$("#explanation_row2").height() - $("#explanation_row2").find($(".nicEdit-panel")).height() - 20 + "px");
    $("#explanation_row2").find($(".nicEdit-main")).css("margin-top",$("#explanation_row2").find($(".nicEdit-panel")).height() + 5 + "px");
    $("#explanation_area_panel").css("width", $("#explanation_row2").find($(".nicEdit-main")).outerWidth( true ) + "px");   

}


$(function() {
    $("#plan_modal").modal('show');
    $(".step").draggable();
});

$().ready(function() {

    var int00;
    $("#example_container").splitter({
        type: "h", 
        accessKey: "P"
    });
    $('.hsplitbar').mousedown(function(){
            int00 = setInterval(function() { resizeEditors(); }, 1);
            $("#explanation_area_panel").css("position","relative");
        })
    $(window).mouseup(function() { 
            clearInterval(int00);
            $("#explanation_area_panel").css("position","fixed");
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
        $(this).find($(".nicEdit-main")).width(container_width - 24+ "px");
        $(this).find($(".nicEdit-panelContain")).width(container_width - 20 + "px");
        $(this).find($(".nicEdit-main")).css("min-height",$(this).height() - $(this).find($(".nicEdit-panel")).height() - 20 + "px");
        $(this).find($(".nicEdit-main")).css("margin-top",$(this).find($(".nicEdit-panel")).height() + 5 + "px");

     })   

    $("#explanation_row2").children().css("width", ($("#explanation_row2").width() - 20) + "px");
    $("#explanation_row2").find($(".nicEdit-main")).css("width",($("#explanation_row2").width() - 27) + "px");
    


    $("#panel_container").find($(".nicEdit-main")).css("min-height",$("#area_container0").height() - $("#panel_container").find($(".nicEdit-panel")).height() - 20 + "px");
    $("#panel_container").find($(".nicEdit-main")).css("margin-top",$("#panel_container").find($(".nicEdit-panel")).height() + 5 + "px");       

    $("#explanation_row2").find($(".nicEdit-main")).css("min-height",$("#explanation_row2").height() - $("#explanation_row2").find($(".nicEdit-panel")).height() - 20 + "px");
    $("#explanation_row2").find($(".nicEdit-main")).css("margin-top",$("#explanation_row2").find($(".nicEdit-panel")).height() + 5 + "px");
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
                $(this).find($(".nicEdit-main")).width(container_width - 24+ "px");
                $(this).find($(".nicEdit-panelContain")).width(container_width - 20 + "px");
                $(this).find($(".nicEdit-main")).css("min-height",$(this).height() - $(this).find($(".nicEdit-panel")).height() - 20 + "px");
                $(this).find($(".nicEdit-main")).css("margin-top",$(this).find($(".nicEdit-panel")).height() + 5 + "px");

             })   

        }
    });

    $("#question_text_container").children().css("width", ($("#question_modal_body").width()) + "px");
    $("#question_text_container").find($(".nicEdit-main")).css("width",($("#question_modal_body").width()) + "px");
});
