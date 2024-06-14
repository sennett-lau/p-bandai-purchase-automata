function waitForSelector(selector, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const interval = 100;
    let elapsedTime = 0;

    const checkExist = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(checkExist);
        resolve(element);
      }

      elapsedTime += interval;
      if (elapsedTime >= timeout) {
        clearInterval(checkExist);
        reject(new Error(`Timeout: ${selector} not found`));
      }
    }, interval);
  });
}

function logXMinutesBeforePurchaseTime(msUntilPurchase, minutes) {
  setTimeout(() => {
    console.log(`Running auto buy script in ${minutes} minutes...`);
  }, msUntilPurchase - minutes * 60 * 1000);
}

function logXSecondsBeforePurchaseTime(msUntilPurchase, seconds) {
  setTimeout(() => {
    console.log(`Running auto buy script in ${seconds} seconds...`);
  }, msUntilPurchase - seconds * 1000);
}

async function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function automatePurchase(config) {
  const nowUTC8 = new Date().getTime();
  const purchaseTimeUTC8 = new Date(config.purchaseTime).getTime();

  const timeUntilPurchase = purchaseTimeUTC8 - nowUTC8;

  console.log('Current time (UTC+8):', new Date(nowUTC8).toLocaleString());
  console.log('Purchase time (UTC+8):', new Date(purchaseTimeUTC8).toLocaleString());

  const timeUntilPurchaseMinutes = Math.floor(timeUntilPurchase / 60000);
  const timeUntilPurchaseSeconds = Math.floor(timeUntilPurchase / 1000);

  console.log(`Time until purchase: ${timeUntilPurchaseMinutes} minutes (${timeUntilPurchaseSeconds} seconds)`);

  if (timeUntilPurchase > 0) {
    logXMinutesBeforePurchaseTime(timeUntilPurchase, 3);
    logXMinutesBeforePurchaseTime(timeUntilPurchase, 1);

    logXSecondsBeforePurchaseTime(timeUntilPurchase, 30);
    logXSecondsBeforePurchaseTime(timeUntilPurchase, 10);
    logXSecondsBeforePurchaseTime(timeUntilPurchase, 5);
    logXSecondsBeforePurchaseTime(timeUntilPurchase, 4);
    logXSecondsBeforePurchaseTime(timeUntilPurchase, 3);
    logXSecondsBeforePurchaseTime(timeUntilPurchase, 2);
    logXSecondsBeforePurchaseTime(timeUntilPurchase, 1);
  }

  setTimeout(() => {
    console.log('Running auto buy script now...');

    if (!config.isRefreshed) {
      chrome.storage.local.set({ isRefreshed: true });

      window.location.reload();

      return
    }

    runAutoBuyScript(config);
  }, timeUntilPurchase);
}

async function runAutoBuyScript(config) {
  try {
    console.log('Running auto buy script...');

    // Wait for the purchase number input and update its value
    const purchaseNumberInput = await waitForSelector('#sc_p07_01_purchaseNumber');
    purchaseNumberInput.value = config.itemAmount.toString();

    // Monitor network requests and redirect to checkout page
    const observer = new MutationObserver(async () => {
      // check if the element with id 'addToCartLayer' is visible
      const addToCartLayer = document.getElementById('addToCartLayer');

      if (!addToCartLayer) {

        // refresh the page if the element is not found
        window.location.reload();
        return;
      }

      observer.disconnect();
      window.location.href = 'https://p-bandai.com/hk/cart';
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Click the add to cart button
    const addToCartButton = await waitForSelector('#addToCartButton');
    addToCartButton.click();

  } catch (error) {
    console.error('Error during purchase automation:', error);
  }
}

chrome.storage.local.get(['isRunning', 'itemAmount', 'purchaseTime', 'itemId', 'isRefreshed'], (data) => {
  console.log('Current config data:', data);

  if (!data.isRunning) {
    console.log('Automation is not running.');
    return;
  }

  if (window.location.href !== `https://p-bandai.com/hk/item/${data.itemId}`) {
    console.log("Not on the target item URL. Stopping automation.");
    return;
  }

  automatePurchase(data);
});
