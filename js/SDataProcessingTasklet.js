// Helper class for creating a tasklet that will take an action on each record selected within a page.
// To use:
// * Create a subclass of _SDataProcessingTasklet
// * Override the custom processing methods
// * Invoke the "onProcessClick" method when the "Process" button is clicked in the UI
// * Invoke the "onCancelClick" method when the "Cancel" button is clicked in the UI

define([
        'Sage/TaskPane/_BaseTaskPaneTasklet',
        'dojo/_base/xhr',
        'dojo/_base/lang',
        'dojo/_base/declare',
        'dojo/string',
        'dojo/dom-class',
        'dojo/dom-construct',
        'dojo/on',
        'Sage/Utility/Jobs',
        'dijit/ProgressBar',
        'dijit/Dialog',
        'Sage/UI/Dialogs'
],
function (
    _BaseTaskPaneTasklet,
    xhr,
    lang,
    declare,
    dString,
    domClass,
    domConstruct,
    on,
    jobs,
    ProgressBar,
    Dialog,
    Dialogs
    ) {

    return declare([_BaseTaskPaneTasklet], {
        tableName: "C_INVOICE",  // table naem / group family  - TODO - this should be dyanmic
        sdataResourceName: "cinvoices", // corresponding sdata name - TODO - this should be dyanmic        
        _cancelled: false,  // cancellation flag

        constructor: function (options) {
            lang.mixin(this, options);
        },

        /////// Custom processing

        validateForm: function () {
            throw "validateForm must be implemented";
        },

        // field to be selected (in addition to the record id)
        // comma separated values
        getFieldsToSelect: function () {
            throw "getFieldsToSelect must be implemented";
        },

        // if appropriate, return an additional condition (sdata string) to be appended to the sdata query 
        // when retrieving the record data
        getAdditionalCondition: function () {
            throw "getAdditionalCondition must be implemented";
        },

        // process a single record.  Return a deferred object.
        processOneRecord: function (recordData) {
            throw "processOneRecord must be implemented";
        },

        processCompleted: function () {
            throw "processCompleted must be implemented.";
        },

        /// *** No overridable code after this line ***

        /////// Helper sdata methods - they can be called by the subclass

        // page's sdata resource kind
        getResourceKind: function () {
            return this.sdataResourceName;
        },

        // update a single record and return a deferred object
        updateRecord: function (recordData) {
            var def = new dojo.Deferred();

            var svc = Sage.Data.SDataServiceRegistry.getSDataService('dynamic');
            var req = new Sage.SData.Client.SDataSingleResourceRequest(svc)
                    .setResourceKind(this.getResourceKind())
                    .setResourceSelector("'" + recordData.$key + "'");
            var def = new dojo.Deferred();

            req.update(recordData, {
                success: function () {
                    def.resolve();
                },
                failure: function (error) {
                    def.reject(error);
                }
            });
            return def;
        },

        updateRecordBusinessRule: function (recordData, operationName, businessRuleParams) {
            var def = new dojo.Deferred();

            var svc = Sage.Data.SDataServiceRegistry.getSDataService('dynamic');
            var req = new Sage.SData.Client.SDataServiceOperationRequest(svc)
                .setResourceKind(this.getResourceKind())
                .setOperationName(operationName);

            var payload =
            {
                name: operationName,
                request:
                {
                    entity: { '$key': recordData.$key }
                }

            };

            for (var propertyName in businessRuleParams) {
                payload.request[propertyName] = businessRuleParams[propertyName];
            }

            var def = new dojo.Deferred();

            req.execute(payload, {
                success: function () {
                    def.resolve();
                },
                failure: function (error) {
                    def.reject(error);
                },
                scope: this
            });

            return def;

        },


        /////// Event handlers

        onProcessClick: function () {
            if (this.validateForm()) {
                this._cancelled = false;
                this.prepareSelectedRecords(lang.hitch(this, "_onPrepareSelected"));
            }
        },

        onCancelClick: function () {
            this._hideProgress();
            this._cancelled = true;
        },

        /////// Progress bar

        _showProgress: function (title) {
            if (!this._progressDialog) {
                var pb = new ProgressBar({ style: 'width: 300px' });
                var d = new Dialog({ title: title });
                d.setContent(pb.domNode);
                d.show();
                this._progressDialog = d;
                this._progressBar = pb;
            } else {
                this._progressDialog.set('title', title);
            }
        },

        _hideProgress: function () {
            if (this._progressDialog) {
                this._progressDialog.destroy();
                this._progressDialog = null;
            }
        },

        _updateProgress: function (value) {
            this._progressBar.set('value', value);
        },

        _updateProgressMax: function (max) {
            this._progressBar.set('maximum', max);
        },


        //////// Reading records


        _onPrepareSelected: function () {
            try {
                var selInfo = this.getSelectionInfo();
                if (selInfo.recordCount == 0)
                    return;
                if (selInfo.selectionCount == 0) {
                    // need to read the group data
                    this._showProgress('Reading Group Data');

                    var gid = this.getCurrentGroupId();

                    if (gid == "LOOKUPRESULTS")
                        sdataUrl = "slxdata.ashx/slx/system/-/groups(name%20eq%20'Lookup%20Results'%20and%20upper(family)%20eq%20'" + this.tableName + "')/%24queries/execute";
                    else
                        sdataUrl = "slxdata.ashx/slx/system/-/groups('" + gid + "')/%24queries/execute";
                    var selectedIds = [];
                    var process = lang.hitch(this, function (index) {
                        try {
                            var keyFieldName = this.tableName + "ID";
                            dojo.xhrGet({
                                url: sdataUrl + "?_includeContent=false&select=" + keyFieldName + "&format=json&startIndex=" + index,
                                handleAs: "json",
                                load: lang.hitch(this, function (response) {
                                    if (this._cancelled)
                                        return;
                                    this._updateProgressMax(response.$totalResults);
                                    this._updateProgress(response.$startIndex + response.$itemsPerPage - 1);
                                    console.log("Reading record ids", response.$resources);
                                    var theseIds = response.$resources.map(function (v) { return v[keyFieldName] });
                                    console.log("theseIds", theseIds);
                                    selectedIds = selectedIds.concat(theseIds);
                                    if (response.$startIndex + response.$itemsPerPage > response.$totalResults) {
                                        // done!                                        
                                        this._getSelectedRecordsData(selectedIds);
                                    } else {
                                        process(response.$startIndex + response.$itemsPerPage);
                                    }
                                }),
                                error: function (response) {
                                    this._hideProgress();
                                    alert("Failed to retrieve group data");
                                }
                            });
                        } catch (e) {
                            alert("Error reading group data: " + e.toString());
                            this._processComplete();
                        }
                    });
                    process(1);
                } else {
                    this._getSelectedRecordsData(selInfo.selectedIds);
                }
            } catch (e) {
                if (typeof console != "undefined")
                    console.warn("_onPrepareSelected: uncaught exception", e);
                alert("There was an error preparing the record selection: " + e.toString());
            }
        },

        // process all selected records by batches
        _getSelectedRecordsData: function (selectedIds) {
            this._showProgress('Reading Record Data');
            // process the records in batch
            var svc = Sage.Data.SDataServiceRegistry.getSDataService('dynamic');
            var req = new Sage.SData.Client.SDataResourceCollectionRequest(svc)
                .setResourceKind(this.getResourceKind())
                .setQueryArg("select", "Id" + (this.getFieldsToSelect() ? "," + this.getFieldsToSelect() : ""));
            var recordData = [];
            var condition = this.getAdditionalCondition();
            if (condition)
                condition = " and " + condition;
            this._updateProgress(0);
            this._updateProgressMax(selectedIds.length);
            var processBatch = lang.hitch(this, function (start) {
                try {
                    if (this._cancelled)
                        return;
                    if (start < selectedIds.length) {
                        var idBatch = selectedIds.slice(start, start + 30);
                        this._updateProgress(start);
                        req.setQueryArg("where", "Id in ('" + idBatch.join("','") + "')" + condition);
                        req.read({
                            success: function (data) {
                                for (var i = 0; i < data.$resources.length; i++) {
                                    recordData.push(data.$resources[i]);
                                }

                                processBatch(start + 30);
                            },
                            failure: function () {
                                alert("There was an error reading Saleslogix data");
                            }
                        });
                    } else {
                        if (recordData.length == 0) {
                            this._processComplete();
                            Dialogs.alert('No record matched the specified criteria');
                        } else {
                            this._processSelectedRecords(recordData);
                        }
                    }
                } catch (e) {
                    if (typeof console != "undefined")
                        console.warn(e);
                    alert("There was an error processing a record batch in _getSelectedRecordsData: " + e.toString());
                    this._processComplete();
                }
            });
            processBatch(0);
        },

        ////////// Processing the update

        _processSelectedRecords: function (recordData) {
            this._showProgress('Updating record data');
            this._updateProgress(0);
            this._updateProgressMax(recordData.length);

            var process = lang.hitch(this, function (index) {
                if (this._cancelled)
                    return;
                this._updateProgress(index);
                if (index == recordData.length) {
                    this._processComplete();
                } else {
                    try {
                        this.processOneRecord(recordData[index]).then(lang.hitch(this, process, index + 1));
                    } catch (e) {
                        if (typeof console != "undefined")
                            console.warn("Uncaught exception in processOneRecord", e);
                        alert("There was an error processing a record: " + e.toString());
                        this._processComplete();
                    }
                }
            });
            process(0);
        },

        _processComplete: function () {
            this._hideProgress();
            Sage.Groups.GroupManager.refreshListView();
            this.processCompleted();
        }

    });  // end declare
});                                                          // end define