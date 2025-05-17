import axios from "axios";
import * as cheerio from "cheerio";
import { createObjectCsvWriter } from "csv-writer";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import { chromium } from "playwright";
import { ProgressCallback } from "..";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

const keywords = [
  "водка",
  "ром",
  "кальвадос",
  "виски",
  "бурбон",
  "арманьяк",
  "текила",
  "джин",
  "ликер",
  "ликёр",
  "настойка",
  "бальзам",
  "бренди",
  "коньяк",
  "ливер",
  "виски",
  "шампанское",
];

const csvWriter = createObjectCsvWriter({
  path: "globus.csv",
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

async function getCookie() {
  const browser = await chromium.launch({
    headless: true,
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  let headers = {};
  // Слушаем события запросов
  page.on("request", async (request) => {
    if (request.url() == "https://www.globus.ru/catalog/alkogol/")
      headers = await request.allHeaders();
  });
  await page.goto("https://www.globus.ru/catalog/alkogol/");
  await page.click(".js-select-town.button-select.see");
  await page.waitForTimeout(5000); // 5 секунд, измените при необходимости;
  await browser.close();
  console.log(headers.cookie.split(" "));
  return headers.cookie;
}

async function getAllStores() {
  const options = {
    method: "GET",
    url: "https://www.globus.ru/catalog/",
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
      pragma: "no-cache",
      priority: "u=0, i",
      referer: "https://www.globus.ru/catalog/alkogol/krepkiy-alkogol/?page=2",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    },
  };
  const response = await axios.request(options);
  const page = cheerio.load(response.data);
  const storeIds = page(".all_city__block-city-wrapper")
    .find(".four_city")
    .find(".js-select-city")
    .map((index, element) => page(element).attr("data-id"))
    .get();
  const storeNames = page(".all_city__block-city-wrapper")
    .find(".four_city")
    .find("span")
    .text()
    .match(/Глобус [A-ZА-ЯЁ][a-zа-яё]*(?: [A-ZА-ЯЁ][a-zа-яё]*)*/g);
  let allStores = [];
  for (let i = 0; i < storeIds.length; i++) {
    allStores.push({
      name: storeNames![i],
      id: storeIds[i],
    });
  }
  return allStores;
}

function editCookie(cookie: string, storeId: number) {
  let editedCookie = cookie.split(" ");
  editedCookie[0] = `globus_hyper_id=${storeId};`;
  return editedCookie.join(" ");
}

async function getPagesCount(cookie: string) {
  const url = "https://www.globus.ru/catalog/alkogol";
  const options: RequestInit = {
    keepalive: false,
    method: "GET",
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      priority: "u=0, i",
      referer: "https://www.globus.ru/catalog/alkogol/",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      cookie: cookie,
    },
  };
  const response = await fetch(url, options);
  const page = cheerio.load(await response.text());
  const pagesCount = page(".pim-list__navigation").find("a:eq(4)");
  console.log(pagesCount.text());
  return Number(pagesCount.text());
}

async function getProducts(pageNum: number, cookie: string) {
  const url = `https://www.globus.ru/catalog/alkogol/?page=${pageNum}&count=36`;
  const options = {
    url: `https://www.globus.ru/catalog/alkogol/?page=${pageNum}&count=36`,
    method: "GET",
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      priority: "u=0, i",
      referer: "https://www.globus.ru/catalog/alkogol/",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      cookie: cookie,
    },
  };
  const response = await axios.request(options);
  const start = Date.now();
  const page = cheerio.load(await response.data);
  const productNames = page(".js-catalog")
    .find("a")
    .find(".pim-list__item-title")
    .text()
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item !== "");
  const productPrices = page(".js-catalog")
    .find("a")
    .find(".pim-list__item-price-actual-main")
    .text()
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item !== "");
  let products = [];
  for (let i = 0; i < productNames.length; i++) {
    products.push({
      name: productNames[i],
      price: productPrices[i],
    });
  }
  console.log(Date.now() - start);
  return products;
}

export async function getGlobus() {
  let cookies = await getCookie();
  const allStores = await getAllStores();
  // pc({ task: allStores.length });
  for (let i = 0; i < allStores.length; i++) {
    try {
      const newCookies = await editCookie(cookies, allStores[i]?.id);
      const pagesCount = await getPagesCount(newCookies);
      let productsArr = [];
      for (let j = 1; j < pagesCount; j++) {
        const start = Date.now();
        const products = await getProducts(j, newCookies);
        products.map((item) => productsArr.push(item));
        console.log(`${j} page fetched in ${Date.now() - start}`);
      }
      const filteredProducts = productsArr.filter((item) =>
        keywords.some((keyword) => item.name.toLowerCase().includes(keyword))
      );
      const records = filteredProducts.map((product) => ({
        date: new Date().toISOString(),
        network: "Глобус",
        address: allStores[i]?.name,
        category: product.name.split(" ")[0],
        sku: product.name,
        price: product.price,
      }));
      await csvWriter.writeRecords(records);
      console.log(i);
      // pc({ done: i + 1 });
    } catch (error) {
      if (error.code == "ECONNRESET") continue;
    }
  }
}
getGlobus();
