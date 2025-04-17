import axios from "axios";
import { chromium, Page } from "playwright";

const baseUrl = "https://www.perekrestok.ru/";
const setStoreUrl = "https://www.perekrestok.ru/api/customer/1.4.1.0/delivery/mode/pickup/";
const storesUrl = "https://www.perekrestok.ru/api/customer/1.4.1.0/shop/points";
const categoriesUrl =
  "https://www.perekrestok.ru/api/customer/1.4.1.0/catalog/category/1/full";

async function getCookies(baseUrl: string, debug: boolean) {
  let page: Page;
  let cookies: any[] = [];
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36";
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: userAgent });

  page = await context.newPage();
  await page.evaluate(() => {
    window.interceptedResponses = [];
    const originalFetch = window.fetch;
    window.fetch = async function (url: string, options: RequestInit) {
      const response = await originalFetch(url, options);
      const clone = response.clone();
      clone.text().then((data) => {
        window.interceptedResponses.push({ url, options, data });
      });
      return response;
    };
  });

  if (debug) {
    console.log(`Navigating to base URL: ${baseUrl}`);
  }

  const response = await page.goto(baseUrl, {
    waitUntil: "networkidle",
  });

  cookies = await context.cookies();
  const session = JSON.parse(
    cookies.filter((item) => item.name == "session")[0]?.value.substring(2)
  );
  let accessToken = session.accessToken;
  let refreshToken = session.refreshToken;

  if (debug) {
    console.log(`Status code: ${response?.status()}`);
    console.log(`Cookies fetched: ${JSON.stringify(cookies)}`);
    console.log(
      `accessToken = ${accessToken} \n refreshToken = ${refreshToken}`
    );
  }
  function convertCookiesToString(
    cookies: Array<{ name: string; value: string }>
  ): string {
    return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  }

  const predefinedOrder = [
    "spid",
    "_ym_uid",
    "_ym_d",
    "_ym_isad",
    "_ymab_param",
    "agreements",
    "TS015bfe9d",
    "spsc",
    "_ym_visorc",
  ];

  let cookieString =
    convertCookiesToString(
      cookies
        .filter((cookie) => predefinedOrder.includes(cookie.name))
        .sort(
          (a, b) =>
            predefinedOrder.indexOf(a.name) - predefinedOrder.indexOf(b.name)
        )
    ) +
    " session=j:" +
    JSON.stringify(session);
  await browser.close();

  try {
    let options = {
      method: "GET",
      maxRedirects: 0,
      url: storesUrl,
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        auth: `Bearer ${accessToken}`,
        "cache-control": "no-cache",
        pragma: "no-cache",
        priority: "u=1, i",
        "sec-ch-ua":
          '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        Cookie: `${cookieString}`,
      },
    };
    const validateCookies = (await axios.request(options)).data;
    if (validateCookies) return { cookieString, accessToken, refreshToken };
  } catch (error) {
    console.error("Error spsc header, refetching...");
    if (error.response) {
      let spscHeader = error.response.headers["set-cookie"]
        .toString()
        .replace(/.*spsc=([^;]*).*/, "$1");
      cookieString = cookieString.replace(/spsc=[^;]*/g, `spsc=${spscHeader}`);
      return { cookieString, accessToken, refreshToken };
    }
  }
}

async function getAllStores(accessToken: string, cookieString: string) {
  // const autchData = await getCookies(baseUrl, true);
  let options = {
    method: "GET",
    maxRedirects: 0,
    url: storesUrl,
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      auth: `Bearer ${accessToken}`,
      "cache-control": "no-cache",
      pragma: "no-cache",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      Cookie: `${cookieString}`,
    },
  };
  const stores = (await axios.request(options)).data.content.items.map((store) => {
    storeId: store.id,
    storeLocation: store.location,
  });
  // console.log(stores);
  return stores;
}

async function getCategories(accessToken: string, cookieString: string) {
  // const cookies = await getCookies(baseUrl, false)
  const options = {
    method: "GET",
    url: categoriesUrl,
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      auth: `Bearer ${accessToken}`,
      "cache-control": "no-cache",
      pragma: "no-cache",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      Cookie: `${cookieString}`,
    },
  };

  let categories = (await axios.request(options)).data.content.children;

  const excludedTitles = ["Вино", "Игристые вина", "Пиво"];

  categories = categories.map((child) => ({
    title: child.category.title,
    id: child.category.id
  })).filter((item) => !excludedTitles.includes(item.title));

  return categories;
}

async function setStore(storeId: number, accessToken: string, cookieString: string) {
  const options = {
    method: "PUT",
    url: setStoreUrl + storeId,
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      auth: `Bearer ${accessToken}`,
      "cache-control": "no-cache",
      pragma: "no-cache",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      Cookie: `${cookieString}`,
    },
  };
  const storeEnable = await axios.request(options)
  return storeEnable.data
}

export async function getPerecrestok() {
  const cookies = await getCookies(baseUrl, true);
  const stores = await getAllStores(cookies!.accessToken, cookies!.cookieString);
  const categories = await getCategories(cookies!.accessToken, cookies!.cookieString);
  for (let i = 0; i < stores.length; i++) {
    await setStore(stores[i].)
  }

}