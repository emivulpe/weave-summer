
$(document).ready(function() {
    $(".nicEdit-main").css("white-space", "pre");
})


$("#accept_all_changes_button").click(function(){
    alert("in accept_all_changes_button");
    while(allMatches.length > 0){
        stepDetails = allMatches[0]; 
        allMatches.shift(); 
        stepNumber = stepDetails["step_number"];
        newStepText = stepDetails["proposed_text"];
        panel_id = stepDetails["panel_id"];
        $.post("/weave/edit_step/", {
            'example_name': exampleName,
            'panel_id': currentFocusedEditor,
            'csrfmiddlewaretoken': csrftoken,
            'html' : newStepText,
            'step_number' : stepNumber
        })
    }
    $("#step_editor_modal").modal('hide');
    
})



$("#step_editor_confirmation_button").click(function(){
	stepEditor = nicEditors.findEditor("text_to_change_textarea");
    newStepText = stepEditor.getContent();
    stepEditorTitle = $("#step_editor_title").text();
    stepNumber = parseInt(stepEditorTitle.replace( /\D+/g, '')) - 1;
    $.post("/weave/edit_step/", {
        'example_name': exampleName,
        'panel_id': currentFocusedEditor,
        'csrfmiddlewaretoken': csrftoken,
        'html' : newStepText,
        'step_number' : stepNumber
    })
})


$("#cancel_next_changes_button").click(function(){
    allMatches = [];
    $("#step_editor_modal").modal('hide');
})



$("#edit_modal").on('shown.bs.modal',function(){
    if(nicEditInstances["new_text_textarea"] == undefined){

        nicEditInstances["new_text_textarea"] = new nicEditor({"iconsPath" : nicEditorPath,"buttonList" : buttonList}).panelInstance("new_text_textarea");
    }
    var editEditor = nicEditors.findEditor("new_text_textarea");
    editEditor.setContent(rawText);

})


$("#step_editor_modal").on('shown.bs.modal',function(){
    if(nicEditInstances["text_to_change_textarea"] == undefined){
        nicEditInstances["text_to_change_textarea"] = new nicEditor({"iconsPath" : nicEditorPath,"buttonList" : buttonList}).panelInstance("text_to_change_textarea");
    }
    confirmStepChange();
})


$('#step_editor_modal').on('hidden.bs.modal', function () {
    if(allMatches.length > 0){
        $("#step_editor_modal").modal('show');
    }
})