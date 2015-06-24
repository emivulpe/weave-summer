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
    
    $("#edit_modal").modal('show');
    rawText = getSelectionHtml();
    $("#text_to_change").html(rawText);
    
}
$("#apply_changes_button").click(function(){
    var editEditor = nicEditors.findEditor("new_text_textarea");
    newText = editEditor.getContent();
    //alert(textToChange);
    //newText = $("#new_text_textarea").val();
    alert(rawText + " raw " + newText + " new");
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
    //alert(html);
    //$("#text_to_change_raw").text(html);
    return html;
}