import axios from "axios";
import { createObjectCsvWriter } from "csv-writer";

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

const csvWriter = createObjectCsvWriter({
  path: "products.csv",
  header: [
    { id: "date", title: "Дата" },
    { id: "network", title: "Сеть" },
    { id: "address", title: "Адрес" },
    { id: "category", title: "Категория" },
    { id: "sku", title: "SKU" },
    { id: "price", title: "Цена" },
  ],
});

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
  let zone = 0;

  for (const coords of COORDINATES) {
    try {
      const stores = await fetchStores(coords);
      stores.forEach((store) => {
        allStores.push({
          code: store.code,
          address: store.address,
        });
      });
      zone += 1;
    } catch (error) {
      console.error(
        `Ошибка при получении магазинов для координат (${coords.leftTopLatitude}, ${coords.leftTopLongitude}): `,
        error
      );
    }
  }
  console.log("Found " + allStores.length + " magazines");
  return allStores;
}

getMagnit();

async function getMagnit() {
  const stores = await getAllStores();

  for (let i = 0; i < stores.length; i++) {
    const store = stores[i];
    console.log(
      `Processing store ${i + 1} of ${stores.length}: ${store.address}`
    );

    let allRecords = [];

    for (let t = 0; t < categories.length; t++) {
      let totalCountProducts = 0;
      let offset = 0;

      // Получение общего количества продуктов
      let optionsFromProducts = {
        method: "POST",
        url: "https://magnit.ru/webgate/v2/goods/search",
        headers: { "content-type": "application/json" },
        data: {
          sort: { order: "desc", type: "popularity" },
          pagination: { limit: 50, offset: offset },
          categories: [categories[t].code],
          includeAdultGoods: true,
          storeCode: `${store.code}`,
          storeType: "1",
          catalogType: "1",
        },
      };

      const response = await axios.request(optionsFromProducts);
      totalCountProducts = response.data.pagination.totalCount;
      console.log(
        `Total products found: ${totalCountProducts} for category ${categories[t].name}`
      );

      const totalCountPages = Math.ceil(totalCountProducts / 50);
      // Массив для хранения промисов
      const fetchPromises = [];

      for (let j = 0; j < totalCountPages; j++) {
        // Обновляем смещение для следующего запроса
        optionsFromProducts.data.pagination.offset = j * 50;

        // Создаем обещание для получения продуктов
        fetchPromises.push(
          axios.request(optionsFromProducts).then((response) => {
            const products = response.data.items;

            return products.map((product) => ({
              date: new Date().toISOString(),
              network: "Магнит",
              address: store.address,
              category: categories[t].name,
              sku: product.name,
              price: Math.floor(product.price),
            }));
          })
        );
      }

      // Ждем выполнения всех запросов
      const recordsArray = await Promise.all(fetchPromises);
      allRecords.push(...recordsArray.flat()); // Объединяем все записи
      console.log(
        `Fetched total ${allRecords.length} records for category ${categories[t].name}`
      );
    }

    await csvWriter.writeRecords(allRecords); // Записываем в файл
    console.log(
      `All records written to ${store.code}_products.csv for store ${store.address}.`
    );
  }
}

// Последовательный долгий парсинг
// async function getMagnit() {
//   const stores = await getAllStores();

//   for (let i = 0; i < stores.length; i++) {
//     const store = stores[i];
//     console.log(
//       `Processing store ${i + 1} of ${stores.length}: ${store.address}`
//     );

//     let allRecords = []; // Массив для хранения всех записей о продуктах для текущего магазина

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

//         allRecords.push(...records); // Добавляем новые записи в общий массив
//         console.log(
//           `Fetched ${records.length} records for category ${categories[t].name}`
//         );

//         offset += 50; // Увеличиваем смещение для следующей порции запросов
//         optionsFromProducts.data.pagination.offset = offset; // Обновляем смещение в запросе
//       }
//     }

//     await csvWriter.writeRecords(allRecords); // Записываем все записи в файл за один раз
//     console.log(
//       `All records written to ${store.code}_products.csv for store ${store.address}.`
//     );
//   }
// }
