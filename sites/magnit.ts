import axios, { type AxiosRequestConfig } from "axios";
import { type ProgressCallback } from "..";
import ora from "ora";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import chalk from "chalk";
import { createObjectCsvWriter } from "csv-writer";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });
const API_URL = "https://magnit.ru/webgate/v1/store-search/geo";
// API не позволяет выудить все магазины разом, поэтому я решил разбить россию на 20 зон, думаю этого хватит чтобы вытащить все
const csvWriter = createObjectCsvWriter({
  path: "magnit.csv",
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
const BOUNDARIES = {
  leftTopLatitude: 81.0, // максимальная северная широта (приблизительно)
  leftTopLongitude: 180.0, // максимальная западная долгота
  rightBottomLatitude: 39.0, // максимальная южная широта
  rightBottomLongitude: 20.0, // максимальная восточная долгота
};
let startTime = Date.now();
const NUMBER_OF_SQUARES = 20; // например 10
const latitudeStep =
  (BOUNDARIES.leftTopLatitude - BOUNDARIES.rightBottomLatitude) /
  NUMBER_OF_SQUARES;
const longitudeStep =
  (BOUNDARIES.leftTopLongitude - BOUNDARIES.rightBottomLongitude) /
  NUMBER_OF_SQUARES;

const squares = [];

for (let i = 0; i < NUMBER_OF_SQUARES; i++) {
  for (let j = 0; j < NUMBER_OF_SQUARES; j++) {
    const leftTopLatitude = BOUNDARIES.leftTopLatitude - i * latitudeStep;
    const leftTopLongitude = BOUNDARIES.leftTopLongitude - j * longitudeStep;
    const rightBottomLatitude = leftTopLatitude - latitudeStep;
    const rightBottomLongitude = leftTopLongitude - longitudeStep;

    squares.push({
      leftTopLatitude,
      leftTopLongitude,
      rightBottomLatitude,
      rightBottomLongitude,
    });
  }
}

const COORDINATES = [
  {
    region: "Республика Адыгея",
    leftTopLatitude: 45.2007,
    leftTopLongitude: 38.3849,
    rightBottomLatitude: 44.6634,
    rightBottomLongitude: 39.0962,
  },
  {
    region: "Республика Алтай",
    leftTopLatitude: 52.0337,
    leftTopLongitude: 85.2781,
    rightBottomLatitude: 49.8501,
    rightBottomLongitude: 88.2082,
  },
  {
    region: "Республика Башкортостан",
    leftTopLatitude: 57.4733,
    leftTopLongitude: 54.991,
    rightBottomLatitude: 53.366,
    rightBottomLongitude: 60.7262,
  },
  {
    region: "Республика Бурятия",
    leftTopLatitude: 56.6861,
    leftTopLongitude: 101.1955,
    rightBottomLatitude: 51.642,
    rightBottomLongitude: 106.4698,
  },
  {
    region: "Республика Дагестан",
    leftTopLatitude: 47.9805,
    leftTopLongitude: 46.5861,
    rightBottomLatitude: 41.0977,
    rightBottomLongitude: 50.1654,
  },
  {
    region: "Республика Ингушетия",
    leftTopLatitude: 43.0512,
    leftTopLongitude: 44.5559,
    rightBottomLatitude: 41.7865,
    rightBottomLongitude: 45.7016,
  },
  {
    region: "Республика Кабардино-Балкария",
    leftTopLatitude: 44.5979,
    leftTopLongitude: 42.3531,
    rightBottomLatitude: 43.2541,
    rightBottomLongitude: 44.3952,
  },
  {
    region: "Республика Калмыкия",
    leftTopLatitude: 48.322,
    leftTopLongitude: 43.1244,
    rightBottomLatitude: 45.1867,
    rightBottomLongitude: 48.2592,
  },
  {
    region: "Республика Карачаево-Черкесия",
    leftTopLatitude: 44.7031,
    leftTopLongitude: 41.4308,
    rightBottomLatitude: 42.5197,
    rightBottomLongitude: 43.6703,
  },
  {
    region: "Республика Карелия",
    leftTopLatitude: 65.4485,
    leftTopLongitude: 30.1857,
    rightBottomLatitude: 60.1325,
    rightBottomLongitude: 37.1704,
  },
  {
    region: "Республика Коми",
    leftTopLatitude: 67.0572,
    leftTopLongitude: 52.3409,
    rightBottomLatitude: 60.0438,
    rightBottomLongitude: 57.8114,
  },
  {
    region: "Республика Крым",
    leftTopLatitude: 45.5463,
    leftTopLongitude: 32.0156,
    rightBottomLatitude: 44.3869,
    rightBottomLongitude: 35.7322,
  },
  {
    region: "Республика Мордовия",
    leftTopLatitude: 55.7228,
    leftTopLongitude: 42.8675,
    rightBottomLatitude: 53.873,
    rightBottomLongitude: 46.35,
  },
  {
    region: "Республика Северная Осетия – Алания",
    leftTopLatitude: 43.4555,
    leftTopLongitude: 41.7923,
    rightBottomLatitude: 41.0883,
    rightBottomLongitude: 45.3884,
  },
  {
    region: "Республика Татарстан",
    leftTopLatitude: 56.0025,
    leftTopLongitude: 48.0765,
    rightBottomLatitude: 54.4502,
    rightBottomLongitude: 56.0645,
  },
  {
    region: "Республика Тыва",
    leftTopLatitude: 52.8074,
    leftTopLongitude: 90.5568,
    rightBottomLatitude: 50.3591,
    rightBottomLongitude: 95.3258,
  },
  {
    region: "Республика Хакасия",
    leftTopLatitude: 54.7883,
    leftTopLongitude: 88.994,
    rightBottomLatitude: 50.885,
    rightBottomLongitude: 92.6795,
  },
  {
    region: "Амурская область",
    leftTopLatitude: 55.8176,
    leftTopLongitude: 136.7146,
    rightBottomLatitude: 49.3681,
    rightBottomLongitude: 140.3692,
  },
  {
    region: "Архангельская область",
    leftTopLatitude: 67.2091,
    leftTopLongitude: 35.0045,
    rightBottomLatitude: 60.0622,
    rightBottomLongitude: 45.4212,
  },
  {
    region: "Астраханская область",
    leftTopLatitude: 48.8332,
    leftTopLongitude: 44.6039,
    rightBottomLatitude: 45.7515,
    rightBottomLongitude: 48.0634,
  },
  {
    region: "Белгородская область",
    leftTopLatitude: 52.9165,
    leftTopLongitude: 36.5983,
    rightBottomLatitude: 50.8389,
    rightBottomLongitude: 39.4527,
  },
  {
    region: "Брянская область",
    leftTopLatitude: 54.1557,
    leftTopLongitude: 30.2791,
    rightBottomLatitude: 52.1005,
    rightBottomLongitude: 34.0405,
  },
  {
    region: "Владимирская область",
    leftTopLatitude: 57.0371,
    leftTopLongitude: 39.6788,
    rightBottomLatitude: 55.7064,
    rightBottomLongitude: 42.0868,
  },
  {
    region: "Волгоградская область",
    leftTopLatitude: 51.8506,
    leftTopLongitude: 45.474,
    rightBottomLatitude: 46.6338,
    rightBottomLongitude: 51.8903,
  },
  {
    region: "Вологодская область",
    leftTopLatitude: 60.4693,
    leftTopLongitude: 35.1586,
    rightBottomLatitude: 57.1898,
    rightBottomLongitude: 43.0748,
  },
  {
    region: "Воронежская область",
    leftTopLatitude: 51.8353,
    leftTopLongitude: 37.6069,
    rightBottomLatitude: 46.1798,
    rightBottomLongitude: 40.1792,
  },
  {
    region: "Забайкальский край",
    leftTopLatitude: 58.02,
    leftTopLongitude: 98.15,
    rightBottomLatitude: 50.508,
    rightBottomLongitude: 118.9283,
  },
  {
    region: "Ивановская область",
    leftTopLatitude: 58.0592,
    leftTopLongitude: 39.3382,
    rightBottomLatitude: 55.9411,
    rightBottomLongitude: 42.0267,
  },
  {
    region: "Иркутская область",
    leftTopLatitude: 64.523,
    leftTopLongitude: 97.3467,
    rightBottomLatitude: 51.7448,
    rightBottomLongitude: 106.3181,
  },
  {
    region: "Калининградская область",
    leftTopLatitude: 54.9011,
    leftTopLongitude: 19.0214,
    rightBottomLatitude: 54.4055,
    rightBottomLongitude: 22.0831,
  },
  {
    region: "Калужская область",
    leftTopLatitude: 55.4443,
    leftTopLongitude: 34.0868,
    rightBottomLatitude: 54.1863,
    rightBottomLongitude: 37.1322,
  },
  {
    region: "Камчатский край",
    leftTopLatitude: 60.9024,
    leftTopLongitude: 155.0,
    rightBottomLatitude: 50.0465,
    rightBottomLongitude: 162.7161,
  },
  {
    region: "Кемеровская область",
    leftTopLatitude: 55.6191,
    leftTopLongitude: 85.1385,
    rightBottomLatitude: 52.3624,
    rightBottomLongitude: 94.7284,
  },
  {
    region: "Кировская область",
    leftTopLatitude: 59.6151,
    leftTopLongitude: 48.1571,
    rightBottomLatitude: 56.1573,
    rightBottomLongitude: 53.4355,
  },
  {
    region: "Костромская область",
    leftTopLatitude: 58.8889,
    leftTopLongitude: 39.3178,
    rightBottomLatitude: 57.1545,
    rightBottomLongitude: 47.9635,
  },
  {
    region: "Краснодарский край",
    leftTopLatitude: 46.7124,
    leftTopLongitude: 37.9511,
    rightBottomLatitude: 41.2827,
    rightBottomLongitude: 40.5948,
  },
  {
    region: "Красноярский край",
    leftTopLatitude: 65.0,
    leftTopLongitude: 85.0,
    rightBottomLatitude: 50.0,
    rightBottomLongitude: 101.0,
  },
  {
    region: "Курганская область",
    leftTopLatitude: 57.2087,
    leftTopLongitude: 61.0587,
    rightBottomLatitude: 54.7641,
    rightBottomLongitude: 66.0435,
  },
  {
    region: "Курская область",
    leftTopLatitude: 52.943,
    leftTopLongitude: 35.6319,
    rightBottomLatitude: 46.1471,
    rightBottomLongitude: 39.6615,
  },
  {
    region: "Ленинградская область",
    leftTopLatitude: 60.5464,
    leftTopLongitude: 28.6619,
    rightBottomLatitude: 59.042,
    rightBottomLongitude: 32.0738,
  },
  {
    region: "Липецкая область",
    leftTopLatitude: 53.9711,
    leftTopLongitude: 38.7856,
    rightBottomLatitude: 51.303,
    rightBottomLongitude: 41.7948,
  },
  {
    region: "Магаданская область",
    leftTopLatitude: 64.0046,
    leftTopLongitude: 138.8358,
    rightBottomLatitude: 55.045,
    rightBottomLongitude: 142.2336,
  },
  {
    region: "Московская область",
    leftTopLatitude: 57.628,
    leftTopLongitude: 36.4182,
    rightBottomLatitude: 54.3711,
    rightBottomLongitude: 42.5326,
  },
  {
    region: "Москва",
    leftTopLatitude: 56.0056,
    leftTopLongitude: 36.6475,
    rightBottomLatitude: 55.6025,
    rightBottomLongitude: 38.9527,
  },
  {
    region: "Мурманская область",
    leftTopLatitude: 69.4148,
    leftTopLongitude: 32.8463,
    rightBottomLatitude: 59.5136,
    rightBottomLongitude: 42.3146,
  },
  {
    region: "Нижегородская область",
    leftTopLatitude: 58.2364,
    leftTopLongitude: 41.2297,
    rightBottomLatitude: 50.4274,
    rightBottomLongitude: 45.6894,
  },
  {
    region: "Новгородская область",
    leftTopLatitude: 59.8568,
    leftTopLongitude: 30.067,
    rightBottomLatitude: 57.1475,
    rightBottomLongitude: 34.7372,
  },
  {
    region: "Новосибирская область",
    leftTopLatitude: 55.9557,
    leftTopLongitude: 76.2916,
    rightBottomLatitude: 51.5603,
    rightBottomLongitude: 83.2287,
  },
  {
    region: "Омская область",
    leftTopLatitude: 55.3744,
    leftTopLongitude: 70.5217,
    rightBottomLatitude: 51.2232,
    rightBottomLongitude: 77.0358,
  },
  {
    region: "Оренбургская область",
    leftTopLatitude: 58.551,
    leftTopLongitude: 57.3853,
    rightBottomLatitude: 50.2438,
    rightBottomLongitude: 60.7782,
  },
  {
    region: "Орловская область",
    leftTopLatitude: 53.866,
    leftTopLongitude: 35.5104,
    rightBottomLatitude: 50.7605,
    rightBottomLongitude: 38.2974,
  },
  {
    region: "Пензенская область",
    leftTopLatitude: 56.7459,
    leftTopLongitude: 41.6021,
    rightBottomLatitude: 52.9988,
    rightBottomLongitude: 46.8356,
  },
  {
    region: "Пермский край",
    leftTopLatitude: 60.026,
    leftTopLongitude: 55.8137,
    rightBottomLatitude: 55.4,
    rightBottomLongitude: 60.5964,
  },
  {
    region: "Приморский край",
    leftTopLatitude: 49.5719,
    leftTopLongitude: 135.7272,
    rightBottomLatitude: 43.3132,
    rightBottomLongitude: 144.5389,
  },
  {
    region: "Псковская область",
    leftTopLatitude: 58.8316,
    leftTopLongitude: 27.3071,
    rightBottomLatitude: 56.1843,
    rightBottomLongitude: 32.4364,
  },
  {
    region: "Ростовская область",
    leftTopLatitude: 48.7829,
    leftTopLongitude: 38.1553,
    rightBottomLatitude: 43.1977,
    rightBottomLongitude: 47.4862,
  },
  {
    region: "Рязанская область",
    leftTopLatitude: 54.6743,
    leftTopLongitude: 39.2534,
    rightBottomLatitude: 51.6637,
    rightBottomLongitude: 43.3072,
  },
  {
    region: "Саратовская область",
    leftTopLatitude: 53.3861,
    leftTopLongitude: 46.375,
    rightBottomLatitude: 48.8786,
    rightBottomLongitude: 51.112,
  },
  {
    region: "Сахалинская область",
    leftTopLatitude: 57.2338,
    leftTopLongitude: 141.1422,
    rightBottomLatitude: 48.8236,
    rightBottomLongitude: 146.4144,
  },
  {
    region: "Самарская область",
    leftTopLatitude: 54.3682,
    leftTopLongitude: 48.6451,
    rightBottomLatitude: 50.3149,
    rightBottomLongitude: 52.4583,
  },
  {
    region: "Санкт-Петербург",
    leftTopLatitude: 60.0396,
    leftTopLongitude: 29.4053,
    rightBottomLatitude: 59.565,
    rightBottomLongitude: 30.3701,
  },
  {
    region: "Свердловская область",
    leftTopLatitude: 60.7439,
    leftTopLongitude: 60.6956,
    rightBottomLatitude: 49.0481,
    rightBottomLongitude: 66.1894,
  },
  {
    region: "Тамбовская область",
    leftTopLatitude: 54.445,
    leftTopLongitude: 40.0101,
    rightBottomLatitude: 50.8145,
    rightBottomLongitude: 44.1913,
  },
  {
    region: "Тверская область",
    leftTopLatitude: 58.3914,
    leftTopLongitude: 32.6586,
    rightBottomLatitude: 54.7787,
    rightBottomLongitude: 37.4836,
  },
  {
    region: "Тульская область",
    leftTopLatitude: 54.8088,
    leftTopLongitude: 36.0736,
    rightBottomLatitude: 51.1353,
    rightBottomLongitude: 39.0704,
  },
  {
    region: "Тюменская область",
    leftTopLatitude: 65.327,
    leftTopLongitude: 67.487,
    rightBottomLatitude: 54.0235,
    rightBottomLongitude: 79.629,
  },
  {
    region: "Удмуртская Республика",
    leftTopLatitude: 59.2314,
    leftTopLongitude: 51.2185,
    rightBottomLatitude: 56.5321,
    rightBottomLongitude: 57.9125,
  },
  {
    region: "Ульяновская область",
    leftTopLatitude: 58.2914,
    leftTopLongitude: 47.6423,
    rightBottomLatitude: 53.2821,
    rightBottomLongitude: 53.0857,
  },
  {
    region: "Челябинская область",
    leftTopLatitude: 57.4305,
    leftTopLongitude: 60.2287,
    rightBottomLatitude: 51.2875,
    rightBottomLongitude: 64.9408,
  },
  {
    region: "Чеченская Республика",
    leftTopLatitude: 45.82,
    leftTopLongitude: 42.421,
    rightBottomLatitude: 41.8933,
    rightBottomLongitude: 46.4898,
  },
  {
    region: "Чувашская Республика",
    leftTopLatitude: 57.4474,
    leftTopLongitude: 46.6301,
    rightBottomLatitude: 54.8948,
    rightBottomLongitude: 48.7383,
  },
  {
    region: "Ярославская область",
    leftTopLatitude: 58.6223,
    leftTopLongitude: 38.0569,
    rightBottomLatitude: 54.9936,
    rightBottomLongitude: 41.6073,
  },
];

const categories = [
  //   { code: 47161, name: "Алкашка впринципе" },
  //   { code: 41181, name: "Крепкая алкашка" },
  { code: 41193, name: "Водка" },
  { code: 41195, name: "Бренди" },
  { code: 41197, name: "Настойки" },
  { code: 41199, name: "Вискарь, Бурбон" },
  { code: 41201, name: "Джин" },
  { code: 41203, name: "Ликер" },
  { code: 47261, name: "Коньяк" },
  { code: 47263, name: "Ром" },
  { code: 47265, name: "Текила" },
  { code: 47267, name: "Бальзам" },
  { code: 41211, name: "Медовуха" },
  { code: 47271, name: "Сидр" },
];

interface GeoBoundingBox {
  leftTopLatitude: number;
  leftTopLongitude: number;
  rightBottomLatitude: number;
  rightBottomLongitude: number;
}

function generateZones(
  n: number,
  latMin: number,
  latMax: number,
  lonMin: number,
  lonMax: number
): GeoBoundingBox[] {
  const zones: GeoBoundingBox[] = [];

  // Вычисляем размер зоны
  const zoneHeight = (latMax - latMin) / Math.sqrt(n);
  const zoneWidth = (lonMax - lonMin) / Math.sqrt(n);

  for (let i = 0; i < Math.sqrt(n); i++) {
    for (let j = 0; j < Math.sqrt(n); j++) {
      const zone: GeoBoundingBox = {
        leftTopLatitude: latMax - i * zoneHeight,
        leftTopLongitude: lonMin + j * zoneWidth,
        rightBottomLatitude: latMax - (i + 1) * zoneHeight,
        rightBottomLongitude: lonMin + (j + 1) * zoneWidth,
      };
      zones.push(zone);
    }
  }

  return zones;
}

// Пример использования
const latMin = 41.174; // Южная граница России
const latMax = 81.85; // Северная граница России
const lonMin = 19.644; // Западная граница России
const lonMax = 190.0; // Восточная граница России
const totalZones = 1000; // Количество зон

const zones = generateZones(totalZones, latMin, latMax, lonMin, lonMax);

async function fetchStores(coordinates) {
  const response = await axios.post(
    API_URL,
    {
      aggs: false,
      geoBoundingBox: {
        leftTopLatitude: coordinates.leftTopLatitude,
        leftTopLongitude: coordinates.leftTopLongitude,
        rightBottomLatitude: coordinates.rightBottomLatitude,
        rightBottomLongitude: coordinates.rightBottomLongitude,
      },
      limit: 5000,
      storeTypes: [1, 2, 6, 5],
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.stores || [];
}

export async function getAllStores() {
  const allStores = [];
  const spinner = ora(chalk.blue("Fetching regions Magnit...")).start();
  for (const coords of COORDINATES) {
    try {
      const stores = await fetchStores(coords);
      stores.forEach((store) => {
        allStores.push({
          code: store.code,
          address: store.address,
        });
      });
    } catch (error) {
      console.error(
        `Ошибка при получении магазинов для координат (${coords.leftTopLatitude}, ${coords.leftTopLongitude}): ${error.message}`
      );
    }
  }

  // Удаляем дубликаты
  const uniqueStores = Array.from(
    new Map(allStores.map((store) => [store.code, store])).values()
  );
  spinner.succeed(chalk.green("Regions fetched successfully!"));

  console.log("Found " + uniqueStores.length + " unique stores");
  return uniqueStores;
}

// getMagnit();

export async function getMagnit(pc: ProgressCallback, batchSize: number = 1) {
  const stores = await getAllStores();
  console.log(Date.now() - startTime);

  // const progressBar = new MultiBar({
  //   format: `Progress Magnit: | {bar} | {percentage}% | Processing store: {value}/{total}`,
  //   hideCursor: true,
  //   barCompleteChar: "\u2588",
  //   barIncompleteChar: "\u2591",
  // });

  const storesCount = stores.length; // stores.length;

  // const storeBar = progressBar.create(storesCount, 0);
  pc({ task: storesCount });

  for (let i = 0; i < Math.ceil(storesCount / batchSize); i++) {
    const batchStart = Date.now();
    await Promise.all(
      new Array(batchSize).fill(1).map(async (_, v) => {
        const store = stores[batchSize * i + v];

        let allRecords: any[] = [];

        let categoryPromises: Promise<void>[] = [];

        for (let t = 0; t < categories.length; t++) {
          categoryPromises.push(
            (async () => {
              let totalCountProducts = 0;
              let offset = 0;

              let optionsFromProducts = {
                method: "POST",
                url: "https://magnit.ru/webgate/v2/goods/search",
                headers: {
                  "content-type": "application/json",
                },
                data: {
                  sort: { order: "desc", type: "popularity" },
                  pagination: { limit: 50, offset: offset },
                  categories: [categories[t]!.code],
                  includeAdultGoods: true,
                  storeCode: `${store.code}`,
                  storeType: "1",
                  catalogType: "1",
                },
              } satisfies AxiosRequestConfig;

              const response = await axios
                .request(optionsFromProducts)
                .catch(() => {});
              totalCountProducts = response.data.pagination.totalCount | 1;

              const totalCountPages = Math.ceil(totalCountProducts / 50);
              const fetchPromises = [];

              for (let j = 0; j < totalCountPages; j++) {
                optionsFromProducts.data.pagination.offset = j * 50;
                fetchPromises.push(
                  axios
                    .request(optionsFromProducts)
                    .then((response) => {
                      const products = response.data.items;

                      return products.map((product) => ({
                        date: new Date().toISOString(),
                        network: "Магнит",
                        address: store.address,
                        category: categories[t]!.name,
                        sku: product.name,
                        price: Math.floor(product.price),
                      }));
                    })
                    .catch((error) => {
                      console.log("tum tum tum tum tum tum tum sahur", error);
                    })
                );
              }

              const recordsArray = await Promise.all(fetchPromises);
              allRecords.push(...recordsArray.flat().filter((v) => !!v));
            })()
          );
        }

        await Promise.all(categoryPromises);

        await csvWriter.writeRecords(allRecords);
        // storeBar.update(i + 1);
        pc({ done: i + 1 });
      })
    );
    console.log(
      `a batch of ${batchSize} is fetched in ${Date.now() - batchStart}ms`
    );
  }

  // storeBar.stop();
}

// Последовательный долгий парсинг
// async function getMagnit() {
//   const stores = await getAllStores();

//   for (let i = 0; i < stores.length; i++) {
//     const store = stores[i];
//     console.log(
//       `Processing store ${i + 1} of ${stores.length}: ${store.address}`
//     );

//     let allRecords = [];

//     for (let t = 0; t < categories.length; t++) {
//       let offset = 0;

//       let optionsFromProducts = {
//         method: "POST",
//         url: "https://magnit.ru/webgate/v2/goods/search",
//         headers: { "content-type": "application/json" },
//         data: {
//           sort: { order: "desc", type: "popularity" },
//           pagination: { limit: 50, offset: offset },
//           categories: [categories[t].code],
//           includeAdultGoods: true,
//           storeCode: `${store.code}`,
//           storeType: "1",
//           catalogType: "1",
//         },
//       };

//       const totalCountProducts = (await axios.request(optionsFromProducts)).data
//         .pagination.totalCount;
//       console.log(
//         `Total products found: ${totalCountProducts} for category ${categories[t].name}`
//       );
//       const totalCountPages = Math.ceil(totalCountProducts / 50);

//       for (let j = 0; j < totalCountPages; j++) {
//         const products = (await axios.request(optionsFromProducts)).data.items;

//         // Заполняем массив записей о продуктах
//         const records = products.map((product) => ({
//           date: new Date().toISOString(),
//           network: "Магнит",
//           address: store.address,
//           category: categories[t].name,
//           sku: product.name,
//           price: Math.floor(product.price), // Удаляем копейки
//         }));

//         allRecords.push(...records);
//         console.log(
//           `Fetched ${records.length} records for category ${categories[t].name}`
//         );

//         offset += 50;
//         optionsFromProducts.data.pagination.offset = offset;
//       }
//     }

//     await csvWriter.writeRecords(allRecords);
//     console.log(
//       `All records written to ${store.code}_products.csv for store ${store.address}.`
//     );
//   }
// }
