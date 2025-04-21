import axios from "axios";
import { resolve } from "bun";
import chalk from "chalk";
import { createObjectCsvWriter } from "csv-writer";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

const csvWriter = createObjectCsvWriter({
  path: "diksi.csv",
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
  const url = "https://dixy.ru/ajax/ajax.php";
  const form = new FormData();
  form.append("action", "getSelfPoints");
  const options = {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Accept-Language": "ru-RU,ru;q=0.9",
      Connection: "keep-alive",
      Origin: "https://dixy.ru",
      Referer: "https://dixy.ru/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    },
  };
  options.body = form;
  const response = await fetch(url, options);
  const data = await response.json();
  return data.flatMap((shop) => ({
    id: shop.id,
    coords: shop.geometry.coordinates.join(","),
    address: shop.properties.balloonContentBody,
  }));
}

async function getProducts(shopInfo: string) {
  const url =
    "https://dixy.ru/ajax/listing-json.php?block=product-list&sid=731&perPage=10000&page=1&searchQuery=&gl_filter=";
  const form = new FormData();
  form.append(
    "filterData",
    '[{"facet_id":"493","value":"ром","type":"string","id":"10"},{"facet_id":"3241","value":"водка","type":"string","id":"10"},{"facet_id":"3260","value":"виски","type":"string","id":"10"},{"facet_id":"3347","value":"спиртной напиток","type":"string","id":"10"},{"facet_id":"3362","value":"джин","type":"string","id":"10"},{"facet_id":"3370","value":"ликер","type":"string","id":"10"},{"facet_id":"3404","value":"коньяк","type":"string","id":"10"},{"facet_id":"3421","value":"бальзам","type":"string","id":"10"},{"facet_id":"3428","value":"настойка","type":"string","id":"10"},{"facet_id":"3729","value":"бренди","type":"string","id":"10"},{"facet_id":"4139","value":"сидр","type":"string","id":"10"},{"facet_id":"6097","value":"аперитив","type":"string","id":"10"}]'
  );

  const options = {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      Connection: "keep-alive",
      Origin: "https://dixy.ru",
      Referer: "https://dixy.ru/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      Cookie: `store_info=${shopInfo}`,
    },
  };

  options.body = form;
  const products = await fetch(url, options).then((response) =>
    response.json()
  );
  if (products[0].pagenData.element_count == 0) return null;
  console.log(products[0].cards.length, products[0].pagenData.element_count);
  return products[0].cards.flatMap((product) => ({
    title: product.title,
    category: product.section,
    price: product.priceSimple,
  }));
}

async function setStore(storeId: number, coords: string, address: string) {
  const url = "https://dixy.ru/ajax/ajax.php";
  const form = new FormData();
  form.append("action", "saveStore");
  form.append("isDelivery", "false");
  form.append("store_id", storeId.toString());
  form.append("coords", coords); // 55.751442,37.615569
  form.append("address", address); // улица Покровка, 17с1

  const options = {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Accept-Language": "ru-RU,ru;q=0.9",
      Connection: "keep-alive",
      Origin: "https://dixy.ru",
      Referer: "https://dixy.ru/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    },
  };

  options.body = form;
  const response = await fetch(url, options);
  const data = await response.json();
  const shopInfo = JSON.parse(
    Buffer.from(data.store_info, "base64").toString("utf-8")
  );
  return { shopInfo, data };
}

export async function getDiksi() {
  const allStores = await getAllStores();
  for (let i = 0; i < allStores.length; i++) {
    try {
      const start = Date.now();
      const store = await setStore(
        allStores[i].id,
        allStores[i].coords,
        allStores[i].address
      );
      const products = await getProducts(store.data.store_info);
      if (products == null) continue;
      const records = products.map((product) => ({
        date: new Date().toISOString(),
        network: "Дикси",
        address: store.shopInfo.store_address,
        category: product.category,
        sku: product.title,
        price: product.price,
      }));
      await csvWriter.writeRecords(records);
      console.log(i, `shop fetched is ${Date.now() - start}`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.log(chalk.redBright(error));
      await new Promise(resolve => setTimeout(resolve, 120000));
      continue;
    }
  }
}

getDiksi();
