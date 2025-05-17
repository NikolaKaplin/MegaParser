// import { createObjectCsvWriter } from "csv-writer";
import { getAshan } from "./sites/ashan";
import { getAzbukaVkusa } from "./sites/azbuka-vkusa";
import { getBristol } from "./sites/bristol";
import { getDiksi } from "./sites/!diksi";
import { getGlobus } from "./sites/globus";
import { getLenta } from "./sites/lenta";
import { getMagnit } from "./sites/magnit";
import { getMetro } from "./sites/metro";
import { getPerecrestok } from "./sites/perekrestok";
import { getSmart } from "./sites/smart";
import { getSpar } from "./sites/spar";
import { getVinlab } from "./sites/vin-lab";

console.log("Mega parser started");

export interface SortTable {
  day: Date;
  net: string;
  address: string;
  category: string;
  sku: string;
  price: string;
}

export type Progress = {
  done?: number;
  task?: number;
};
export type ProgressCallback = (progress: Progress) => void;

const names = [
  "Ашан",
  "Лента",
  "Глобус",
  "Вин лаб",
  "Смарт",
  "Азбука вкуса",
  "Дикси",
  "Спар",
  "Перекресток",
  "Метро",
  "Ашан",
  "Бристоль",
];
const parseFunctions = [
  getAshan,
  getLenta,
  getGlobus,
  getVinlab,
  getSmart,
  getAzbukaVkusa,
  getDiksi,
  getSpar,
  getPerecrestok,
  getMetro,
  getAshan,
  getBristol,
];

async function main() {
  let progress: Progress[] = [];
  const MAX_CONCURRENT = 5; // Максимальное количество одновременных задач
  let activeTasks = 0;
  let currentIndex = 0;
  const results: any[] = [];

  function repeat(s: string, count: number) {
    return new Array(Math.floor(count)).fill(s).join("");
  }

  function updateProgressBars() {
    console.clear();
    console.log("Progress:");
    for (let i = 0; i < names.length; i++) {
      const name = names[i]!;
      const { done, task } = progress[i] ?? { done: 0, task: 0 };

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
        `${name}${" ".repeat(
          40 - name.length
        )} shop | ${bar} | ${visualPercent}% (${done}/${task || "?"})`
      );
    }
    console.log(`${repeat("-", process.stdout.columns / 2)}`);
    console.log(`Active tasks: ${activeTasks}/${MAX_CONCURRENT}`);
  }

  async function runTask(index: number) {
    activeTasks++;
    updateProgressBars();

    progress[index] = { done: 0, task: 0 };
    try {
      const result = await parseFunctions[index](((p) => {
        if (p.done) progress[index]!.done = p.done;
        if (p.task) progress[index]!.task = p.task;
        updateProgressBars();
      }) as ProgressCallback);

      results[index] = result;
    } catch (error) {
      console.error(`Error in ${names[index]}:`, error);
      results[index] = { error };
    } finally {
      activeTasks--;
      updateProgressBars();

      // Запускаем следующую задачу, если есть
      if (currentIndex < parseFunctions.length) {
        runTask(currentIndex++);
      }
    }
  }

  // Запускаем первые MAX_CONCURRENT задач
  while (activeTasks < MAX_CONCURRENT && currentIndex < parseFunctions.length) {
    runTask(currentIndex++);
  }

  // Ждем завершения всех задач
  while (activeTasks > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("All stores processed successfully:", results);
}
main();
