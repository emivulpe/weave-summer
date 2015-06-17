var currentStep = 0; // Stores the current step you're on. 0 means initial state.
var csrftoken = getCookie('csrftoken');
var direction = "next";
var last_direction = "next";
var exampleName = "";
var exampleEditors = [];
var explanationEditor = null;


$("#btn_prev").css('visibility', 'hidden');
$("#btn_reset").css('visibility', 'hidden');

$('#create_example_button').click(function(){
    exampleName = $('#example_name').val()
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
            $("#example_name_label").html(exampleName + "- step " +  (currentStep + 1));
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
                exampleEditors[index] = new nicEditor({"iconsPath" : nicEditorPath, "buttonList" : buttonList,}).addInstance($(this).attr("id")).setPanel("area_panel_" + index);                   
            });
            explanationEditor = new nicEditor({"iconsPath" : nicEditorPath,"buttonList" : buttonList}).addInstance("explanation_area").setPanel('explanation_area_panel');
            //$(".nicEdit-main").css("height",$("#area_container0").height() - $(".nicEdit-panel").height() - 20 + "px");

            $("#panel_container").find($(".nicEdit-main")).css("min-height",$("#area_container0").height() - $("#panel_container").find($(".nicEdit-panel")).height() - 20 + "px");
            $("#panel_container").find($(".nicEdit-main")).css("margin-top",$("#panel_container").find($(".nicEdit-panel")).height() + 5 + "px");
            


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
        }
    });

});


$('#create_question_step').click(function(){


    var invalidInputs = $('.option_text').filter(function() {
        return $.trim(this.value) == '';
    });
    var questionEditor = nicEditors.findEditor("question_text");
    var questionText = questionEditor.getContent();
    console.log(questionText + "question_text");
    if(questionText.length > 5){
        if($('#multiple_choice_radio_button').is(':checked')) {
            if ($("#options_list input:checkbox:checked").length == 0){
                BootstrapDialog.alert('Please select at least one correct answer by clicking on the checkbox next to the correct answer!');
            }
            else if (invalidInputs.length > 0) {
                BootstrapDialog.alert('Please enter text for each of the options or delete an option by draging it to the recycle bin!');
            } 
            else{
                $('#question_modal').modal('hide');
                goToStep("next",true);
            }
        }
        else{
            $('#question_modal').modal('hide');
            goToStep("next",true);
        }
    }
    else{
        BootstrapDialog.alert('Please enter your question! A valid question is at least 5 characters long.');

    }

});


$("#question_step_close_button").click(function(){
    alert("question closed");
    $(".option").each(function(){
        $(this).remove();
    })
})


