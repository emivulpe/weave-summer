var currentStep = 0; // Stores the current step you're on. 0 means initial state.
var csrftoken = getCookie('csrftoken');
var direction = "next";
var last_direction = "next";
var exampleName = "";
var exampleEditors = [];
var explanationEditor = undefined;
//var option_number = 1;
var commentEditors = [];
var exactMatches = [];
var possibleMatches = [];
var allMatches = [];
var stepToChangeIndex = -1;
var previousStepToChangeDirection = "next";
var exactMatchesBeingProcessed = true;
var exactMatchesEdits = {};
var possibleMatchesEdits = {};
var currentFocusedEditor = undefined;
var loadingQuestionStep = false;


$(".prev_btn").css('visibility', 'hidden');
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

                /*if(nicEditInstances[$(this).attr("id")] != undefined){
                    nicEditInstances[$(this).attr("id")].removeInstance(nicEditInstances[$(this).attr("id")]);
                    nicEditInstances[$(this).attr("id")] = undefined;
                }*/
                textareaId = $(this).attr("id");
                if(nicEditInstances[$(this).attr("id")] == undefined){
                    nicEditInstances[$(this).attr("id")] = new nicEditor({"iconsPath" : nicEditorPath, "buttonList" : buttonList,}).addInstance($(this).attr("id")).setPanel("area_panel_" + index).addEvent('focus', function() {
                                                                                                                                                                                                                                    currentFocusedEditor = textareaId;
                                                                                                                                                                                                                                  });                  
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
    //option_number = 1;

    var invalidInputs = $('.option_text').filter(function() {
        return $.trim(this.value) == '';
    });
    var questionEditor = nicEditors.findEditor("question_text");
    var questionText = questionEditor.getContent();
    console.log(questionText + "question_text");
    if(questionText.length > 4){
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
                $("#create_question_step").hide();

            }
        }
        else{
            $('#question_modal').modal('hide');
            goToStep("next",true);
            $("#create_question_step").hide();

        }
    }
    else{
        BootstrapDialog.alert('Please enter your question! A valid question is at least 5 characters long.');

    }

});


$("#question_step_close_button").click(function(){
    resetQuestionModal(true);
})


// A function defining the actions the student interface needs to undertake at a particular step
function editText(textToChange, newText) {

    var panel_texts = {}
    // Save the entries for each panel for the current step
    $('textarea[id^="area"]').each(function(index) {
        console.log($(this).attr("id"));
        var panelId = $(this).attr("id");
        var panelArea = nicEditors.findEditor(panelId);
        var panelContent = panelArea.getContent();
        panel_texts[panelId] = panelContent;

    });

    var saveStepTextsRequest = $.post("/weave/save_step_texts/", {
        'csrfmiddlewaretoken': csrftoken,
        'example_name': exampleName,
        'step_number': currentStep,
        'panel_texts' : JSON.stringify(panel_texts)
    });
    saveStepTextsRequest.done(function() {
        var explanationArea = nicEditors.findEditor("explanation_area");    //Save the explanation for this step
        explanation = explanationArea.getContent();
        // Save the explanation for the current step
        $.post("/weave/save_explanation/", {
            'html': explanation,
            'csrfmiddlewaretoken': csrftoken,
            'example_name': exampleName,
            'step_number':currentStep,
        }).done(function() {
            //get the steps that involve the selected text- rename the view appropriately!!!
            $.post("/weave/edit_steps/", {
                'example_name': exampleName,
                'panel_id': currentFocusedEditor,
                'csrfmiddlewaretoken': csrftoken,
                'text_to_change' : textToChange + "",
                'new_text' : newText,
                'step_number' : currentStep
            }).done(
                function(affectedSteps){

                    /*
                    exactMatches = affectedSteps['exact_matches'];
                    possibleMatches = affectedSteps['possible_matches'];
                    
                    if(exactMatches.length > 0){
                        exactMatchesBeingProcessed = true;
                        $("#step_editor_modal").modal('show');
                    }
                    else if(possibleMatches.length > 0){
                        exactMatchesBeingProcessed = false;
                        $("#step_editor_modal").modal('show');
                    }
                    */
                    loadStep("this");
                    allMatches = affectedSteps['all_matches'];
                    $("#step_editor_modal").modal('show');
                    //$("#step_editor_modal").modal('show');
                });
        });  

    })

}

