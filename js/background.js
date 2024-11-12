chrome.bookmarks.onCreated.addListener(function (id, bookmark) {
  chrome.storage.local.set({ showToast: true });
  chrome.storage.local.set({ newBookmarkAdded: true }); // Set a flag for the popup
});
