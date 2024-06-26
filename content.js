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

function logXMinutesBeforePurchaseTime(msUntilPurchase, minutesList) {
  for (const minutes of minutesList) {
    setTimeout(() => {
      console.log(`Running auto buy script in ${minutes} minutes...`);
    }, msUntilPurchase - minutes * 60 * 1000);
  }
}

function logXSecondsBeforePurchaseTime(msUntilPurchase, secondsList) {
  for (const seconds of secondsList) {
    setTimeout(() => {
      console.log(`Running auto buy script in ${seconds} seconds...`);
    }, msUntilPurchase - seconds * 1000);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleAddToCartAction(config) {
  try {
    console.log('Running auto buy script...');

    // Wait for the purchase number input and update its value
    const purchaseNumberInput = await waitForSelector('#sc_p07_01_purchaseNumber');
    purchaseNumberInput.value = config.itemAmount.toString();

    // Monitor network requests and redirect to checkout page
    const observer = new MutationObserver(async () => {
      // check if the element with id 'addToCartLayer' is visible
      const addToCartLayer = await waitForSelector('#addToCartLayer', 5000);

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

async function handleItemPageWatcher(config) {
  const nowUTC8 = new Date().getTime();
  const purchaseTimeUTC8 = new Date(config.purchaseTime).getTime();

  const timeUntilPurchase = purchaseTimeUTC8 - nowUTC8;

  console.log('Current time (UTC+8):', new Date(nowUTC8).toLocaleString());
  console.log('Purchase time (UTC+8):', new Date(purchaseTimeUTC8).toLocaleString());

  const timeUntilPurchaseMinutes = Math.floor(timeUntilPurchase / 60000);
  const timeUntilPurchaseSeconds = Math.floor(timeUntilPurchase / 1000);

  console.log(`Time until purchase: ${timeUntilPurchaseMinutes} minutes (${timeUntilPurchaseSeconds} seconds)`);

  if (timeUntilPurchase > 0) {
    logXMinutesBeforePurchaseTime(timeUntilPurchase, [3, 1]);

    logXSecondsBeforePurchaseTime(timeUntilPurchase, [30, 10, 5, 4, 3, 2, 1]);
  }

  setTimeout(() => {
    console.log('Running auto buy script now...');

    if (!config.isRefreshed) {
      chrome.storage.local.set({ isRefreshed: true });

      window.location.reload();

      return
    }

    handleAddToCartAction(config);
  }, timeUntilPurchase);
}

async function handleCartPageActions(config) {
  try {
    console.log('Handling cart page actions...');

    // Wait for the checkout button and click it
    const checkoutButton = await waitForSelector('.m-cart--foot__fee__btn > a');
    checkoutButton.click();

  } catch (error) {
    console.error('Error during cart page actions:', error);
  }
}

async function handleOrderInformationPageActions() {
  try {
    console.log('Handling order information page actions...');

    // Wait for the Visa payment option and click it
    const visaPaymentOption = await waitForSelector('#pBOrderInfoForm > section.u-sm-mb48.u-xs-mb16 > div > div > section > div:nth-child(12) > div > div.m-table__td.js-radio-group > div:nth-child(1) > label');
    visaPaymentOption.click();

    // Wait for the confirm button and click it
    const confirmButton = await waitForSelector('#confirmOrderInfo');
    confirmButton.click();

  } catch (error) {
    console.error('Error during order information page actions:', error);
  }
}

async function handleOrderConfirmationPageActions() {
  try {
    console.log('Handling order confirmation page actions...');

    // Wait for the agreement button and click it
    const agreementButton = await waitForSelector('#placeOrderForm > section.o-section.a-box.o-agree.u-sm-mb80.u-xs-mb60 > div > label');
    agreementButton.click();

    // mimic the user scrolling down to the bottom of the page
    window.scrollTo(0, document.body.scrollHeight, 'smooth');

    // DEPRECATED: Click with scripts makes the website redirect to a empty cart page
    // // Wait for the confirm button and click it
    // const confirmButton = await waitForSelector('#orderInfoConfirmBtn');
    // confirmButton.click();

  } catch (error) {
    console.error('Error during order confirmation page actions:', error);
  }
}

chrome.storage.local.get(['isRunning', 'itemAmount', 'purchaseTime', 'itemId', 'isRefreshed'], (data) => {
  console.log('Current config data:', data);

  if (!data.isRunning) {
    console.log('Automation is not running.');
    return;
  }

  if (window.location.href.startsWith('https://p-bandai.com/hk/item')) {

    if (window.location.href !== `https://p-bandai.com/hk/item/${data.itemId}`) {
      console.log("Not on the target item URL. Stopping automation.");
      return;
    }

    handleItemPageWatcher(data);
  } else if (window.location.href === 'https://p-bandai.com/hk/cart') {
    console.log('On the cart page. Starting purchase...');

    handleCartPageActions(data);
  } else if (window.location.href.startsWith('https://p-bandai.com/hk/checkout/orderinformation')) {
    console.log('On the order information page. Filling in details...');

    handleOrderInformationPageActions(data);
  } else if (window.location.href.startsWith('https://p-bandai.com/hk/checkout/confirm')) {
    console.log('On the order confirmation page. Waiting for user to confirm order...');

    handleOrderConfirmationPageActions();
  }
});
