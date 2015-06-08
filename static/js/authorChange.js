var currentStep = 0; // Stores the current step you're on. 0 means initial state.
var csrftoken = getCookie('csrftoken');
var direction = "next";
var last_direction = "next";
$("#btn_prev").css('visibility', 'hidden');
$("#btn_reset").css('visibility', 'hidden');



// A function defining the actions the student interface needs to undertake at a particular step
function goToStep(direction) {
    //alert("in go to" + $("#example_name").text() + "da");
	//save the html in a db (either replace the existing one if there is one or create a new one
	//NOTE: there are multiple panels- ensure you say what html goes for which panel
	
    handleControlVisibility(direction);
	
	// Save the entries for each panel for the step
	$('textarea[id^="area"]').each(function(index) {
		console.log($(this).attr("id"));
        var panelId = $(this).attr("id");
        var panelArea = nicEditors.findEditor(panelId);
        var panelContent = panelArea.getContent();
        $.post("/weave/save_step/", {
            'html': panelContent,
			'csrfmiddlewaretoken': csrftoken,
			'example_name': $("#example_name").text(),
			'step_number': currentStep,
			'panel_id' : panelId,
        });
	});
	var explanationArea = nicEditors.findEditor("explanation_area");	//Save the explanation for this step
    var explanation = explanationArea.getContent();
	$.post("/weave/save_explanation/", {
		'html': explanation,
		'csrfmiddlewaretoken': csrftoken,
		'example_name': $("#example_name").text(),
		'step_number':currentStep,
	});

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

    //get request to see if there is entry for that step
    //if there is- fill the textarea with it
    //else show an empty text area
    var request = $.get('/weave/get_next_step/', {
        'example_name' : $("#example_name").text(),
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
                    if(text_area.getContent().toLowerCase().substring(0,7) == "<b>step" || text_area.getContent().toLowerCase().substring(0,4) == "step"){
                        // The step identification is already contained in the content of the explanation so don't add it again
                        text_area.setContent(data[key]); 
                    }
                    else{
                        text_area.setContent("<b>Step " + currentStep + ":</b> " + data[key]); 
                    }
                }
                else{
                    text_area.setContent(data[key]);
                }

                console.log(text_area + 4);
                
              }
            }
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
    goToStep("next");
    alert("next");
});


// Bind an event to the previous button.
$('#btn_prev').click(function() {
    goToStep("back");
    alert("back");
});

// Reset the example on click of the reset button
$('#btn_done').click(function() {
    $("#plan_modal").modal('show');
});

$('#btn_question').click(function(){
    $("#question_modal").modal('show');
});


// Attaching the required actions on button clicks
$(document).ready(function() {
    $("#btnClose").click(function(e) {
        HideDialog();
        e.preventDefault();
    });

    $("#btnSubmit").click(function(e) {
        if (multipleChoiceQuestion) {
            answer = $(".options input:checked + label").text();
        } else {
            answer = $("#textarea_" + textareaNum).val();
            textareaNum++;
        }
        if (answer != "" && answer != undefined) {
            explanation_dict[currentStep - 1] = " You answered: " + answer + "<br>" + explanation_dict[currentStep - 1];
            HideDialog();
            e.preventDefault();
            var now = new Date().getTime();
            if (currentStep > 0) {
                $.post("/weave/log_question_info_db/", {
                    'time': (now - lastTime) / 1000,
                    'step': currentStep,
                    'answer': answer,
                    'example_name': app_name,
                    'csrfmiddlewaretoken': csrftoken,
                    'multiple_choice': multipleChoiceQuestion
                });
            }
            lastTime = now;
            answer = " You answered: " + answer;
            goToStep("next");
        }
    });

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
                goToStep("back");
            }
            break;
        case 39:
            if (currentStep <= totalSteps && $("#dialog").is(':hidden')) { //if the action is question that hasn't been asked yet, i.e. the explanation_dict is still empty for that step
                goToStep("next");
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