require(['dojo/aspect', 'Sage/Utility/File/DragDropWatcher'], 
function(aspect, DragDropWatcher) {
  var preventDefaultFileHandler = function(targetNode) {
      aspect.around(DragDropWatcher, 'handleFileDrop', function (originalFun) {
          return function (e) {
              if(e.target !== targetNode) {
                  originalFun.apply(this, arguments);
              }
          };
      });
  }
  
  preventDefaultFileHandler(dojo.byId('someNode'));
})