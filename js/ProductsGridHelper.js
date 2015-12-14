// Helper for the products grid used at the SalesOrder and Opportunity levels
define(['dojo/_base/declare', 'dojo/aspect'], function (declare, aspect) {
    var Helper = declare([], {
        grid: null,

        constructor: function(grid) {
            this.grid = grid;
            this.setupDefaultProgram();
            this.setupProductFilter();
        },

        // called from server side code, if the user is not allowed to edit the other columns in the grid
        setGridReadOnly: function() {
            var structure = grid.structure;
            var cells = structure[0].cells;
            for (var i = 0; i < cells.length; i++) {
                var c = cells[i];
                if (c.fieldName != 'Quantity')
                    c.editable = false;
            }
            grid.setStructure(structure);
        },

        // setup handler to set default program based on value passed from client context
        setupDefaultProgram: function () {
            var program = Sage.Utility.getClientContextByKey('DefaultProgram');
            if (program) {
                aspect.before(this.grid, 'createItems', function(items) {
                    for (var i = 0; i < items.length; i++) {
                        items[i].Program = program;
                    }
                });
            }
        },

        // filter Obsolete products
        setupProductFilter: function() {
            for (var i = 0; i < this.grid.tools.length; i++) {
                if (this.grid.tools[i].type === 'Sage.UI.SDataLookup') {
                    var lookup = dijit.byId(this.grid.tools[i].controlConfig.id);
                    if (lookup && lookup.query && lookup.query.fn) {
                        aspect.after(lookup.query, 'fn', function(condition) {
                            if (condition) {
                                condition += ' and ';
                            } else {
                                condition = '';
                            }
                            condition += 'Status ne "Obsolete"';
                            return condition;
                        });
                    }
                }
            }
        }
    });

    // return a deferred that will resolve to the helper once the grid is ready to be customized
    return function(gridId) {
        var def = new dojo.Deferred();
        var int = setInterval(function() {
            var grid = dijit.byId(gridId);
            if (grid) {
                clearInterval(int);
                def.resolve(new Helper(grid));
            }
        }, 500);
        return def;
    };   
});