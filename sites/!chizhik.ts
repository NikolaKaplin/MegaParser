import axios, { Axios, AxiosRequestConfig } from "axios";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import * as fs from "fs";
import * as path from "path";
import { chromium } from "playwright";
import { createObjectCsvWriter } from "csv-writer";

// без авторизации информация о всех магазинах отсуствует, используются access и refresh токены, acces токен обновляется каждые 6 минут
axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

const csvWriter = createObjectCsvWriter({
  path: "chizhik.csv",
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

const jsonFilePath = path.join(__dirname, "../jwt/chizhik.json");

async function updateToken(cookie: string) {
  const jsonString = fs.readFileSync(jsonFilePath, "utf-8");
  const tokens = JSON.parse(jsonString);
  const options = {
    method: "POST",
    url: "https://app.chizhik.club/api/v1/x5id/refresh/",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/plain, */*",
      "accept-language": "ru-RU,ru;q=0.9",
      authorization: `Bearer ${tokens.access}`,
      origin: "https://chizhik.club",
      priority: "u=1, i",
      referer: "https://chizhik.club/",
      "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      Cookie: cookie,
    },
    data: {
      refresh: tokens.refresh,
      client: "WEB",
    },
  };
  const newTokens = await axios.request(options);
  console.log(newTokens.data);
  fs.writeFileSync(
    jsonFilePath,
    JSON.stringify(await newTokens.data, null, 2),
    "utf-8"
  );
  return newTokens.data;
}

async function getCookie() {
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36";
  const browser = await chromium.launch({
    headless: true,
  });
  const context = await browser.newContext({
    userAgent: userAgent,
    geolocation: { longitude: 0, latitude: 0 },
    permissions: ["geolocation"], // разрешение на геолокацию
  });
  const page = await context.newPage();
  let cookie: string;
  // Слушаем события ответов
  page.on("request", async (request) => {
    if (
      request.url() ===
      "https://app.chizhik.club/api/v1/geo/cities/?name=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0"
    ) {
      cookie = await request.allHeaders();
    }
  });
  await page.goto(
    "https://app.chizhik.club/api/v1/geo/cities/?name=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0",
    { waitUntil: "networkidle" }
  );
  await page.reload();
  // await page.waitForTimeout(1000000);
  await browser.close();
  return cookie.cookie;
}

async function getAllStores(cookie: string, accessToken: string) {
  const options = {
    method: "GET",
    url: "https://app.chizhik.club/api/v1/shops/",
    headers: {
      accept: "*/*",
      "accept-language": "ru-RU,ru;q=0.9",
      authorization: `Bearer ${accessToken}`,
      origin: "https://chizhik.club",
      priority: "u=1, i",
      referer: "https://chizhik.club/",
      "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      Cookie: cookie,
    },
  };
  const shops = await axios.request(options);
  return shops.data;
}

async function getProducts(
  cookie: string,
  accessToken: string,
  storeId: number,
  categoryId: number
) {
  const options = {
    method: "GET",
    url: "https://app.chizhik.club/api/v1/catalog/products/",
    params: { shop_id: storeId.toString(), category_id: categoryId.toString() },
    headers: {
      accept: "*/*",
      "accept-language": "ru-RU,ru;q=0.9",
      authorization: `Bearer ${accessToken}`,
      origin: "https://chizhik.club",
      priority: "u=1, i",
      referer: "https://chizhik.club/",
      "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      Cookie: cookie,
    },
  };
  const products = await axios.request(options);
  console.log(products.data.count);
  return products.data.items;
}

export async function getChizhik() {
  const categories = [
    { name: "Водка", id: 5 },
    { name: "Ликёро-водочные напитки", id: 6 },
    { name: "Коньяк", id: 153 },
  ];

  let cookie = await getCookie();
  let token = await updateToken(cookie);

  // Обновление куки и токена каждые 5 минут
  setInterval(async () => {
    cookie = await getCookie();
    token = await updateToken(cookie);
  }, 5 * 60 * 1000); // 5 минут в миллисекундах

  const stores = await getAllStores(cookie, token.access);

  for (let i = 0; i < stores.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const start = Date.now();
    const records = await Promise.all(
      categories.map(async (category) => {
        const products = await getProducts(
          cookie,
          token.access,
          stores[i].id,
          category.id
        );
        if (!products) return [];

        return products.map((product) => ({
          date: new Date().toISOString(),
          network: "Чижик",
          address: stores[i].name,
          category: category.name,
          sku: product.title,
          price: product.price,
        }));
      })
    );

    const flatRecords = records.flat();

    if (flatRecords.length > 0) {
      await csvWriter.writeRecords(flatRecords);
    }
    console.log(i, `${Date.now() - start}ms`);
  }
}

getChizhik();

//блокировка
