import axios from "axios";
import chalk from "chalk";
import { createObjectCsvWriter } from "csv-writer";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import { ProgressCallback } from "..";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

const csvWriter = createObjectCsvWriter({
  path: "spar.csv",
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

async function getAllStores() {
  const options = {
    method: "GET",
    url: "https://s.myspar.ru/upload/shops_json.txt",
    headers: {
      accept: "*/*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
      origin: "https://myspar.ru",
      pragma: "no-cache",
      priority: "u=1, i",
      referer: "https://myspar.ru/",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    },
  };
  const response = await axios.request(options);
  // console.log(
  //   response.data.ITEMS.map((item) => ({
  //     id: item.ID,
  //     address: item.PROPS.ADDRESS,
  //   }))
  // );
  return response.data.ITEMS.map((item) => ({
    id: item.XML_ID,
    address: item.PROPS.ADDRESS,
  }));
}

async function getProducts(storeId: number) {
  const options = {
    method: "GET",
    url: "https://search-myspar.ext-geoprod.1221sys.ru/",
    params: {
      query: "Алкоголь",
      location: storeId,
      isWeb: "true",
      limit: "1000",
    },
    headers: {
      accept: "*/*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      origin: "https://myspar.ru",
      priority: "u=1, i",
      referer: "https://myspar.ru/",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    },
  };
  const response = await axios.request(options);
  // console.log(response.data.total);
  // console.log(response.data.products.length);
  return response.data.products;
}

export async function getSpar(pc: ProgressCallback) {
  const allStores = await getAllStores();
  pc({ task: allStores.length });
  for (let i = 0; i < allStores.length; i++) {
    // const start = Date.now();
    const products = await getProducts(allStores[i].id);
    if (products.length == 0) {
      // console.log(chalk.redBright(`товары отсуствуют ${allStores[i].id}`));
      continue;
    }
    const records = products.map((product) => ({
      date: new Date().toISOString(),
      network: "Spar",
      address: allStores[i].address,
      category: product.name.split(" ")[0],
      sku: product.name,
      price: product.price,
    }));
    await csvWriter.writeRecords(records);
    // console.log(`store ${i} fetched is ${Date.now() - start}`);
    pc({ done: i + 1 });
  }
}
