document.getElementById('toggleAutomation').addEventListener('click', () => {
  chrome.storage.local.get('isRunning', (data) => {
    const newState = !data.isRunning;
    chrome.storage.local.set({ isRunning: newState }, () => {
      document.getElementById('toggleAutomation').innerText = newState ? 'Stop Automation' : 'Start Automation';

      chrome.storage.local.set({ isRefreshed: false });

      if (newState) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            files: ["content.js"]
          });
        });
      }
    });
  });
});

chrome.storage.local.get(['isRunning', 'itemAmount', 'itemId'], (data) => {
  document.getElementById('toggleAutomation').innerText = data.isRunning ? 'Stop Automation' : 'Start Automation';
  document.getElementById('itemAmount').value = data.itemAmount || '';
  document.getElementById('itemId').value = data.itemId || '';
  console.log('Initial state of isRunning:', data.isRunning);
});

document.getElementById('confirmUpdate').addEventListener('click', () => {
  const itemAmount = document.getElementById('itemAmount').value;
  const itemId = document.getElementById('itemId').value;
  
  chrome.storage.local.set({ itemAmount: parseInt(itemAmount, 10), itemId }, () => {
    console.log('Updated itemAmount to', itemAmount);
    console.log('Updated itemId to', itemId);
  });
});
