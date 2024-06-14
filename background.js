chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isRunning: false });

  // Load config and store it
  fetch(chrome.runtime.getURL('config.json'))
    .then(response => response.json())
    .then(config => {
      chrome.storage.local.set(config, () => {
        console.log('Config has been set:', config);
      });
    });
});
