// To check for a secured action access:
var rs = Sage.Services.getService('RoleSecurityService');
rs.hasAccess('Entities/User/Delete');

// secured action access is cached on the client side and often requires a complete cache clear
