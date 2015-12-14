define(['dojo/_base/declare', 'dijit/_Widget', 'dijit/_TemplatedMixin', 'dijit/_WidgetsInTemplateMixin',
    'dojox/grid/DataGrid', 'Sage/Data/BaseSDataStore', 'dojo/_base/lang', 'dojo/on', 'dojo/query',
    'dojo/text!./templates/AddReturnProduct.html',
    'dojo/NodeList-dom'],
function (declare, _Widget, _TemplatedMixin, _WidgetsInTemplateMixin, DataGrid, BaseSDataStore, lang, on, query, template) {
    // utility stuff
    function qq(v) {
        return '"' + v.replace('"', '""') + '"';
    }

    return declare([_Widget, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,
        _grid: null,

        postCreate: function () {
            this.inherited(arguments);
            this.showSearchType();
            var dlg = dijit.byId('DialogWorkspace_window');
            dlg.layout();           
        },

        ///////////////// UI

        /**
        * Show the correct control for the search type
        * @returns {} 
        */
        showSearchType: function () {
            if (this._grid)
                this._grid.destroyRecursive();
            if (this._getSearchType() == 'ItemMaster') {
                this._grid = this._buildItemMasterGrid();
                query('.salesHistoryFilter', this.domNode).style('display', 'none');
            } else {
                // sales history
                this._grid = this._buildSalesHistoryGrid();
                query('.salesHistoryFilter', this.domNode).style('display', '');
            }
            on(this._grid, 'rowClick', lang.hitch(this, 'onGridRowClick'));
            this._grid.placeAt(this.gridContainer);
            this._grid.startup();
        },


        ////////////////// Events

        refreshGrid: function() {
            if (this._grid)
                this._grid._refresh();
        },        

        onGridRowClick: function() {
            var selected = this._grid.selection.getSelected();
            if (selected.length > 0) {
                var product = selected[0].Product ? selected[0].Product : selected[0];
                document.querySelector('input[id$=lueProduct_LookupText').value = product.Name;
                document.querySelector('input[id$=lueProduct_LookupResult').value = product.$key;
            }
        },

        ////////////////// Sales History Data

        _buildSalesHistoryGrid: function () {
            var layout = [
                [
                { name: 'Item #', field: 'ITEMNUMBER', width: '15%' },
                { name: 'Invoice #', field: 'FSInvoice.INVOICENUMBER', width: '15%' },
                { name: 'CO #', field: 'FSInvoice.CONUMBER', width: '15%' },
                { name: 'Product Name', field: 'Product.Name', width: '40%' },
                { name: 'Invoice Date', field: 'FSInvoice.INVOICEDATE', width: '15%' },
                { name: 'Order Qty', field: 'ORDERQTY', width: '15%' }
                ]
            ];
            var grid = new DataGrid({
                store: this._buildSalesHistoryStore(),
                selectionMode: 'single',
                structure: layout,
                query: {
                    scope: this,
                    fn: this._getSalesHistoryQuery
                }
            });
            return grid;
        },

        _buildSalesHistoryStore: function () {
            var storeOptions = {
                resourceKind: 'fsInvoiceItems',
                include: ['Product', 'FSInvoice'],
                select: [],
                sort: []
            };
            var store = new BaseSDataStore(storeOptions);
            return store;
        },

        _getSalesHistoryQuery: function() {
            var accid = Sage.Utility.getClientContextByKey("ReturnAccountId");
            if (!accid) {
                return '1 eq 2';
            }
            var qry = ['FSInvoice.Account.Id eq ' + qq(accid)];
            if (this.txtFilterProduct.get('value')) {
                qry.push('Product.Name like ' + qq(this.txtFilterProduct.get('value') + '%'));
            }
            if (this.txtFilterSku.get('value')) {
                qry.push('Product.ActualId like ' + qq(this.txtFilterSku.get('value') + '%'));
            }
            if (this.txtFilterInvoiceNumber.get('value')) {
                qry.push('FSInvoice.INVOICENUMBER like ' + qq(this.txtFilterInvoiceNumber.get('value') + '%'));
            }
            if (this.txtFilterCONum.get('value')) {
                qry.push('FSInvoice.CONUMBER like ' + qq(this.txtFilterCONum.get('value') + '%'));
            }
            return qry.join(' and ');
        },

        ////////////////// Item Master Data

        _buildItemMasterGrid: function () {
            var layout = [
                [
                { name: 'Item #', field: 'ActualId', width: '40%' },
                { name: 'Product Name', field: 'Name', width: '60%' },
                ]
            ];
            var grid = new DataGrid({
                store: this._buildItemMasterStore(),
                structure: layout,
                selectionMode: 'single',
                query: {
                    scope: this,
                    fn: this._getItemMasterQuery
                }
            });
            return grid;
        },

        _buildItemMasterStore: function () {
            var storeOptions = {
                resourceKind: 'products',
                include: [],
                select: [],
                sort: ['ActualId', 'Name']
            };
            var store = new BaseSDataStore(storeOptions);
            return store;
        },

        _getItemMasterQuery: function () {            
            var qry = [];
            if (this.txtFilterProduct.get('value')) {
                qry.push('Name like ' + qq(this.txtFilterProduct.get('value') + '%'));
            }
            if (this.txtFilterSku.get('value')) {
                qry.push('ActualId like ' + qq(this.txtFilterSku.get('value') + '%'));
            }
            return qry.join(' and ');
        },

        ////////////////// 

        /**
        * @returns {string} SalesHistory or ItemMaster
        */
        _getSearchType: function () {            
            return this.optSalesHistory.checked ? 'SalesHistory' : 'ItemMaster';
        }
    });
});