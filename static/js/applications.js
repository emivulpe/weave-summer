/*
The functions in this script deal with resizing of panels.
*/


$(function($) {
    $(".resizable").resizable();
    $("#dialog").draggable();
	
});

$("#panel_container").colResizable({
    liveDrag: true,
    gripInnerHtml: "<div class='grip'></div>",
    draggingClass: "dragging"
});