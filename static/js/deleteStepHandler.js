$("#delete_question_step_btn").confirmation({
    'title' : 'Are you sure you would like to delete this step?',
    'placement': 'top', 
    'btnOkLabel' : 'Yes',
    'btnCancelLabel' : 'No',
    'popout' : false,
    'onConfirm' : function(){
        $("#question_modal").modal('hide');
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
    }
})

$("#delete_step_btn").confirmation({
    'title' : 'Are you sure you would like to delete this step?',
    'placement': 'bottom', 
    'btnOkLabel' : 'Yes',
    'btnCancelLabel' : 'No',
    'popout' : false,
    'onConfirm' : function(){
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
    }
})
