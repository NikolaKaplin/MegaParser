import axios from "axios";
import { createObjectCsvWriter } from "csv-writer";
import { chromium, Page } from "playwright";
// import { csvWriter } from "..";

export const csvWriter = createObjectCsvWriter({
  path: "producs.csv",
  header: [
    { id: "date", title: "Дата" },
    { id: "network", title: "Сеть" },
    { id: "address", title: "Адрес" },
    { id: "category", title: "Категория" },
    { id: "sku", title: "SKU" },
    { id: "price", title: "Цена" },
  ],
  encoding: "utf8",
});

const baseUrl = "https://www.perekrestok.ru/";
const setStoreUrl =
  "https://www.perekrestok.ru/api/customer/1.4.1.0/delivery/mode/pickup/";
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
  const stores = (await axios.request(options)).data.content.items.map(
    (store) => ({
      storeId: store.id,
      storeLocation: {
        lattitude: store.location.coordinates[0],
        longitude: store.location.coordinates[1],
      },
    })
  );

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

  categories = categories
    .map((child) => ({
      title: child.category.title,
      id: child.category.id,
    }))
    .filter((item) => !excludedTitles.includes(item.title));

  return categories;
}

async function setStore(
  storeId: number,
  accessToken: string,
  cookieString: string
) {
  const url = setStoreUrl + storeId;
  const options = {
    method: "PUT",
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
  const storeEnable = await fetch(url, options).then((res) => res.json());
  console.log(storeEnable);
  return storeEnable.content.shop;
}

async function getProducts(
  categoryId: number,
  accessToken: string,
  cookieString: string
) {
  const options = {
    method: "POST",
    url: "https://www.perekrestok.ru/api/customer/1.4.1.0/catalog/product/feed",
    headers: {
      "content-type": "application/json",
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
    data: {
      page: 1,
      perPage: 48,
      filter: { category: categoryId, onlyWithProductReviews: false },
      withBestProductReviews: false,
    },
  };
  const products = await axios.request(options);
  return products.data.content.items.flatMap((item) => ({
    title: item.title,
    price: item.priceTag.price.toString().slice(0, -2),
  }));
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getPerecrestok() {
  const cookies = await getCookies(baseUrl, true);
  const stores = await getAllStores(
    cookies!.accessToken,
    cookies!.cookieString
  );
  const categories = await getCategories(
    cookies!.accessToken,
    cookies!.cookieString
  );
  for (let i = 0; i < stores.length; i++) {
    const startShop = Date.now();
    const enableStore = await setStore(
      stores[i].storeId,
      cookies!.accessToken,
      cookies!.cookieString
    );
    await Promise.all(
      categories.map(async (category) => {
        const products = await getProducts(
          category.id,
          cookies!.accessToken,
          cookies!.cookieString
        );
        const records = products.map((product) => ({
          date: new Date().toISOString(),
          network: "Перекресток",
          address: enableStore.address,
          category: category.title,
          sku: product.title,
          price: product.price,
        }));
        await csvWriter.writeRecords(records);
      })
    );
    if ((i + 1) % 10 === 0) {
      console.log("Waiting for 25 seconds after 10 iterations...");
      await delay(30000);
    }
    console.log(`a store  fetched is ${Date.now() - startShop}ms`);
  }
}

// getPerecrestok();

async function collectionCookie() {
  let resultArr: any = [];
  for (let i = 0; i < 10; i++) {
    const cookieString = await getCookies(baseUrl, false);
    console.log(cookieString);
    let result = {};
  }
}
collectionCookie();
//доделать ротацию cookie
