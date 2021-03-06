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
$(".next_btn").css('visibility', 'hidden');
$("#btn_reset").css('visibility', 'hidden');



//$('#create_question_step').click(function(){
//    //option_number = 1;
//
//    var invalidInputs = $('.option_text').filter(function() {
//        return $.trim(this.value) == '';
//    });
//    var questionEditor = nicEditors.findEditor("question_text");
//    var questionText = questionEditor.getContent();
//    console.log(questionText + "question_text");
//    if($('#multiple_choice_radio_button').is(':checked')) {
//        if (invalidInputs.length > 0) {
//            BootstrapDialog.alert('Please enter text for each of the options or delete an option by clicking on the recycle bin next to it!');
//        }
//        else{
//            $('#question_modal').modal('hide');
//            // ?????????? do I need to set the booleans somehow??????????
//            saveQuestion("false", "false", "next", false);
//            $("#create_question_step").hide();
//            //$("#delete_question").show();
//
//        }
//    }
//    else{
//        $('#question_modal').modal('hide');
//        // ?????????? do I need to set the booleans somehow??????????
//        saveQuestion("false", "false", "next", false);
//        $("#create_question_step").hide();
//        //$("#delete_question").show();
//
//    }
//
//});


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

                    if(allMatches.length > 0){
                        $("#step_editor_modal").modal('show');
                    }
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


function saveQuestion(isQuestionBefore, isQuestionAfter, direction, newStep){
    if (isQuestionBefore == undefined){
        isQuestionBefore = false;
    }
    if (isQuestionAfter == undefined){
        isQuestionAfter = false;
    }
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
    $.post("/weave/create_question/", {
        'question_text': questionText,
        'csrfmiddlewaretoken': csrftoken,
        'example_name': exampleName,
        'step_number':currentStep,
        'options' : JSON.stringify(options_dict),
        'question_type' : questionType,
        'insert_before' : isQuestionBefore,
        'insert_after' : isQuestionAfter
        //'comments' : JSON.stringify(comments_dict)
    }).done(function(){
        handleNavigationVisibility();
        if(direction != null && direction != "this"){
            loadStep(direction);
        }
        else{
            if (newStep){
                if(currentStep > 0){
                    var request = $.get('/weave/get_next_step/', {
                        'example_name' : exampleName,
                        'step_number' : currentStep-1,
                        'use_to_create_new_step' : "true"
                    });

                    request.done(function(data) {
                        manageExampleAreas(data, "this"); 
                    });
                    var explanationArea = nicEditors.findEditor("explanation_area");    //Save the explanation for this step
                    explanationArea.setContent("");
                }
                else{
                    $('textarea[id^="area"]').each(function(index) {
                        var panelId = $(this).attr("id");
                        var panelArea = nicEditors.findEditor(panelId);
                        var panelContent = panelArea.setContent("");
                    });
                }
            }
        }
    }); 
    resetQuestionModal(true);
}



