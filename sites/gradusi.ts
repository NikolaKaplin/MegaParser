import axios, { AxiosRequestConfig } from "axios";
import * as cheerio from "cheerio";

import { createObjectCsvWriter } from "csv-writer";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

const csvWriter = createObjectCsvWriter({
  path: "gradusi.csv",
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
  let options: AxiosRequestConfig = {
    method: "GET",
    url: "https://gradusi.net/api/rest/v1/cities/by_regions/",
    headers: {
      accept: "*/*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      priority: "u=1, i",
      referer: "https://gradusi.net/catalog/category/2359/?page=2",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    },
  };
  let response = await axios.request(options);
  const regions = response.data.flatMap((item) => item.region);
  console.log(regions);
  let allStores: any = [];
  for (let i = 0; i < regions.length; i++) {
    options = {
      method: "GET",
      url: "https://gradusi.net/api/rest/v1/geo/warehouses/",
      params: { region: regions[i] },
      headers: {
        accept: "*/*",
        "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        priority: "u=1, i",
        referer: "https://gradusi.net/catalog/category/2359/?page=2",
        "sec-ch-ua":
          '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      },
    };
    response = await axios.request(options);
    response.data.results.map((item) =>
      allStores.push({
        storeId: item.id,
        storeAddress: item.address,
      })
    );
  }
  return allStores;
}

async function setStore(storeId: number) {
  const options = {
    method: "POST",
    url: "https://gradusi.net/api/rest/v1/geo/warehouses/385/",
    headers: {
      accept: "*/*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-length": "0",
      origin: "https://gradusi.net",
      priority: "u=1, i",
      referer: "https://gradusi.net/catalog/category/2351/",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      "x-csrftoken": "bh1Lem1DEmEA3SZHvV4DhOea4WNttKJJ",
    },
  };
  const response = await axios.request(options);
  return response.status;
}

async function getProducts(pageNum: number) {
  const options = {
    method: "GET",
    url: `https://gradusi.net/catalog/category/2351/?page=${pageNum}`,
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
      pragma: "no-cache",
      priority: "u=0, i",
      referer: "https://gradusi.net/catalog/category/2351/",
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
  const productsNames: string[] = page(".catalog-product-list-short-prods")
    .find(".product.product--item-grid.show.white_cover")
    .map((index, element) =>
      page(element).find(".product__name.short_prods_name ").text()
    )
    .get();
  const productsPrices: string[] = page(".catalog-product-list-short-prods")
    .find(".product.product--item-grid.show.white_cover")
    .map((index, element) =>
      page(element).find(".price_default ").text().trim()
    )
    .get();
  let products: object[] = [];
  for (let i = 0; i < productsNames.length; i++) {
    products.push({
      name: productsNames[i],
      price: productsPrices[i],
    });
  }
  console.log(products);
  return products;
}

async function getPagesCount() {
  const options = {
    method: "GET",
    url: "https://gradusi.net/catalog/category/2351/",
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
      pragma: "no-cache",
      priority: "u=0, i",
      referer: "https://gradusi.net/catalog/category/2351/",
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
  const pagesCount = page(".pagination.pagination__pages ")
    .find(".page-link")
    .eq(-2)
    .text()
    .trim();
  return Number(pagesCount);
}

export async function getGradusi() {
  const allStores = await getAllStores();
  for (let i = 0; i < allStores.length; i++) {
    const start = Date.now();
    let productArr: object[] = [];
    const pagesCount = await getPagesCount();
    for (let j = 1; j < pagesCount; j++) {
      const start = Date.now();
      const products = await getProducts(j);
      products.map((product) => productArr.push(product));
      console.log(`page ${j} fetched as ${Date.now() - start}ms`);
    }
    let records: any = [];
    productArr.map((product) =>
      records.push({
        date: new Date().toISOString(),
        network: "Градусы",
        address: allStores[i]!.storeAddress,
        category: product.name.split(" ")[0],
        sku: product.name.toString(),
        price: product.price,
      })
    );
    console.log(records);
    await csvWriter.writeRecords(records);
    console.log(`store ${i} fetched as ${Date.now() - start}ms`);
  }
}
getGradusi();
