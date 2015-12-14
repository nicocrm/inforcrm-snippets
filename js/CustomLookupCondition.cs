// hack to "stuff" a custom condition into a lookup
ScriptManager.RegisterStartupScript(this, GetType(), "CustomLookupFilter",
   @"require(['Sage/UI/SDataLookup', 'dojo/aspect'], function(SDataLookup, aspect) {
        aspect.after(SDataLookup.prototype, 'initConditionManager', function() {
            if(/lueNotifUser/.test(this.id)){ 
                this.conditionMgr.conditionWidgets['customcondition'] = { getCondition: function() { 
                    return { fieldname: 'User.Type', operator: ' in (\'Remote\', \'Concurrent\', \'Network\')', 
                     val: { toString: function() { return '' } } } } }
            }
        });
    });", true);