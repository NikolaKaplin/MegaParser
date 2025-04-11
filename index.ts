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

async function StartMegaParser() {
  try {
    await getSmart();
  } catch (error) {
    console.log(error);
  }
}

StartMegaParser();
