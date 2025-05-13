import axios from "axios";
import * as cheerio from "cheerio";
import { createObjectCsvWriter } from "csv-writer";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import { product } from "puppeteer";

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

const baseUrl = "https://amwine.ru/catalog/krepkie_napitki/";
type Category = {
  name: string;
  url: string;
};
const categories: Category[] = [
  {
    name: "Чача",
    url: "chacha/",
  },
  {
    name: "Арманьяк",
    url: "armanyak/",
  },
  {
    name: "Бальзамы и настойки",
    url: "balzamy_i_nastoyki/",
  },
  {
    name: "Бренди",
    url: "brendi/",
  },
  {
    name: "Вермуты и апперетивы",
    url: "vermut_i_apperitivy/",
  },
  {
    name: "Виски",
    url: "viski/",
  },
  {
    name: "Водка",
    url: "vodka/",
  },
  {
    name: "Самогон",
    url: "samogon/",
  },
  {
    name: "Джин",
    url: "dzhin/",
  },
  {
    name: "Кальвадос",
    url: "kalvados/",
  },
  {
    name: "Коньяк",
    url: "konyak/",
  },
  {
    name: "Ликер",
    url: "liker/",
  },
  {
    name: "Ром",
    url: "rom/",
  },
  { name: "Текила Мексики", url: "tekila_i_meskal/" },
];

async function getAllStores() {
  const options = {
    method: "GET",
    url: "https://amwine.ru/local/templates/am/ajax/cities-list.php",
  };
  const response = await axios.request(options);
  const page = cheerio.load(response.data);

  const storeNames = page(".select-city-popup .select-city-popup__list-item")
    .map((index, element) => {
      return {
        cityName: page(element).text().trim().replace(/\s+/g, " "),
        cityId: page(element).attr("data-city-id"),
        regionId: page(element).attr("data-region-id"),
      };
    })
    .get();

  console.log(storeNames);
  return storeNames;
}

async function setStore(cityId: number, regionId: number) {
  const encodedParams = new URLSearchParams();
  encodedParams.set("regionID", "182684");
  encodedParams.set("cityID", "670");

  const options = {
    method: "POST",
    url: "https://amwine.ru/local/templates/am/ajax/set.location.php",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Accept: "*/*",
      "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      "Bx-ajax": "true",
      Connection: "keep-alive",
      Origin: "https://amwine.ru",
      Referer:
        "https://amwine.ru/catalog/krepkie_napitki/tekila_i_meskal/?page=4",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    },
    data: encodedParams,
  };
  const response = await axios.request(options);
  console.log(response.data.success);
}

setStore(1, 1);

