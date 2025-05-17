import axios from "axios";
import { createObjectCsvWriter } from "csv-writer";
import { chromium } from "playwright";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import ora from "ora";
import chalk from "chalk";
import { ProgressCallback } from "..";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

const baseUrl = "https://bristol.ru/";
const shopInfoUrl = "https://api.mobile.bristol.ru/api/v2/shops/";
const allShopsCoordsUrl =
  "https://api.mobile.bristol.ru/api/v2/shops/coords?consumer=website";
const producsApiUrl = "https://api.mobile.bristol.ru/api/v3/products";

const categories = [
  {
    id: 121,
    name: "Водка, Настойка",
  },
  {
    id: 122,
    name: "Виски, Бурбон",
  },
  {
    id: 123,
    name: "Коньяк, Арманьяк,",
  },
  {
    id: 124,
    name: "Ром, Джин, Текила",
  },
  {
    id: 125,
    name: "Аперитив, Ликер, Бальзам, Вермут",
  },
];

const csvWriter = createObjectCsvWriter({
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

async function getHeaders() {
  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    geolocation: { longitude: 0, latitude: 0 },
    permissions: ["geolocation"], // разрешение на геолокацию
  });
  const page = await context.newPage();
  let headers = {};
  // Слушаем события запросов
  page.on("request", (request) => {
    if (request.url() == allShopsCoordsUrl) headers = request.headers();
  });

  // Переходим на страницу
  await page.goto(baseUrl);

  // Даем время для загрузки страницы и обработки запросов
  await page.waitForTimeout(5000); // 5 секунд, измените при необходимости

  // Кликаем на кнопку "Да"
  await page.click("button.btn-primary");

  // Даем время, чтобы обработать возможные переходы/загрузки
  await page.waitForTimeout(2000); // 2 секунды, при необходимости измените

  // Кликаем на кнопку с адресом "Арх. обл. г.Котлас ул.Ленина д.176"
  await page.click("button.navigation-shop__button");

  // Даем время для загрузки после клика
  await page.waitForTimeout(5000); // 5 секунд, измените при необходимости

  // Закрываем браузер
  await browser.close();
  return headers;
}

async function getAllShops(headers: object) {
  const options = {
    method: "GET",
    url: allShopsCoordsUrl,
    headers: headers,
  };
  const allShops = await axios.request(options);
  return allShops.data;
}

async function getShopInfo(headers: object, shopId: number) {
  headers.Origin = "https://bristol.ru";
  const options = {
    method: "GET",
    url: shopInfoUrl + shopId.toString(),
    params: { consumer: "website" },
    headers: headers,
  };
  while (true) {
    try {
      const shopInfo = await axios.request(options);

      // Если запрос успешен, возвращаем массив товаров
      return shopInfo.data.shop;
    } catch (error) {
      // Проверка на ошибку 500
      if (error.response && error.response.status === 500) {
        console.error("Ошибка 500: Повторная попытка через 1 секунду...");

        // Ждём 1 секунду
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        // В случае других ошибок, пробрасываем их дальше
        throw error;
      }
    }
  }
}

async function getProducts(
  headers: object,
  shopNum: string,
  categoryId: number,
  communityId: number,
  page: number
): Promise<any> {
  const options = {
    method: "GET",
    url: producsApiUrl,
    params: {
      remnants_in_shop: "В наличии",
      consumer: "website",
      shop_number: shopNum,
      community_id: communityId,
      page: page,
      sort: "new_first",
      count: "24",
      category_id: categoryId,
    },
    headers: headers,
  };

  while (true) {
    try {
      const products = await axios.request(options);

      // Если запрос успешен, возвращаем массив товаров
      return products.data.promo_products;
    } catch (error) {
      // Проверка на ошибку 500
      if (error.response && error.response.status === 500) {
        console.error("Ошибка 500: Повторная попытка через 1 секунду...");

        // Ждём 1 секунду
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        // В случае других ошибок, пробрасываем их дальше
        throw error;
      }
    }
  }
}

export async function getBristol(pc: ProgressCallback) {
  let spinner = ora(chalk.blue("Fetching headers Bristol...")).start();
  let headers = await getHeaders();
  spinner.succeed(chalk.green("Headers fetched successfully!"));
  spinner = ora(chalk.blue("Fetching list shops Bristol...")).start();
  const allShops = await getAllShops(headers);
  spinner.succeed(chalk.green("List shops fetched successfully!"));
  console.log(allShops.length);
  pc({ task: allShops.length });
  for (let i = 0; i < allShops.length; i++) {
    try {
      const start = Date.now();
      let shop;

      // Обернуть вызов getShopInfo в try-catch
      try {
        shop = await getShopInfo(headers, allShops[i].id);
      } catch (error) {
        console.error(
          chalk.red(
            `Error fetching info for shop ${allShops[i].id}: ${error.message}`
          )
        );
        headers = await getHeaders();
        // Пропустить итерацию в случае ошибки
        continue;
      }

      await Promise.all(
        categories.map(async (category) => {
          let productsArr = [];
          let products = await getProducts(
            headers,
            shop.number,
            category.id,
            shop.community_id,
            1
          );
          products.forEach((product) => productsArr.push(product));

          if (products.length === 24) {
            for (let j = 2; products.length === 24; j++) {
              products = await getProducts(
                headers,
                shop.number,
                category.id,
                shop.community_id,
                j
              );
              products.forEach((product) => productsArr.push(product));
            }
          }

          console.log(productsArr.length);
          const records = productsArr.map((product) => ({
            date: new Date().toISOString(),
            network: "Бристоль",
            address: shop.name,
            category: category.name,
            sku: product.name,
            price:
              product.prices.promo_price !== undefined
                ? product.prices.promo_price
                : product.prices.regular_price,
          }));
          await csvWriter.writeRecords(records);
        })
      );
      console.log(chalk.blueBright(`${i} fetched in ${Date.now() - start}ms`));
      pc({ done: i + 1 });
    } catch (error) {
      continue;
    }
  }
  return;
}
