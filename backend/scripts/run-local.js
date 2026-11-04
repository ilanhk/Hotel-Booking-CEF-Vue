// Launches the built CEF bundle locally on the PORT from .env.
// CEF's dev server reads its port from process.argv[3] when its module loads (default 8888),
// and finds root.yaml next to the entry script (process.argv[1]), so we make the
// process look as if it was started with: node dist/index.js --local <port>
import "dotenv/config";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const entry = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/index.js");

process.argv[1] = entry;
process.argv[2] = "--local";
process.argv[3] = process.env.PORT ?? "8888";

await import(pathToFileURL(entry).href);
