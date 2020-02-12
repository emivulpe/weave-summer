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
var d = new Date();
var lastTime = d.getTime();
var multipleChoiceQuestion = false;




$(".prev_btn").css('visibility', 'hidden');
$(".next_btn").css('visibility', 'hidden');
$("#btn_reset").css('visibility', 'hidden');




function loadStep(direction, answer){

    if (currentStep > 0) {
        var now = new Date().getTime();
        if (answer != null){

        // !!!!!!!!!!!!
        
        // The answer should be the answered selected/written by the user!
        // !!!!!!!!!!!!    
            $.post("/weave/log_question_info_db/", {
                'time': (now - lastTime) / 1000,
                'step_number': currentStep,
                'answer': answer,
                'example_name': exampleName,
                'csrfmiddlewaretoken': csrftoken,
                'direction': direction,
            });
        }
        else{
            $.post("/weave/log_info_db/", {
                'time': (now - lastTime) / 1000,
                'step_number': currentStep,
                'direction': direction,
                'csrfmiddlewaretoken': csrftoken,
                'example_name': exampleName
            });            
        }
        lastTime = now;
    }

    if (direction != "this"){
        if (direction == "next"){
            currentStep++;
        }
        else{
            currentStep --;
        }
    }
    handleNavigationVisibility();
    $("#example_name_label").text(exampleName + "- step " + (currentStep + 1));
    //get request to see if there is entry for that step
    //if there is- fill the textarea with it
    //else show an empty text area
    var request = $.get('/weave/get_next_step/', {
        'example_name' : exampleName,
        'step_number' : currentStep,
        'use_to_create_new_step' : "false",
        'edit_mode': "false"
    });

    request.done(function(data) {
        if (data.hasOwnProperty("question_text")) {
            $("#create_question_step").hide();
            $("#question_step_navigator").show();
            $("#question_step_close_button").hide();

            $("#example_name_label").text(exampleName + "- step " + (currentStep + 1));   
            $("#question_modal_title").text("Step " + (currentStep + 1) + "- Question Step");   
            $("#question_modal").modal('show');

           loadingQuestionStep = true;
            $('#question_modal').on('shown.bs.modal', function (e) {
                if(loadingQuestionStep){
                   manageExampleAreas(data, direction); 
                }
                
            });
        }
        else{
            manageExampleAreas(data, direction, answer);
        }

    });
}




function manageExampleAreas(data, direction, answer) {
    resetQuestionModal();
    if (!("error" in data)) {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {

                if (key == "options"){
                    var questionOptions = data[key];
                    if(questionOptions.length > 0){
                        multipleChoiceQuestion = true;
                        for (var i = 0; i < questionOptions.length; i++){
                            opt_number = i + 1;
                            option = questionOptions[i];
                            var optionText = option["option_text"];     
                            $("#options_list").append('<li class ="option"><table id = "option_' + opt_number +'" style = "width:100%;"><tr><td style = "width:1%;white-space:nowrap;"><input type="checkbox" class = "answer_checkbox" id = "checkbox_' + opt_number + '"></td><td class = "option_number" style = "width:1%;white-space:nowrap; padding : 10px;"><label for = "checkbox_' + opt_number + '">' + opt_number + '.</label></td><td class = "option_text"><label for = "checkbox_' + opt_number + '">' + optionText + '</label></td></tr></table></li>');
                        }
                    }
                    else{
                        multipleChoiceQuestion = false;
                        $("#options_list").append('<li><label id = "answer_area_label" for = "answer_area">Please enter your answer below:</label></li>');
                        $("#options_list").append('<li><textarea id = "answer_area" style = "width:100%; resize: none;"></textarea></li>');
                    }
                }
                else if(key == "question_type" && data[key] == "open"){
                      $("#options_list").append('<li><label id = "answer_area_label" for = "answer_area">Please enter your answer below:</label></li>');
                      $("#options_list").append('<li><textarea id = "answer_area" style = "width:100%; resize: none;"></textarea></li>');
                }
                else if(key == "explanation_area" && direction == "next" && answer != null){
                    $("#" + key).html("<div>You have answered: " + answer + "</div>" + data[key]);
                }
                else { 
                    $("#" + key).html(data[key]);
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


function resetQuestionModal(){

    $(".option").each(function(){
        $(this).remove();
    });
    $("#answer_area").remove();
    $("#answer_area_label").remove();
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
    loadStep("next");
});


// Bind an event to the previous button.
$('#btn_prev').click(function() {
    loadStep("back");
});




// Use JQuery to pick up when the user pushes the next button.
$('#question_btn_next').click(function() {
    answer = getAnswer();
    $("#question_modal").modal('hide');
    $('#question_modal').on('hidden.bs.modal', function () {
        $(this).removeData('bs.modal');
    });
    resetQuestionModal();  
    loadStep("next", answer);
});


// Bind an event to the previous button.
$('#question_btn_prev').click(function() {
    $("#question_modal").modal('hide');
    $('#question_modal').on('hidden.bs.modal', function () {
        $(this).removeData('bs.modal')
    });
    resetQuestionModal();
    loadStep("back");
});




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

/*
function showAnswer(){
    explanation = $("#explanation_area").html();
    var request = $.get("/weave/get_answer/", {
        'example_name': exampleName,
        'step_number': currentStep,
        'csrfmiddlewaretoken': csrftoken,
    });
    request.done(function(outcome) {
        if ("answer" in outcome){
            answer = "You have selected " + outcome['answer'] + "<br>";
        }
        else{
            answer = "";
        }
        $("#explanation_area").html(answer + "<br>" + explanation);

    })
}
*/
function getAnswer(){
    if (multipleChoiceQuestion) {
        answer = "";
        $("input:checked").each(function(){
            answer += $(this).parent().siblings(".option_text").text() + ";";
        })
    }
    else {
        answer = $("#answer_area").val();
    }
    return answer;
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
                    loadStep("back");
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
                    loadStep("next");
                }
            });
            break;
    }
};