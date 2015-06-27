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
    getSelectionHtml();
  }
});
 
var nicEditorUnhighlightButton = nicEditorButton.extend({
    mouseClick : function() {
        this.ne.nicCommand("hiliteColor","#FFFFFF")
    }
});

nicEditors.registerPlugin(nicPlugin,nicEditOptions);
var rawText = "";
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
    rawText = getSelectionHtml();
    if (rawText != ""){
        $("#edit_modal").modal('show');
        $("#text_to_change").html(rawText);
    }
    else {
        BootstrapDialog.alert('Sorry but you can make edits without selecting some text with the mouse first!');
    }

    
}
$("#apply_changes_button").click(function(){
    var editEditor = nicEditors.findEditor("new_text_textarea");
    newText = editEditor.getContent();
    editText(rawText, newText);
    $("#edit_modal").modal('hide');
});

function getSelectionHtml() {
    var html = "";
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
    } else if (typeof document.selection != "undefined") {
        if (document.selection.type == "Text") {
            html = document.selection.createRange().htmlText;
        }
    }
    return html;
}