import axios from "axios";

async function getAllStores() {
    const url = 'https://dixy.ru/ajax/ajax.php';
    const form = new FormData();
    form.append('action', 'getSelfPoints');
    const options = {
        method: 'POST',
        headers: {
            Accept: '*/*',
            'Accept-Language': 'ru-RU,ru;q=0.9',
            Connection: 'keep-alive',
            Origin: 'https://dixy.ru',
            Referer: 'https://dixy.ru/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
        }
    };
    options.body = form;
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
}

async function getProducts(shopId: number) {
    const options = {
        method: 'GET',
        url: 'https://dixy.ru/ajax/listing-json.php',
        params: {
            block: 'product-list',
            sid: shopId.toString(),
            perPage: '100000',
            page: '1',
            filterData: 'facet_id":"493","value":"ром","type":"string","id":"10"},{"facet_id":"3241","value":"водка","type":"string","id":"10"},{"facet_id":"3260","value":"виски","type":"string","id":"10"},{"facet_id":"3347","value":"спиртной напиток","type":"string","id":"10"},{"facet_id":"3362","value":"джин","type":"string","id":"10"},{"facet_id":"3370","value":"ликер","type":"string","id":"10"},{"facet_id":"3404","value":"коньяк","type":"string","id":"10"},{"facet_id":"3421","value":"бальзам","type":"string","id":"10"},{"facet_id":"3428","value":"настойка","type":"string","id":"10"},{"facet_id":"3729","value":"бренди","type":"string","id":"10"},{"facet_id":"4139","value":"сидр","type":"string","id":"10"},{"facet_id":"6097","value":"аперитив","type":"string","id":"10',
            searchQuery: '',
            gl_filter: ''
        },
        headers: {
            Accept: '*/*',
            'Accept-Language': 'ru-RU,ru;q=0.9',
            Connection: 'keep-alive',
            Referer: 'https://dixy.ru/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
        }
    };
    const products = (await axios.request(options)).data
    console.log(products[0].cards.length)

    return products;
}
getProducts(740);

async function setStore(storeId: number, coords: string, address: string) {
    const url = 'https://dixy.ru/ajax/ajax.php';
    const form = new FormData();
    form.append('action', 'saveStore');
    form.append('isDelivery', 'false');
    form.append('store_id', '775');
    form.append('coords', '56.7236190211869,37.52867317768029');
    form.append('address', 'Талдом, микрорайон Юбилейный, 34А');
    const options = {
        method: 'POST',
        headers: {
            Accept: '*/*',
            'Accept-Language': 'ru-RU,ru;q=0.9',
            Origin: 'https://dixy.ru',
            Referer: 'https://dixy.ru/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
        }
    };
    const response = await fetch(url, options);
    const data = await response.json();
    return data // расшифровать jwt

}