function confirmStepChange(){ 
    stepDetails = allMatches[0]; 
    allMatches.shift();
    $("#step_editor_title").text("Step " + (stepDetails["step_number"] + 1));
    $("#current_step_text").html(stepDetails["html"]);
    $("#panel_id").text(stepDetails["panel_id"]);
    stepEditor = nicEditors.findEditor("text_to_change_textarea");
    if(stepEditor != undefined){
        stepEditor.setContent(stepDetails["proposed_text"]);
    }
}


/*
function confirmStepChanges(direction, initialInvocation){
    if(!initialInvocation){
        storeNewStepText();
        //alert(stepToChangeIndex);
    }
    typeOfControls = ".step_editor_control";
    if (exactMatchesBeingProcessed){
        typeOfMatches = exactMatches;
        title = "Exact matches step editor- step ";
    }
    else{
        typeOfMatches = possibleMatches;
        title = "Possible matches step editor- step ";
    }
    if (direction == "next"){
        stepToChangeIndex++;
        //alert(stepToChangeIndex + " step to change " + direction + " prev");
        handleStepEditorControlVisibility(direction , stepToChangeIndex, typeOfMatches.length, typeOfControls);
    }
    else if(direction == "back"){
        //alert(stepToChangeIndex + " step to change " + direction + " prev");
        handleStepEditorControlVisibility(direction , stepToChangeIndex, typeOfMatches.length, typeOfControls);
        stepToChangeIndex--;
    } 
    //alert(stepToChangeIndex + " step to change " + direction + " prev");
    if(typeOfMatches[stepToChangeIndex] != undefined){
        stepDetails = typeOfMatches[stepToChangeIndex]; 
        //alert(stepDetails["html"] + " interested in this");
        $("#step_editor_title").text(title + (stepDetails["step_number"] + 1));
        $("#current_step_text").html(stepDetails["html"]);
        $("#panel_id").text(stepDetails["panel_id"]);
        stepEditor = nicEditors.findEditor("text_to_change_textarea");
        if(stepEditor != undefined){
            //alert(stepDetails["proposed_text"] + " this should not be undefined");
            stepEditor.setContent(stepDetails["proposed_text"]);
        }
        else{
            alert("Step editor was undefined!!!");
        }
    }
    else{
        //----------------> IMPORTANT- check why it enters here <------------------ alert("check here");
    }   

}
*/
function storeNewStepText(){
    stepEditor = nicEditors.findEditor("text_to_change_textarea");
    newStepText = stepEditor.getContent();
    var str=$("#step_editor_title").text();
    stepToEdit = parseInt(str.replace( /\D+/g, '')) - 1;
    if (exactMatchesBeingProcessed){
        exactMatchesEdits[stepToEdit] = newStepText;
    }
    else{
        possibleMatchesEdits[stepToEdit] = newStepText;
    }
    //alert("example: " + exampleName + " step: " + num + " new text: " + newStepText);
}
// A function defining the actions the student interface needs to undertake at a particular step
function goToStep(direction, question) {

	//save the html in a db (either replace the existing one if there is one or create a new one
	//NOTE: there are multiple panels- ensure you say what html goes for which panel
    handleStepEditorControlVisibility(direction, currentStep, 1000, ".example_control");
    //handleControlVisibility(direction);
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
        'csrfmiddlewaretoken': csrftoken,
        'example_name': exampleName,
        'step_number': currentStep,
        'panel_texts' : JSON.stringify(panel_texts)
    });
    saveStepTextsRequest.done(function() {
        var explanation = "";
        if(question){
            saveQuestion();
        } 
        else {
            var explanationArea = nicEditors.findEditor("explanation_area");    //Save the explanation for this step
            explanation = explanationArea.getContent();
        }
        $.post("/weave/save_explanation/", {
            'html': explanation,
            'csrfmiddlewaretoken': csrftoken,
            'example_name': exampleName,
            'step_number':currentStep,
        }).done(function() {
            loadStep(direction);
        });  

    })

}



