define(['dijit/form/ValidationTextBox'], function(ValidationTextBox) {    
    var cssPath = "css/MultiSelectDropdown.css";
    
    return dojo.declare("MultiSelectDropdown", [dijit.form.TextBox], {
        // multi select dropdown used for selecting codes & brands.
        // configured with a generic (dojo.api.Read) datastore

        dataStore: null, // DS - MUST be provided at construction
        valueField: "",  // which field in DS to use to store data.  Defaults to $key.
        textField: "",   // which field in DS to use for display.  Defaults to $descriptor.
        textFieldList: [],   // OPTIONAL list of fields to use for item display.  If this is not provided then we just use textField
        labelList: [],  // OPTIONAL list of labels to use corresponding to the fields in textFieldList.  If not provided the label header won't be displayed.
        dataCarrierId: "",  // this can specify the id of a hidden field to use to store the selected values.  Optional - if not specified a new hidden field will be created.        

        _hidden: null,
        _txtFilter: null, // textbox used for filtering
        _checkboxList: null,   // UL element used to contain the checkboxes


        postMixInProperties: function () {
            this.inherited(arguments);
            this.valueField = this.valueField || "$key";
            this.textField = this.textField || "$descriptor";
            if (!this.dataStore)
                throw "Data store must be provided";
        },

        postCreate: function () {
            this.inherited(arguments);

            this._loadStylesheet();
            this._createControlUI();

            // if there are values in the hidden field we want to loadItems to make sure we pop the text
            // but in general not a bad thing to call loadItems this way when they open the popup it's already there, and
            // we just load it in the background.
            this._loadItems();
            //            if (this._hidden.value) {
            //                this._loadItems();
            //            }
        },

        focus: function () {
            // ignore those, because they prevent clicking within the filter box
        },

        _loadItems: function () {
            this._panel.innerHTML = "<img src='images/loading_animation_liferay.gif' alt='Loading...'>";
            this.dataStore.fetch({
                count: 9999,  // dont worry about paging...
                sort: [{ attribute: this.textField}],
                onComplete: dojo.hitch(this, "_onItemsLoaded")
            });
        },

        _onItemsLoaded: function (items) {

            var div = this._panel;
            div.innerHTML = "";

            // filter control
            this._createFilterUI(div);
            this._createCheckboxesUI(div, items);
            this._createButtonsUI(div);

            this._filterItems();

            //            if (this._hidden.value) {
            //                this._resetSelectionText();
            //            }
        },

        // *************  UI 

        _loadStylesheet: function () {
            var path = cssPath;
            var ss = document.styleSheets;
            for (var i = 0, max = ss.length; i < max; i++) {
                if (ss[i].href == path)
                    return;
            }
            if (document.createStyleSheet) {
                document.createStyleSheet(path);
            } else {
                var link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = path;

                document.getElementsByTagName("head")[0].appendChild(link);
            }
        },

        _createControlUI: function () {
            // Create the initially visible UI - adding the popup button to the textbox control

            this.domNode.style.position = "relative";

            //            var txt = new dijit.form.TextBox();
            //            dojo.place(txt.domNode, this.domNode, "last");

            var btn = document.createElement("a");
            btn.href = "#";
            btn.innerHTML = "<img src='images/icons/elipses.gif' alt='Select' width='16' height='16'>";
            btn.style.position = "absolute";
            btn.style.right = "3px";
            btn.style.top = "0px";
            btn.style.zIndex = 20;
            dojo.place(btn, this.domNode, "last");
            dojo.connect(btn, "onclick", dojo.hitch(this, "_togglePopup"));
            //            var btn = document.createElement("");

            // hidden field used to carry the value
            if (this.dataCarrierId) {
                this._hidden = dojo.byId(this.dataCarrierId);
            } else {
                var hid = this._hidden = document.createElement("input");
                hid.type = "hidden";
                hid.name = this.domNode.name;
                this.domNode.name = '';
                hid.value = this.get('value');
                dojo.place(hid, this.domNode, "after");
            }

            var div = this._panel = document.createElement("div");
            div.className = "multiselect";
            div.style.display = "none";
            div.style.width = "200px"; // this will be overwritten when the popup is shown
            div.style.position = "absolute";
            dojo.place(div, btn, "after");
        },

        _createFilterUI: function (container) {
            // Filter header panel
            var panFilter = document.createElement("div");
            panFilter.className = "filter";
//            var lbl = document.createElement("label");
//            lbl.className = "lbl";
//            lbl.innerHTML = "Filter Items:";
//            container.appendChild(lbl);
            var div = document.createElement("div");
            div.className = "textcontrol";
            var txtFilter = this._txtFilter = document.createElement("input");
            txtFilter.type = "text";
            txtFilter.title = "Filter Items";
            div.appendChild(txtFilter);
            panFilter.appendChild(div);
            container.appendChild(panFilter);
            container.appendChild(document.createElement("br"));

            dojo.connect(txtFilter, "onkeyup", dojo.hitch(this, "_filterItems"));
        },

        _createCheckboxesUI: function (div, items) {
            // show the checkboxes in the provided div
            var self = this;
            // need a div wrapper for IE
            var container = document.createElement("div");
            container.className = "checkboxList";
            var tbl = this._checkboxList = document.createElement("table");
            var th = this._createCheckboxesHeader(tbl);
            var selected = this._hidden.value;
            var fieldList = this.textFieldList;
            if (!fieldList || fieldList.length == 0)
                fieldList = [this.textField];
            
            var maxWidth = (dojo.marginBox(this.domNode).w / fieldList.length) - 20 + "px";
            for (var i = 0; i < items.length; i++) {
                var text = this.dataStore.getValue(items[i], this.textField);
                var tr = document.createElement("tr");
                var td = document.createElement("td");

                var chk = document.createElement("input");
                chk.id = this.domNode.id + "_chk_" + i;
                chk.type = "checkbox";
                chk.value = this.dataStore.getValue(items[i], this.valueField);
                chk.text = text;  // this is not actually displayed but used in our script
                chk.checked = (selected.indexOf(chk.value) != -1);
                td.appendChild(chk);
                tr.appendChild(td);

                for (var j = 0; j < fieldList.length; j++) {
                    td = document.createElement("td");
                    var lbl = document.createElement("label");
                    lbl.htmlFor = chk.id;
                    if (typeof fieldList[j] == "function") {
                        text = fieldList[j](items[i]);
                    } else {                        
                        text = this.dataStore.getValue(items[i], fieldList[j]);
                    }
                    lbl.appendChild(document.createTextNode(text));
                    lbl.style.maxWidth = maxWidth;
                    td.appendChild(lbl);
                    tr.appendChild(td);
                }

                // event handler so we can update text when they select an item
                dojo.connect(chk, "onclick", function () {
                    self._onCheckboxClicked(this.checked, this.value, this.text);
                });

                tbl.appendChild(tr);
            }
            container.appendChild(tbl);
            div.appendChild(container);
        },

        _createCheckboxesHeader: function (tbl) {
            // Create table header for the checkboxes
            if (!this.labelList)
                return;
            var tr = document.createElement("tr");

            // first one for the checkbox column
            var th = document.createElement("th");
            tr.appendChild(th);
            for (var i = 0; i < this.labelList.length; i++) {
                var th = document.createElement("th");
                th.appendChild(document.createTextNode(this.labelList[i]));
                tr.appendChild(th);
            }

            tbl.appendChild(tr);
        },

        _createButtonsUI: function (div) {
            // Button panel at the bottom

            var panButtons = document.createElement("div");
            panButtons.className = "buttons";
            var self = this;

            // Select All
            // this has been removed per KH request
            //            var btn = document.createElement("button");
            //            btn.className = "slxbutton";
            //            btn.innerHTML = "All";
            //            panButtons.appendChild(btn);
            //            dojo.connect(btn, "onclick", function (e) {
            //                self._selectAll();
            //                dojo.stopEvent(e);
            //            });

            // Select None
            var btn = document.createElement("button");
            btn.className = "slxbutton";
            btn.innerHTML = "None";
            panButtons.appendChild(btn);
            dojo.connect(btn, "onclick", function (e) {
                self._selectNone();
                dojo.stopEvent(e);
            });

            var spacer = document.createElement("span");
            spacer.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
            panButtons.appendChild(spacer);

            // OK
            var btn = document.createElement("button");
            btn.className = "slxbutton";
            btn.innerHTML = "OK";
            panButtons.appendChild(btn);
            div.appendChild(panButtons);

            dojo.connect(btn, "onclick", function (e) {
                self._togglePopup();
                dojo.stopEvent(e);
            });
        },

        _resetSelectionText: function () {
            // query the selected checkboxes and set the displayed text (and hidden selection values) to those
            var selIds = [];
            var selText = [];
            dojo.query("input[type=checkbox]", this._checkboxList).forEach(function (node) {
                if (node.checked) {
                    selIds.push(node.value);
                    selText.push(node.text);
                }
            });
            this._hidden.value = selIds.join(',');
            this.set('value', selText.join(', '));
        },

        // *************  Events

        _togglePopup: function () {
            if (this._panel.style.display == "none") {
                var sz = dojo.marginBox(this.domNode);
                this._panel.style.width = sz.w + "px";
                this._panel.style.display = "";
                if (!this._checkboxList)
                    this._loadItems();
            } else {
                this._panel.style.display = "none";
            }
        },

        _onCheckboxClicked: function (isChecked, value, text) {
            var selIds = this._hidden.value.split(",");
            var selText = this.get('value').split(", ");
            if (this._hidden.value == "") {
                selIds = [];
                selText = [];
            }

            if (isChecked) {
                if (!dojo.some(selIds, function (i) { return i == value })) {
                    selIds.push(value);
                    selText.push(text);
                    selText.sort();
                }
            } else {
                selIds = dojo.filter(selIds, function (i) { return i != value });
                selText = dojo.filter(selText, function (i) { return i != text });
            }
            this._hidden.value = selIds.join(',');
            this.set('value', selText.join(', '));
        },

        _filterItems: function () {
            // show/hide items that match/fail current filter
            var filter = this._txtFilter.value.toLowerCase();
            var showTr = null;
            dojo.query("td label", this._checkboxList).forEach(function (node) {
                var tr = node.parentNode.parentNode;
                if (showTr === tr)
                    // we already decided to show this tr so let's not hide it now.
                    return;

                if (filter && node.innerHTML.toLowerCase().indexOf(filter) == -1) {
                    tr.style.display = "none";
                } else {
                    showTr = tr;
                    tr.style.display = "";
                }
            });
        },

        _selectAll: function () {
            var selIds = [];
            var selText = [];
            dojo.query("input[type=checkbox]", this._checkboxList).forEach(function (node) {
                if (node.parentNode.parentNode.style.display !== "none") {
                    node.checked = true;
                    selIds.push(node.value);
                    selText.push(node.text);
                }
            });
            this._hidden.value = selIds.join(',');
            this.set('value', selText.join(', '));
        },

        _selectNone: function () {
            dojo.query("input[type=checkbox]", this._checkboxList).forEach(function (node) {
                node.checked = false;
            });
            this._hidden.value = "";
            this.set('value', "");
        }
    });
});