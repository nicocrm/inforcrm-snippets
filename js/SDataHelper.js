define([], function () {

    // Convenience function for performing an SData operation.
    // Returns a deferred object that will be resolved when the operation completes.
    //
    // options is an object with the following properties:
    // contract: sdata contract to use (default = dynamic)
    // resourceId: if provided, will use the specified id as a resource locator
    // resourceKind: required - sdata resource type
    // operation: name of operation to invoke on the request (i.e. update, create, read).  defaults to read
    // operationName: name of operation for business rule (optional but necessary for "execute" operations)
    // requestType: type of resource request, defaults to Sage.SData.Client.SDataSIngleResourceRequest
    // where: used as "where" query arg (optional)
    // select: used as "select" query arg (optional)
    // queryArgs: additional query args (optional)
    //
    // For operations that require a data parameter, the "data" argument should be provided, otherwise it must be left out
    function doSDataRequest(options, data) {
        var def = new dojo.Deferred();
        var sdata = Sage.Utility.getSDataService(options.contract || "dynamic");
        var requestType = options.requestType;
        if (!requestType) {
            if (options.operation === "execute") {
                requestType = Sage.SData.Client.SDataServiceOperationRequest;
            } else if (options.resourceId || options.operation === "create") {
                requestType = Sage.SData.Client.SDataSingleResourceRequest;
            } else {
                requestType = Sage.SData.Client.SDataResourceCollectionRequest;
            }
        }
        var req = new requestType(sdata);
        req.setResourceKind(options.resourceKind);
        if (options.resourceId && req.setResourceSelector)
            req.setResourceSelector("'" + options.resourceId + "'");
        if (options.queryArgs)
            req.setQueryArgs(options.queryArgs, false);
        if (options.where)
            req.setQueryArg("where", options.where);
        if (options.select)
            req.setQueryArg("select", options.select);
        if (options.operationName)
            req.setOperationName(options.operationName);

        if (options.operation === "execute" && options.resourceId && !data) {
            data = {
                $name: options.operationName,
                request: {
                    entity: { "$key": options.resourceId }
                }
            };
        }

        var parms = [];
        if (data)
            parms.push(data);
        parms.push({
            success: function (data) {
                def.resolve(data);
            },
            failure: function (response) {
                if (typeof console !== "undefined")
                    console.warn("SData request failed", response);
                def.reject((response && response.responseText) ? response.responseText : "Unknown error");
            }
        });

        req[options.operation || "read"].apply(req, parms);

        return def;
    }



    return {
        // generic sdata request
        doSDataRequest: doSDataRequest
    };
});