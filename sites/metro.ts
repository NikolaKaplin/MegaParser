import axios from "axios";
import chalk from "chalk";
import { createObjectCsvWriter } from "csv-writer";

const csvWriter = createObjectCsvWriter({
  path: "metro.csv",
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
  const options = {
    method: "GET",
    url: "https://api.metro-cc.ru/api/v1/C98BB1B547ECCC17D8AEBEC7116D6/tradecenters",
    headers: {
      accept: "application/json",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      "if-none-match": 'W/"58df2e9a3457d9ac78e81dfe5d8eda8a"',
      origin: "https://online.metro-cc.ru",
      priority: "u=1, i",
      referer: "https://online.metro-cc.ru/",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      "x-requested-with": "XMLHttpRequest",
    },
  };
  const response = await axios.request(options);
  const allStores = response.data.data;
  console.log(allStores.length);
  return allStores;
}

async function getTotalPagesCount(storeId: number) {
  const options = {
    method: "POST",
    url: "https://api.metro-cc.ru/products-api/graph",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/plain, */*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      origin: "https://online.metro-cc.ru",
      priority: "u=1, i",
      referer: "https://online.metro-cc.ru/",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    },
    data: {
      query:
        "\n  query Query($useMultiSort: Boolean, $storeId: Int!, $slug: String!, $attributes:[AttributeFilter], $filters: [FieldFilter], $from: Int!, $size: Int!, $sort: InCategorySort, $in_stock: Boolean, $eshop_order: Boolean, $is_action: Boolean, $priceLevelsOnline: Boolean) {\n    category (storeId: $storeId, slug: $slug, inStock: $in_stock, eshopAvailability: $eshop_order, isPromo: $is_action, priceLevelsOnline: $priceLevelsOnline) {\n      id\n      name\n      slug\n      id\n      parent_id\n      meta {\n        description\n        h1\n        title\n        keywords\n      }\n      disclaimer\n      description {\n        top\n        main\n        bottom\n      }\n      breadcrumbs {\n        category_type\n        id\n        name\n        parent_id\n        parent_slug\n        slug\n      }\n      promo_banners {\n        id\n        image\n        name\n        category_ids\n        type\n        sort_order\n        url\n        is_target_blank\n        analytics {\n          name\n          category\n          brand\n          type\n          start_date\n          end_date\n        }\n      }\n\n\n      dynamic_categories(from: 0, size: 9999) {\n        slug\n        name\n        id\n        category_type\n        dynamic_product_settings {\n          attribute_id\n          max_value\n          min_value\n          slugs\n          type\n        }\n      }\n      filters {\n        facets {\n          key\n          total\n          filter {\n            id\n            hru_filter_slug\n            is_hru_filter\n            is_filter\n            name\n            display_title\n            is_list\n            is_main\n            text_filter\n            is_range\n            category_id\n            category_name\n            values {\n              slug\n              text\n              total\n            }\n          }\n        }\n      }\n      total\n      prices {\n        max\n        min\n      }\n      pricesFiltered {\n        max\n        min\n      }\n      products(useMultiSort: $useMultiSort, attributeFilters: $attributes, from: $from, size: $size, sort: $sort, fieldFilters: $filters)  {\n        health_warning\n        limited_sale_qty\n        id\n        slug\n        name\n        name_highlight\n        article\n        new_status\n        main_article\n        main_article_slug\n        is_target\n        category_id\n        category {\n          name\n        }\n        url\n        images\n        pick_up\n        rating\n        icons {\n          id\n          badge_bg_colors\n          rkn_icon\n          caption\n          type\n          is_only_for_sales\n          caption_settings {\n            colors\n            text\n          }\n          sort\n          image_svg\n          description\n          end_date\n          start_date\n          status\n        }\n        manufacturer {\n          name\n        }\n        packing {\n          size\n          type\n        }\n        stocks {\n          value\n          text\n          scale\n          eshop_availability\n          prices_per_unit {\n            old_price\n            offline {\n              price\n              old_price\n              type\n              offline_discount\n              offline_promo\n            }\n            price\n            is_promo\n            levels {\n              count\n              price\n            }\n            online_levels {\n              count\n              price\n              discount\n            }\n            discount\n          }\n          prices {\n            price\n            is_promo\n            old_price\n            offline {\n              old_price\n              price\n              type\n              offline_discount\n              offline_promo\n            }\n            levels {\n              count\n              price\n            }\n            online_levels {\n              count\n              price\n              discount\n            }\n            discount\n          }\n        }\n      }\n      argumentFilters {\n        eshopAvailability\n        inStock\n        isPromo\n        priceLevelsOnline\n      }\n    }\n  }\n",
      variables: {
        isShouldFetchOnlyProducts: true,
        slug: "krepkiy-alkogol",
        storeId: storeId,
        sort: "default",
        size: 30,
        from: 30,
        filters: [{ field: "main_article", value: "0" }],
        attributes: [],
        in_stock: false,
        eshop_order: false,
        useMultiSort: true,
      },
    },
  };
  const response = await axios.request(options);
  const totalPagesCount = Math.ceil(response.data.data.category.total / 50);
  console.log(`total page count`, totalPagesCount);
  return totalPagesCount;
}

async function getProducts(storeId: number, page: number) {
  const options = {
    method: "POST",
    url: "https://api.metro-cc.ru/products-api/graph",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/plain, */*",
      "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
      origin: "https://online.metro-cc.ru",
      priority: "u=1, i",
      referer: "https://online.metro-cc.ru/",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    },
    data: {
      query:
        "\n  query Query($useMultiSort: Boolean, $storeId: Int!, $slug: String!, $attributes:[AttributeFilter], $filters: [FieldFilter], $from: Int!, $size: Int!, $sort: InCategorySort, $in_stock: Boolean, $eshop_order: Boolean, $is_action: Boolean, $priceLevelsOnline: Boolean) {\n    category (storeId: $storeId, slug: $slug, inStock: $in_stock, eshopAvailability: $eshop_order, isPromo: $is_action, priceLevelsOnline: $priceLevelsOnline) {\n      id\n      name\n      slug\n      id\n      parent_id\n      meta {\n        description\n        h1\n        title\n        keywords\n      }\n      disclaimer\n      description {\n        top\n        main\n        bottom\n      }\n      breadcrumbs {\n        category_type\n        id\n        name\n        parent_id\n        parent_slug\n        slug\n      }\n      promo_banners {\n        id\n        image\n        name\n        category_ids\n        type\n        sort_order\n        url\n        is_target_blank\n        analytics {\n          name\n          category\n          brand\n          type\n          start_date\n          end_date\n        }\n      }\n\n\n      dynamic_categories(from: 0, size: 9999) {\n        slug\n        name\n        id\n        category_type\n        dynamic_product_settings {\n          attribute_id\n          max_value\n          min_value\n          slugs\n          type\n        }\n      }\n      filters {\n        facets {\n          key\n          total\n          filter {\n            id\n            hru_filter_slug\n            is_hru_filter\n            is_filter\n            name\n            display_title\n            is_list\n            is_main\n            text_filter\n            is_range\n            category_id\n            category_name\n            values {\n              slug\n              text\n              total\n            }\n          }\n        }\n      }\n      total\n      prices {\n        max\n        min\n      }\n      pricesFiltered {\n        max\n        min\n      }\n      products(useMultiSort: $useMultiSort, attributeFilters: $attributes, from: $from, size: $size, sort: $sort, fieldFilters: $filters)  {\n        health_warning\n        limited_sale_qty\n        id\n        slug\n        name\n        name_highlight\n        article\n        new_status\n        main_article\n        main_article_slug\n        is_target\n        category_id\n        category {\n          name\n        }\n        url\n        images\n        pick_up\n        rating\n        icons {\n          id\n          badge_bg_colors\n          rkn_icon\n          caption\n          type\n          is_only_for_sales\n          caption_settings {\n            colors\n            text\n          }\n          sort\n          image_svg\n          description\n          end_date\n          start_date\n          status\n        }\n        manufacturer {\n          name\n        }\n        packing {\n          size\n          type\n        }\n        stocks {\n          value\n          text\n          scale\n          eshop_availability\n          prices_per_unit {\n            old_price\n            offline {\n              price\n              old_price\n              type\n              offline_discount\n              offline_promo\n            }\n            price\n            is_promo\n            levels {\n              count\n              price\n            }\n            online_levels {\n              count\n              price\n              discount\n            }\n            discount\n          }\n          prices {\n            price\n            is_promo\n            old_price\n            offline {\n              old_price\n              price\n              type\n              offline_discount\n              offline_promo\n            }\n            levels {\n              count\n              price\n            }\n            online_levels {\n              count\n              price\n              discount\n            }\n            discount\n          }\n        }\n      }\n      argumentFilters {\n        eshopAvailability\n        inStock\n        isPromo\n        priceLevelsOnline\n      }\n    }\n  }\n",
      variables: {
        isShouldFetchOnlyProducts: true,
        slug: "krepkiy-alkogol",
        storeId: storeId,
        sort: "default",
        size: 50,
        from: 50 * page,
        filters: [{ field: "main_article", value: "0" }],
        attributes: [],
        in_stock: false,
        eshop_order: false,
        useMultiSort: true,
      },
    },
  };
  const response = await axios.request(options);
  const products = response.data.data.category.products;
  console.log(products.length);
  return products;
}

export async function getMetro() {
  const allStores = await getAllStores();
  for (let i = 0; i < allStores.length; i++) {
    const totalPagesCount = await getTotalPagesCount(allStores[i].store_id);
    const productsArr: any = [];
    for (let j = 0; j < totalPagesCount; j++) {
      const start = Date.now();
      const products = await getProducts(allStores[i].store_id, j);
      products.map((item) => productsArr.push(item));
      console.log(`page ${j} fetched as ${Date.now() - start}`);
    }
    const records = productsArr.map((product) => ({
      date: new Date().toISOString(),
      network: "Метро",
      address: allStores[i].address,
      category: product.name.split(" ")[0],
      sku: product.name,
      price: product.stocks[0].prices.price,
    }));
    await csvWriter.writeRecords(records);
    console.log(chalk.blue(`store ${i} ${allStores[i].store_id} fetched`));
  }
}

getMetro();
