import { Stagehand } from "../lib";
import { z } from "zod";

async function example() {
  const stagehand = new Stagehand({
    env: "LOCAL",
    verbose: 1,
    debugDom: true,
    enableCaching: true,
  });
  const modelName = "anthropic.claude-3-sonnet-20240229-v1:0";

  await stagehand.init({
    modelName,
  });

  await stagehand.page.goto("https://github.com/browserbase/stagehand");
  await stagehand.act({
    action: "click on the contributors",
    modelName,
  });
  const contributor = await stagehand.extract({
    instruction: "extract the top contributor",
    schema: z.object({
      username: z.string(),
      url: z.string(),
    }),
  });
  console.log(`Our favorite contributor is ${contributor.username}`);
}

(async () => {
  await example();
})();