function saveQuestion(){
    var questionEditor = nicEditors.findEditor("question_text");
    var questionText = questionEditor.getContent();
    explanation = "<b>" + questionText + "</b><br>";

    //Add the question options if any
    var options = [];
    //var comments_dict = {};
    if($("input:radio[id^='multiple_choice_']").is(":checked")) {
        $(".option_text").each(function(index){
            option_text = $(this).val(); 
            correct = $(this).parent().prev().find($(":checkbox")).is(':checked');
            options[index] = {"option_text" : option_text, "correct" : correct};
        });
        $("[id^=option_").each(function(index){
            optionText = $(this).find(".option_text").val();
            correct = $(this).find($(":checkbox")).is(':checked');
            optionComment = "no comment";
            options[index] = {"option_text" : optionText, "correct" : correct};
            if($("input:radio[id='multiple_choice_with_comments_radio_button']").is(":checked")){
                var commentArea = nicEditors.findEditor("comment_textarea_" + (index + 1));
                optionComment = commentArea.getContent();
                options[index]["comment"] = optionComment;
            }
        });


    }


    //A trick to pass the array with AJAX- it is not possible to pass an array otherwise!
    var options_dict = {'options' : options};
    console.log(options_dict['options'] + "OPTIONS DICT");
    var questionType = $('input[name="question_type_radio"]:checked').val();;
    //A special request to post the question- create a question etc
    $.post("/weave/save_question/", {
        'question_text': questionText,
        'csrfmiddlewaretoken': csrftoken,
        'example_name': exampleName,
        'step_number':currentStep,
        'options' : JSON.stringify(options_dict),
        'question_type' : questionType
        //'comments' : JSON.stringify(comments_dict)
    }); 
    resetQuestionModal(true);
}


function loadStep2(direction){
    if (direction != "this"){
        if (direction == "next"){
            currentStep ++;
        }
        else{
            currentStep --;
        }
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
        manageExampleAreas(data, direction);
    });
}

function loadStep(direction){
    if (direction != "this"){
        if (direction == "next"){
            currentStep++;
            if(previousStepToChangeDirection == "back"){
                currentStep++;
            }
        }
        else{
            currentStep --;
            if(previousStepToChangeDirection == "back"){
                currentStep--;
            }
        }
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
        if (data.hasOwnProperty("question_text")) {
            //alert("here is a question dialog");
            $("#create_question_step").hide();
            $("#question_step_navigator").show();
            $("#question_step_close_button").hide();
            handleStepEditorControlVisibility(direction, currentStep, 1000, ".question_control");
            handleStepEditorControlVisibility(direction, currentStep, 1000, ".example_control");       
            $("#question_modal").modal('show');
            var questionEditor = nicEditors.findEditor("question_text");
            questionEditor.setContent(data["question_text"]);
           // alert("THIS STEP IS A QUESTION!!!!!!!!");
           loadingQuestionStep = true;
            $('#question_modal').on('shown.bs.modal', function (e) {
                if(loadingQuestionStep){
                   manageExampleAreas(data, direction); 
                }
                
            });
        }
        else{
            manageExampleAreas(data, direction);
        }

    });
}


