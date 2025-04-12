import axios, { type AxiosRequestConfig } from "axios";
import { MultiBar } from "cli-progress";
import path from "path";
import { csvWriter, playerSound, type ProgressCallback } from "..";
const API_URL = "https://magnit.ru/webgate/v1/store-search/geo";
// API не позволяет выудить все магазины разом, поэтому я решил разбить россию на 20 зон, думаю этого хватит чтобы вытащить все
const COORDINATES = [
  {
    leftTopLatitude: 82.0,
    leftTopLongitude: 30.0,
    rightBottomLatitude: 70.0,
    rightBottomLongitude: 50.0,
  }, // 1-й квадрат
  {
    leftTopLatitude: 70.0,
    leftTopLongitude: 30.0,
    rightBottomLatitude: 60.0,
    rightBottomLongitude: 50.0,
  }, // 2-й квадрат
  {
    leftTopLatitude: 70.0,
    leftTopLongitude: 50.0,
    rightBottomLatitude: 60.0,
    rightBottomLongitude: 70.0,
  }, // 3-й квадрат
  {
    leftTopLatitude: 60.0,
    leftTopLongitude: 30.0,
    rightBottomLatitude: 50.0,
    rightBottomLongitude: 50.0,
  }, // 4-й квадрат
  {
    leftTopLatitude: 60.0,
    leftTopLongitude: 50.0,
    rightBottomLatitude: 50.0,
    rightBottomLongitude: 70.0,
  }, // 5-й квадрат
  {
    leftTopLatitude: 50.0,
    leftTopLongitude: 30.0,
    rightBottomLatitude: 40.0,
    rightBottomLongitude: 50.0,
  }, // 6-й квадрат
  {
    leftTopLatitude: 50.0,
    leftTopLongitude: 50.0,
    rightBottomLatitude: 40.0,
    rightBottomLongitude: 70.0,
  }, // 7-й квадрат
  {
    leftTopLatitude: 40.0,
    leftTopLongitude: 30.0,
    rightBottomLatitude: 30.0,
    rightBottomLongitude: 50.0,
  }, // 8-й квадрат
  {
    leftTopLatitude: 40.0,
    leftTopLongitude: 50.0,
    rightBottomLatitude: 30.0,
    rightBottomLongitude: 70.0,
  }, // 9-й квадрат
  {
    leftTopLatitude: 30.0,
    leftTopLongitude: 30.0,
    rightBottomLatitude: 20.0,
    rightBottomLongitude: 50.0,
  }, // 10-й квадрат
  {
    leftTopLatitude: 30.0,
    leftTopLongitude: 50.0,
    rightBottomLatitude: 20.0,
    rightBottomLongitude: 70.0,
  }, // 11-й квадрат
  {
    leftTopLatitude: 20.0,
    leftTopLongitude: 30.0,
    rightBottomLatitude: 10.0,
    rightBottomLongitude: 50.0,
  }, // 12-й квадрат
  {
    leftTopLatitude: 20.0,
    leftTopLongitude: 50.0,
    rightBottomLatitude: 10.0,
    rightBottomLongitude: 70.0,
  }, // 13-й квадрат
  {
    leftTopLatitude: 10.0,
    leftTopLongitude: 30.0,
    rightBottomLatitude: 1.0,
    rightBottomLongitude: 50.0,
  }, // 14-й квадрат
  {
    leftTopLatitude: 10.0,
    leftTopLongitude: 50.0,
    rightBottomLatitude: 1.0,
    rightBottomLongitude: 70.0,
  }, // 15-й квадрат
  {
    leftTopLatitude: 1.0,
    leftTopLongitude: 30.0,
    rightBottomLatitude: -10.0,
    rightBottomLongitude: 50.0,
  }, // 16-й квадрат
  {
    leftTopLatitude: 1.0,
    leftTopLongitude: 50.0,
    rightBottomLatitude: -10.0,
    rightBottomLongitude: 70.0,
  }, // 17-й квадрат
  {
    leftTopLatitude: -10.0,
    leftTopLongitude: 30.0,
    rightBottomLatitude: -20.0,
    rightBottomLongitude: 50.0,
  }, // 18-й квадрат
  {
    leftTopLatitude: -10.0,
    leftTopLongitude: 50.0,
    rightBottomLatitude: -20.0,
    rightBottomLongitude: 70.0,
  }, // 19-й квадрат
  {
    leftTopLatitude: -20.0,
    leftTopLongitude: 30.0,
    rightBottomLatitude: -30.0,
    rightBottomLongitude: 50.0,
  }, // 20-й квадрат
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
        `Ошибка при получении магазинов для координат (${coords.leftTopLatitude}, ${coords.leftTopLongitude}): `
        // error
      );
    }
  }
  console.log("Found " + allStores.length + " magazines");
  return allStores;
}

// getMagnit();

export async function getMagnit(pc: ProgressCallback, batchSize: number = 1) {
  const stores = await getAllStores();

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

              const response = await axios.request(optionsFromProducts);
              totalCountProducts = response.data.pagination.totalCount;

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
                    .catch(() => {
                      console.log("tum tum tum tum tum tum tum sahur");
                      playerSound.play(path.join(__dirname, "audio/sahur.mp3"));
                    })
                );
              }

              const recordsArray = await Promise.all(fetchPromises);
              allRecords.push(...recordsArray.flat());
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
