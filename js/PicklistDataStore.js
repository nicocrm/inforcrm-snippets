define(['Sage/Data/SDataServiceRegistry', 'Sage/Data/BaseSDataStore', 'dojo/_base/declare', 'dojo/_base/lang'], function (SDataServiceRegistry, BaseSDataStore, declare, lang) {
    // Wrapper for Base Sdata Store, with 2 purposes:
    // - set default options for retrieving picklist data
    // - unwraps the results of the sdata call to return only the picklist items
    return declare([BaseSDataStore], {
        constructor: function (options) {
            if (!options.pickListName)
                throw Error('pickListName is required');
            this.pickListName = options.pickListName;
            this.resourceKind = 'picklists';
            this.service = SDataServiceRegistry.getSDataService('system', false, true, false);
            this.directQuery = { name: options.pickListName };
            this.select = [
                'items/text',
                'items/code',
                'items/number'
            ];
            this.include = ['items'];
        },
        fetch: function (context) {
            var newContext = lang.mixin({
                onComplete: function (feed) {
                    if (!feed[0]) {
                        console.warn('Unable to locate picklist name ' + this.pickListName);
                    } else {
                        context.onComplete(feed[0].items.$resources);
                    }
                }
            });
            return this.inherited(arguments, [newContext]);
        }
    });
});