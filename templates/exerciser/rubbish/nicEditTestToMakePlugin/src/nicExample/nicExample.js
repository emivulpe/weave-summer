/**
* nicExample
* @description: An example button plugin for nicEdit
* @requires: nicCore, nicPane, nicAdvancedButton
* @author: Brian Kirchoff
* @version: 0.9.0
*/
 
/* START CONFIG */
var nicExampleOptions = {
    buttons : {
        'example' : {name : __('Some alt text for the button'), type : 'nicEditorExampleButton'}
    }/* NICEDIT_REMOVE_START */,iconFiles : {'example' : 'src/nicExample/icons/save.gif'}/* NICEDIT_REMOVE_END */
};
/* END CONFIG */
 
var nicEditorExampleButton = nicEditorButton.extend({   
  mouseClick : function() {
    alert('The example save button icon has been clicked!');
  }
});
 
nicEditors.registerPlugin(nicPlugin,nicExampleOptions);
