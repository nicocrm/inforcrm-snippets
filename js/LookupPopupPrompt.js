// add a prompt when the user opens the lookup
aspect.around(SDataLookup.prototype, 'showLookup',
                    function (originalShowLookup) {
                        return function () {
                            var self = this;
                            if (/lkupEndUser/.test(this.id)) {
                                SlxDialogs.raiseQueryDialog('Warning', 'Are you sure', function (yesNo) {
                                    if (yesNo) {
                                        originalShowLookup.apply(self, arguments);
                                        // now we need to register the handler for when the lookup is hidden
                                        aspect.after(self.lookupDialog, 'onHide', function () {
                                            self.destroy();
                                            // autopostback
                                            __doPostBack(self.id.replace(/_Lookup$/, ''), '');
                                        });
                                    } else {
                                        self.destroy();
                                    }
                                }, 'OK', 'Cancel');
                            } else {
                                originalShowLookup.apply(self, arguments);
                            }
                        }
                    });