function manageExampleAreas(data, direction) {
    resetQuestionModal(true);
    if (!("error" in data)) {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                //alert(key);
                console.log(key + 1);
                console.log(data[key] + 2);
                console.log($("#"+key).html() + 3);
                
                //if (text_area != undefined){
                    if (key == "explanation_area"){
                        text_area = nicEditors.findEditor(key);
                        text_area.setContent(data[key]); 
                    }
                    else {

                        if (key == "options"){
                            //alert("options");
                            //var questionOptions = JSON.parse(data[key]);
                            var questionOptions = data[key];
                            //alert(questionOptions);

                            for (var i = 0; i < questionOptions.length; i++){
                                opt_number = i + 1;
                                option = questionOptions[i];
                                console.log(option["option_text"] + " this is an option" + option["correct"] + opt_number);
                                var optionText = option["option_text"]; 
                                var correct = option["correct"];
                                //alert(optionText);
                                if (correct){
                                    $("#options_list").append('<li class="list-group-item option" style = "background-color:green;"><table id = "option_' + opt_number +'"style = "width:100%;"><tr><td><input type="checkbox" checked></td><td>' + opt_number + '.</td><td><input class="form-control option_text" type="text" value="' + optionText + '"></td></tr></table></li>');
                                }
                                else{
                                    $("#options_list").append('<li class="list-group-item option"><table id = "option_' + opt_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td>' + opt_number + '.</td><td><input class="form-control option_text" type="text" value=' + optionText + '></td></tr></table></li>');
                                }
                                if (option.hasOwnProperty("comment")){

                                    $("#option_" + opt_number).append('<tr id = "comment_area_' + opt_number + '"><td colspan = "3"><label for = "comment_textarea_' + opt_number + '">Answer comment:</label><textarea id="comment_textarea_' + opt_number + '" style = "width:100%;"></textarea></td></tr>');
         
                                    commentText = option["comment"];
                                    if(nicEditors.findEditor("comment_textarea_" + opt_number) == undefined){
                                        nicEditInstances[("comment_textarea_" + opt_number)] = new nicEditor({"iconsPath" : nicEditorPath, "buttonList" : buttonList,}).panelInstance("comment_textarea_" + opt_number);
                                    }
                                    //alert(nicEditors.findEditor("comment_textarea_" + opt_number));
                                    nicEditors.findEditor("comment_textarea_" + opt_number).setContent(commentText);
                                }
                            }

                            //correctAnswerController();
                            //$('.option').draggable();   
                            console.log("OPTIOOOOOOOOOOOOOONSSSSSSS");
                        }
                        else if (key == "question_type"){
                            questionType = data[key];
                            $("[name=question_type_radio][value="+ questionType +"]").prop('checked', true);// + data[key] + "]")
                        }

                        else if (key != "question_text"){ 
                            text_area = nicEditors.findEditor(key);
                            text_area.setContent(data[key]);
                        }
                        
                }

            }
        }

    }

    else{
        console.log("there was an error");
    }
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
    if(direction != "this"){
        // Ensure the correct arrows are shown
        if (currentStep <= 1 && direction == "back") {
            $(".prev_btn").css('visibility', 'hidden');
        } else {
            $(".prev_btn").css('visibility', 'visible');
            $(".next_btn").css('visibility', 'visible');
        }
    }
    
}

function handleStepEditorControlVisibility2(direction, currentStepNumber, numberOfSteps, controlClass){
    if(controlClass == undefined){
        controlClass = "";
    }
    if(controlClass == ".question_control"){
        currentStepNumber++;
    }
    //alert(controlClass + ".prev_btn");
    if(direction != "this"){
        if (currentStepNumber >= numberOfSteps && direction == "next") {
            $(controlClass + ".next_btn").css('visibility', 'hidden');
        } 
        else if (currentStepNumber <= 1 && direction == "back") {
            $(controlClass + ".prev_btn").css('visibility', 'hidden');
        } 
        else {
            $(controlClass + ".prev_btn").css('visibility', 'visible');
            $(controlClass + ".next_btn").css('visibility', 'visible');
        }
    }
}       


