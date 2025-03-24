chrome.runtime.onMessage.addListener((message) => {
  if (message === "openPopup") {
    chrome.action.openPopup()
  }
})
