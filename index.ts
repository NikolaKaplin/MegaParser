import { createObjectCsvWriter } from "csv-writer";
import { getMagnit } from "./sites/magnit";
import { getSmart } from "./sites/smart";

console.log("Mega parser started");

export interface SortTable {
  day: Date;
  net: string;
  address: string;
  category: string;
  sku: string;
  price: string;
}

export const csvWriter = createObjectCsvWriter({
  path: "producs.csv",
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

async function StartMegaParser() {
  try {
    await getSmart();
    await getMagnit();
  } catch (error) {
    console.log(error);
  }
}
StartMegaParser();

// const parseFunctions = [getSmart, getMagnit];

// async function main() {
//   const allPromises = parseFunctions.map((func) => func()); // Запускаем все функции параллельно

//   try {
//     // Используем Promise.all для ожидания выполнения всех Promises
//     const results = await Promise.all(allPromises);
//     console.log("All stores processed successfully:", results);
//   } catch (error) {
//     console.error("An error occurred while processing stores:", error);
//   }
// }

// main();