// A function defining the actions the student interface needs to undertake at a particular step
function goToStep(direction, question) {

	//save the html in a db (either replace the existing one if there is one or create a new one
	//NOTE: there are multiple panels- ensure you say what html goes for which panel
	
    handleControlVisibility(direction);
	var panel_texts = {}
	// Save the entries for each panel for the step
	$('textarea[id^="area"]').each(function(index) {
		console.log($(this).attr("id"));
        var panelId = $(this).attr("id");
        var panelArea = nicEditors.findEditor(panelId);
        var panelContent = panelArea.getContent();
        panel_texts[panelId] = panelContent;

	});
    var saveStepTextsRequest = $.post("/weave/save_step_texts/", {
            'html': "panelContent",
            'csrfmiddlewaretoken': csrftoken,
            'example_name': exampleName,
            'step_number': currentStep,
            'panel_texts' : JSON.stringify(panel_texts)
    });
    saveStepTextsRequest.done(function() {
        var explanation = "";
        if(question){
            
            
            var questionEditor = nicEditors.findEditor("question_text");
            var questionText = questionEditor.getContent();
            explanation = "<b>" + questionText + "</b><br>";
            alert("question" + explanation);

            //Add the question options if any
            var options = [];
            var comments_dict = {};
            //var correct = [];
            if($("input:radio[id='multiple_choice_radio_button']").is(":checked")) {
                $(".option_text").each(function(index){
                    /*
                        options[index] = $(this).val(); 
                        explanation += $(this).val() + "<br>";
                        console.log($(this).val() + "OPTION VAL");
                        correct[index] = $(this).parent().prev().find($(":checkbox")).is(':checked');
                    */
                    option_text = $(this).val(); 
                    correct = $(this).parent().prev().find($(":checkbox")).is(':checked');
                    options[index] = {"option_text" : option_text, "correct" : correct};
                });
                var correctAnswerComment = nicEditors.findEditor(correct_answer_comment_textarea).getContent();
                var wrongAnswerComment = nicEditors.findEditor(wrong_answer_comment_textarea).getContent();
                comments_dict['correct_answer_comment'] = correctAnswerComment;
                comments_dict['wrong_answer_comment'] = wrongAnswerComment;
            }
            else{
                var generalComment = nicEditors.findEditor(general_comment_textarea).getContent();
                comments_dict['general_comment'] = generalComment;
            }
                

            $(".option").each(function(){
                $(this).remove();
            })
            //A trick to pass the array with AJAX- it is not possible to pass an array otherwise!
            var options_dict = {'options' : options};
            console.log(options_dict['options'] + "OPTIONS DICT");
            alert(explanation);



            //A special request to post the question- create a question etc
            $.post("/weave/save_question/", {
                'question_text': questionText,
                'csrfmiddlewaretoken': csrftoken,
                'example_name': exampleName,
                'step_number':currentStep,
                'options' : JSON.stringify(options_dict),
                'comments' : JSON.stringify(comments_dict)
            }); 

        } 
        else {
            
            var explanationArea = nicEditors.findEditor("explanation_area");    //Save the explanation for this step
            explanation = explanationArea.getContent();
            alert("not question" + explanation);
        }
        $.post("/weave/save_explanation/", {
            'html': explanation,
            'csrfmiddlewaretoken': csrftoken,
            'example_name': exampleName,
            'step_number':currentStep,
        }).done(function() {
          //if it is next 
            //increment the step counter
        //if it is back
            //decrement the counter
        if (direction == "next"){
            currentStep ++;
        }
        else{
            currentStep --;
        }
        $("#example_name_label").html(exampleName + "- step " + (currentStep + 1));
        //get request to see if there is entry for that step
        //if there is- fill the textarea with it
        //else show an empty text area
        var request = $.get('/weave/get_next_step/', {
            'example_name' : exampleName,
            'step_number' : currentStep
        });

        request.done(function(data) {
            if (!("error" in data)) {
                for (var key in data) {
                  if (data.hasOwnProperty(key)) {

                    console.log(key + 1);
                    console.log(data[key] + 2);
                    console.log($("#"+key).html() + 3);
                    var text_area = nicEditors.findEditor(key);

                    if (key == "explanation_area"){
                        text_area.setContent(data[key]); 
                    }
                    else {
                        if (key == "question"){
                            if (data[key] != ""){
                                $("#question_modal").modal('show');
                                var questionEditor = nicEditors.findEditor("question_text");
                                questionEditor.setContent(data[key]);
                                console.log("THIS STEP IS A QUESTION!!!!!!!!");
                            }
                            else{
                                console.log("this is not a question?????????");
                            }
                        }
                        else if (key == "options"){
                            var questionOptions = JSON.parse(data[key]);
                            for (var i = 0; i < questionOptions.length; i++){
                                console.log(questionOptions[i]["option_text"] + " this is an option" + questionOptions[i]["correct"]);
                                var correct = questionOptions[i]["correct"];
                                if (correct){
                                    $("#options_list").append('<li class="list-group-item option" style = "background-color:green;"><table style = "width:100%;"><tr><td><input type="checkbox" checked></td><td><input class="form-control option_text" type="text" value=' + questionOptions[i]["option_text"] + '></td></tr></table></li>');
                                }
                                else{
                                    $("#options_list").append('<li class="list-group-item option"><table style = "width:100%;"><tr><td><input type="checkbox"></td><td><input class="form-control option_text" type="text" value=' + questionOptions[i]["option_text"] + '></td></tr></table></li>');

                                }
                            }
                            correctAnswerController();
                            $('.option').draggable();   
                            console.log("OPTIOOOOOOOOOOOOOONSSSSSSS");
                        }
                        else if(key == "correct_answer_comment"){
                            var correctAnswerComment = nicEditors.findEditor("correct_answer_comment_textarea");
                            correctAnswerComment.setContent(data[key]);
                        }
                        else if(key == "wrong_answer_comment"){
                            var wrongAnswerComment = nicEditors.findEditor("wrong_answer_comment_textarea");
                            wrongAnswerComment.setContent(data[key]);
                        }
                        else if(key == "general_comment"){
                            var generalComment = nicEditors.findEditor("general_comment_textarea");
                            generalComment.setContent(data[key]);
                        }
                        else {
                            text_area.setContent(data[key]);
                        }
                        
                    }

                    console.log(text_area + 4);
                    
                  }
                }
            }
            else{
                console.log("there was an error");
            }
        });
    });  

    })

}

