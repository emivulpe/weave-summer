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
        'unhighlight' : {name : __('Unhighlight'), type : 'nicEditorUnhighlightButton'},
        'custom_indent' : {name : __('Indent'), type : 'nicEditorIndentButton'},
        'custom_outdent' : {name : __('Outdent'), type : 'nicEditorOutdentButton'}
    },/* NICEDIT_REMOVE_START */
    iconFiles : {'edit' : editGif, 'unhighlight' : unhighlightGif}
    
/* NICEDIT_REMOVE_END */
};
/* END CONFIG */
 
var nicEditorEditButton = nicEditorButton.extend({   
  mouseClick : function() {
    getSelText();
    getSelectionHtml();
  }
});

var nicEditorIndentButton = nicEditorButton.extend({   
  mouseClick : function() {
    var selectedText = getSelectionHtml();
    if (selectedText == ""){
        BootstrapDialog.alert('Please select the whole line you would like to indent! The easiest way to do so is by double clicking the line with the mouse.');
    }
    else{
        var focusedEditor = nicEditors.findEditor(currentFocusedEditor);
        var textInFocusedEditor =  focusedEditor.getContent();    //Save the explanation for this step
        var indentedText = "    " + textInFocusedEditor;
        focusedEditor.setContent(textInFocusedEditor.replace(selectedText, indentedText));
    }
  }
});


var nicEditorOutdentButton = nicEditorButton.extend({   
  mouseClick : function() {
    var selectedText = getSelectionHtml();
    if (selectedText == ""){
        BootstrapDialog.alert('Please select the whole line you would like to indent! The easiest way to do so is by double clicking the line with the mouse.');
    }
    else{
        var focusedEditor = nicEditors.findEditor(currentFocusedEditor);
        var textInFocusedEditor =  focusedEditor.getContent();    //Save the explanation for this step
        var spacesRemoved = 0;
        var outdentedText = selectedText;
        while (spacesRemoved < 4 && selectedText.charAt(0) === " "){
            outdentedText = outdentedText.substring(1);
            spacesRemoved++;
        }
        focusedEditor.setContent(textInFocusedEditor.replace(selectedText, outdentedText));
    }
  }
});
 
var nicEditorUnhighlightButton = nicEditorButton.extend({
    mouseClick : function() {
        this.ne.nicCommand("hiliteColor","#FFFFFF");
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
    alert(newText + "newwwww");
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

