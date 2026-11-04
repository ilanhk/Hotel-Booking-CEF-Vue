import { readFile, writeFile } from "node:fs/promises";

// cef-build emits CommonJS but copies the source package's "type": "module" into dist.
const packagePath = new URL("../dist/package.json", import.meta.url);
const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
packageJson.type = "commonjs";
await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