function loadStep(direction){

    if (direction == "next"){
        currentStep++;
    }
    else if (direction == "back"){
        currentStep --;
    }

    $("#example_name_label").text(exampleName + "- step " + (currentStep + 1));
    //get request to see if there is entry for that step
    //if there is- fill the textarea with it
    //else show an empty text area
    var request = $.get('/weave/get_next_step/', {
        'example_name' : exampleName,
        'step_number' : currentStep,
        'use_to_create_new_step' : "false"
    });

    request.done(function(data) {
        handleNavigationVisibility();
        if (data.hasOwnProperty("question_text")) {
            //alert("here is a question dialog");
            //$("#create_question_step").hide();
            //$("#delete_question").show();
            $("#question_step_navigator").show();
            $("#question_step_close_button").hide();

            $("#example_name_label").text(exampleName + "- step " + (currentStep + 1));   
            $("#question_modal_title").text("Step " + (currentStep + 1) + "- Question Step");
            if (data.hasOwnProperty("question_type")) {

                questionType = data["question_type"];
                if(questionType == "open"){
                    $("#add_option_button").hide();
                }
                else{
                    $("#add_option_button").show();
                }
            }
            $("#question_modal").modal('show');

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
    if(direction != "this"){
        resetQuestionModal(true);
    }
    if (!("error" in data)) {
        if (data.hasOwnProperty("question_type")) {
            questionType = data["question_type"];
            $("[name=question_type_radio][value="+ questionType +"]").prop('checked', true);
        }
        for (var key in data) {

            if (data.hasOwnProperty(key) && key != "question_type") {
                //alert(key);
                console.log(key + 1);
                console.log(data[key] + 2);
                console.log($("#"+key).html() + 3);
                
                //if (text_area != undefined){
                if (key == "explanation_area"){
                    text_area = nicEditors.findEditor(key);
                    text_area.setContent(data[key]); 
                }
                else if(key == "question_text"){
                    var questionEditor = nicEditors.findEditor("question_text");
                    questionEditor.setContent(data[key]);
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
                                $("#options_list").append('<li class="list-group-item option" style = "background-color:green;"><table id = "option_' + opt_number +'"style = "width:100%;"><tr><td><input type="checkbox" checked></td><td class = "option_number">' + opt_number + '.</td><td><input class="form-control option_text" type="text" value="' + optionText + '"></td><td align="center"><a href="#" style="top: 2px; color : #777;" title = "Delete this option" class = "delete_option"><i class="fa fa-trash-o fa-lg landing-icon fa"></i></a></td></tr></table></li>');
                            }
                            else{
                                $("#options_list").append('<li class="list-group-item option"><table id = "option_' + opt_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td class = "option_number">' + opt_number + '.</td><td><input class="form-control option_text" type="text" value="' + optionText + '"></td><td align="center"><a href="#" style="top: 2px; color : #777;" title = "Delete this option" class = "delete_option"><i class="fa fa-trash-o fa-lg landing-icon fa"></i></a></td></tr></table></li>');
                            }
                            refreshDeleteOptionController();
                            if (option.hasOwnProperty("comment")){

                                $("#option_" + opt_number).append('<tr id = "comment_area_' + opt_number + '"><td colspan = "4"><label>Answer comment:</label><textarea id="comment_textarea_' + opt_number + '" style = "width:100%;"></textarea></td></tr>');
     
                                commentText = option["comment"];
                                if(nicEditors.findEditor("comment_textarea_" + opt_number) == undefined){
                                    nicEditInstances[("comment_textarea_" + opt_number)] = new nicEditor({"iconsPath" : nicEditorPath, "buttonList" : buttonList,}).panelInstance("comment_textarea_" + opt_number);
                                }
                                //alert(nicEditors.findEditor("comment_textarea_" + opt_number));
                                nicEditors.findEditor("comment_textarea_" + opt_number).setContent(commentText);
                            }
                        }

                        //correctAnswerController();
                        console.log("OPTIOOOOOOOOOOOOOONSSSSSSS");
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
    saveStep("false", "false", "next", false);
});


// Bind an event to the previous button.
$('#btn_prev').click(function() {
    saveStep("false", "false", "back", false);
});

/*------
$('.delete_step_btn').click(function() {
    if ($(this).hasClass("question_step_btn")){
        $("#question_modal").modal('hide');
    }
    $.post("/weave/delete_step/", {
        'example_name': exampleName,
        'step_number': currentStep,
        'csrfmiddlewaretoken': csrftoken,
    }).done(function(){
        if(currentStep > 0){
            loadStep("back");
        }
        else{
            loadStep("this");
        }
    })
});

-----*/ 

/*
$('#btn_create_step_after').click(function() {
    saveStep("true", "false");
    currentStep ++;
    $("#example_name_label").html(exampleName + "- step " + (currentStep + 1));
    handleStepEditorControlVisibility("next", currentStep, 1000, ".example_control");
});

$('#btn_create_step_before').click(function() {
    alert("create before");
    saveStep("false", "true");
})
*/

$('.create_step_btn.after').click(function() {
    /*
    if(currentStep > 0){
        var request = $.get('/weave/get_next_step/', {
            'example_name' : exampleName,
            'step_number' : currentStep-1
        });

        request.done(function(data) {
            manageExampleAreas(data, "this"); 
        })
    }
    var explanationArea = nicEditors.findEditor("explanation_area");    //Save the explanation for this step
    explanationArea.setContent("");
    */
    if($(this).hasClass("question_step_btn")){
        saveQuestion("false", "true", "this", true);
        $("#question_modal").modal('hide');
    }
    else{
        saveStep("false", "true", "this", true);
    }
    currentStep ++;
    $("#example_name_label").text(exampleName + "- step " + (currentStep + 1));
    //handleNavigationVisibility();
});

$('.create_step_btn.before').click(function() {
    /*
    if(currentStep > 0){
        var request = $.get('/weave/get_next_step/', {
            'example_name' : exampleName,
            'step_number' : currentStep-1
        });

        request.done(function(data) {
            manageExampleAreas(data, "this"); 
        });
        var explanationArea = nicEditors.findEditor("explanation_area");    //Save the explanation for this step
        explanationArea.setContent("");
    }
    else{
        $('textarea[id^="area"]').each(function(index) {
            var panelId = $(this).attr("id");
            var panelArea = nicEditors.findEditor(panelId);
            var panelContent = panelArea.setContent("");
        });
    }
    */
    if($(this).hasClass("question_step_btn")){
        saveQuestion("true", "false", "this", true);
        $("#question_modal").modal('hide');
    }
    else{
        saveStep("true", "false", "this", true);
    }
})



function saveStep(insertBefore, insertAfter, direction, newStep){
    if (insertBefore == undefined){
        insertBefore = false;
    }
    if (insertAfter == undefined){
        insertAfter = false;
    }

    var panel_texts = {};
    var explanationArea = nicEditors.findEditor("explanation_area");    //Save the explanation for this step
    explanation = explanationArea.getContent();
    explanationArea.setContent("");
    // Save the entries for each panel for the step
    $('textarea[id^="area"]').each(function(index) {
        console.log($(this).attr("id") + " in save step");
        var panelId = $(this).attr("id");
        var panelArea = nicEditors.findEditor(panelId);
        var panelContent = panelArea.getContent();
        panel_texts[panelId] = panelContent;

    });
    var saveStepTextsRequest = $.post("/weave/create_step/", {
        'csrfmiddlewaretoken': csrftoken,
        'example_name': exampleName,
        'step_number': currentStep,
        'panel_texts' : JSON.stringify(panel_texts),
        'explanation' : explanation,
        'insert_after' : insertAfter,
        'insert_before' : insertBefore
    }).done(function(){
        handleNavigationVisibility();
        if(direction != null && direction != "this"){
            loadStep(direction);
        }
        else{
            if (newStep){
                if(currentStep > 0){
                    var request = $.get('/weave/get_next_step/', {
                        'example_name' : exampleName,
                        'step_number' : currentStep-1,
                        'use_to_create_new_step' : "true"
                    });

                    request.done(function(data) {
                        manageExampleAreas(data, "this"); 
                    });
                    var explanationArea = nicEditors.findEditor("explanation_area");    //Save the explanation for this step
                    explanationArea.setContent("");
                }
                else{
                    $('textarea[id^="area"]').each(function(index) {
                        var panelId = $(this).attr("id");
                        var panelArea = nicEditors.findEditor(panelId);
                        var panelContent = panelArea.setContent("");
                    });
                }
            }
        }
    });
    //clearAutomaticHighlighting();
    $(".style").each(function(){
        $(this).replaceWith(function() { 
            return $(".style").contents(); 
        });
    });

}

$('.done_btn').click(function(){
    saveStep(false, false, "this", false);
})


function clearAutomaticHighlighting(){
    $('textarea[id^="area"]').each(function(index) {
        var panelId = $(this).attr("id");
        var panelArea = nicEditors.findEditor(panelId);
        var panelContent = panelArea.getContent();
        alert(panelContent);
        $(".style").replaceWith(function() { return $(".style").contents(); });
        alert(panelContent);
    });
}

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
    saveQuestion("false", "false", "next", false);
    $("#question_modal").modal('hide');
    $('#question_modal').on('hidden.bs.modal', function () {
        $(this).removeData('bs.modal')
    });
    resetQuestionModal(true);  
    //loadStep("next");
});


// Bind an event to the previous button.
$('#question_btn_prev').click(function() {
    saveQuestion("false", "false", "back", false);
    $("#question_modal").modal('hide');
    $('#question_modal').on('hidden.bs.modal', function () {
        $(this).removeData('bs.modal')
    });
    resetQuestionModal(true);
    //loadStep("back");
});

// // Reset the example on click of the reset button
// $('.done_btn').click(function() {
//     alert("done clicked");
// });


$('.create_question_btn').click(function(){

    if($(this).hasClass("before")){
        isQuestionBefore = true;
        isQuestionAfter = false;
    }
    else{
        isQuestionBefore = false;
        isQuestionAfter = true;
    }
    if($(this).hasClass("question_step_btn")){
        saveQuestion(isQuestionBefore, isQuestionAfter, "this", true);
    }
    else{
        saveStep(isQuestionBefore, isQuestionAfter, "this", true);
    }
    stepsToSubtract = 1;
    if($(this).hasClass("after")){
        currentStep ++;
    }
    else{
        stepsToSubtract++;
    }
    $("#example_name_label").text(exampleName + "- step " + (currentStep + 1));
    $("#question_modal_title").text("Step " + (currentStep + 1) + "- Question Step");
    loadingQuestionStep = false;
    
    window.setTimeout(function(){
        var request = $.get("/weave/check_steps/", {
            'example_name': exampleName,
            'step_number': (currentStep-stepsToSubtract),
            'csrfmiddlewaretoken': csrftoken,
        });
//        request.done(function(outcome) {
//            if (outcome['next_steps'] != 0){
//                $("#create_question_step").show();
//            }
//            else{
//                $("#create_question_step").hide();
//            }
//
//        })
    },1000);

    var questionEditor = nicEditors.findEditor("question_text");
    if(questionEditor != undefined){
        questionEditor.setContent("");
    }

    $("#question_modal").find($(".nicEdit-main")).css("min-height",50 + "px");
    $("#question_modal").modal('show');
    //$('#question_modal').on('shown.bs.modal', function () {
        //resetQuestionModal(true);
        option_number = 1;
        $("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td class = "option_number">' + option_number++ + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td><td align="center"><a href="#" style="top: 2px; color : #777;" title = "Delete this option" class = "delete_option"><i class="fa fa-trash-o fa-lg landing-icon fa"></i></a></td></tr></table></li>');
        $("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td class = "option_number">' + option_number++ + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td><td align="center"><a href="#" style="top: 2px; color : #777;" title = "Delete this option" class = "delete_option"><i class="fa fa-trash-o fa-lg landing-icon fa"></i></a></td></tr></table></li>');
 
        refreshDeleteOptionController();
    //}) 
    //$("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td>' + option_number++ + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr></table></li>');
    //$("#options_list").append('<li class="list-group-item option"><table id = "option_' + option_number +'"style = "width:100%;"><tr><td><input type="checkbox"></td><td>' + option_number++ + '.</td><td><input class="form-control option_text" type="text" placeholder="Option Text"></td></tr></table></li>');

    $("#question_step_close_button").show();          

    correctAnswerController();

});


function refreshDeleteOptionController(){
    $(".delete_option").click(function(){
        $(this).parents("li").nextAll().each(function(){
            // adapt the option number of the next options appropriately
            $(this).find("table").attr("id", "option_" + (parseInt($(this).find(".option_number").html().replace( /\D+/g, '')) - 1));
            alert($(this).find("[id^='comment_area_']").attr("id"));
            alert($(this).find("[id^='comment_textarea_']").attr("id"));
            $(this).find("[id^='comment_area_']").attr("id", "comment_area_" + (parseInt($(this).find(".option_number").html().replace( /\D+/g, '')) - 1));
            $(this).find("[id^='comment_textarea_']").attr("id", "comment_textarea_" + (parseInt($(this).find(".option_number").html().replace( /\D+/g, '')) - 1));
            $(this).find(".option_number").html(parseInt($(this).find(".option_number").html().replace( /\D+/g, '')) - 1 + ".");
        })
        $(this).parents("li").remove();
    });
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

function handleNavigationVisibility(){
    var request = $.get("/weave/check_steps/", {
        'example_name': exampleName,
        'step_number': currentStep,
        'csrfmiddlewaretoken': csrftoken,
    });
    request.done(function(outcome) {
        if (outcome['previous_steps'] != 0){
            // show previous
            $(".prev_btn").css('visibility', 'visible');
        }
        else{
            // hide previous
            $(".prev_btn").css('visibility', 'hidden');
        }

        if (outcome['next_steps'] != 0){
            // show next
            $(".next_btn").css('visibility', 'visible');
        }
        else{
            //hide next
            $(".next_btn").css('visibility', 'hidden');
        }
    })
}


// Specify the shortcut keys for transition between examples
document.onkeydown = function(e) {
    switch (e.keyCode) {
        case 37:
            var request = $.get("/weave/check_steps/", {
                'example_name': exampleName,
                'step_number': (currentStep),
                'csrfmiddlewaretoken': csrftoken,
            });
            request.done(function(outcome) {
                if (outcome['previous_steps'] > 0){
                    saveStep("false", "false", "back", false);
                }
            });

            break;
        case 39:
            var request = $.get("/weave/check_steps/", {
                'example_name': exampleName,
                'step_number': (currentStep),
                'csrfmiddlewaretoken': csrftoken,
            });
            request.done(function(outcome) {
                if (outcome['next_steps'] > 0){
                    saveStep("false", "false", "next", false);
                }
            });
            break;
    }
};