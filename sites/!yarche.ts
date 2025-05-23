import { createObjectCsvWriter } from "csv-writer";
import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RecaptchaPlugin from "@extra/recaptcha";

const HOST = "https://xn--80akiai2b0bl4e.xn--p1ai";

const headers = {
  accept: "*/*",
  "accept-language": "en,uk-UA;q=0.9,uk;q=0.8,ru-RU;q=0.7,ru;q=0.6",
  "cache-control": "no-cache",
  pragma: "no-cache",
  priority: "u=1, i",
  "sec-ch-ua":
    '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  cookie:
    "csrftoken=k03Y9xaS6FahqAUABOkCd5A5UprdlDMosLhdEq9oleEw3ohVFnnKhE2zP8IJrSSl; sessionid=cldtbiefs164m4dvjegqxnl8fltq469e; _ga_SB7PR6QT3R=GS2.1.s1747952982$o3$g0$t1747952982$j60$l0$h0$dXKzXt7lNTX--9Q_a2l2D84nJhlYZlnn5rQ; _ym_uid=1747947081932547177; _ym_d=1747952985",
  Referer: "https://xn--80akiai2b0bl4e.xn--p1ai/ivanteevka/beer/day",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

type City = {
  id: number;
  name: string;
};
async function getCities() {
  return fetch(`${HOST}/get_cities/`, { headers }).then(
    async (res) => (await res.json()) as City[]
  );
}

type Shop = {
  id: number;
  address: string;
};
async function getShops(cityId: number) {
  return fetch(`${HOST}/get_shops/${cityId}`, { headers })
    .then(async (res) => (await res.json()) as Shop[])
    .catch(() => []);
}

type Product = {
  category_id: number;
  name: string;
};
type Discount = {
  id: number;
  product: Product;
  shop_id: number;
  price: number;
  discount_price: number;
};
async function getDiscounts(
  shopId: number,
  offset: number = 0,
  limit: number = 24
) {
  return fetch(`${HOST}/get_discounts/${shopId}/${offset}/${limit}/`, {
    headers,
  })
    .then(async (res) => {
      const json = await res.json();
      console.log({ json });
      return json as { discounts: Discount[]; total_count: number };
    })
    .catch(() => ({ discounts: [] as Discount[], total_count: 0 }));
}

async function getAllDiscounts(shopId: number) {
  const PAGE_SIZE = 24;
  const { discounts, total_count } = await getDiscounts(shopId, 0, PAGE_SIZE);
  if (typeof discounts == "undefined") return [];

  for (let i = 1; i < Math.ceil(total_count / PAGE_SIZE); i++) {
    const ds = await getDiscounts(shopId, i * PAGE_SIZE, PAGE_SIZE);
    discounts.push(...ds.discounts);
  }
  return discounts;
}

async function updateCookies() {
  chromium.use(RecaptchaPlugin({visualFeedback: true, provider: {
    id: "2captcha",
    token:
  } }));
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  let cookies = "";
  page.on("request", async (r) => {
    // console.log(r.url());
    if (r.url().includes(HOST)) {
      cookies = await r.allHeaders().then((res) => res["cookie"]);
      console.log(cookies);
      console.log("set!");
    }
  });
  console.log("goto");
  await page.goto(HOST, { timeout: 60000, waitUntil: "commit" });
  while (cookies.length == 0) await page.waitForTimeout(100);
  console.log("close");
  await browser.close();
  headers.cookie = cookies;
}

(async (BATCH_SIZE = 10) => {
  const csvWriter = createObjectCsvWriter({
    path: "yarche.csv",
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

  const shops = ([] as Shop[]).concat(
    ...(await Promise.all((await getCities()).map((c) => c.id).map(getShops)))
  );

  console.log(`yarche: ${shops.length} shops total`);

  for (let b = 0; b < Math.ceil(shops.length / BATCH_SIZE); b++) {
    console.log("getting new cookies...");
    await updateCookies();

    const promises: Promise<void>[] = [];
    for (
      let i = b * BATCH_SIZE;
      i < Math.min((b + 1) * BATCH_SIZE, shops.length);
      i++
    )
      promises.push(
        (async () => {
          const shop = shops[i]!;
          const discounts = (await getAllDiscounts(shop.id)).filter(
            (d) =>
              ["пиво", "вино"].filter((t) =>
                d.product.name.toLowerCase().includes(t)
              ).length == 0
          );

          await csvWriter.writeRecords(
            discounts.map((d) => ({
              date: new Date().toISOString(),
              network: "Yarche",
              address: shop.address,
              category: d.product.name.split(" ")[0],
              sku: d.product.name,
              price: d.discount_price.toFixed(2),
            }))
          );
        })()
      );
    const startTime = Date.now();
    await Promise.all(promises);
    console.log(
      `yarche: ${b * BATCH_SIZE}/${shops.length} (${Date.now() - startTime}ms)`
    );
  }
})();
