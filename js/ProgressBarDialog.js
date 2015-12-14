// Progress Bar Dialog
// Usage:
//  - pb = new ProgressBarDialog({title: 'Foo', maximum: 123})
//    pb.updateProgress(123);
//    pb.updateMax(4445);
//    pb.destroy()
define(['dojo/_base/declare', 'dijit/ProgressBar', 'dijit/Dialog'], 
function(declare, ProgressBar, Dialog) {
	return declare([Dialog], {
		// set progress bar title
		title: '',
		// total value for the progress bar
		maximum: 0,
		_progressBar: null,
		// default to NOT closable
		closable: false,  
		
		postCreate: function() {
			this.inherited(arguments);
			this._progressBar = new ProgressBar({ style: 'width: 300px', maximum: this.maximum });
			this.setContent(this._progressBar.domNode); 
			this.show();
		},
		
		updateProgress: function(current) {
			this._progressBar.set('value', current);
		},
		
		updateMax: function(max) {
			this._progressBar.set('maximum', current);
		}
	});
});