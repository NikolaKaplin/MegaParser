import axios, { AxiosRequestConfig } from "axios";
import { createObjectCsvWriter } from "csv-writer";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import { chromium } from "playwright";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

const regions = [
  {
    regionName: "Москва",
    code: "az",
  },
  {
    regionName: "Санкт-Петербург",
    code: "az_spb",
  },
];

const csvWriter = createObjectCsvWriter({
  path: "azbuka-vkusa.csv",
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

async function getNewCookie(cookie) {
  let options: AxiosRequestConfig = {
    method: "GET",
    url: "https://av.ru/category/all",
    params: {
      q: ":acbestseller:categoryUrl:/alkogol:assortmentTypes:INTERNET:wineAndAlcoholBeverageType:Коньяк:wineAndAlcoholBeverageType:Водка:wineAndAlcoholBeverageType:Виски купажированный:wineAndAlcoholBeverageType:Бренди:wineAndAlcoholBeverageType:Ром:wineAndAlcoholBeverageType:Ликёр:wineAndAlcoholBeverageType:Джин:wineAndAlcoholBeverageType:Текила:wineAndAlcoholBeverageType:Арманьяк:wineAndAlcoholBeverageType:Виски солодовый:wineAndAlcoholBeverageType:Водка виноградная:wineAndAlcoholBeverageType:Сидр сухой:wineAndAlcoholBeverageType:Настойка горькая:wineAndAlcoholBeverageType:Водка плодовая:wineAndAlcoholBeverageType:Настойка сладкая:wineAndAlcoholBeverageType:Сидр полусладкий:wineAndAlcoholBeverageType:Ликер крепкий:wineAndAlcoholBeverageType:Ликероводочное изделие:wineAndAlcoholBeverageType:Кальвадос:wineAndAlcoholBeverageType:Настойка:wineAndAlcoholBeverageType:Сидр сладкий:wineAndAlcoholBeverageType:Шампанское белое брют:wineAndAlcoholBeverageType:Шампанское розовое экстра брют:wineAndAlcoholBeverageType:Ликер:wineAndAlcoholBeverageType:Саке",
      showPreOrder: "true",
      pageSize: "42",
      page: "0",
    },
    validateStatus: () => true,
    maxRedirects: 0,
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "ru-RU,ru;q=0.9",
      priority: "u=1, i",
      referer: "https://av.ru/catalog/alkogol",
      "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      cookie: cookie,
    },
  };
  const response = await axios.request(options);
  const newCookies =
    response.headers["set-cookie"]
      ?.toString()
      .replace(/.*(spsc=[^;]+;).*/, "$1") +
    " " +
    cookie;
  return newCookies;
}

async function getProducts(cookie: string, page: number, region: string) {
  let options: AxiosRequestConfig = {
    method: "GET",
    url: "https://av.ru/category/all",
    params: {
      q: ":acbestseller:categoryUrl:/alkogol:assortmentTypes:INTERNET:wineAndAlcoholBeverageType:Коньяк:wineAndAlcoholBeverageType:Водка:wineAndAlcoholBeverageType:Виски купажированный:wineAndAlcoholBeverageType:Бренди:wineAndAlcoholBeverageType:Ром:wineAndAlcoholBeverageType:Ликёр:wineAndAlcoholBeverageType:Джин:wineAndAlcoholBeverageType:Текила:wineAndAlcoholBeverageType:Арманьяк:wineAndAlcoholBeverageType:Виски солодовый:wineAndAlcoholBeverageType:Водка виноградная:wineAndAlcoholBeverageType:Сидр сухой:wineAndAlcoholBeverageType:Настойка горькая:wineAndAlcoholBeverageType:Водка плодовая:wineAndAlcoholBeverageType:Настойка сладкая:wineAndAlcoholBeverageType:Сидр полусладкий:wineAndAlcoholBeverageType:Ликер крепкий:wineAndAlcoholBeverageType:Ликероводочное изделие:wineAndAlcoholBeverageType:Кальвадос:wineAndAlcoholBeverageType:Настойка:wineAndAlcoholBeverageType:Сидр сладкий:wineAndAlcoholBeverageType:Шампанское белое брют:wineAndAlcoholBeverageType:Шампанское розовое экстра брют:wineAndAlcoholBeverageType:Ликер:wineAndAlcoholBeverageType:Саке",
      showPreOrder: "true",
      pageSize: "42",
      page: page,
    },
    validateStatus: () => true,
    maxRedirects: 0,
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "ru-RU,ru;q=0.9",
      priority: "u=1, i",
      referer: "https://av.ru/catalog/alkogol",
      "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      cookie: cookie + region,
    },
  };
  let products = await axios.request(options);
  if (products.status === 307) {
    const newCookies =
      products.headers["set-cookie"]
        ?.toString()
        .replace(/.*(spsc=[^;]+;).*/, "$1") +
      " " +
      cookie +
      region;
    options.headers!.cookie = newCookies;
    products = await axios.request(options);
  }

  return {
    products: products.data.products.products,
    countPages: products.data.products.pagination.numberOfPages,
  };
}

async function setRegion(cookie: string, region: string) {
  const options = {
    method: "POST",
    url: "https://av.ru/occ/api/regions/current",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/plain, */*",
      "accept-language": "ru-RU,ru;q=0.9",
      origin: "https://av.ru",
      priority: "u=1, i",
      referer: "https://av.ru/",
      "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      cookie: cookie,
    },
    data: { code: region },
  };
  const response = axios.request(options);
  console.log((await response).status);
  if ((await response).status == 200) return { status: 200 };
  return { status: 400 };
}

async function getAzbukaVkusa() {
  const cookies = await getCookie();
  const newCookie = await getNewCookie(cookies);
  const products = await getProducts(newCookie, 0, regions[0]?.code!);
  console.log(products.countPages);
  for (let j = 0; j < regions.length; j++) {
    let productsArr: any = [];
    const regionStatus = await setRegion(newCookie, regions[j]?.code!);
    for (let i = 0; i < products.countPages; i++) {
      const start = Date.now();
      const products = await getProducts(newCookie, i, regions[j]?.code!);
      products.products.map((product) => productsArr.push(product));
      console.log(`fetched as ${Date.now() - start}ms `, i);
    }
    console.log(productsArr.length);
    const records = productsArr.map((product) => ({
      date: new Date().toISOString(),
      network: "Азбука вкуса",
      address: regions[j]?.regionName,
      category: product.name.split(" ")[0],
      sku: product.name,
      price: product.totalPrice,
    }));
    await csvWriter.writeRecords(records);
  }
}

getAzbukaVkusa();