async function getProducts(page: number, category: string) {
  const encodedParams = new URLSearchParams();
  encodedParams.set("json", "y");
  encodedParams.set("params[IBLOCK_TYPE]", "catalog");
  encodedParams.set("params[IBLOCK_ID]", "2");
  encodedParams.set("params[CACHE_TYPE]", "A");
  encodedParams.set("params[CACHE_TIME]", "3600");
  encodedParams.set("params[SECTION_ID]", "36");
  encodedParams.set("params[SECTION_CODE]", category.replace("/", ""));
  encodedParams.set("params[PRICE_CODE]", "CFO");
  encodedParams.set("params[PAGE_ELEMENT_COUNT]", "20");
  encodedParams.set("params[FILTER_NAME]", "arrFilterCatalog");
  encodedParams.set("params[SORT_ORDER]", "ASC");
  encodedParams.set("params[SORT_FIELD]", "SORT");
  encodedParams.set("params[MESSAGE_404]", "");
  encodedParams.set("params[SET_STATUS_404]", "");
  encodedParams.set("params[SHOW_404]", "Y");
  encodedParams.set("params[FILE_404]", "");
  encodedParams.set("params[NO_INDEX_NO_FOLLOW]", "N");
  encodedParams.set("params[CURRENT_PAGE]", "1");
  encodedParams.set("params[~IBLOCK_TYPE]", "catalog");
  encodedParams.set("params[~IBLOCK_ID]", "2");
  encodedParams.set("params[~CACHE_TYPE]", "A");
  encodedParams.set("params[~CACHE_TIME]", "3600");
  encodedParams.set("params[~SECTION_ID]", "36");
  encodedParams.set("params[~SECTION_CODE]", category.replace("/", ""));
  encodedParams.set("params[~PRICE_CODE]", "CFO");
  encodedParams.set("params[~PAGE_ELEMENT_COUNT]", "20");
  encodedParams.set("params[~FILTER_NAME]", "arrFilterCatalog");
  encodedParams.set("params[~SORT_ORDER]", "ASC");
  encodedParams.set("params[~SORT_FIELD]", "SORT");
  encodedParams.set("params[~MESSAGE_404]", "");
  encodedParams.set("params[~SET_STATUS_404]", "");
  encodedParams.set("params[~SHOW_404]", "Y");
  encodedParams.set("params[~FILE_404]", "");
  encodedParams.set("params[~NO_INDEX_NO_FOLLOW]", "N");
  encodedParams.set("params[~CURRENT_PAGE]", "1");
  encodedParams.set("current_filter[ACTIVE]", "Y");
  encodedParams.set("current_filter[IBLOCK_ID]", "2");
  encodedParams.set("current_filter[INCLUDE_SUBSECTIONS]", "Y");
  encodedParams.set("current_filter[", "SECTION_ID]");
  encodedParams.set("36", "");
  encodedParams.set("PAGEN_1", page.toString());
  encodedParams.set("page", page.toString());
  encodedParams.set("sort", "sort");
  encodedParams.set("alcoValues[35][id]", "35");
  encodedParams.set("alcoValues[35][code]", "35");
  encodedParams.set("alcoValues[35][value]", "35");
  encodedParams.set("alcoValues[38][id]", "38");
  encodedParams.set("alcoValues[38][code]", "38");
  encodedParams.set("alcoValues[38][value]", "38");
  encodedParams.set("alcoValues[39][id]", "39");
  encodedParams.set("alcoValues[39][code]", "39");
  encodedParams.set("alcoValues[39][value]", "39");
  encodedParams.set("alcoValues[40][id]", "40");
  encodedParams.set("alcoValues[40][code]", "40");
  encodedParams.set("alcoValues[40][value]", "40");
  encodedParams.set("fullUrl", `/catalog/krepkie_napitki/${category}`);
  const options = {
    method: "POST",
    url: "https://amwine.ru/local/components/adinadin/catalog.section.json/ajax_call.php",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      Connection: "keep-alive",
      Origin: "https://amwine.ru",
      Referer: `https://amwine.ru/catalog/krepkie_napitki/${category}?page=${page.toString()}`,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    },
    data: encodedParams,
  };
  const response = await axios.request(options);
  return {
    products: response.data.products,
    countPages: Math.ceil(response.data.productsTotalCount / 20),
  };
}

export async function getAromatniyMir() {
  const allStores = await getAllStores();
  for (let i = 1; i < allStores.length; i++) {
    await setStore(allStores[i].cityId, allStores[i].regionId);
    for (let j = 0; j < categories.length; j++) {
      let productsArr: any = [];
      const pagesCount = await getProducts(1, categories[j]?.url!);
      for (let p = 0; p < pagesCount.countPages; p++) {
        const products = await getProducts(p, categories[j]?.url!);
        products.products.map((product) => productsArr.push(product));
        console.log(`${p} page fetched`);
      }
      const records = productsArr.map((product) => ({
        date: new Date().toISOString(),
        network: "Ароматный мир",
        address: allStores[i].cityName,
        category: categories[j]?.name,
        sku: product.name.toString(),
        price: product.price,
      }));
      await csvWriter.writeRecords(records);
    }
  }
}
getAromatniyMir();
