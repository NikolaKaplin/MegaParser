// import { createObjectCsvWriter } from "csv-writer";
import { getAshan } from "./sites/!ashan";
import { getAzbukaVkusa } from "./sites/azbuka-vkusa";
import { getDiksi } from "./sites/diksi";
import { getMagnit } from "./sites/magnit";
import { getMetro } from "./sites/metro";
import { getPerecrestok } from "./sites/perekrestok";
import { getSmart } from "./sites/smart";
import { getSpar } from "./sites/spar";

console.log("Mega parser started");

export interface SortTable {
  day: Date;
  net: string;
  address: string;
  category: string;
  sku: string;
  price: string;
}

// export const csvWriter = createObjectCsvWriter({
//   path: "producs.csv",
//   header: [
//     { id: "date", title: "Дата" },
//     { id: "network", title: "Сеть" },
//     { id: "address", title: "Адрес" },
//     { id: "category", title: "Категория" },
//     { id: "sku", title: "SKU" },
//     { id: "price", title: "Цена" },
//   ],
//   encoding: "utf8",
// });

// async function StartMegaParser() {
//   try {
//     await getSmart();
//     await getMagnit();
//   } catch (error) {
//     console.log(error);
//   }
// }
// StartMegaParser();

export type Progress = {
  done?: number;
  task?: number;
};
export type ProgressCallback = (progress: Progress) => void;

const names = ["Магнит", "Смарт", "Азбука вкуса", "Дикси", "Спар", "Перекресток", "Метро", "Ашан"];
const parseFunctions = [getMagnit, getSmart, getAzbukaVkusa, getDiksi, getSpar, getPerecrestok, getMetro, getAshan];

async function main() {
  let progress: Progress[] = [];

  function repeat(s: string, count: number) {
    return new Array(Math.floor(count)).fill(s).join("");
  }

  function updateProgressBars() {
    console.clear();
    console.log("Progress:");
    for (let i = 0; i < names.length; i++) {
      const name = names[i]!;
      const { done, task } = progress[i]!;

      if (done == task && task != 0) {
        console.log(`${name} is done.`);
        continue;
      }

      const percent = done! / (task || 1);
      const visualPercent = Math.floor(percent * 100);

      const symbols = process.stdout.columns / 4;
      const barCompleteChar = "\u2588";
      const barIncompleteChar = "\u2591";

      const bar =
        repeat(barCompleteChar, symbols * percent) +
        repeat(barIncompleteChar, symbols * (1 - percent));
      console.log(
        `${name} shop | ${bar} | ${visualPercent}% (${done}/${task || "?"})`
      );
    }
    console.log(`${repeat("-", process.stdout.columns / 2)}`);
  }

  const allPromises = parseFunctions.map((func, i) => {
    progress[i] = { done: 0, task: 0 };
    return func(((p) => {
      if (p.done) progress[i]!.done = p.done;
      if (p.task) progress[i]!.task = p.task;
      updateProgressBars();
    }) as ProgressCallback);
  });

  try {
    const results = await Promise.all(allPromises);
    console.log("All stores processed successfully:", results);
  } catch (error) {
    console.error("An error occurred while processing stores:", error);
  }
}

main();
