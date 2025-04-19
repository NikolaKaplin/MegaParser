import { chromium } from "playwright";
import fs from "fs";
import path from "path";

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: [
      "--disable-features=IsHeadless",
      "--disable-blink-features=AutomationControlled",
      "--disable-gpu-sandbox",
    ],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Переходим на страницу для инициализации контекста
  await page.goto("https://bristol.ru/");

  // Даем время для загрузки страницы
  await page.waitForTimeout(2000); // 2 секунды, измените при необходимости

  // Выполняем запрос к API
  const response = await page.evaluate(async () => {
    const response = await fetch(
      "https://api.mobile.bristol.ru/api/v2/shops/coords?consumer=website"
    );
    return await response.json(); // Получаем ответ в формате JSON
  });

  // Выводим содержимое ответа в консоль
  console.log("API Response:", response);

  // Сохраняем содержимое ответа в файл
  const responseFileName = path.join(__dirname, "response.json");
  fs.writeFileSync(responseFileName, JSON.stringify(response, null, 2));
  console.log(`Response saved to ${responseFileName}`);

  // Закрываем браузер
  await browser.close();
})();
