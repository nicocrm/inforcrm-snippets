// Show an indeterminate progress bar.
// For a progress bar that can be updated, see ProgressBarDialog.js instead.
Sage.UI.Dialogs.showProgressBar({ message: 'message', showmessage: true, title: 'title', indeterminate: true, canclose: false })
// to hide:
Sage.UI.Dialogs.closeProgressBar();