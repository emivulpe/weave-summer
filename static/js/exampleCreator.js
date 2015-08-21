$('#example_name').on('input', function() {
    if ($("#example_name").val() == ""){
    	$('#create_example_button').prop('disabled', true);
    }
    else {
    	$('#create_example_button').prop('disabled', false);
    }
});



$('#create_example_button').click(function(){
    exampleName = $('#example_name').val();

    if(exampleName.indexOf('_') != -1){
        BootstrapDialog.alert("Please enter an example name which doesn't contain an underscore!");
    }
    else{
        var request = $.post("/weave/create_example/", {
            'example_name': exampleName,
            'number_of_panels': $('#number_of_panels').val(),
            'csrfmiddlewaretoken': csrftoken,
        });
        request.done(function(outcome) { // Extract a list of the relevant groups
            if ("error" in outcome) {
                BootstrapDialog.alert('Please enter a valid example name and a valid number of panels');
            } 
            else if ("disallowed" in outcome){
                BootstrapDialog.alert('Please select a different name for your example because there is an example with your selected name!');
            }
            else {
                $('#plan_modal').modal('hide');
                $("#example_container").css("visibility", "visible");
                $("#example_name_label").text(exampleName + "- step " +  (currentStep + 1));
                var number_of_panels = parseInt($("#number_of_panels").val());
                var panel_width = $("#panel_container").width()/number_of_panels;
                console.log(panel_width  +" wew " + $("#panel_container").width());
                for (i = 0; i < number_of_panels; i++) {
                    $("#example_panels").append('<td id = "panel_area_' + i + '" class = "panel" valign="top" style = " width:' + panel_width + 'px;"><div id = "area_container' + i + '" class="panel" style="margin:0px; float: left;word-wrap:break-word;overflow-y:scroll; overflow-x:hidden; width:' + panel_width + 'px;"><div id="area_panel_' + i + '" style="width:' + panel_width + 'px; position:absolute;"></div><textarea id = "area' + i + '" class="panel" style = "width:' + (panel_width-20) + 'px; margin: 100px;"></textarea></div></td>');
                }
                //$(".nicEdit-main").css("margin","100px");
                $("#panel_container" ).colResizable({ disable : true });



                $('textarea[id^="area"]').each(function(index) {
                    $(this).height($("#outer_panel2").height()*0.71);
                    //$(this).css("margin","100px");

                    /*if(nicEditInstances[$(this).attr("id")] != undefined){
                        nicEditInstances[$(this).attr("id")].removeInstance(nicEditInstances[$(this).attr("id")]);
                        nicEditInstances[$(this).attr("id")] = undefined;
                    }*/
                    textareaId = $(this).attr("id");
                    if(nicEditInstances[$(this).attr("id")] == undefined){
                        nicEditInstances[$(this).attr("id")] = new nicEditor({"iconsPath" : nicEditorPath, "buttonList" : buttonList,}).addInstance($(this).attr("id")).setPanel("area_panel_" + index);                 
                    }
                });
                /*if(nicEditInstances["explanation_area"] != undefined){
                    nicEditInstances["explanation_area"].removeInstance(nicEditInstances["explanation_area"]);
                    nicEditInstances["explanation_area"] = undefined;
                }*/
                if(nicEditInstances["explanation_area"] == undefined){
                    nicEditInstances["explanation_area"] = new nicEditor({"iconsPath" : nicEditorPath,"buttonList" : buttonList}).addInstance("explanation_area").setPanel('explanation_area_panel');
                }
                //$(".nicEdit-main").css("height",$("#area_container0").height() - $(".nicEdit-panel").height() - 20 + "px");

                $("#panel_container").find($(".nicEdit-main")).css("min-height",$("#area_container0").height() - $("#panel_container").find($(".nicEdit-panel")).height() - 20 + "px");
                $("#panel_container").find($(".nicEdit-main")).css("margin-top",$("#panel_container").find($(".nicEdit-panel")).height() + 5 + "px");
                
                $("#panel_container").find($(".nicEdit-main")).focus(function(){
                    currentFocusedEditor = $(this).parent().siblings("textarea").attr("id");
                })

                //$("#panel_container").find($(".nicEdit-panelContain")).css("width", $("#panel_container").find($(".nicEdit-main")).outerWidth() + "px");
                //$("#panel_container").find($(".nicEdit-panel")).css("margin-right" , "0");
                //$("#area_panel_0").css("width", $("#panel_container").find($(".nicEdit-main")).outerWidth( true ) + "px");
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

				$(".nicEdit-main").css("white-space", "pre");

            }
        });
    }

});