function handleStepEditorControlVisibility(direction, currentStepNumber, numberOfSteps, controlClass){
    if(controlClass == undefined){
        controlClass = "";
    }
    if(controlClass == ".question_control"){
        currentStepNumber++;
    }
    if (direction == "back"){
        currentStepNumber--;
    }
    //alert(currentStepNumber + " steppppppp");
    if(direction == "next"){
        if(currentStepNumber < 0  || (controlClass == ".step_editor_control" && currentStepNumber <= 0)){
            $(controlClass + ".prev_btn").css('visibility', 'hidden');
            //alert("should hide");
        }
        else{
             $(controlClass + ".prev_btn").css('visibility', 'visible');
        }  
    }
    else{
        if(currentStepNumber <= 0){
            $(controlClass + ".prev_btn").css('visibility', 'hidden');
        }
        else{
             $(controlClass + ".prev_btn").css('visibility', 'visible');
        }
    }

    if(/*currentStepNumber >= 0 &&*/currentStepNumber < numberOfSteps - 1){
        $(controlClass + ".next_btn").css('visibility', 'visible');
    }
    else{
        $(controlClass + ".next_btn").css('visibility', 'hidden');
    }
}       



function resetQuestionModal(radioChoiceReset){

    if(radioChoiceReset){
        $("#multiple_choice_radio_button").prop('checked',true);
    }
    $(".option").each(function(){
        $(this).remove();
    })
    //option_number = 1;
    $("#options_container").show();
}

// Reset an example- show only the relevant elements
function doReset() {
    $("*[id^='fragment_']").css("background-color", "transparent");
    $("*[id^='fragment_']").hide();
    $('#explanation').html('');
    $(".prev_btn").css('visibility', 'hidden');
    $(".next_btn").css('visibility', 'visible');
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
});


// Bind an event to the previous button.
$('#btn_prev').click(function() {
    goToStep("back", false);
});

/*
$('#step_editor_btn_next').click(function() {
    confirmStepChanges("next", false);
});


// Bind an event to the previous button.
$('#step_editor_btn_prev').click(function() {
    confirmStepChanges("back", false);
});

*/


// Use JQuery to pick up when the user pushes the next button.
$('#question_btn_next').click(function() {
    goToStep("next", true);
    $("#question_modal").modal('hide');
    $('#question_modal').on('hidden.bs.modal', function () {
        $(this).removeData('bs.modal')
    });
    resetQuestionModal(true);  

});


// Bind an event to the previous button.
$('#question_btn_prev').click(function() {
    goToStep("back", true);
    $("#question_modal").modal('hide');
    $('#question_modal').on('hidden.bs.modal', function () {
        $(this).removeData('bs.modal')
    });
    resetQuestionModal(true);
});

// Reset the example on click of the reset button
$('#btn_done').click(function() {
    alert("done clicked");
});

