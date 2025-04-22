import axios from "axios";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });

async function getAllStores() {
  let shops = {
    status: 200,
  };
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
      shops = await axios.request(options);
      shops.data.map((shop) => allShops.push(shop));
      console.log(i);
    } catch (error) {
      console.log(error);
      break;
    }
  }
  console.log(allShops, allShops.length);
  return allShops;
}

getAllStores();
