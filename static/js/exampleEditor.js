var nicEditInstances = {};

$("#panel_container" ).colResizable({ disable : true });


$('textarea[id^="area"]').each(function(index) {
    $(this).height($("#outer_panel2").height()*0.71);
    textareaId = $(this).attr("id");
    if(nicEditInstances[$(this).attr("id")] == undefined){
        nicEditInstances[$(this).attr("id")] = new nicEditor({"iconsPath" : nicEditorPath, "buttonList" : buttonList,}).addInstance($(this).attr("id")).setPanel("area_panel_" + index);                 
    }
});

if(nicEditInstances["explanation_area"] == undefined){
    nicEditInstances["explanation_area"] = new nicEditor({"iconsPath" : nicEditorPath,"buttonList" : buttonList}).addInstance("explanation_area").setPanel('explanation_area_panel');
}

$("#panel_container").find($(".nicEdit-main")).css("min-height",$("#area_container0").height() - $("#panel_container").find($(".nicEdit-panel")).height() - 20 + "px");
$("#panel_container").find($(".nicEdit-main")).css("margin-top",$("#panel_container").find($(".nicEdit-panel")).height() + 5 + "px");

$("#panel_container").find($(".nicEdit-main")).focus(function(){
    currentFocusedEditor = $(this).parent().siblings("textarea").attr("id");
})

$("#explanation_row2").find($(".nicEdit-main")).css("min-height",$("#explanation_row2").height() - $("#explanation_row2").find($(".nicEdit-panel")).height() - 20 + "px");
$("#explanation_row2").find($(".nicEdit-main")).css("margin-top",$("#explanation_row2").find($(".nicEdit-panel")).height() + 5 + "px");
$("#explanation_area_panel").css("width", $("#explanation_row2").find($(".nicEdit-main")).outerWidth( true ) + "px");

$('[id^="area_panel_"]').each(function(){
    $(this).css("width", $("#panel_container").find($(".nicEdit-main")).outerWidth( true ) + "px")
});


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

handleNavigationVisibility();