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
        'edit' : {name : __('Edit'), type : 'nicEditorEditButton'}
    }/* NICEDIT_REMOVE_START */,iconFiles : {'edit' : editGif}/* NICEDIT_REMOVE_END */
};
/* END CONFIG */
 
var nicEditorEditButton = nicEditorButton.extend({   
  mouseClick : function() {
    getSelText();
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
    alert("this was the selected text: " + txt);
}