function correctAnswerController(){
    $('#options_list :checkbox').change(function () {
        if ($(this).is(':checked')) {
            console.log($(this).val() + ' is now checked');
            $(this).parents("li").css("background-color","green");
        } else {
            console.log($(this).val() + ' is now unchecked');
            $(this).parents("li").css("background-color","white");
        }
    });
}
function handleControlVisibility(direction){
        // Ensure the correct arrows are shown
    if (currentStep == 1 && direction == "back") {
        $("#btn_prev").css('visibility', 'hidden');
    } else {
        $("#btn_prev").css('visibility', 'visible');
        $("#btn_next").css('visibility', 'visible');
    }
    
}

// Reset an example- show only the relevant elements
function doReset() {
    $("*[id^='fragment_']").css("background-color", "transparent");
    $("*[id^='fragment_']").hide();
    $('#explanation').html('');
    $("#btn_prev").css('visibility', 'hidden');
    $("#btn_next").css('visibility', 'visible');
    $("#btn_reset").css('visibility', 'hidden');
    $("#forward_button_label").text('Start');
    $("#forward_button_label").css('cursor', 'pointer');
    $("#forward_button_label").css('color', 'red');
    $("#forward_button_label").css('font-size', '24px');
    $("#next_arrow").hide();


    currentStep = 0;
}


// Use JQuery to pick up when the user pushes the next button.
$('#btn_next').click(function() {
    goToStep("next", false);
    alert("next");
});


// Bind an event to the previous button.
$('#btn_prev').click(function() {
    goToStep("back", false);
    alert("back");
});

// Reset the example on click of the reset button
$('#btn_done').click(function() {
    alert("done clicked");
});

$('#btn_question').click(function(){
    // reset the values of the input fields
    var questionEditor = nicEditors.findEditor("question_text");
    if(questionEditor != undefined){
        questionEditor.setContent("");
    }
    var correctAnswerComment = nicEditors.findEditor("correct_answer_comment_textarea");
    if(correctAnswerComment != undefined){
        correctAnswerComment.setContent("");
    }
    var wrongAnswerComment = nicEditors.findEditor("wrong_answer_comment_textarea");
    if(wrongAnswerComment != undefined){
        wrongAnswerComment.setContent("");
    }
    var generalComment = nicEditors.findEditor("general_comment_textarea");
    if(generalComment != undefined){
        generalComment.setContent("");
    }
    $("#question_modal").find($(".nicEdit-main")).css("min-height",50 + "px");

    $(".option_text").each(function(){
        $(this).val("");
    })


    $("#options_list").append('<li class="list-group-item option"><table style = "width:100%;"><tr><td><input type="checkbox"></td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr></table></li>');
    $("#options_list").append('<li class="list-group-item option"><table style = "width:100%;"><tr><td><input type="checkbox"></td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr></table></li>');
    $('.option').draggable();              
    $("#question_modal").modal('show');
    correctAnswerController();

});




// Show the dialog for a question
function ShowDialog() {
    $("#overlay").show();
    $("#dialog").css({
        "position": "absolute",
        "top": ((($(window).height() - $("#dialog").outerHeight()) / 2) + $(window).scrollTop() + "px"),
        "left": ((($(window).width() - $("#dialog").outerWidth()) / 2) + $(window).scrollLeft() + "px"),
    });
    $("#dialog").fadeIn(300);

    $("#overlay").unbind("click");
}


// Hide a dialog of a question
function HideDialog() {
    $("#overlay").hide();
    $("#dialog").fadeOut(300);
}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Specify the shortcut keys for transition between examples
document.onkeydown = function(e) {
    switch (e.keyCode) {
        case 37:
            if (currentStep > 0 && $("#dialog").is(':hidden')) {
                goToStep("back",false);
            }
            break;
        case 39:
            if (currentStep <= totalSteps && $("#dialog").is(':hidden')) { //if the action is question that hasn't been asked yet, i.e. the explanation_dict is still empty for that step
                goToStep("next",false);
            }
            break;
    }
};

// A function to escape HTML to ensure the correct text for the examples appears
function escapeHtml(unsafe) {
    if (unsafe == null) {
        return "";
    }
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}