/**
* nicExample
* @description: An example button plugin for nicEdit
* @requires: nicCore, nicPane, nicAdvancedButton
* @author: Brian Kirchoff
* @version: 0.9.0
*/
 

/* START CONFIG */
var nicEditOptions = {
    buttons : {
        'edit' : {name : __('Edit'), type : 'nicEditorEditButton'},
        'unhighlight' : {name : __('Unhighlight'), type : 'nicEditorUnhighlightButton'}
    }/* NICEDIT_REMOVE_START */,iconFiles : {'edit' : editGif, 'unhighlight' : unhighlightGif}/* NICEDIT_REMOVE_END */
};
/* END CONFIG */
 
var nicEditorEditButton = nicEditorButton.extend({   
  mouseClick : function() {
    getSelText();
  }
});
 
var nicEditorUnhighlightButton = nicEditorButton.extend({
    mouseClick : function() {
        this.ne.nicCommand("hiliteColor","#FFFFFF")
    }
});

nicEditors.registerPlugin(nicPlugin,nicEditOptions);

function getSelText()
{
    var txt = '';
     if (window.getSelection)
    {
        txt = window.getSelection();
             }
    else if (document.getSelection) // FireFox
    {
        txt = document.getSelection();
            }
    else if (document.selection)  // IE 6/7
    {
        txt = document.selection.createRange().text;
            }
    else return;
    $("#text_to_change").text(txt);
    $("#edit_modal").modal('show');

}
$("#apply_changes_button").click(function(){
    textToChange = $("#text_to_change").text();
    newText = $("#new_text_textarea").val();
    goToStep("this", false, textToChange, newText);
    $("#edit_modal").modal('hide');
});

