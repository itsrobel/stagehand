// import { Stagehand } from "../lib";
// import { z } from "zod";
//
// async function example() {
//   const stagehand = new Stagehand({
//     env: "LOCAL",
//     verbose: 1,
//     debugDom: true,
//     enableCaching: true,
//   });
//   const modelName = "anthropic.claude-3-sonnet-20240229-v1:0";
//
//   await stagehand.init({
//     modelName,
//   });
//
//   await stagehand.page.goto("https://github.com/browserbase/stagehand");
//   await stagehand.page.goto(
//     "https://autoflow-cascade-na.amazon.com/PAE2/shiftplan/",
//   );
//   await stagehand.act({
//     action: "click on the on 9:15 PM ",
//     modelName,
//   });
//   // const contributor = await stagehand.extract({
//   //   instruction: " ",
//   //   schema: z.object({
//   //     username: z.string(),
//   //     url: z.string(),
//   //   }),
//   // });
//   // console.log(`Our favorite contributor is ${contributor.username}`);
// }
//
// (async () => {
//   await example();
// })();

import { chromium, BrowserContext } from "playwright";
import * as fs from "fs";
// import * as path from "path";
// import cookies from "../test-auth.json";

// import cookies from "../test_cookies.json";
let cookies = "";
console.log(cookies);

async function runWithCookies(data: any) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // Load cookies from the JSON file
  // const cookiesString = fs.readFileSync("playwright_cookies.json", "utf8");

  // const cookiesString = fs.readFileSync("./playwright_cookies.json", "utf8");
  // const cookies = JSON.parse(data);

  // Set the cookies in the context
  await context.addCookies(data);

  // await context.addCookies(sub_domain);

  // Now you can use this context to create pages
  const page = await context.newPage();
  await page.goto("https://midway-auth.amazon.com");
  await new Promise((resolve) => setTimeout(resolve, 20000));
  // Your automation script continues here...

  await browser.close();
}

runWithCookies(cookies).catch(console.error);
