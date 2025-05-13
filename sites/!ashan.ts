import axios, { AxiosRequestConfig } from "axios";
import { createObjectCsvWriter } from "csv-writer";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import { ProgressCallback } from "..";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

const csvWriter = createObjectCsvWriter({
    path: "ashan.csv",
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
    let options: AxiosRequestConfig = {
        method: 'GET',
        url: 'https://www.auchan.ru/v3/regions/',
        params: { need_ll: '1' },
        headers: {
            accept: '*/*',
            'accept-language': 'ru-RU,ru;q=0.9',
            'cache-control': 'no-cache',
            pragma: 'no-cache',
            priority: 'u=1, i',
            referer: 'https://www.auchan.ru/shop/522/',
            'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        }
    };
    let response = await axios.request(options);
    const allRegions = response.data.regions;
    console.log(allRegions.length)
    response = await axios.request(options);
    let allStores: any = [];
    for (let i = 0; i < allRegions.length; i++) {
        options = {
            method: 'GET',
            url: 'https://www.auchan.ru/v3/shops/',
            params: { regionId: allRegions[i].id },
            headers: {
                accept: '*/*',
                'accept-language': 'ru-RU,ru;q=0.9',
                'cache-control': 'no-cache',
                pragma: 'no-cache',
                priority: 'u=1, i',
                referer: 'https://www.auchan.ru/shop/522/',
                'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
            }
        };
        response = await axios.request(options);
        response.data.shops.map((item) => allStores.push(item));
    }
    return allStores;
}

async function getProducts(storeId: number, page: number) {
    const options = {
        method: 'POST',
        url: 'https://www.auchan.ru/v3/catalog/products/',
        params: {
            orderField: 'rank',
            orderDirection: 'asc',
            merchantId: storeId.toString(),
            deliveryAddressSelected: '0',
            perPage: '40',
            page: page.toString()
        },
        headers: {
            'content-type': 'application/json',
            accept: '*/*',
            'accept-language': 'ru-RU,ru;q=0.9',
            'cache-control': 'no-cache',
            origin: 'https://www.auchan.ru',
            pragma: 'no-cache',
            priority: 'u=1, i',
            referer: 'https://www.auchan.ru/catalog/alkogol/krepkiy-alkogol/',
            'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
        },
        data: {
            filter: {
                cashback_only: false,
                active_only: true,
                promo_only: false,
                category: 'krepkiy_alkogol'
            }
        }
    };
    const response = await axios.request(options);
    const products = response.data.items;
    const pages = ~~(response.data.activeRange / 40);
    console.log("products: ", products.length, " pages: ", pages)
    return {
        pages: pages,
        products: products
    };
}

export async function getAshan(pc: ProgressCallback) {
    const allStores = await getAllStores();
    pc({ task: allStores.length });
    console.log(allStores.length)
    for (let i = 0; i < allStores.length; i++) {
        try {
            let productsArr: any = [];
            const pagesCount = await getProducts(allStores[i].merchant_id, 1);
            for (let j = 1; j < pagesCount.pages; j++) {
                const start = Date.now()
                const products = await getProducts(allStores[i].merchant_id, j);
                products.products.map((product) => productsArr.push(product));
                console.log(`page fetched as ${Date.now() - start}`)
            }
            const records = productsArr.map((product) => ({
                date: new Date().toISOString(),
                network: "Ашан",
                address: allStores[i]!.address_string,
                category: product.title.split(" ")[0],
                sku: product.title,
                price: product.price
                    ? product.price.value
                    : "Цена отсутствует",
            }))
            await csvWriter.writeRecords(records);
            pc({ done: i + 1 });
        } catch (error) {
            console.log("ERROR PRINT: ", error)
            continue;
        }
    }
}


