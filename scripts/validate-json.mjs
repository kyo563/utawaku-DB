#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const files = [
  "public-data/meta.json",
  "public-data/songs.json",
  "public-data/gags.json",
  "public-data/archive.json"
];

let ok = true;
for (const file of files) {
  try {
    const txt = await readFile(file, "utf8");
    JSON.parse(txt);
    console.log(`OK ${file}`);
  } catch (e) {
    ok = false;
    console.error(`NG ${file}: ${e.message}`);
  }
}

process.exit(ok ? 0 : 1);
