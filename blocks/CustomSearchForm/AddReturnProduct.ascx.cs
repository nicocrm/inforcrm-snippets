// In AA: I created a "Panel" placeholder and set the column span to 2
// I can't use the placeholder directly because it is itself a dijit

// form load method:
String appPath = Request.ApplicationPath;
ScriptManager.RegisterStartupScript(this, GetType(), "AddReturnProduct",
    @"require({ packages: [{ name: 'Martin', location: '" + appPath +
    @"/MartinEng/js'}] }, ['Martin/Return/AddReturnProduct'], function(AddReturnProduct) {
        var s = new AddReturnProduct({});
        dojo.place(s.domNode, dojo.byId('" + placeholder.ClientID + @"').parentElement, 'only');
    });                                    
", true);
