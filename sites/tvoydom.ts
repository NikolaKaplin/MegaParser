import { createObjectCsvWriter } from "csv-writer";

const csvWriter = createObjectCsvWriter({
  path: "tvoydom.csv",
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

async function writeItemsToCSV(items: TvoydomItem[]) {
  await csvWriter.writeRecords(
    items.map((item) => ({
      date: new Date().toISOString(),
      network: "TvoyDom",
      address: "example address",
      category: item.name.split(" ")[0],
      sku: item.name,
      price: item.price.toFixed(2),
    }))
  );
}

const REMOVED_SECTIONS = [7079, 7477, 7472];
const BATCH_SIZE = 1;

type TvoydomItem = {
  id: number;
  name: string;
  price: number;
  sectionId: number;
};

async function getItemsPage(page = 1, pageSize = 24) {
  const params = new URLSearchParams();
  params.set("csrf_token", "785e7da318eef51aa71d8ab72b750f97");
  params.set("page", page.toString());
  params.set("pageSize", pageSize.toString());
  params.set("sortColumn", "popularity");
  params.set("sortDirection", "desc");
  params.set("landingFilter", "");
  const body = params.toString();

  const res = await fetch("https://tvoydom.ru/api/internal/catalog/alkogol-2", {
    method: "POST",
    headers: {
      accept: "*/*",
      "accept-language": "en",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "x-language-id": "ru",
      "x-requested-with": "XMLHttpRequest",
      cookie:
        "__ddg1_=4TNMzHQAsSDYw0pH8ifX; PHPSESSID=f9f72bf0fed5766271e62f7cf5fd221e; region=1; region_requires_confirmation=1; region_id=77; city_id=1; _ym_uid=1747075697111436798; _ym_d=1747075697; _ymab_param=C5a03JqJfEG21urTk89ivOq58aysWLKXWUhWnRJjQOi6V7Yh_J-PrDq13qysvWHTPvygkv5aZvBc-uhpbpDTuw1hUZk; advcake_trackid=9bcc6bb9-ffea-4fd0-d28e-29989bc1182e; advcake_session_id=904e9a47-3f97-ae40-9b12-daff5177475c; _userGUID=0:malfrix6:P4JNroJeI5n_YkPcOnJPFBDFgUkCYRRi; _dvs=0:malfrix6:IiNzu5OgUAxjnN903h122PFxXwOLlHwW; stDeIdU=003fab73-8b69-40ec-931d-25e09ee1808d; _ym_isad=2; region_delivery_showed=true; _ym_visorc=w; UniqAnalyticsId=1747075702591375; digi_uc=W10=; alcohol_permission_confirmed=true; advcake_track_url=%3D20250113o66OUhExaQN7S4ZeK7ZYs2IeIzBBqzvIKNDdbMowniY%2BR1jYXv5AVLMCJR0WatrRCZ6Eb407G9YfA3vJ3XZn0Pkf5R0MWSqAObQkPJXWP252dNQcytQW7x1jkpwt3KcVE%2BTlXt%2BHQu8qSbZMM3Jg7uKGL5kGFisM5qYp%2FPZ6pDwCatd6Lxk%2FM%2BjgTYZY%2FgMFwOPasXgbiklAKmgDQqI4aOnjs8rYRC%2BZ8fVrHWAl92DZszTXrHSi%2FMgoLaYoK8m4zlZoTsgESFm5%2Fl3h2UJPv69O3aBSl7y2EEWMm7FZkxVfLrB%2FeSup6nPo1GSfU8JNcpVfKPaaZzAYb%2FKNYk8aGc2aouXKm1zH0l38P9RS4RV8ezDIIFK7pixi4u2nTUQhbUG86FBKsxkx71db%2Fz2soxL2slVxy4kfYzCH2IM4D8Mm87q8R44yXZKzmsLRVWPDVeQuU04vXLH4R5t2bhYXAXIJV3jdlp67X5mFw026ZxSTIWigU1e0MRcv8M1JtVreJDFWQ6UMuoh0Lgr9fauCcWueyIhPxe4OD2HSKk6xDVwMOqBuNZtAglyVrRlm6SSQAKJhJUw81%2B6aaIvoxDaCBKl2jfv%2FODnLV%2Fnt0FiADoNI77iIxm3v4gnjHSyNZit%2FDZE7Gg7dIL3qJhcwWUkiIM7cZMl60Qqd6HB0IygTwoqI5maN8tPjnXw%3D; __ddg9_=104.28.198.246; __ddg10_=1747077794; __ddg8_=OjKVEBoQxzeKHucF",
      Referer: "https://tvoydom.ru/catalog/alkogol-2/",
    },
    body,
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text) as { total: number; cards: TvoydomItem[] };
    return json;
  } catch (error) {
    console.error(`Tvoydom returned non-json response: "${text}"`);
    throw error;
  }
}

(async () => {
  const pageSize = 24;

  const firstPage = await getItemsPage();
  const totalPages = Math.ceil(firstPage.total / pageSize);

  for (let i = 1; i <= totalPages; i += BATCH_SIZE) {
    const endPage = Math.min(i + BATCH_SIZE - 1, totalPages);
    console.log(`Fetching pages ${i} to ${endPage} out of ${totalPages}`);

    const pagePromises = Array.from({ length: endPage - i + 1 }, (_, j) =>
      getItemsPage(i + j)
    );

    const startTime = Date.now();
    const pages = await Promise.all(pagePromises);
    console.log(`Fetched pages in ${Date.now() - startTime}ms`);

    for (const page of pages) {
      await writeItemsToCSV(
        page.cards.filter((item) => !REMOVED_SECTIONS.includes(item.sectionId))
      );
    }
  }
  console.log("Done!");
})();

//ассортимент повторяется