$('#btn_question_old').click(function(){
    // reset the values of the input fields
    //$('#question_modal').removeData('bs.modal');
    //resetQuestionModal(true);
    $("#create_question_step").show();

    $("#question_step_navigator").hide();
    var questionEditor = nicEditors.findEditor("question_text");
    if(questionEditor != undefined){
        questionEditor.setContent("");
    }
    /*
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
    */
    $("#question_modal").find($(".nicEdit-main")).css("min-height",50 + "px");

    /*$(".option_text").each(function(){
        alert("some option");
        $(this).val("");
    })*/
    //var option_type = $('input[type=radio][name=question_type_radio]').val();
    //alert(option_type + "option type");
    option_number = 1;
    $("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td>' + option_number++ + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr></table></li>');
    $("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td>' + option_number++ + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr></table></li>');
       
        /*if (option_type == "multiple_choice_with_comments"){
            $('table[id^="option_"]').each(function(index) {
                $(this).append('<tr id = "comment_area_' + (index + 1) + '"><td colspan = "3"><label for = "comment_textarea_' + (index + 1) + '">Answer comment:</label><textarea id="comment_textarea_' + (index + 1) + '" style = "width:100%;"></textarea></td></tr>');
            });

            $('textarea[id^="comment_textarea_"]').each(function(index) {
                //$(this).height($("#outer_panel2").height()*0.71);
                //$(this).css("margin","100px");
                //$(this).width($("#question_text_container").width());
                // if(nicEditInstances[$(this).attr("id")] != undefined){
                //     nicEditInstances[$(this).attr("id")].removeInstance(nicEditInstances[$(this).attr("id")]);
                //     nicEditInstances[$(this).attr("id")] = undefined;
                // }
                //if(nicEditInstances[$(this).attr("id")] == undefined){
                nicEditInstances[$(this).attr("id")] = new nicEditor({"iconsPath" : nicEditorPath, "buttonList" : buttonList,}).panelInstance($(this).attr("id"));//.addInstance($(this).attr("id")).setPanel("comment_panel_" + index+1);                   
                //}

                //---------commentEditors[index] = new nicEditor({"iconsPath" : nicEditorPath, "buttonList" : buttonList,}).panelInstance($(this).attr("id"));//.addInstance($(this).attr("id")).setPanel("comment_panel_" + index+1);                   
            


            });
            //$("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'" style = "width:100%;"><tr class = "handle"><td><input type="checkbox"></td><td>' + option_number + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr><tr><td colspan = "3"><label for = "comment_textarea_' + option_number + '">Correct answer comment:</label><textarea id="comment_textarea_' + option_number++ + '" style = "width:100%;"></textarea></td></tr></table></li>');
            //$("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr class = "handle"><td><input type="checkbox"></td><td>' + option_number + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr><tr><td colspan = "3"><label for = "comment_textarea_' + option_number + '">Correct answer comment:</label><textarea id="comment_textarea_' + option_number++ + '" style = "width:100%;"></textarea></td></tr></table></li>');
        }
        else{
            $("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td>' + option_number++ + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr></table></li>');
            $("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td>' + option_number++ + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr></table></li>');
        }*/

    //$('.option').draggable();    
    //resetQuestionModal(true);
    //alert($(".option").length + " after reset");
    $("#question_step_close_button").show();          
    $("#question_modal").modal('show');
    correctAnswerController();

});


$('#btn_question').click(function(){
    loadingQuestionStep = false;
    $("#create_question_step").show();
    $("#question_step_navigator").hide();

    var questionEditor = nicEditors.findEditor("question_text");
    if(questionEditor != undefined){
        questionEditor.setContent("");
    }

    $("#question_modal").find($(".nicEdit-main")).css("min-height",50 + "px");
    $("#question_modal").modal('show');
    //$('#question_modal').on('shown.bs.modal', function () {
        //resetQuestionModal(true);
        option_number = 1;
        $("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td>' + option_number++ + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr></table></li>');
        $("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td>' + option_number++ + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr></table></li>');


    //}) 
    //$("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td>' + option_number++ + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr></table></li>');
    //$("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td>' + option_number++ + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr></table></li>');

    $("#question_step_close_button").show();          

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
// document.onkeydown = function(e) {
//     switch (e.keyCode) {
//         case 37:
//             if (currentStep > 0 && $("#dialog").is(':hidden')) {
//                 goToStep("back",false);
//             }
//             break;
//         case 39:
//             if (currentStep <= totalSteps && $("#dialog").is(':hidden')) { //if the action is question that hasn't been asked yet, i.e. the explanation_dict is still empty for that step
//                 goToStep("next",false);
//             }
//             break;
//     }
// };

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

function findOccurrences( array, element ) {
    var totalOccurrences = 0;
    var indexOfDifferentElements = [];
    for(var index = 0; index < array.length; index++){
        if(array[index] == element){
            totalOccurrences++;
        }
        else{
            indexOfDifferentElements[indexOfDifferentElements.length] = index;
        }
    }

    return {"totalOccurrences" : totalOccurrences, "indexOfDifferentElements" : indexOfDifferentElements};

}