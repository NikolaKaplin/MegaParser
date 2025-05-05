// playwright-extra is a drop-in replacement for playwright,
// it augments the installed playwright with plugin functionality
import { chromium } from "playwright-extra";

// Load the stealth plugin and use defaults (all tricks to hide playwright usage)
// Note: playwright-extra is compatible with most puppeteer-extra plugins
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Add the plugin to playwright (any number of plugins can be added)
chromium.use(StealthPlugin());

// ...(the rest of the quickstart code example is the same)
chromium.launch({ headless: false }).then(async (browser) => {
  const page = await browser.newPage();
  let cookie;
  page.on("request", async (request) => {
    if (
      request.url() ==
      "https://www.winelab.ru/catalog/krepkiy-alkogol-vodka/results"
    )
      cookie = await request.allHeaders();
  });
  console.log("Testing the stealth plugin..");
  await page.goto(
    "https://www.winelab.ru/catalog/krepkiy-alkogol-vodka/results"
  );
  await page.waitForTimeout(5000);
  await page.reload();
  console.log("All done✨", `cookie: ${cookie.cookie}`);
  await browser.close();
});
