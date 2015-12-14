// Example usage to require() a custom module that is included in the <customer>/js folder.
String appPath = Request.ApplicationPath;
ScriptManager.RegisterStartupScript(this, GetType(), "RFI_CustomerPortalScript",
    @"require({ packages: [{ name: 'MyCustomer', location: '" + appPath +
    @"/MyCustomer/js'}] }, ['MyCustomer/MyModule'], function(MyModule) {  });                                    
", true);