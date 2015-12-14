/**
 * Creates a dialog with any number of buttons.
 * make sure msg is wide enough to accomodate the buttons otherwise they will wrap
 * @param {string} msg
 * @param {string} title
 * @param {string[]} buttons - The button labels
 * @param {function} callback
 */
function buildQueryDialog(msg, title, buttons, callback){
    var queryDialog = dijit.byId('queryDialog');
    if(queryDialog){
        queryDialog.destroy();
    }        
    
    queryDialog = new dijit.Dialog({ id: 'queryDialog', title: title, closable: false });
    var buttonsDiv = dojo.create('div', { style: 'text-align: right; padding: 10px' });
    for(var i=0; i < buttons.length; i++){
        var btn = new dijit.form.Button({
            label: buttons[i],
            onClick: function() {
                callback(this.label);
            }
        });
        dojo.place(btn.domNode, buttonsDiv);
    }
    var contentNode = dojo.create('div');
    dojo.place('<div>' + msg + '</div>', contentNode);
    dojo.place(buttonsDiv, contentNode);
    dojo.place(contentNode, queryDialog.containerNode, 'only');
    queryDialog.show();
    return queryDialog;        
}

// for comparison, this is how to use the raiseQueryDialog function:
// Note the callback will be invoked with a "true" or "false" parameter - not the button labels
Sage.UI.Dialogs.raiseQueryDialog(title, query, callback, 'Yes', 'No')