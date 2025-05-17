import axios from "axios";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { createObjectCsvWriter } from "csv-writer";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import { chromium } from "playwright-extra";
import { ProgressCallback } from "..";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

const csvWriter = createObjectCsvWriter({
  path: "vin-lab.csv",
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

const baseUrl = "https://www.winelab.ru";
type Categories = {
  category: string;
  url: string;
};
const categories: Categories[] = [
  {
    category: "Абсент",
    url: "/catalog/krepkiy-alkogol-absent",
  },
  {
    category: "Виски",
    url: "/catalog/krepkiy-alkogol-viski",
  },
  {
    category: "Водка",
    url: "/catalog/krepkiy-alkogol-vodka",
  },
  {
    category: "Коньяк и Бренди",
    url: "/catalog/krepkiy-alkogol-konyak-i-brendi",
  },
  {
    category: "Джин",
    url: "/catalog/krepkiy-alkogol-dzhin",
  },
  {
    category: "Ром",
    url: "/catalog/krepkiy-alkogol-rom",
  },
  {
    category: "Текила",
    url: "/catalog/krepkiy-alkogol-likery",
  },
  {
    category: "Бальзамы",
    url: "/catalog/krepkiy-alkogol-balzamy",
  },
  {
    category: "Настойки",
    url: "/catalog/krepkiy-alkogol-nastoyki",
  },
];

function updateCookie(
  cookieStr: string,
  newRegion: string,
  newPOS: string
): string {
  // Разделяем куки на отдельные пары "ключ=значение"
  const cookieParts = cookieStr.split("; ").map((part) => part.trim());

  // Обновляем нужные значения
  const updatedCookies = cookieParts.map((part) => {
    if (part.startsWith("currentRegion=")) {
      return `currentRegion=${newRegion}`;
    } else if (part.startsWith("currentPOS=")) {
      return `currentPOS=${newPOS}`;
    }
    return part;
  });

  // Собираем обратно в строку
  return updatedCookies.join("; ");
}

async function getCookie() {
  chromium.use(StealthPlugin());
  const browser = await chromium.launch({
    headless: true,
    // args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = await browser.newPage();
  let cookie;
  page.on("request", async (request) => {
    if (
      request.url() ==
      "https://www.winelab.ru/catalog/krepkiy-alkogol/results?page=1"
    )
      cookie = await request.allHeaders();
  });
  console.log("Start chromium witch the stealth plugin..");
  await page.goto(
    "https://www.winelab.ru/catalog/krepkiy-alkogol/results?page=1"
  );
  await page.waitForTimeout(5000);
  await page.reload();
  await page.waitForTimeout(5000);
  console.log("All done✨", `cookie: ${cookie.cookie}`);
  await browser.close();
  return cookie.cookie;
}

// getCookie();

async function getAllStores() {
  let options = {
    method: "GET",
    url: "https://www.winelab.ru/store-finder/getAllRegionsAndCities",
    headers: {
      accept: "*/*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      priority: "u=1, i",
      referer:
        "https://www.winelab.ru/store-map?q=%3A%3AaddressRegionIsoCode%3ARU-MOW",
      "sec-ch-ua":
        '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      traceparent: "00-f0f96503c3515645298fce00ce7672d3-b380b2d1bf7439d9-01",
      tracestate:
        "1000000@nr=0-1-1000000-3324113-b380b2d1bf7439d9----1746356161580",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
      "x-requested-with": "XMLHttpRequest",
    },
  };
  let response = await axios.request(options);
  const allRegions = response.data.regions;

  interface RegionObject {
    [key: string]: string;
  }

  interface TransformedRegion {
    code: string;
    region: string;
  }

  const transformedRegions: TransformedRegion[] = allRegions.map(
    (regionObject) => {
      const code = Object.keys(regionObject)[0];
      const region = regionObject[code!];
      return { code, region };
    }
  );

  let allStores: object[] = [];

  for (let i = 0; i < transformedRegions.length; i++) {
    const start = Date.now();
    const options = {
      method: "GET",
      url: "https://www.winelab.ru/store-map/results",
      params: { q: `::addressRegionIsoCode:${transformedRegions[i]?.code}` },
      headers: {
        accept: "*/*",
        "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        priority: "u=1, i",
        referer:
          "https://www.winelab.ru/store-map?q=%3A%3AaddressRegionIsoCode%3ARU-MOW",
        "sec-ch-ua":
          '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        traceparent: "00-f6a5ec15dfbc6234aed77d128a6059eb-a9df906a7282d59a-01",
        tracestate:
          "1000000@nr=0-1-1000000-3324113-a9df906a7282d59a----1746356787695",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "x-requested-with": "XMLHttpRequest",
      },
    };
    const response = await axios.request(options);
    const storesInRegion = response.data.results;
    storesInRegion.map((item) =>
      allStores.push({
        regionName: transformedRegions[i]?.region,
        regionCode: transformedRegions[i]?.code,
        storeCode: item.name,
        storeAddress: item.address.formattedAddress,
      })
    );
    console.log(
      `${transformedRegions[i]?.region} fetched as ${
        Date.now() - start
      }ms, stores: ${storesInRegion.length}`
    );
  }
  console.log(allStores.length);
  return allStores;
}

// getAllStores();

async function getProducts(cookie: string, category: number, page: number) {
  console.log(baseUrl + categories[category]?.url);
  const options = {
    method: "GET",
    url: baseUrl + categories[category]?.url + "/results",
    params: { page: page.toString() },
    headers: {
      accept: "*/*",
      "accept-language": "ru-RU,ru;q=0.9",
      priority: "u=1, i",
      referer: "https://www.winelab.ru/catalog/krepkiy-alkogol?page=1",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", ";Not A Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      traceparent: "00-231900e22ad7d40194c2ef6ee1f41d8d-1482b4c1ca5c1ec2-01",
      tracestate:
        "1000000@nr=0-1-1000000-3324113-1482b4c1ca5c1ec2----1746377045628",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      "x-requested-with": "XMLHttpRequest",
      Cookie: cookie,
    },
  };
  const response = await axios.request(options);
  // console.log(response.status);
  const products = response.data.results;
  // console.log(products);
  return {
    products: products,
    pages: response.data.pagination.numberOfPages,
  };
}

export async function getVinlab(pc: ProgressCallback) {
  let cookie = await getCookie(); // Первоначальное получение куки
  const allStores = await getAllStores();
  pc({ task: allStores.length });
  for (let i = 0; i < allStores.length; i++) {
    let retryCount = 0;
    const maxRetries = 3; // Максимальное количество попыток

    while (retryCount < maxRetries) {
      try {
        const setStoreParamsInCookies = updateCookie(
          cookie,
          allStores[i]!.regionCode,
          allStores[i]!.storeCode
        );

        const start = Date.now();
        let productsArr: any = [];

        await Promise.all(
          categories.map(async (category) => {
            const index = categories.findIndex(
              (item) => item.category === category.category
            );

            // Запрос продуктов с проверкой на устаревание куки
            const pages = await getProductsWithCookieRetry(
              setStoreParamsInCookies,
              index,
              1
            );

            console.log(
              `Detected ${pages.pages} pages in ${categories[index]?.category} category`
            );

            for (let j = 1; j < pages.pages; j++) {
              const products = await getProductsWithCookieRetry(
                setStoreParamsInCookies,
                index,
                j
              );

              products.products.forEach((product) => {
                productsArr.push({
                  date: new Date().toISOString(),
                  network: "Винлаб",
                  address: allStores[i]!.storeAddress,
                  category: category.category,
                  sku: product.name,
                  price: product.price
                    ? product.price.value
                    : "Цена отсутствует",
                });
              });
            }
          })
        );

        await csvWriter.writeRecords(productsArr);
        console.log(`${i} shop fetched in ${Date.now() - start}ms`);
        pc({ done: i + 1 });
        break; // Успешно завершили итерацию, выходим из retry-цикла
      } catch (error) {
        retryCount++;
        console.error(
          `Error in shop ${i}, attempt ${retryCount}:`,
          error.message
        );

        if (retryCount >= maxRetries) {
          console.error(`Max retries reached for shop ${i}, skipping...`);
          break;
        }

        // Обновляем куки и повторяем попытку
        cookie = await getCookie();
        console.log("Cookie refreshed, retrying...");
      }
    }
  }
}

async function getProductsWithCookieRetry(
  cookie: string,
  categoryIndex: number,
  page: number
) {
  try {
    return await getProducts(cookie, categoryIndex, page);
  } catch (error) {
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.log("Cookie expired, refreshing...");
      throw error; // Перебрасываем ошибку для обработки в основном цикле
    }
    throw error;
  }
}
