// Move Up / Move Down buttons for InforCRM (code for https://nicocrm.wordpress.com/?p=562)

// Helper for the products grid used at the SalesOrder and Opportunity levels
define(['dojo/_base/declare', 'dojo/_base/lang', 'dojo/aspect', 'dojo/on', 'Sage/UI/Dialogs'], 
function (declare, lang, aspect, on, slxDialogs) {
    var Helper = declare([], {
        grid: null,

        constructor: function (grid) {
            this.grid = grid;
            this.setupMoveUpDownHandlers();
        },

        setupMoveUpDownHandlers: function () {
            var tools = this.grid.tools;
            for (var i = 0; i < tools.length; i++) {
                if (/btnMoveUp/.test(tools[i].id)) {
                    on(dijit.byId(tools[i].id), 'click', lang.hitch(this, 'onMoveClick', true));
                }
                if (/btnMoveDown/.test(tools[i].id)) {
                    on(dijit.byId(tools[i].id), 'click', lang.hitch(this, 'onMoveClick', false));
                }
            }
        },

        onMoveClick: function (up) {
            var selected = this.grid.selection.selected;
            var sortProps = this.grid.getSortProps();
            var direction = up ? 1 : -1;
            if (sortProps && sortProps.descending) {
                direction = -direction;
            }

            // validate
            if (this.grid.selection.getSelectedCount() == 0) {
                slxDialogs.alert('Please select 1 or more products.');
                return;
            }
            if (sortProps != null && sortProps[0].attribute != 'Sort') {
                slxDialogs.alert('Please sort the grid by line number');
                return;
            }

            // prepare sorted array
            // sort by descending order if we are moving up, ascending if we are moving down
            var sortedItems = [];
            for (var i = 0; i < this.grid.rowCount; i++) {
                var item = this.grid.getItem(i);
                // we can ignore the items not in cache, because it means the user has not seen them
                // at the same time, this will cause the grid to populate the cache for this item, so the next time 
                // we'll have it - this covers the scenario of the user moving the item repeatedly
                if (!item)                
                    continue;
                var newSortedItem = { index: i, item: item };
                // find insertion point: first item that is bigger (or smaller)
                for (var j = 0; j < sortedItems.length; j++) {
                    var isGreater = sortedItems[j].item.Sort > item.Sort;
                    if (up ? isGreater : !isGreater) {
                        sortedItems.splice(j, 0, newSortedItem);
                        item = null;
                        break;
                    }
                }
                if (item) {
                    sortedItems.push(newSortedItem);
                }
            }
            if (selected[sortedItems[0].index]) {
                slxDialogs.alert(up ? 'Cannot move the first item up' : 'Cannot move the last item down');
            }

            for (var i = 1; i < sortedItems.length; i++) {
                if (selected[sortedItems[i].index]) {
                    // now switch with sortedItems[i-1]
                    var itemToMove = sortedItems[i].item;
                    var j = i - 1;
                    while (selected[sortedItems[j].index]) {
                        j--;
                    }
                    var itemToSwitch = sortedItems[j].item;
                    var originalSort = itemToMove.Sort;
                    this.grid.store.setValue(itemToMove, 'Sort', itemToSwitch.Sort);
                    this.grid.store.setValue(itemToSwitch, 'Sort', originalSort);                    
                }
            }
        }
    });

    // return a deferred that will resolve to the helper once the grid is ready to be customized
    return function (gridId) {
        var def = new dojo.Deferred();
        var int = setInterval(function () {
            var grid = dijit.byId(gridId);
            if (grid) {
                clearInterval(int);
                def.resolve(new Helper(grid));
            }
        }, 500);
        return def;
    };
});