import { spawnSync } from "node:child_process";

function runStep(label, args) {
  const result = spawnSync("node", args, { stdio: "inherit" });
  if (result.status !== 0) {
    if (result.error) console.error(result.error);
    console.error(`${label}: błąd startu.`);
    process.exit(result.status || 1);
  }
}

runStep("Baza danych", ["prisma/init-sqlite.js"]);
runStep("Seed", ["prisma/seed.js"]);

await import("./index.js");
