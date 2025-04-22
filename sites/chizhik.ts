import axios from "axios";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import * as fs from "fs";
import * as path from "path";
import { chromium } from "playwright";

// без авторизации информация о всех магазинах отсуствует, используются access и refresh токены, acces токен обновляется каждые 6 минут
axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

const categories = [
  {
    id: 5,
    name: "Водка",
    image: null,
    icon: null,
    depth: 3,
    is_adults: true,
    is_inout: false,
    slug: "vodka",
    children: [],
  },
  {
    id: 153,
    name: "Коньяк",
    image: null,
    icon: null,
    depth: 3,
    is_adults: true,
    is_inout: false,
    slug: "koniak",
    children: [],
  },
  {
    id: 6,
    name: "Ликёро-водочные напитки",
    image: null,
    icon: null,
    depth: 3,
    is_adults: true,
    is_inout: false,
    slug: "likioro-vodochnye-napitki",
    children: [],
  },
];

const jsonFilePath = path.join(__dirname, "../jwt/chizhik.json");

async function updateToken(cookie: string) {
  const jsonString = fs.readFileSync(jsonFilePath, "utf-8");
  const tokens = JSON.parse(jsonString);
  console.log(tokens.refresh);
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
  console.log(await newTokens.data);
  fs.writeFileSync(
    jsonFilePath,
    JSON.stringify(await newTokens.data, null, 2),
    "utf-8"
  );
}

async function getCookie() {
  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36";
  const browser = await chromium.launch({
    headless: false,
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
  console.log(cookie);
  return cookie.cookie;
}

async function getAllStores() {
  let allShops = [];
  for (let i = 1; i < 1000; i++) {
    const options = {
      method: "GET",
      url: "https://gw-hardis.x5.ru/st/wp-json/wp/v2/shops",
      params: { page: i.toString(), per_page: "100" },
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        origin: "https://www.chizhik.club",
        priority: "u=1, i",
        referer: "https://www.chizhik.club/",
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
    try {
      const shops = await axios.request(options);
      shops.data.map((shop) => allShops.push(shop));
      console.log(i);
    } catch (error) {
      console.log(error);
      break;
    }
  }
  console.log(allShops.length);
  return allShops;
}

async function getAllCities(cookie: string) {
  let options = {
    method: "GET",
    url: "https://app.chizhik.club/api/v1/geo/cities/",
    params: { page: 1 },
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "ru-RU,ru;q=0.9",
      "cache-control": "max-age=0",
      priority: "u=0, i",
      "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
      Cookie: cookie,
    },
  };
  const allCities: any = [];
  let cities = await axios.request(options);
  cities.data.items.map((city) => allCities.push(city));
  for (let i = 2; i < cities.data.total_pages; i++) {
    options.params.page = i;
    cities = await axios.request(options);
    cities.data.items.map((city) => allCities.push(city));
  }
  console.log(allCities.length);
  return allCities;
}

export async function getChizhik() {
  const cookie = await getCookie();
  updateToken(cookie);
  // const allCities = getAllCities(cookie!)
  // for (let i = 0; i < allCities.length; i++) {

  // }
}

getChizhik();
