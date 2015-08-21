$('#add_option_button').click(function(){
    var option_type = $('input[type=radio][name=question_type_radio]:checked').val();
    console.log(option_type + "OPTION TYPE");
    option_number = $("#options_list").find($(".option")).length + 1;
    $("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number + '"style = "width:100%;"><tr><td><input type="checkbox"></td><td class = "option_number">' + option_number + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td><td align="center"><a href="#" style="top: 2px; color : #777;" title = "Delete this option" class = "delete_option"><i class="fa fa-trash-o fa-lg landing-icon fa"></i></a></td></tr></table></li>');
    
    refreshDeleteOptionController();

    if (option_type == "multiple_choice_with_comments"){
        $('#option_' + option_number).append('<tr id = "comment_area_' + option_number + '"><td colspan = "4"><label>Answer comment:</label><textarea id="comment_textarea_' + option_number + '" style = "width:100%;"></textarea></td></tr>');

        if(nicEditors.findEditor("comment_textarea_" + option_number) == undefined){
            nicEditInstances["comment_textarea_" + option_number] = new nicEditor({"iconsPath" : nicEditorPath, "buttonList" : buttonList,}).panelInstance("comment_textarea_" + option_number);
        }
    }
    option_number++;

    correctAnswerController();
    $('.modal').data('bs.modal').handleUpdate();

});

$("#question_modal").on('shown.bs.modal',function(){
    $("#question_text").width($("#question_text_container").width());

    if(nicEditInstances["question_text"] == undefined){
        nicEditInstances["question_text"] = new nicEditor({"iconsPath" : nicEditorPath,"buttonList" : buttonList}).panelInstance("question_text");
    }

})

$('input[type=radio][name=question_type_radio]').on('change', function(){
    $("#question_modal").find($(".nicEdit-main")).css("min-height",50 + "px");  


    switch($(this).val()){
        case 'multiple_choice' :
            $("#options_container").show();
            console.log("mc");
            $('[id^="comment_area_"]').each(function(index) {
                $(this).remove();
                console.log("to remove");
            })

            break;
        case 'multiple_choice_with_comments' :
            $("#options_container").show();
            console.log("mcwc");
            $('table[id^="option_"]').each(function(index) {
                if($(this).find($("#comment_area_" + (index + 1))).length == 0){
                    $(this).append('<tr id = "comment_area_' + (index + 1) + '"><td colspan = "4"><label>Answer comment:</label><textarea id="comment_textarea_' + (index + 1) + '" style = "width:100%;"></textarea></td></tr>');
                }
            });

            $('textarea[id^="comment_textarea_"]').each(function(index) {

                if(nicEditors.findEditor($(this).attr("id")) == undefined){

                nicEditInstances[$(this).attr("id")] = new nicEditor({"iconsPath" : nicEditorPath, "buttonList" : buttonList,}).panelInstance($(this).attr("id"));
                }
            });
            break;
        case 'open' :
            $("#options_container").hide();
            console.log("o");
            break;
    }            
});