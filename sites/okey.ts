import axios from "axios";
import { chromium } from "playwright-extra";

async function getCookie() {
  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext({ permissions: ["geolocation"] });
  const page = await context.newPage();
  let headers = {};
  // Слушаем события запросов
  page.on("request", async (request) => {
    if (
      request.url() ==
      "https://www.okeydostavka.ru/msk/alkogol-/krepkii-alkogol-#facet:&productBeginIndex:144&orderBy:2&pageView:grid&minPrice:86.99&maxPrice:23499.99&pageSize:72&"
    )
      headers = await request.allHeaders();
  });
  await page.goto(
    "https://www.okeydostavka.ru/msk/alkogol-/krepkii-alkogol-#facet:&productBeginIndex:144&orderBy:2&pageView:grid&minPrice:86.99&maxPrice:23499.99&pageSize:72&"
  );

  await page.waitForTimeout(10000);
  await page.click(".btn.btn-red.prompt-ok-button");
  await page.waitForTimeout(10000);
  await page.reload(); //
  await browser.close();
  console.log(headers);
  return headers.cookie;
}
getCookie();

// async function getCities() {

//   const response = await axios.request(options);
//   const allCites = response.data.data.city_list;
//   console.log(allCites);
//   return allCites;
// }

async function getAllStores() {}

async function setStoreCookie(
  cityId: number,
  regionId: number,
  cookie: string
) {
  const formattedCookie =
    cookie + " " + `region_id=${regionId};` + `city_id=${cityId}`;
  return formattedCookie;
}

export async function getProducts() {}

// export async function getOkey() {
//   let cookie = await getCookie();
//   const stores = await getAllStores();
//   for (let i = 0; i < stores.length; i++) {
//     cookie = setStoreCookie(stores[i].item.id, stores[i].city.id, cookie);
//     const store = stores[i];
//   }
// }
