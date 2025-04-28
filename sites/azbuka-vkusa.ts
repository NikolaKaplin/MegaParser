import axios from "axios";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import { chromium } from "playwright";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

async function getCookie() {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  let headers = {};
  page.on("request", async (request) => {
    if (
      request.url() ==
      "https://av.ru/warp/cache/shopsSpecialOrder?city=msk&short=false"
    )
      headers = await request.allHeaders();
  });
  await page.goto(
    "https://av.ru/warp/cache/shopsSpecialOrder?city=msk&short=false"
  );
  await page.waitForTimeout(5000);
  await page.reload();
  await browser.close();
  console.log(headers.cookie);
  return headers.cookie;
}
getCookie();

//доделать