import axios from "axios";
import ora from "ora";
import chalk from "chalk";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";
import { type ProgressCallback } from "..";
import { createObjectCsvWriter } from "csv-writer";

axios.defaults.httpAgent = new httpAgent({ keepAlive: false });
axios.defaults.httpsAgent = new httpsAgent({ keepAlive: false });
const csvWriter = createObjectCsvWriter({
  path: "smart.csv",
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
const regionsUrl =
  "https://smart.swnn.ru/WS/hs/exchange/getTerritoriesIndividuals/?fromSite";

const groupsUrl = "https://smart.swnn.ru/WS/hs/exchange/getCatalogGroups/1/1/1";

let running = true;

export async function getSmart(pc: ProgressCallback) {
  process.on("SIGINT", () => {
    console.log(chalk.red("\nInterrupted! Exiting..."));
    running = false;
    process.exit();
  });

  const spinner = ora(chalk.blue("Fetching regions...")).start();
  const regions = (await axios.get(regionsUrl)).data.Data[0].Data;
  spinner.succeed(chalk.green("Regions fetched successfully!"));

  const transformedProducts = [];

  // const progressBar = new MultiBar({
  //   format: `${chalk.cyan(
  //     "Progress Smart magazine"
  //   )} | {bar} | {percentage}% | Region: {value}/{total}`,
  //   hideCursor: true,
  //   barCompleteChar: "\u2588",
  //   barIncompleteChar: "\u2591",
  // });

  // const regionBar = progressBar.create(regions.length, 0);
  pc({ task: regions.length });

  for (let i = 0; i < regions.length && running; i++) {
    const optionsFromGroups = {
      method: "POST",
      url: groupsUrl,
      params: { noauth: "" },
      headers: { "content-type": "application/json" },
      data: { КодТерритории: regions[i].Код, Дискаунтер: true },
    };
    const groups = (await axios.request(optionsFromGroups)).data.Data[0].Data;
    const filteredGroups = groups.filter(
      (group) =>
        group.РодительКод === "p504" &&
        group.Наименование !== "ПИВО" &&
        group.Наименование !== "ВИНО"
    );

    // regionBar.update(i + 1);
    pc({ done: i + 1 });

    // console.clear();
    // console.log(
    //   chalk.yellow(
    //     `Currently processing region ${i + 1}/${regions.length}. Found ${
    //       filteredGroups.length
    //     } groups.`
    //   )
    // );

    for (let j = 0; j < filteredGroups.length && running; j++) {
      const optionsFromProducts = {
        method: "POST",
        url: "https://smart.swnn.ru/WS/hs/exchange/getItems/1/1/1",
        params: { noauth: "" },
        headers: { "content-type": "application/json" },
        data: {
          Дискаунтер: true,
          КодТерритории: regions[i].Код,
          ТипГруппы: "catalog",
          КодГруппы: filteredGroups[j].Код,
          НомерСтраницы: 1,
          РазмерСтраницы: 100000000000,
          КодСортировки: 1,
          ЗначенияФильтров: [],
        },
      };

      const response = await axios.request(optionsFromProducts);
      const products = response.data.Data[0].Data;

      products.forEach((product) => {
        transformedProducts.push({
          date: new Date().toISOString(),
          network: "Smart",
          address: regions[i].Наименование,
          category: filteredGroups[j].Наименование,
          sku: product.Наименование,
          price: product.Цена,
        });
      });
    }
  }

  // regionBar.stop();
  // console.clear();

  if (running) {
    console.log(chalk.green("All regions processed."));
    await csvWriter.writeRecords(transformedProducts);
    console.log(chalk.blue("Data successfully written to products.csv"));
  } else {
    console.log(chalk.yellow("Process was terminated before completing."));
  }
}
