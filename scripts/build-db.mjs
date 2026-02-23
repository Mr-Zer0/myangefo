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

// --- Create MIMU baseline & summary tables ---

db.exec(`
  CREATE TABLE baseline_indicator (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    sector TEXT NOT NULL,
    sub_sector TEXT,
    indicator_name TEXT NOT NULL,
    indicator_type TEXT,
    unit TEXT,
    data_year INTEGER,
    value REAL,
    source_name TEXT
  );

  CREATE TABLE area_demography (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    census_year INTEGER,
    population_total INTEGER,
    population_male INTEGER,
    population_female INTEGER,
    sex_ratio REAL,
    num_households INTEGER,
    avg_household_size REAL,
    num_female_headed_hh INTEGER,
    pct_female_headed_hh REAL,
    population_density REAL,
    urban_population_pct REAL,
    annual_growth_rate REAL,
    total_fertility_rate REAL,
    crude_birth_rate REAL,
    crude_death_rate REAL,
    num_villages INTEGER,
    num_village_tracts INTEGER,
    num_wards INTEGER,
    num_townships INTEGER,
    num_districts INTEGER,
    num_housing_units INTEGER,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_health (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    data_year INTEGER,
    infant_mortality_rate REAL,
    neonatal_mortality_rate REAL,
    under_five_mortality_rate REAL,
    life_expectancy_at_birth REAL,
    num_doctors INTEGER,
    num_hospitals INTEGER,
    num_rural_health_centres INTEGER,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_education (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    data_year INTEGER,
    adult_literacy_rate REAL,
    primary_enrollment_ratio REAL,
    secondary_enrollment_ratio REAL,
    girls_to_boys_ratio_primary REAL,
    girls_to_boys_ratio_secondary REAL,
    num_primary_schools INTEGER,
    num_middle_schools INTEGER,
    num_high_schools INTEGER,
    num_monastic_schools INTEGER,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_agriculture (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    data_year INTEGER,
    area_sown_paddy_acres REAL,
    area_sown_total_acres REAL,
    harvested_area_acres REAL,
    production_tonnes REAL,
    agriculture_share_govt_expenditure REAL,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_economy (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    data_year INTEGER,
    labour_force_participation_rate REAL,
    employment_to_population_ratio REAL,
    wealth_ranking_index REAL,
    wealth_rank TEXT,
    share_women_nonagri_wage_employment REAL,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_environment (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    data_year INTEGER,
    num_hh_electricity INTEGER,
    num_hh_solar INTEGER,
    num_hh_kerosene INTEGER,
    num_hh_improved_toilet INTEGER,
    num_hh_piped_water INTEGER,
    num_hh_wood_fuel_cooking INTEGER,
    num_natural_disasters INTEGER,
    rainfall_mm REAL,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_nutrition (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    data_year INTEGER,
    malnutrition_under_one_yr_pct REAL,
    malnutrition_under_three_yr_pct REAL,
    anaemia_prevalence_women_15_49_pct REAL,
    low_birth_weight_pct REAL,
    food_energy_deprivation_pct REAL,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_ict_transport (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    data_year INTEGER,
    num_hh_with_computer INTEGER,
    num_hh_with_internet INTEGER,
    num_internet_users INTEGER,
    num_hh_with_radio INTEGER,
    num_hh_with_mobile_phone INTEGER,
    road_length_km REAL,
    num_airports INTEGER,
    PRIMARY KEY (area_pcode, area_level)
  );

  CREATE TABLE area_protection (
    area_pcode TEXT NOT NULL,
    area_level TEXT NOT NULL,
    data_year INTEGER,
    birth_registration_pct REAL,
    num_idp INTEGER,
    num_human_trafficking_victims INTEGER,
    num_persons_with_disability INTEGER,
    num_battle_events INTEGER,
    num_conflict_fatalities INTEGER,
    PRIMARY KEY (area_pcode, area_level)
  );
`);

// --- Create indexes ---

db.exec(`
  CREATE INDEX idx_district_sr ON district(sr_pcode);
  CREATE INDEX idx_township_district ON township(district_pcode);
  CREATE INDEX idx_town_township ON town(township_pcode);
  CREATE INDEX idx_ward_town ON ward(town_pcode);
  CREATE INDEX idx_village_tract_township ON village_tract(township_pcode);
  CREATE INDEX idx_village_vt ON village(village_tract_pcode);

  CREATE INDEX idx_baseline_area ON baseline_indicator(area_pcode);
  CREATE INDEX idx_baseline_sector ON baseline_indicator(sector);
  CREATE INDEX idx_baseline_year ON baseline_indicator(data_year);
  CREATE INDEX idx_baseline_area_level ON baseline_indicator(area_level);

  CREATE INDEX idx_demography_area ON area_demography(area_pcode);
  CREATE INDEX idx_health_area ON area_health(area_pcode);
  CREATE INDEX idx_education_area ON area_education(area_pcode);
  CREATE INDEX idx_agriculture_area ON area_agriculture(area_pcode);
  CREATE INDEX idx_economy_area ON area_economy(area_pcode);
  CREATE INDEX idx_environment_area ON area_environment(area_pcode);
  CREATE INDEX idx_nutrition_area ON area_nutrition(area_pcode);
  CREATE INDEX idx_ict_transport_area ON area_ict_transport(area_pcode);
  CREATE INDEX idx_protection_area ON area_protection(area_pcode);
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
console.log("FTS4 index populated");

db.close();

// --- Copy sql-wasm.wasm to public ---

const wasmSrc = resolve(root, "node_modules/sql.js/dist/sql-wasm.wasm");
const wasmDst = resolve(publicDir, "sql-wasm.wasm");
copyFileSync(wasmSrc, wasmDst);
console.log("Copied sql-wasm.wasm to public/");

console.log(`Done! Database written to ${dbPath}`);
