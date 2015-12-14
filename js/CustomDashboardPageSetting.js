define(['Sage/UI/Dashboard/DashboardPage', 'dojo/aspect', 'dojo/query', 'dojo/dom-construct', './MultiSelectDropdown', './PicklistDataStore'],
    function (DashboardPage, aspect, query, domConstruct, MultiSelect, PicklistDataStore) {
        var _portalAccess = undefined;

        aspect.after(DashboardPage.prototype, '_editOptionsMenu', function () {
            var trButtons = query('.dijitDialog .edit-options-table > table > tbody > tr');
            if (trButtons.length == 0) {
                console.warn('Unable to find options dialog');
                return;
            }
            trButtons = trButtons[trButtons.length - 1];
            var trNew = domConstruct.place('<tr><td>Portal Access:</td><td><div></div></td></tr>', trButtons, 'before');
            var placeholder = query('div', trNew)[0];

            _portalAccess = this.portalAccess || retrievePageOption(this, '@portalAccess');
            
            var store = new PicklistDataStore({ pickListName: 'Web Access Level' });
            var ddl = new MultiSelect({
                dataStore: store,
                textField: 'text',
                valueField: 'text',
                value: _portalAccess
            }, placeholder);
            ddl.on('change', function (val) {
                _portalAccess = val;
            });
            var dlg = query('.dijitDialog .edit-options-table')[0].parentNode;
            dlg.style.cssText = "overflow-y: visible !important;";
        });
        aspect.after(DashboardPage.prototype, '_prepForSave', function (pg) {
            if (_portalAccess !== undefined) {
                pg.Dashboard['@portalAccess'] = _portalAccess;
                _portalAccess = undefined;
            }
            return pg;
        });

        function retrievePageOption(dashboardPage, optionName) {
            var dash = dijit.byId('Dashboard');
            for (var i in dash.pages) {  // dash.pages is NOT an array
                if (dash.pages.hasOwnProperty(i)) {
                    var title = Sage.Utility.htmlDecode(dash.pages[i]['@title']);
                    if (dashboardPage.name == title) {
                        return dash.pages[i][optionName];
                    }
                }
            }
            return null;
        }

    });