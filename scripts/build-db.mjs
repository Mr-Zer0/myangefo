import Database from "better-sqlite3";
import { readFileSync, copyFileSync, mkdirSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dataDir = resolve(root, "src/data");
const publicDir = resolve(root, "public");

mkdirSync(publicDir, { recursive: true });

const dbPath = resolve(publicDir, "myangefo.db");
rmSync(dbPath, { force: true });
const db = new Database(dbPath);

db.pragma("journal_mode = OFF");
db.pragma("synchronous = OFF");

// --- Create tables ---

db.exec(`
  CREATE TABLE state_region (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL
  );

  CREATE TABLE district (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL,
    sr_pcode TEXT NOT NULL
  );

  CREATE TABLE township (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL,
    district_pcode TEXT NOT NULL,
    sr_pcode TEXT NOT NULL
  );

  CREATE TABLE town (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    township_pcode TEXT NOT NULL,
    district_pcode TEXT NOT NULL,
    sr_pcode TEXT NOT NULL
  );

  CREATE TABLE ward (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL,
    town_pcode TEXT NOT NULL,
    township_pcode TEXT NOT NULL,
    district_pcode TEXT NOT NULL,
    sr_pcode TEXT NOT NULL
  );

  CREATE TABLE village_tract (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL,
    township_pcode TEXT NOT NULL,
    district_pcode TEXT NOT NULL,
    sr_pcode TEXT NOT NULL
  );

  CREATE TABLE village (
    pcode TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_mm TEXT NOT NULL,
    local_name_en TEXT,
    local_name_mm TEXT,
    latitude REAL,
    longitude REAL,
    village_tract_pcode TEXT NOT NULL,
    township_pcode TEXT NOT NULL,
    district_pcode TEXT NOT NULL,
    sr_pcode TEXT NOT NULL
  );
`);

// --- Create indexes on parent pcode columns ---

db.exec(`
  CREATE INDEX idx_district_sr ON district(sr_pcode);
  CREATE INDEX idx_township_district ON township(district_pcode);
  CREATE INDEX idx_town_township ON town(township_pcode);
  CREATE INDEX idx_ward_town ON ward(town_pcode);
  CREATE INDEX idx_village_tract_township ON village_tract(township_pcode);
  CREATE INDEX idx_village_vt ON village(village_tract_pcode);
`);

// --- Load JSON and insert ---

function loadJson(filename) {
  return JSON.parse(readFileSync(resolve(dataDir, filename), "utf-8"));
}

const tables = [
  {
    name: "state_region",
    file: "state_region.json",
    cols: ["pcode", "name_en", "name_mm"],
  },
  {
    name: "district",
    file: "district.json",
    cols: ["pcode", "name_en", "name_mm", "sr_pcode"],
  },
  {
    name: "township",
    file: "township.json",
    cols: ["pcode", "name_en", "name_mm", "district_pcode", "sr_pcode"],
  },
  {
    name: "town",
    file: "town.json",
    cols: ["pcode", "name_en", "name_mm", "latitude", "longitude", "township_pcode", "district_pcode", "sr_pcode"],
  },
  {
    name: "ward",
    file: "ward.json",
    cols: ["pcode", "name_en", "name_mm", "town_pcode", "township_pcode", "district_pcode", "sr_pcode"],
  },
  {
    name: "village_tract",
    file: "villagetract.json",
    cols: ["pcode", "name_en", "name_mm", "township_pcode", "district_pcode", "sr_pcode"],
  },
  {
    name: "village",
    file: "village.json",
    cols: ["pcode", "name_en", "name_mm", "local_name_en", "local_name_mm", "latitude", "longitude", "village_tract_pcode", "township_pcode", "district_pcode", "sr_pcode"],
  },
];

for (const { name, file, cols } of tables) {
  const data = loadJson(file);
  const placeholders = cols.map(() => "?").join(", ");
  const stmt = db.prepare(
    `INSERT INTO ${name} (${cols.join(", ")}) VALUES (${placeholders})`
  );

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      stmt.run(...cols.map((c) => row[c] ?? null));
    }
  });

  insertMany(data);
  console.log(`${name}: inserted ${data.length} rows`);
}

// --- Create FTS4 virtual table (sql.js lacks FTS5) ---

db.exec(`
  CREATE VIRTUAL TABLE fts_places USING fts4(
    name_en,
    name_mm,
    pcode,
    type,
    tokenize=unicode61
  );
`);

const ftsInsert = db.prepare(
  `INSERT INTO fts_places (name_en, name_mm, pcode, type) VALUES (?, ?, ?, ?)`
);

const insertFts = db.transaction(() => {
  for (const { name } of tables) {
    const rows = db.prepare(`SELECT name_en, name_mm, pcode FROM ${name}`).all();
    for (const row of rows) {
      ftsInsert.run(row.name_en, row.name_mm, row.pcode, name);
    }
  }
});

insertFts();
console.log("FTS5 index populated");

db.close();

// --- Copy sql-wasm.wasm to public ---

const wasmSrc = resolve(root, "node_modules/sql.js/dist/sql-wasm.wasm");
const wasmDst = resolve(publicDir, "sql-wasm.wasm");
copyFileSync(wasmSrc, wasmDst);
console.log("Copied sql-wasm.wasm to public/");

console.log(`Done! Database written to ${dbPath}`);
