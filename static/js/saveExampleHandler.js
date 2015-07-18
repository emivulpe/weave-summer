$(".step_btn.store_example_btn").confirmation({
    'title' : 'Are you sure you would like to save the example and go to the home page?',
    'placement': 'bottom',
    'btnOkLabel' : 'Yes',
    'btnCancelLabel' : 'No',
    'popout' : false,
    'onConfirm' : function(){
        alert("code to go to the home page");
    }
})


$(".question_step_btn.store_example_btn").confirmation({
    'title' : 'Are you sure you would like to save the example and go to the home page?',
    'placement': 'top',
    'btnOkLabel' : 'Yes',
    'btnCancelLabel' : 'No',
    'popout' : false,
    'onConfirm' : function(){
        alert("code to go to the home page");
    }
})
